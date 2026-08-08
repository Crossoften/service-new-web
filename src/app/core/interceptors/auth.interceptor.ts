import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '@environments/environment';
import { SessionService } from '../services/session.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const sessionService = inject(SessionService);
  const token = sessionService.getToken();

  if (!token || !req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  if (
    req.url.includes('/v1/login') ||
    req.url.includes('/v1/forgot') ||
    req.url.includes('/v1/no-auth')
  ) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    })
  );
};
