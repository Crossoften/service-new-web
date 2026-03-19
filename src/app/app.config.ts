import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { mockInterceptor } from './core/interceptors/mock.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { routes } from './app.routes';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withComponentInputBinding(),
      withViewTransitions({
        onViewTransitionCreated: () => {},
      })
    ),
    provideAnimations(),
    provideHttpClient(withInterceptors([mockInterceptor, errorInterceptor])),
    importProvidersFrom(NgbModule),
  ],
};
