export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  status?: number;
  message?: string;
  data?: string;
  token?: string;
  refreshToken?: string;
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

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
}