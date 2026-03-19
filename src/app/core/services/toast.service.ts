import { Injectable } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toasts: Toast[] = [];

  showSuccess(message: string, duration = 3000): void {
    this.show(message, 'success', duration);
  }

  showError(message: string, duration = 5000): void {
    this.show(message, 'error', duration);
  }

  showInfo(message: string, duration = 3000): void {
    this.show(message, 'info', duration);
  }

  showWarning(message: string, duration = 4000): void {
    this.show(message, 'warning', duration);
  }

  private show(message: string, type: ToastType, duration: number): void {
    const id = Math.random().toString(36).substr(2, 9);
    const toast: Toast = { id, message, type, duration };

    this.toasts.push(toast);

    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }
  }

  remove(id: string): void {
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }

  getToasts(): Toast[] {
    return this.toasts;
  }

  clear(): void {
    this.toasts = [];
  }
}
