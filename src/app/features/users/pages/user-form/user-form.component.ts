import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, of, switchMap } from 'rxjs';

import { ToastService } from '@core/services/toast.service';
import { UploadsService } from '@core/services/uploads.service';
import { SidebarComponent } from '@features/dashboard/components/sidebar/sidebar.component';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton.component';

import { AdminUser, UpdateAdminUserPayload } from '../../models/user.model';
import { UsersService } from '../../services/users.service';

type UserFormGroup = FormGroup<{
  name: FormControl<string>;
  email: FormControl<string>;
  document: FormControl<string>;
  phone: FormControl<string>;
  birthDate: FormControl<string>;
  biography: FormControl<string>;
  deliveryCommissionRate: FormControl<number | null>;
}>;

/** `document` é `VarChar(18)` no banco e `@MaxLength(18)` no DTO. */
const TAMANHO_MAXIMO_DOCUMENTO = 18;

/** `biography` é `@MaxLength(1500)` no DTO. */
const TAMANHO_MAXIMO_BIOGRAFIA = 1500;

/** `deliveryCommissionRate` é `@Min(0)` e `@Max(100)` no DTO. */
const COMISSAO_MINIMA = 0;
const COMISSAO_MAXIMA = 100;

/** E `@IsNumber({ maxDecimalPlaces: 2 })`. */
const CASAS_DECIMAIS_DA_COMISSAO = 2;

/**
 * Espelha o `maxDecimalPlaces: 2` do DTO.
 *
 * Sem isto, digitar 15,555 só daria erro depois do 400 do servidor — e a
 * mensagem do back-end não diz qual campo arredondar.
 */
function noMaximoDuasCasas(control: AbstractControl): ValidationErrors | null {
  const valor = control.value;
  if (valor === null || valor === undefined || valor === '') return null;

  const casas = String(valor).split('.')[1]?.length ?? 0;
  return casas > CASAS_DECIMAIS_DA_COMISSAO ? { casasDecimais: true } : null;
}

/**
 * O campo `<input type="date">` só aceita `yyyy-MM-dd`, enquanto a API devolve
 * ISO completo (`1990-05-20T00:00:00.000Z`). Cortar os dez primeiros caracteres
 * evita construir um `Date`, que aplicaria o fuso do navegador e poderia
 * exibir o dia anterior para quem está a oeste de Greenwich.
 */
function paraCampoDeData(iso: string | null): string {
  return iso ? iso.slice(0, 10) : '';
}

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SidebarComponent, LoadingSkeletonComponent],
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss'],
})
export class UserFormComponent implements OnInit {
  @Input() id!: string;

  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly usersService = inject(UsersService);
  private readonly uploadsService = inject(UploadsService);
  private readonly toastService = inject(ToastService);

