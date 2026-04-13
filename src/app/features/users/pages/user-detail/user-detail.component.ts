import { Component, OnInit, Input, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { SidebarComponent } from '@features/dashboard/components/sidebar/sidebar.component';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton.component';
import { ToastService } from '@core/services/toast.service';
import { UsersService } from '../../services/users.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SidebarComponent, LoadingSkeletonComponent],
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.scss'],
})
export class UserDetailComponent implements OnInit {
  @Input() id!: string;

  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly usersService = inject(UsersService);
  private readonly toastService = inject(ToastService);

  readonly user = signal<User | undefined>(undefined);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);

  form!: FormGroup;

  ngOnInit(): void {
    this.form = this.fb.group({
      name:        ['', [Validators.required, Validators.minLength(2)]],
      email:       ['', [Validators.required, Validators.email]],
      phone:       ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      status:      [false],
    });

    this.isLoading.set(true);
    this.usersService.getUserById(this.id).subscribe({
      next: (user) => {
        if (!user) {
          this.toastService.showError('Usuário não encontrado.');
          this.router.navigate(['/users']);
          return;
        }
        this.user.set(user);
        this.form.patchValue({
          name:        user.name,
          email:       user.email,
          phone:       user.phone,
          dateOfBirth: user.dateOfBirth,
          status:      user.status === 'active',
        });
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.showError('Erro ao carregar usuário.');
        this.isLoading.set(false);
      },
    });
  }

  get avatarInitials(): string {
    const name = this.user()?.name ?? '';
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }

  isFieldInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSaving.set(true);
    const { status, ...rest } = this.form.value as { status: boolean; name: string; email: string; phone: string; dateOfBirth: string };
    this.usersService
      .updateUser(this.id, { ...rest, status: status ? 'active' : 'inactive' })
      .subscribe({
        next: () => {
          this.toastService.showSuccess('Usuário atualizado com sucesso.');
          this.router.navigate(['/users']);
        },
        error: () => {
          this.toastService.showError('Erro ao salvar usuário.');
          this.isSaving.set(false);
        },
      });
  }

  onCancel(): void {
    this.router.navigate(['/users']);
  }
}
