export type AuthRole = 'Master' | 'Admin';
export type PublicTextType = 'About' | 'Policies' | 'Terms' | 'Tips' | 'Cookies';
export type UserRole = 'Master' | 'Admin' | 'User';
export type UserStatus = 'Active' | 'Pending' | 'Inactive';

export interface PermissionResponse {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  id: number;
  role: AuthRole;
  adminPermissions: PermissionResponse[];
}

export interface MessageResponse {
  message: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyCodeRequest {
  code: string;
}

export interface ResetPasswordRequest {
  code: string;
  password: string;
  confirmPassword: string;
}

export interface ContactUsRequest {
  name: string;
  phone?: string;
  email: string;
  text: string;
}

export interface PublicTextResponse {
  id: number;
  type: PublicTextType;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export interface MySelfResponse {
  id: number;
  name: string;
  email: string;
  document?: string;
  phone?: string;
  code?: string;
  role: UserRole;
  status?: UserStatus;
  fileUrl?: string | null;
  fileKey?: string | null;
  adminPermissions?: Array<string | PermissionResponse>;
  createdAt?: string;
  updatedAt?: string;
}

export interface SessionData {
  token: string;
  id: number;
  role: AuthRole;
  adminPermissions: PermissionResponse[];
}
