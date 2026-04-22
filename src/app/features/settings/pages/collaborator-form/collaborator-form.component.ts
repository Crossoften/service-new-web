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
import {
  Collaborator,
  CollaboratorPermission,
  CollaboratorStatus,
  SaveCollaboratorInput,
} from '../../models/collaborator.model';
import { CollaboratorsService } from '../../services/collaborators.service';

type CollaboratorFormGroup = FormGroup<{
  name: FormControl<string>;
  document: FormControl<string>;
  email: FormControl<string>;
  phone: FormControl<string>;
  password: FormControl<string>;
  status: FormControl<CollaboratorStatus>;
  permDashboard: FormControl<boolean>;
  permSettings: FormControl<boolean>;
}>;

const ALL_PERMISSION_OPTIONS: Array<{
  key: keyof Pick<CollaboratorFormGroup['controls'], 'permDashboard' | 'permSettings'>;
  label: string;
  value: CollaboratorPermission;
}> = [
  { key: 'permDashboard', label: 'Dashboard', value: 'Dashboard' },
  { key: 'permSettings', label: 'Configuracoes', value: 'Settings' },
];

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
  readonly statusOptions: CollaboratorStatus[] = ['Active', 'Pending', 'Inactive'];
  readonly permissionOptions = signal(ALL_PERMISSION_OPTIONS);

  form!: CollaboratorFormGroup;

  get isEditing(): boolean {
    return !!this.id && this.id !== 'new';
  }

  ngOnInit(): void {
    this.form = this.fb.nonNullable.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      document: ['', [Validators.required, Validators.minLength(5)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      password: [
        '',
        this.isEditing
          ? [Validators.minLength(4), Validators.maxLength(8)]
          : [Validators.required, Validators.minLength(4), Validators.maxLength(8)],
      ],
      status: ['Active' as CollaboratorStatus, Validators.required],
      permDashboard: [false],
      permSettings: [false],
    });

    this.loadPermissions();

    if (this.isEditing) {
      this.loadCollaborator();
    }
  }

  isFieldInvalid(field: keyof CollaboratorFormGroup['controls']): boolean {
    const control = this.form.get(field);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const permissions = this.getSelectedPermissions();

    if (!permissions.length) {
      this.toastService.showError('Selecione ao menos uma permissao.');
      return;
    }

    this.isSaving.set(true);

    const payload: SaveCollaboratorInput = {
      id: this.isEditing ? Number(this.id) : undefined,
      name: this.form.controls.name.value,
      document: this.form.controls.document.value,
      email: this.form.controls.email.value,
      phone: this.form.controls.phone.value,
      password: this.form.controls.password.value || undefined,
      status: this.isEditing ? this.form.controls.status.value : undefined,
      permissions,
    };

    this.collaboratorsService.saveCollaborator(payload).subscribe({
      next: () => {
        this.toastService.showSuccess(
          this.isEditing ? 'Colaborador atualizado.' : 'Colaborador adicionado.'
        );
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

  private loadPermissions(): void {
    this.collaboratorsService.getAvailablePermissions().subscribe({
      next: (permissions) => {
        const filtered = ALL_PERMISSION_OPTIONS.filter((option) =>
          permissions.includes(option.value)
        );

        this.permissionOptions.set(filtered.length ? filtered : ALL_PERMISSION_OPTIONS);
      },
      error: () => {
        this.permissionOptions.set(ALL_PERMISSION_OPTIONS);
      },
    });
  }

  private loadCollaborator(): void {
    this.isLoading.set(true);
    this.collaboratorsService.getCollaboratorById(this.id!).subscribe({
      next: (collaborator) => {
        this.collaborator.set(collaborator);
        this.form.patchValue({
          name: collaborator.name,
          document: collaborator.document,
          email: collaborator.email,
          phone: collaborator.phone,
          password: '',
          status: collaborator.status,
          permDashboard: collaborator.permissions.includes('Dashboard'),
          permSettings: collaborator.permissions.includes('Settings'),
        });
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.showError('Erro ao carregar colaborador.');
        this.router.navigate(['/settings']);
        this.isLoading.set(false);
      },
    });
  }

  private getSelectedPermissions(): CollaboratorPermission[] {
    const permissions: CollaboratorPermission[] = [];

    if (this.form.controls.permDashboard.value) {
      permissions.push('Dashboard');
    }

    if (this.form.controls.permSettings.value) {
      permissions.push('Settings');
    }

    return permissions;
  }
}