  readonly user = signal<AdminUser | undefined>(undefined);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);

  readonly tamanhoMaximoBiografia = TAMANHO_MAXIMO_BIOGRAFIA;
  readonly comissaoMinima = COMISSAO_MINIMA;
  readonly comissaoMaxima = COMISSAO_MAXIMA;

  /**
   * A foto fica fora do formulário porque não é texto que o admin digita: são
   * dois campos que vêm do upload em par (`fileUrl` e `fileKey`).
   */
  readonly fotoUrl = signal<string | null>(null);
  readonly fotoKey = signal<string | null>(null);
  readonly novaFoto = signal<File | undefined>(undefined);
  readonly fotoMarcadaParaRemover = signal(false);

  form!: UserFormGroup;

  ngOnInit(): void {
    this.form = this.fb.nonNullable.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      document: ['', [Validators.maxLength(TAMANHO_MAXIMO_DOCUMENTO)]],
      phone: [''],
      birthDate: [''],
      biography: ['', [Validators.maxLength(TAMANHO_MAXIMO_BIOGRAFIA)]],
      deliveryCommissionRate: new FormControl<number | null>(null, {
        validators: [
          Validators.min(COMISSAO_MINIMA),
          Validators.max(COMISSAO_MAXIMA),
          noMaximoDuasCasas,
        ],
      }),
    });

    this.carregarUsuario();
  }

  isFieldInvalid(field: keyof UserFormGroup['controls']): boolean {
    const control = this.form.get(field);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  onSelecionarFoto(event: Event): void {
    const arquivo = (event.target as HTMLInputElement).files?.[0];
    if (!arquivo) return;

    this.novaFoto.set(arquivo);
    this.fotoMarcadaParaRemover.set(false);
  }

  /**
   * Marca para remover, não remove agora.
   *
   * A rota `DELETE /v1/profile-photo` não serve aqui: ela confere a posse e só
   * apaga a foto do próprio autenticado, que é o admin. Tirar a foto de outro
   * usuário é mandar os dois campos nulos no `PATCH`.
   */
  onRemoverFoto(): void {
    this.fotoMarcadaParaRemover.set(true);
    this.novaFoto.set(undefined);
  }

  onDesfazerFoto(): void {
    this.fotoMarcadaParaRemover.set(false);
    this.novaFoto.set(undefined);
  }

  /** Cada regra do DTO tem a sua mensagem; "valor inválido" não diz o que corrigir. */
  get erroDaComissao(): string | null {
    const control = this.form.controls.deliveryCommissionRate;
    if (!control.invalid || !(control.dirty || control.touched)) return null;

    if (control.hasError('min')) return `A comissão não pode ser menor que ${COMISSAO_MINIMA}%.`;
    if (control.hasError('max')) return `A comissão não pode passar de ${COMISSAO_MAXIMA}%.`;
    if (control.hasError('casasDecimais')) {
      return `Use no máximo ${CASAS_DECIMAIS_DA_COMISSAO} casas decimais.`;
    }

    return 'Revise a comissão informada.';
  }

  get fotoEmExibicao(): string | null {
    return this.fotoMarcadaParaRemover() ? null : this.fotoUrl();
  }

  get iniciais(): string {
    return (this.user()?.name ?? '')
      .split(' ')
      .slice(0, 2)
      .map((parte) => parte[0] ?? '')
      .join('')
      .toUpperCase();
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);

    this.enviarFotoSeHouver()
      .pipe(
        switchMap((foto) => this.usersService.updateUser(Number(this.id), this.montarPayload(foto)))
      )
      .subscribe({
        next: () => {
          this.toastService.showSuccess('Usuário atualizado.');
          this.router.navigate(['/users', this.id]);
        },
        error: () => {
          // O `errorInterceptor` já exibe a mensagem; um segundo toast aqui só
          // empilharia aviso sobre aviso.
          this.isSaving.set(false);
        },
      });
  }

  /**
   * O upload só acontece ao salvar.
   *
   * Subir no momento da escolha deixaria arquivo órfão no storage toda vez que
   * o admin desistisse do formulário — e não há rota para o admin limpar o
   * arquivo de outro usuário.
   */
  private enviarFotoSeHouver(): Observable<{ fileUrl: string; fileKey: string } | null> {
    const arquivo = this.novaFoto();
    if (!arquivo) return of(null);

    return this.uploadsService.uploadOne(arquivo);
  }

  onCancel(): void {
    this.router.navigate(['/users', this.id]);
  }

  /**
   * Campo vazio vira `null`, não string vazia.
   *
   * O back-end grava o que recebe: `''` deixaria o documento como texto vazio
   * em vez de ausente, e o `@unique` do Prisma trataria dois vazios como
   * colisão. `null` é o que significa "não informado".
   */
  private montarPayload(foto: { fileUrl: string; fileKey: string } | null): UpdateAdminUserPayload {
    const valor = (campo: 'document' | 'phone' | 'birthDate' | 'biography'): string | null => {
      const bruto = this.form.controls[campo].value.trim();
      return bruto.length ? bruto : null;
    };

    const comissao = this.form.controls.deliveryCommissionRate.value;

    return {
      name: this.form.controls.name.value.trim(),
      email: this.form.controls.email.value.trim(),
      document: valor('document'),
      phone: valor('phone'),
      birthDate: valor('birthDate'),
      biography: valor('biography'),
      // Três caminhos distintos: foto nova vai com os dois campos do upload,
      // remoção vai com os dois nulos, e "não mexi" repete o que já estava
      // gravado. Omitir não serve: a tela manda o formulário inteiro.
      fileUrl: foto ? foto.fileUrl : this.fotoMarcadaParaRemover() ? null : this.fotoUrl(),
      fileKey: foto ? foto.fileKey : this.fotoMarcadaParaRemover() ? null : this.fotoKey(),
      // Campo em branco é `null`, que devolve o usuário ao padrão da
      // plataforma. Zero é zero: comissão zerada, que é outra coisa.
      deliveryCommissionRate:
        comissao === null || (comissao as unknown as string) === '' ? null : Number(comissao),
    };
  }

  private carregarUsuario(): void {
    this.isLoading.set(true);

    this.usersService.getUserById(Number(this.id)).subscribe({
      next: (usuario) => {
        this.user.set(usuario);

        this.form.patchValue({
          name: usuario.name ?? '',
          email: usuario.email ?? '',
          document: usuario.document ?? '',
          phone: usuario.phone ?? '',
          birthDate: paraCampoDeData(usuario.birthDate),
          biography: usuario.biography ?? '',
          deliveryCommissionRate: usuario.deliveryCommissionRate,
        });

        this.fotoUrl.set(usuario.fileUrl);
        this.fotoKey.set(usuario.fileKey);
        this.novaFoto.set(undefined);
        this.fotoMarcadaParaRemover.set(false);

        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.router.navigate(['/users']);
      },
    });
  }
}
