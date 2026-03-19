import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from './core/services/toast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NgbModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'service-web';

  constructor(readonly toastService: ToastService) {}

  getToastIcon(type: string): string {
    const icons: Record<string, string> = {
      success: 'bi bi-check-circle-fill',
      error: 'bi bi-exclamation-circle-fill',
      info: 'bi bi-info-circle-fill',
      warning: 'bi bi-exclamation-triangle-fill',
    };
    return icons[type] || 'bi bi-info-circle-fill';
  }

  getToastTitle(type: string): string {
    const titles: Record<string, string> = {
      success: 'Sucesso',
      error: 'Erro',
      info: 'Informação',
      warning: 'Aviso',
    };
    return titles[type] || 'Notificação';
  }
}
