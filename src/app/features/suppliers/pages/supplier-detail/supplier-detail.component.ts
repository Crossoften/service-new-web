import { Component, OnInit, Input, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { SidebarComponent } from '@features/dashboard/components/sidebar/sidebar.component';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton.component';
import { ToastService } from '@core/services/toast.service';
import { SuppliersService } from '../../services/suppliers.service';
import { Supplier } from '../../models/supplier.model';

@Component({
  selector: 'app-supplier-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SidebarComponent, LoadingSkeletonComponent],
  templateUrl: './supplier-detail.component.html',
  styleUrls: ['./supplier-detail.component.scss'],
})
export class SupplierDetailComponent implements OnInit {
  @Input() id!: string;

  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly suppliersService = inject(SuppliersService);
  private readonly toastService = inject(ToastService);

  readonly supplier = signal<Supplier | undefined>(undefined);
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
    this.suppliersService.getSupplierById(this.id).subscribe({
      next: (sup) => {
        if (!sup) {
          this.toastService.showError('Fornecedor não encontrado.');
          this.router.navigate(['/suppliers']);
          return;
        }
        this.supplier.set(sup);
        this.form.patchValue({
          name:        sup.name,
          email:       sup.email,
          phone:       sup.phone,
          dateOfBirth: sup.dateOfBirth,
          status:      sup.status === 'active',
        });
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.showError('Erro ao carregar fornecedor.');
        this.isLoading.set(false);
      },
    });
  }

  get avatarInitials(): string {
    return (this.supplier()?.name ?? '')
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

  formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatDate(dateStr: string): string {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }

  onSave(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isSaving.set(true);
    const { status, ...rest } = this.form.value as { status: boolean; name: string; email: string; phone: string; dateOfBirth: string };
    this.suppliersService.updateSupplier(this.id, { ...rest, status: status ? 'active' : 'inactive' }).subscribe({
      next: () => {
        this.toastService.showSuccess('Fornecedor atualizado com sucesso.');
        this.router.navigate(['/suppliers']);
      },
      error: () => {
        this.toastService.showError('Erro ao salvar fornecedor.');
        this.isSaving.set(false);
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/suppliers']);
  }
}
