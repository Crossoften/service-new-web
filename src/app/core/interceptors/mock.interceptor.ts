import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { delay, of } from 'rxjs';
import { environment } from '@environments/environment';

export const mockInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.useMock) {
    return next(req);
  }

  const mockResponses: Record<string, unknown> = {
    '/api/auth/login': {
      accessToken: 'mock_token_' + Math.random().toString(36).substr(2, 9),
      user: {
        id: 1,
        name: 'Usuário Demo',
        email: 'demo@service.com',
        role: 'admin',
      },
    },
    '/api/users': {
      data: [],
      total: 0,
      page: 1,
      pageSize: 10,
    },
    '/api/services': {
      data: [],
      total: 0,
      page: 1,
      pageSize: 10,
    },
  };

  for (const [route, response] of Object.entries(mockResponses)) {
    if (req.url.includes(route)) {
      return of(new HttpResponse({ status: 200, body: response })).pipe(
        delay(environment.mockDelay)
      );
    }
  }

  return next(req);
};
