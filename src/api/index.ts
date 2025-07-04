import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { RegisterRequest, RegisterResponse, LoginRequest, LoginResponse, VerifyOTPRequest, VerifyOTPResponse } from './types/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('authToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
    }
    return Promise.reject(error);
  }
);

export const register = async (data: RegisterRequest): Promise<RegisterResponse> => {
  try {
    const response = await api.post('/api/Users/register', data);
    console.log('Server register response:', response.data);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 
                    error.response?.data?.error || 
                    'Registration failed. Please check your input and try again.';
    console.error('Register API error:', error.response?.data || error.message);
    throw new Error(message);
  }
};

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  try {
    const response = await api.post('/api/Users/login', data);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Login failed.';
    throw new Error(message);
  }
};

export const loginWithGoogle = async (accessToken: string): Promise<LoginResponse> => {
  try {
    const response = await api.post('/api/Users/login-google', { accessToken });
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Đăng nhập bằng Google thất bại.';
    throw new Error(message);
  }
};

export const verifyOTP = async (data: VerifyOTPRequest): Promise<VerifyOTPResponse> => {
  try {
    const response = await api.post('/api/Users/verify-otp', data);
    console.log('Server verify OTP response:', response.data);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'OTP verification failed.';
    console.error('Verify OTP API error:', error.response?.data || error.message);
    throw new Error(message);
  }
};

export const forgotPassword = async (email: string): Promise<{ message: string }> => {
  try {
    const response = await api.post('/api/Users/forgot-password', { email });
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Gửi yêu cầu khôi phục mật khẩu thất bại.';
    throw new Error(message);
  }
};

export const resetPassword = async (token: string, newPassword: string): Promise<{ message: string }> => {
  try {
    const response = await api.post('/api/Users/reset-password', { token, newPassword });
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Đặt lại mật khẩu thất bại.';
    throw new Error(message);
  }
};

export const checkAvailability = async (field: 'username' | 'email' | 'phoneNumber', value: string): Promise<boolean> => {
  try {
    const response = await api.post('/api/Users/check-availability', { [field]: value });
    return response.data.isAvailable;
  } catch (error) {
    return false;
  }
};

export default api;