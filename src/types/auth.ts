export interface ProfileUpdates {
  fullName?: string | null;
  username?: string | null;
  phone?: string | null;
}

export interface AuthActionBaseResult {
  success: boolean;
  error?: string;
}

export interface AuthActionProfileResult extends AuthActionBaseResult {
  profile?: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    phone: string | null;
    is_admin: boolean;
    loyalty_points_balance: number;
    referral_code: string | null;
    referred_by: string | null;
    created_at: string;
    updated_at: string;
  }
}

export type AuthActionResult<T extends Record<string, unknown> = Record<string, unknown>> =
  | ({ success: true } & T)
  | { success: false; error: string };

export interface SignInPayload {
  email: string;
  password: string;
  next?: string;
}

export interface SignUpPayload {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  next?: string;
}

export interface UpdatePasswordPayload {
  newPassword: string;
}