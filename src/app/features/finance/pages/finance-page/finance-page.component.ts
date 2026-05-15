import { Component, OnDestroy, OnInit, TemplateRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { SidebarComponent } from '@features/dashboard/components/sidebar/sidebar.component';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '@shared/components/error-state/error-state.component';
import { FinanceService } from '../../services/finance.service';
import { PlatformSettings } from '../../models/finance.model';

@Component({
  selector: 'app-finance-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SidebarComponent,
    LoadingSkeletonComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  templateUrl: './finance-page.component.html',
  styleUrls: ['./finance-page.component.scss'],
})
export class FinancePageComponent implements OnInit, OnDestroy {
  private readonly modal = inject(NgbModal);
  private readonly fb = inject(FormBuilder);
  private readonly financeService = inject(FinanceService);
  private readonly destroy$ = new Subject<void>();

  readonly platformSettings = signal<PlatformSettings | null>(null);
  readonly isLoadingPlatform = signal(false);
  readonly hasPlatformError = signal(false);
  readonly isSavingPlatform = signal(false);

  platformForm!: FormGroup;
  private activeModalRef: NgbModalRef | null = null;

  ngOnInit(): void {
    this.loadPlatformSettings();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPlatformSettings(): void {
    this.isLoadingPlatform.set(true);
    this.hasPlatformError.set(false);

    this.financeService.getPlatformSettings().pipe(takeUntil(this.destroy$)).subscribe({
      next: (settings) => {
        this.platformSettings.set(settings);
        this.isLoadingPlatform.set(false);
      },
      error: () => {
        this.hasPlatformError.set(true);
        this.isLoadingPlatform.set(false);
      },
    });
  }

  openPlatformModal(templateRef: TemplateRef<unknown>): void {
    this.platformForm = this.fb.group({
      influencerCommissionRate: [
        this.platformSettings()?.influencerCommissionRate ?? 0,
        [Validators.required, Validators.min(0), Validators.max(100)],
      ],
    });

    this.activeModalRef = this.modal.open(templateRef, { centered: true, size: 'md' });
  }

  savePlatformSettings(): void {
    if (this.platformForm.invalid) {
      this.platformForm.markAllAsTouched();
      return;
    }

    this.isSavingPlatform.set(true);

    this.financeService
      .updatePlatformSettings({
        influencerCommissionRate: Number(this.platformForm.value.influencerCommissionRate),
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (settings) => {
          this.platformSettings.set(settings);
          this.isSavingPlatform.set(false);
          this.activeModalRef?.close();
        },
        error: () => this.isSavingPlatform.set(false),
      });
  }

  dismissModal(): void {
    this.activeModalRef?.dismiss();
  }

  formatPercent(value: number | null | undefined): string {
    if (value == null) {
      return 'N/D';
    }

    return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
  }

  formatDate(value: string | null | undefined): string {
    if (!value) {
      return 'N/D';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'N/D';
    }

    return date.toLocaleString('pt-BR');
  }
}
