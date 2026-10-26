import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';

import { ToastService } from '@core/services/toast.service';
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
}>;

/** `document` é `VarChar(18)` no banco e `@MaxLength(18)` no DTO. */
const TAMANHO_MAXIMO_DOCUMENTO = 18;

/** `biography` é `@MaxLength(1500)` no DTO. */
const TAMANHO_MAXIMO_BIOGRAFIA = 1500;

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
  private readonly toastService = inject(ToastService);

  readonly user = signal<AdminUser | undefined>(undefined);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);

  readonly tamanhoMaximoBiografia = TAMANHO_MAXIMO_BIOGRAFIA;

  form!: UserFormGroup;

  ngOnInit(): void {
    this.form = this.fb.nonNullable.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      document: ['', [Validators.maxLength(TAMANHO_MAXIMO_DOCUMENTO)]],
      phone: [''],
      birthDate: [''],
      biography: ['', [Validators.maxLength(TAMANHO_MAXIMO_BIOGRAFIA)]],
    });

    this.carregarUsuario();
  }

  isFieldInvalid(field: keyof UserFormGroup['controls']): boolean {
    const control = this.form.get(field);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);

    this.usersService.updateUser(Number(this.id), this.montarPayload()).subscribe({
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
  private montarPayload(): UpdateAdminUserPayload {
    const valor = (campo: keyof UserFormGroup['controls']): string | null => {
      const bruto = this.form.controls[campo].value.trim();
      return bruto.length ? bruto : null;
    };

    return {
      name: this.form.controls.name.value.trim(),
      email: this.form.controls.email.value.trim(),
      document: valor('document'),
      phone: valor('phone'),
      birthDate: valor('birthDate'),
      biography: valor('biography'),
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
        });

        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.router.navigate(['/users']);
      },
    });
  }
}
