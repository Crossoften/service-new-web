import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { SessionService } from '../services/session.service';
import { ToastService } from '../services/toast.service';
import { SUPPRESS_GLOBAL_ERROR_TOAST } from '../tokens/http-context.tokens';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);
  const router = inject(Router);
  const sessionService = inject(SessionService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (req.context.get(SUPPRESS_GLOBAL_ERROR_TOAST) && error.status !== 401) {
        return throwError(() => error);
      }

      switch (error.status) {
        case 0:
          toastService.showError('Erro de conexão. Verifique sua internet.');
          break;

        case 400:
          toastService.showError('Não foi possível concluir. Revise os dados informados.');
          break;

        case 401:
          sessionService.clearSession();
          toastService.showError('Sua sessão expirou. Entre novamente.');
          router.navigate(['/auth/login']);
          break;

        case 403:
          toastService.showError('Acesso negado.');
          break;

        case 404:
          toastService.showError('Recurso não encontrado.');
          break;

        case 500:
          toastService.showError(
            'Não foi possível concluir a operação. Tente novamente mais tarde.'
          );
          break;

        default:
          toastService.showError('Algo deu errado. Tente novamente.');
      }

      return throwError(() => error);
    })
  );
};
