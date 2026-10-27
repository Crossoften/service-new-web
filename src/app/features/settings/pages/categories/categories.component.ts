import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, TemplateRef, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Subject, takeUntil } from 'rxjs';

import { ToastService } from '@core/services/toast.service';
import { SidebarComponent } from '@features/dashboard/components/sidebar/sidebar.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '@shared/components/error-state/error-state.component';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton.component';

import {
  AdminCategory,
  CATEGORY_CONTEXTS,
  CONTEXTO_COM_TAXA,
  CategoryContext,
  UpsertCategoryInput,
} from '../../models/category.model';
import { CategoriesService } from '../../services/categories.service';
import { sugerirSlug } from '../../utils/category-slug';

/** Mesmos limites do `CreateCategoryDto`. */
const NOME_MAXIMO = 120;
const SLUG_MAXIMO = 120;
const ICONE_MAXIMO = 1500;
const TAXA_MINIMA = 0;
const TAXA_MAXIMA = 100;

type FormularioCategoria = FormGroup<{
  name: FormControl<string>;
  slug: FormControl<string>;
  iconUrl: FormControl<string>;
  sortOrder: FormControl<number | null>;
  platformFeeRate: FormControl<number | null>;
  isActive: FormControl<boolean>;
}>;

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SidebarComponent,
    LoadingSkeletonComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss'],
})
export class CategoriesComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly modal = inject(NgbModal);
  private readonly categoriesService = inject(CategoriesService);
  private readonly toastService = inject(ToastService);
  private readonly destroy$ = new Subject<void>();

  readonly contextos = CATEGORY_CONTEXTS;
  readonly nomeMaximo = NOME_MAXIMO;
  readonly slugMaximo = SLUG_MAXIMO;
  readonly iconeMaximo = ICONE_MAXIMO;

  readonly contexto = signal<CategoryContext>(CONTEXTO_COM_TAXA);
  readonly categorias = signal<AdminCategory[]>([]);
  readonly isLoading = signal(false);
  readonly hasError = signal(false);
  readonly isSaving = signal(false);
  readonly alternandoId = signal<number | null>(null);
  readonly emEdicao = signal<AdminCategory | undefined>(undefined);

  private modalRef: NgbModalRef | null = null;

  readonly form: FormularioCategoria = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(NOME_MAXIMO)],
    }),
    slug: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(SLUG_MAXIMO)],
    }),
    iconUrl: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(ICONE_MAXIMO)],
    }),
    sortOrder: new FormControl<number | null>(0),
    platformFeeRate: new FormControl<number | null>(null, {
      validators: [Validators.min(TAXA_MINIMA), Validators.max(TAXA_MAXIMA)],
    }),
    isActive: new FormControl(true, { nonNullable: true }),
  });

  ngOnInit(): void {
    this.carregar();

    // O slug é sugerido a partir do nome só enquanto o admin não mexeu nele.
    // Depois disso o campo é dele, e sobrescrever seria perder o que digitou.
    this.form.controls.name.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((nome) => {
      if (this.emEdicao() || this.form.controls.slug.dirty) return;
      this.form.controls.slug.setValue(sugerirSlug(nome ?? ''));
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  carregar(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.categoriesService.getAll(this.contexto()).subscribe({
      next: (categorias) => {
        this.categorias.set(categorias);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      },
    });
  }

  trocarContexto(contexto: CategoryContext): void {
    if (contexto === this.contexto()) return;

    this.contexto.set(contexto);
    this.categorias.set([]);
    this.carregar();
  }

  /** A taxa da plataforma só existe em `services`; nos outros o back-end recusa. */
  get mostraTaxa(): boolean {
    return this.contexto() === CONTEXTO_COM_TAXA;
  }

  get estaEditando(): boolean {
    return this.emEdicao() !== undefined;
  }

  get rotuloDoContexto(): string {
    return this.contextos.find((c) => c.valor === this.contexto())?.rotulo ?? this.contexto();
  }

  abrirNovo(template: TemplateRef<unknown>): void {
    this.emEdicao.set(undefined);
    this.form.reset({
      name: '',
      slug: '',
      iconUrl: '',
      sortOrder: 0,
      platformFeeRate: this.mostraTaxa ? 10 : null,
      isActive: true,
    });
    this.modalRef = this.modal.open(template, { centered: true, backdrop: 'static' });
  }

  abrirEdicao(categoria: AdminCategory, template: TemplateRef<unknown>): void {
    this.emEdicao.set(categoria);
    this.form.reset({
      name: categoria.name,
      slug: categoria.slug,
      iconUrl: categoria.iconUrl ?? '',
      sortOrder: categoria.sortOrder,
      platformFeeRate: categoria.platformFeeRate,
      isActive: categoria.isActive,
    });
    this.modalRef = this.modal.open(template, { centered: true, backdrop: 'static' });
  }

  fecharModal(): void {
    this.modalRef?.dismiss();
    this.modalRef = null;
    this.emEdicao.set(undefined);
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const emEdicao = this.emEdicao();
    const payload = this.montarPayload();

    this.isSaving.set(true);

    const requisicao = emEdicao
      ? this.categoriesService.update(this.contexto(), emEdicao.id, payload)
      : this.categoriesService.create(this.contexto(), payload);

    requisicao.subscribe({
      next: () => {
        this.toastService.showSuccess(emEdicao ? 'Categoria atualizada.' : 'Categoria criada.');
        this.isSaving.set(false);
        this.fecharModal();
        this.carregar();
      },
      error: (erro: HttpErrorResponse) => {
        this.isSaving.set(false);
        this.toastService.showError(this.mensagemDeErro(erro));
      },
    });
  }

  alternarAtivo(categoria: AdminCategory): void {
    if (this.alternandoId() !== null) return;

    this.alternandoId.set(categoria.id);

    const requisicao = categoria.isActive
      ? this.categoriesService.inactivate(this.contexto(), categoria.id)
      : this.categoriesService.reactivate(this.contexto(), categoria.id);

    requisicao.subscribe({
      next: (atualizada) => {
        this.categorias.update((lista) =>
          lista.map((c) => (c.id === atualizada.id ? atualizada : c))
        );
        this.toastService.showSuccess(
          atualizada.isActive ? 'Categoria reativada.' : 'Categoria inativada.'
        );
        this.alternandoId.set(null);
      },
      error: (erro: HttpErrorResponse) => {
        this.toastService.showError(this.mensagemDeErro(erro));
        this.alternandoId.set(null);
      },
    });
  }

  formatarTaxa(valor: number | null): string {
    if (valor === null) return '—';
    return `${valor.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
  }

  voltar(): void {
    this.router.navigate(['/settings']);
  }

  private montarPayload(): UpsertCategoryInput {
    const { name, slug, iconUrl, sortOrder, platformFeeRate, isActive } = this.form.getRawValue();
    const icone = iconUrl.trim();

    return {
      name: name.trim(),
      slug: slug.trim(),
      ...(icone && { iconUrl: icone }),
      ...(sortOrder !== null && { sortOrder }),
      isActive,
      // Só `services` tem a coluna. Mandar a taxa nos outros contextos faz o
      // back-end responder 400 — a tela nem oferece o campo, e aqui garante
      // que uma troca de contexto não arraste o valor antigo no payload.
      ...(this.mostraTaxa && platformFeeRate !== null && { platformFeeRate }),
    };
  }

  private mensagemDeErro(erro: HttpErrorResponse): string {
    const corpo = erro.error as { message?: string | string[] } | null;
    const mensagem = corpo?.message;

    if (Array.isArray(mensagem) && mensagem.length) return mensagem[0];
    if (typeof mensagem === 'string' && mensagem.trim()) return mensagem;

    return 'Não foi possível salvar a categoria.';
  }
}
