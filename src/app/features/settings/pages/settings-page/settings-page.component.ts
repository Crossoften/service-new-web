import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { SidebarComponent } from '@features/dashboard/components/sidebar/sidebar.component';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SidebarComponent],
  templateUrl: './settings-page.component.html',
  styleUrls: ['./settings-page.component.scss'],
})
export class SettingsPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly toastService = inject(ToastService);

  readonly savingProfile = signal(false);
  readonly savingNotifications = signal(false);
  readonly savingSystem = signal(false);

  readonly profileForm: FormGroup = this.fb.group({
    companyName: ['Service Plataforma', Validators.required],
    cnpj: ['12.345.678/0001-99', Validators.required],
    email: ['contato@service.com.br', [Validators.required, Validators.email]],
    phone: ['34 9 9999-0000', Validators.required],
    address: ['Rua das Flores, 100 – Uberlândia, MG'],
  });

  readonly notificationsForm: FormGroup = this.fb.group({
    emailNewService: [true],
    emailPayment: [true],
    emailPartner: [false],
    pushNewService: [true],
    pushPayment: [false],
    pushPartner: [false],
  });

  readonly systemForm: FormGroup = this.fb.group({
    defaultCommission: [10, [Validators.required, Validators.min(0), Validators.max(100)]],
    currency: ['BRL'],
    timezone: ['America/Sao_Paulo'],
    language: ['pt-BR'],
  });

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    this.savingProfile.set(true);
    setTimeout(() => {
      this.savingProfile.set(false);
      this.toastService.showInfo('Perfil salvo com sucesso.');
    }, 800);
  }

  saveNotifications(): void {
    this.savingNotifications.set(true);
    setTimeout(() => {
      this.savingNotifications.set(false);
      this.toastService.showInfo('Preferências de notificação salvas.');
    }, 600);
  }

  saveSystem(): void {
    if (this.systemForm.invalid) return;
    this.savingSystem.set(true);
    setTimeout(() => {
      this.savingSystem.set(false);
      this.toastService.showInfo('Configurações do sistema salvas.');
    }, 700);
  }
}
