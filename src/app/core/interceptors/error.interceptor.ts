import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { Router } from '@angular/router';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const errorMessage = error.error?.message || 'Erro desconhecido';

      switch (error.status) {
        case 0:
          toastService.showError('Erro de conexão. Verifique sua internet.');
          break;

        case 400:
          toastService.showError(`Requisição inválida: ${errorMessage}`);
          break;

        case 401:
          toastService.showError('Sessão expirada. Faça login novamente.');
          router.navigate(['/auth/login']);
          break;

        case 403:
          toastService.showError('Acesso negado.');
          break;

        case 404:
          toastService.showError('Recurso não encontrado.');
          break;

        case 500:
          toastService.showError('Erro no servidor. Tente novamente mais tarde.');
          break;

        default:
          toastService.showError(`Erro ${error.status}: ${errorMessage}`);
      }

      return throwError(() => error);
    })
  );
};
