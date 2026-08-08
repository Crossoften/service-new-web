import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { SessionService } from '@core/services/session.service';
import { SUPPRESS_GLOBAL_ERROR_TOAST } from '@core/tokens/http-context.tokens';
import { environment } from '@environments/environment';
import {
  ContactUsRequest,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  MessageResponse,
  MySelfResponse,
  PublicTextResponse,
  PublicTextType,
  ResetPasswordRequest,
  UpdateAddressPayload,
  UpdateBillingTypePayload,
  UserAddressResponse,
  VerifyCodeRequest,
} from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  private readonly apiService = inject(ApiService);
  private readonly http = inject(HttpClient);
  private readonly sessionService = inject(SessionService);

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.apiService.post<LoginResponse>('/v1/login', payload).pipe(
      tap((response) => {
        this.sessionService.setSession({
          token: response.token,
          id: response.id,
          role: response.role,
          adminPermissions: response.adminPermissions,
        });
      })
    );
  }

  forgotPassword(payload: ForgotPasswordRequest): Observable<MessageResponse> {
    const context = new HttpContext().set(SUPPRESS_GLOBAL_ERROR_TOAST, true);
    return this.apiService.post<MessageResponse>('/v1/forgot', payload, { context });
  }

  verifyCode(payload: VerifyCodeRequest): Observable<MessageResponse> {
    return this.apiService.post<MessageResponse>('/v1/no-auth/verify-code', payload);
  }

  resetPassword(payload: ResetPasswordRequest): Observable<MessageResponse> {
    return this.apiService.post<MessageResponse>('/v1/no-auth/reset', payload);
  }

  contactUs(payload: ContactUsRequest): Observable<MessageResponse> {
    return this.apiService.post<MessageResponse>('/v1/no-auth/contact-us', payload);
  }

  getPublicText(type: PublicTextType): Observable<PublicTextResponse> {
    return this.apiService.get<PublicTextResponse>('/v1/no-auth/texts', { type });
  }

  getHealthCheck(): Observable<string> {
    return this.http
      .get(`${environment.apiUrl}/v1/no-auth/health-check`, { responseType: 'text' })
      .pipe(
        map((response) => {
          const normalized = response.trim();

          if (!normalized) {
            return 'Status indisponível';
          }

          if (normalized.startsWith('{')) {
            try {
              const parsed = JSON.parse(normalized) as { message?: string };
              return parsed.message ?? normalized;
            } catch {
              return normalized;
            }
          }

          return normalized;
        })
      );
  }

  getMySelf(): Observable<MySelfResponse> {
    return this.apiService.get<MySelfResponse>('/v1/profile/me');
  }

  updateMyAddress(payload: UpdateAddressPayload): Observable<UserAddressResponse> {
    return this.apiService.patch<UserAddressResponse>('/v1/profile/me/address', payload);
  }

  updateMyBillingType(payload: UpdateBillingTypePayload): Observable<MySelfResponse> {
    return this.apiService.patch<MySelfResponse>('/v1/profile/me/billing-type', {
      billingType: payload.billingType === 'None' ? null : payload.billingType,
    });
  }

  logout(): void {
    this.sessionService.clearSession();
  }
}
