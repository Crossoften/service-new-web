import { Injectable } from '@angular/core';
import { PermissionResponse, SessionData } from '@features/auth/models/auth.model';

const SESSION_STORAGE_KEY = 'service.session';

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  getSession(): SessionData | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    const rawSession = localStorage.getItem(SESSION_STORAGE_KEY);

    if (!rawSession) {
      return null;
    }

    try {
      return JSON.parse(rawSession) as SessionData;
    } catch {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
  }

  setSession(session: SessionData): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }

  clearSession(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.removeItem(SESSION_STORAGE_KEY);
  }

  getToken(): string | null {
    return this.getSession()?.token ?? null;
  }

  getPermissions(): PermissionResponse[] {
    return this.getSession()?.adminPermissions ?? [];
  }
}
