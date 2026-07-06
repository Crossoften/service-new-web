export type AuthRole = 'Master' | 'Admin';
export type PublicTextType = 'About' | 'Policies' | 'Terms' | 'Tips' | 'Cookies';
export type UserRole = 'Master' | 'Admin' | 'User';
export type UserStatus = 'Active' | 'Pending' | 'Inactive';
export type UserProfileType = 'Client' | 'Supplier' | 'Partner' | 'Delivery' | 'Influencer';
export type SocialNetwork = 'Instagram' | 'TikTok' | 'YouTube' | 'Facebook' | 'X' | 'Other';
export type BillingType = 'None' | 'Subscription' | 'Commission' | null;

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

export interface UserSocialMediaResponse {
  id: number;
  network: SocialNetwork;
  url: string;
  followers: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserAddressResponse {
  id: number;
  street?: string | null;
  number?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateAddressPayload {
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface UpdateBillingTypePayload {
  billingType: BillingType;
}

export interface MySelfResponse {
  id: number;
  name: string;
  email: string;
  document?: string | null;
  phone?: string | null;
  code?: string;
  biography?: string | null;
  role: UserRole;
  profileType?: UserProfileType;
  status?: UserStatus;
  fileUrl?: string | null;
  fileKey?: string | null;
  referralCode?: string | null;
  birthDate?: string | null;
  commissionRate?: number | null;
  billingType?: BillingType;
  socialMedias: UserSocialMediaResponse[];
  address?: UserAddressResponse | null;
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
