import { Component, OnInit, Input, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { SidebarComponent } from '@features/dashboard/components/sidebar/sidebar.component';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton.component';
import { ToastService } from '@core/services/toast.service';
import { CollaboratorsService } from '../../services/collaborators.service';
import { Collaborator, CollaboratorRole } from '../../models/collaborator.model';

@Component({
  selector: 'app-collaborator-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SidebarComponent, LoadingSkeletonComponent],
  templateUrl: './collaborator-form.component.html',
  styleUrls: ['./collaborator-form.component.scss'],
})
export class CollaboratorFormComponent implements OnInit {
  @Input() id?: string;

  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly collaboratorsService = inject(CollaboratorsService);
  private readonly toastService = inject(ToastService);

  readonly collaborator = signal<Collaborator | undefined>(undefined);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);

  readonly roles: CollaboratorRole[] = ['Admin', 'Admin Master'];

  form!: FormGroup;

  get isEditing(): boolean { return !!this.id && this.id !== 'new'; }

  ngOnInit(): void {
    this.form = this.fb.group({
      cod:        ['', Validators.required],
      name:       ['', [Validators.required, Validators.minLength(2)]],
      token:      [''],
      email:      ['', [Validators.required, Validators.email]],
      senha:      [''],
      role:       ['Admin', Validators.required],
      permDashboard: [false],
      permUsers:     [false],
      permServices:  [false],
      permFinance:   [false],
      permSettings:  [false],
    });

    if (this.isEditing) {
      this.isLoading.set(true);
      this.collaboratorsService.getCollaboratorById(this.id!).subscribe({
        next: (col) => {
          if (!col) {
            this.toastService.showError('Colaborador não encontrado.');
            this.router.navigate(['/settings']);
            return;
          }
          this.collaborator.set(col);
          this.form.patchValue({
            cod:           col.cod,
            name:          col.name,
            token:         col.token,
            email:         col.email,
            role:          col.role,
            permDashboard: col.permissions.dashboard,
            permUsers:     col.permissions.users,
            permServices:  col.permissions.services,
            permFinance:   col.permissions.finance,
            permSettings:  col.permissions.settings,
          });
          this.isLoading.set(false);
        },
        error: () => {
          this.toastService.showError('Erro ao carregar colaborador.');
          this.isLoading.set(false);
        },
      });
    }
  }

  isFieldInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  onSave(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isSaving.set(true);
    const v = this.form.value;
    const payload: Partial<Collaborator> = {
      id:    this.isEditing ? this.id : undefined,
      cod:   v.cod,
      name:  v.name,
      email: v.email,
      token: v.token,
      role:  v.role,
      permissions: {
        dashboard: v.permDashboard,
        users:     v.permUsers,
        services:  v.permServices,
        finance:   v.permFinance,
        settings:  v.permSettings,
      },
    };

    this.collaboratorsService.saveCollaborator(payload).subscribe({
      next: () => {
        this.toastService.showSuccess(this.isEditing ? 'Colaborador atualizado.' : 'Colaborador adicionado.');
        this.router.navigate(['/settings']);
      },
      error: () => {
        this.toastService.showError('Erro ao salvar colaborador.');
        this.isSaving.set(false);
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/settings']);
  }
}
