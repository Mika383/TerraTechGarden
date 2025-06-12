import api from './axios';
import { RegisterRequest, RegisterResponse, LoginRequest, LoginResponse, VerifyOTPRequest, VerifyOTPResponse } from './types/auth';

// Đăng ký người dùng
export const register = async (data: RegisterRequest): Promise<RegisterResponse> => {
  try {
    const response = await api.post('/api/Users/register', data);
    console.log('Server register response:', response.data); // Debug
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 
                    error.response?.data?.error || 
                    'Registration failed. Please check your input and try again.';
    console.error('Register API error:', error.response?.data || error.message);
    throw new Error(message);
  }
};

// Đăng nhập
export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  try {
    const response = await api.post('/api/Users/login', data);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Login failed.';
    throw new Error(message);
  }
};

// Xác minh OTP
export const verifyOTP = async (data: VerifyOTPRequest): Promise<VerifyOTPResponse> => {
  try {
    const response = await api.post('/api/Users/verify-otp', data);
    console.log('Server verify OTP response:', response.data); // Debug
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'OTP verification failed.';
    console.error('Verify OTP API error:', error.response?.data || error.message);
    throw new Error(message);
  }
};
// Optional: Check availability of username, email, or phoneNumber
export const checkAvailability = async (field: 'username' | 'email' | 'phoneNumber', value: string): Promise<boolean> => {
  try {
    const response = await api.post('/api/Users/check-availability', { [field]: value });
    return response.data.isAvailable;
  } catch (error) {
    return false; // Assume unavailable on error
  }
};