import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, TemplateRef, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Observable, Subject, of, switchMap, takeUntil } from 'rxjs';

import { ToastService } from '@core/services/toast.service';
import { UploadsService } from '@core/services/uploads.service';
import { SidebarComponent } from '@features/dashboard/components/sidebar/sidebar.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '@shared/components/error-state/error-state.component';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton.component';

import {
  AdminCategory,
  CATEGORY_CONTEXTS,
  CategoryContext,
  UpsertCategoryInput,
} from '../../models/category.model';
import { CategoriesService } from '../../services/categories.service';
import { sugerirSlug } from '../../utils/category-slug';

/** Mesmos limites do `CreateCategoryDto`. */
const NOME_MAXIMO = 120;
const SLUG_MAXIMO = 120;

type FormularioCategoria = FormGroup<{
  name: FormControl<string>;
  slug: FormControl<string>;
  sortOrder: FormControl<number | null>;
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
  private readonly uploadsService = inject(UploadsService);
  private readonly toastService = inject(ToastService);
  private readonly destroy$ = new Subject<void>();

  readonly contextos = CATEGORY_CONTEXTS;
  readonly nomeMaximo = NOME_MAXIMO;
  readonly slugMaximo = SLUG_MAXIMO;

  readonly contexto = signal<CategoryContext>('services');
  readonly categorias = signal<AdminCategory[]>([]);
  readonly isLoading = signal(false);
  readonly hasError = signal(false);
  readonly isSaving = signal(false);
  readonly alternandoId = signal<number | null>(null);
  readonly emEdicao = signal<AdminCategory | undefined>(undefined);

  /**
   * A imagem fica fora do formulário porque não é texto que o admin digita:
   * são dois campos que vêm do upload em par (`iconUrl` e `iconKey`).
   */
  readonly iconeUrl = signal<string | null>(null);
  readonly iconeKey = signal<string | null>(null);
  readonly novoIcone = signal<File | undefined>(undefined);
  readonly iconeMarcadoParaRemover = signal(false);

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
    sortOrder: new FormControl<number | null>(0),
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
      sortOrder: 0,
      isActive: true,
    });
    this.limparEstadoDoIcone(null, null);
    this.modalRef = this.modal.open(template, { centered: true, backdrop: 'static' });
  }

  abrirEdicao(categoria: AdminCategory, template: TemplateRef<unknown>): void {
    this.emEdicao.set(categoria);
    this.form.reset({
      name: categoria.name,
      slug: categoria.slug,
      sortOrder: categoria.sortOrder,
      isActive: categoria.isActive,
    });
    this.limparEstadoDoIcone(categoria.iconUrl, categoria.iconKey);
    this.modalRef = this.modal.open(template, { centered: true, backdrop: 'static' });
  }

  onSelecionarIcone(event: Event): void {
    const arquivo = (event.target as HTMLInputElement).files?.[0];
    if (!arquivo) return;

    this.novoIcone.set(arquivo);
    this.iconeMarcadoParaRemover.set(false);
  }

  onRemoverIcone(): void {
    this.iconeMarcadoParaRemover.set(true);
    this.novoIcone.set(undefined);
  }

  onDesfazerIcone(): void {
    this.iconeMarcadoParaRemover.set(false);
    this.novoIcone.set(undefined);
  }

  get iconeEmExibicao(): string | null {
    return this.iconeMarcadoParaRemover() ? null : this.iconeUrl();
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

    this.isSaving.set(true);

    const requisicao = this.enviarIconeSeHouver().pipe(
      switchMap((icone) => {
        const payload = this.montarPayload(icone);

        return emEdicao
          ? this.categoriesService.update(this.contexto(), emEdicao.id, payload)
          : this.categoriesService.create(this.contexto(), payload);
      })
    );

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

  voltar(): void {
    this.router.navigate(['/settings']);
  }

  /**
   * O upload só acontece ao salvar.
   *
   * Subir no momento da escolha deixaria arquivo órfão no storage toda vez que
   * o admin desistisse do formulário.
   */
  private enviarIconeSeHouver(): Observable<{ fileUrl: string; fileKey: string } | null> {
    const arquivo = this.novoIcone();
    if (!arquivo) return of(null);

    return this.uploadsService.uploadOne(arquivo);
  }

  private limparEstadoDoIcone(url: string | null, key: string | null): void {
    this.iconeUrl.set(url);
    this.iconeKey.set(key);
    this.novoIcone.set(undefined);
    this.iconeMarcadoParaRemover.set(false);
  }

  private montarPayload(icone: { fileUrl: string; fileKey: string } | null): UpsertCategoryInput {
    const { name, slug, sortOrder, isActive } = this.form.getRawValue();

    return {
      name: name.trim(),
      slug: slug.trim(),
      ...this.imagemDoPayload(icone),
      ...(sortOrder !== null && { sortOrder }),
      isActive,
    };
  }

  /**
   * Três caminhos distintos, e eles não são intercambiáveis:
   *
   * - **imagem nova** → os dois campos do upload;
   * - **remoção** → os dois nulos, que é o que o back-end usa para apagar o
   *   arquivo anterior do storage;
   * - **não mexi** → repete o que já estava gravado na edição, e **omite** na
   *   criação, onde não há nada a repetir.
   *
   * Omitir na edição deixaria a imagem atual no lugar — o que é correto para
   * "não mexi", mas tornaria a remoção impossível. Por isso o par vai
   * explícito sempre que há categoria em edição.
   */
  private imagemDoPayload(
    icone: { fileUrl: string; fileKey: string } | null
  ): Partial<UpsertCategoryInput> {
    if (icone) return { iconUrl: icone.fileUrl, iconKey: icone.fileKey };

    if (this.iconeMarcadoParaRemover()) return { iconUrl: null, iconKey: null };

    if (!this.emEdicao()) return {};

    return { iconUrl: this.iconeUrl(), iconKey: this.iconeKey() };
  }

  private mensagemDeErro(erro: HttpErrorResponse): string {
    const corpo = erro.error as { message?: string | string[] } | null;
    const mensagem = corpo?.message;

    if (Array.isArray(mensagem) && mensagem.length) return mensagem[0];
    if (typeof mensagem === 'string' && mensagem.trim()) return mensagem;

    return 'Não foi possível salvar a categoria.';
  }
}
