import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register, login, loginWithGoogle, verifyOTP } from '../api';
import {
  RegisterRequest, RegisterResponse,
  LoginRequest, LoginResponse,
  VerifyOTPResponse
} from '@/types';
import { getRoleFromToken, getUserIdFromToken } from '../utils/jwt';

interface AuthHook {
  handleRegister: (data: RegisterRequest) => Promise<void>;
  handleLogin: (data: LoginRequest) => Promise<boolean>;
  handleGoogleLogin: (accessToken: string) => Promise<boolean>;
  verifyOTP: (otp: string, email: string) => Promise<boolean>;
  handleLogout: () => void;
  loading: boolean;
  error: string | null;
  showOTP: boolean;
  setShowOTP: React.Dispatch<React.SetStateAction<boolean>>;
  otp: string;
  setOtp: React.Dispatch<React.SetStateAction<string>>;
  registeredEmail: string;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useAuth = (): AuthHook => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState<string>('');
  const navigate = useNavigate();

  const saveTokens = (token: string, refreshToken: string) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('refreshToken', refreshToken);

    const userId = getUserIdFromToken();
    if (userId) {
      localStorage.setItem('userId', userId.toString()); // Optional: dùng khi cần
    }

    window.dispatchEvent(new Event('tokenRefreshed'));
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  const handleRegister = async (data: RegisterRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response: RegisterResponse = await register(data);
      if (response?.message === 'Save data success') {
        setRegisteredEmail(data.email);
        setShowOTP(true);
      } else {
        setError(response?.message || 'Đăng ký thất bại.');
      }
    } catch (error: any) {
      setError(error.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (data: LoginRequest): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response: LoginResponse = await login(data);
      const token = response.token;
      const refreshToken = response.refreshToken;

      if (token && refreshToken) {
        saveTokens(token, refreshToken);

        const role = getRoleFromToken();
        if (!role) {
          setError('Không tìm thấy vai trò trong token.');
          handleLogout();
          return false;
        }

        navigate('/');
        return true;
      }

      setError('Không nhận được token hoặc refreshToken.');
      return false;
    } catch (error: any) {
      setError(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (accessToken: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response: any = await loginWithGoogle(accessToken);
      const token = response.data;

      if (token) {
        saveTokens(token, ''); // Google login thường không có refresh token

        const role = getRoleFromToken();
        if (!role) {
          setError('Không tìm thấy vai trò trong token.');
          handleLogout();
          return false;
        }

        navigate('/');
        return true;
      }

      setError('Không nhận được token.');
      return false;
    } catch (error: any) {
      setError(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const verifyOTPHandler = async (otp: string, email: string) => {
    setLoading(true);
    setError(null);
    try {
      const response: VerifyOTPResponse = await verifyOTP({ email, otp });
      if (response.success || response.message?.includes('thành công')) {
        if (response.token) {
          saveTokens(response.token, '');
        }
        setShowOTP(false);
        setOtp('');
        navigate('/');
        return true;
      }
      setError(response.message || 'OTP không hợp lệ.');
      return false;
    } catch (error: any) {
      setError(error.response?.data?.message || error.message || 'Xác minh OTP thất bại.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    handleRegister,
    handleLogin,
    handleGoogleLogin,
    verifyOTP: verifyOTPHandler,
    handleLogout,
    loading,
    error,
    showOTP,
    setShowOTP,
    otp,
    setOtp,
    registeredEmail,
    setError,
    setLoading,
  };
};
