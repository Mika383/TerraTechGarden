import api from '@/lib/axios/axiosInstance';
import {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  VerifyOTPRequest,
  VerifyOTPResponse,
} from '../types/auth';

export const register = async (data: RegisterRequest): Promise<RegisterResponse> => {
  try {
    const response = await api.post('/Users/register', data);
    console.log('Server register response:', response.data);
    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      'Registration failed. Please check your input and try again.';
    console.error('Register API error:', error.response?.data || error.message);
    throw new Error(message);
  }
};

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  try {
    const response = await api.post('/Users/login', data);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Login failed.';
    throw new Error(message);
  }
};

export const loginWithGoogle = async (accessToken: string): Promise<LoginResponse> => {
  try {
    const response = await api.post('/Users/login-google', { accessToken });
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Đăng nhập bằng Google thất bại.';
    throw new Error(message);
  }
};

export const verifyOTP = async (data: VerifyOTPRequest): Promise<VerifyOTPResponse> => {
  try {
    const response = await api.post('/Users/verify-otp', data);
    console.log('Server verify OTP response:', response.data);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'OTP verification failed.';
    console.error('Verify OTP API error:', error.response?.data || error.message);
    throw new Error(message);
  }
};

export const resendOTP = async (email: string): Promise<{ message: string }> => {
  try {
    const response = await api.post('/Users/resend-otp', { email });
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Gửi lại mã OTP thất bại.';
    throw new Error(message);
  }
};


export const forgotPassword = async (email: string): Promise<{ message: string }> => {
  try {
    const response = await api.post('/Users/forgot-password', { email });
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Gửi yêu cầu khôi phục mật khẩu thất bại.';
    throw new Error(message);
  }
};

export const resetPassword = async (token: string, newPassword: string): Promise<{ message: string }> => {
  try {
    const response = await api.post('/Users/reset-password', { token, newPassword });
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Đặt lại mật khẩu thất bại.';
    throw new Error(message);
  }
};

export const checkAvailability = async (
  field: 'username' | 'email' | 'phoneNumber',
  value: string
): Promise<boolean> => {
  try {
    const response = await api.post('/Users/check-availability', { [field]: value });
    return response.data.isAvailable;
  } catch (error) {
    return false;
  }
};
