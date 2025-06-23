// api/types/auth.ts
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  status?: number;           // Cho đăng nhập Google
  message?: string;         // Cho đăng nhập Google
  data?: string;            // Token cho đăng nhập Google
  token?: string;           // Token cho đăng nhập bình thường
  refreshToken?: string;    // Refresh token cho đăng nhập bình thường
}

export interface RegisterRequest {
  username: string;
  passwordHash: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  fullName: string;
}

export interface RegisterResponse {
  success?: boolean;
  message?: string;
  otpRequired?: boolean;
}

export interface VerifyOTPRequest {
  email: string;
  otp: string;
}

export interface VerifyOTPResponse {
  success: boolean;
  message?: string;
  token?: string;
}