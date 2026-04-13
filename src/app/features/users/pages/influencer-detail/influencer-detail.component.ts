import { Component, OnInit, Input, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { SidebarComponent } from '@features/dashboard/components/sidebar/sidebar.component';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton.component';
import { ToastService } from '@core/services/toast.service';
import { InfluencersService } from '../../services/influencers.service';
import { Influencer } from '../../models/influencer.model';

@Component({
  selector: 'app-influencer-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SidebarComponent, LoadingSkeletonComponent],
  templateUrl: './influencer-detail.component.html',
  styleUrls: ['./influencer-detail.component.scss'],
})
export class InfluencerDetailComponent implements OnInit {
  @Input() id!: string;

  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly influencersService = inject(InfluencersService);
  private readonly toastService = inject(ToastService);

  readonly influencer = signal<Influencer | undefined>(undefined);
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
    this.influencersService.getInfluencerById(this.id).subscribe({
      next: (inf) => {
        if (!inf) {
          this.toastService.showError('Influencer não encontrado.');
          this.router.navigate(['/users/influencers']);
          return;
        }
        this.influencer.set(inf);
        this.form.patchValue({
          name:        inf.name,
          email:       inf.email,
          phone:       inf.phone,
          dateOfBirth: inf.dateOfBirth,
          status:      inf.status === 'active',
        });
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.showError('Erro ao carregar influencer.');
        this.isLoading.set(false);
      },
    });
  }

  get avatarInitials(): string {
    return (this.influencer()?.name ?? '')
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

  onSave(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isSaving.set(true);
    const { status, ...rest } = this.form.value as { status: boolean; name: string; email: string; phone: string; dateOfBirth: string };
    this.influencersService.updateInfluencer(this.id, { ...rest, status: status ? 'active' : 'inactive' }).subscribe({
      next: () => {
        this.toastService.showSuccess('Influencer atualizado com sucesso.');
        this.router.navigate(['/users/influencers']);
      },
      error: () => {
        this.toastService.showError('Erro ao salvar influencer.');
        this.isSaving.set(false);
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/users/influencers']);
  }
}
