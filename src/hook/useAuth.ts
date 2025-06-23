// hook/useAuth.ts
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register, login, loginWithGoogle, verifyOTP } from '../api';
import { RegisterRequest, RegisterResponse, LoginRequest, LoginResponse, VerifyOTPRequest, VerifyOTPResponse } from '../api/types/auth';
import { getRoleFromToken } from '../utils/jwt';

interface AuthHook {
  handleRegister: (data: RegisterRequest) => Promise<void>;
  handleLogin: (data: LoginRequest) => Promise<boolean>;
  handleGoogleLogin: (accessToken: string) => Promise<boolean>;
  verifyOTP: (otp: string, email: string) => Promise<boolean>;
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

  const handleRegister = async (data: RegisterRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response: RegisterResponse = await register(data);
      if (response && response.message === 'Save data success') {
        setRegisteredEmail(data.email);
        setShowOTP(true);
      } else if (response && response.message) {
        setError(response.message);
      } else {
        setError('Đăng ký thất bại. Phản hồi từ server không hợp lệ.');
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
      if (response.status === 200 && response.data) {
        localStorage.setItem('authToken', response.data);
        const role = getRoleFromToken();
        if (!role) {
          setError('Đăng nhập thất bại: Không tìm thấy vai trò trong token.');
          localStorage.removeItem('authToken');
          return false;
        }
        navigate('/');
        return true;
      }
      setError('Đăng nhập thất bại: Không nhận được token.');
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
      const response: LoginResponse = await loginWithGoogle(accessToken);
      if (response.status === 200 && response.data) {
        console.log('Google Login Token từ API:', response.data); // Log token từ API
        localStorage.setItem('authToken', response.data); // Lưu token vào localStorage
        const role = getRoleFromToken();
        if (!role) {
          setError('Đăng nhập Google thất bại: Không tìm thấy vai trò trong token.');
          localStorage.removeItem('authToken');
          return false;
        }
        navigate('/');
        return true;
      }
      setError('Đăng nhập Google thất bại: Không nhận được token.');
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
      if (response.success || (response.message && response.message.includes('thành công'))) {
        if (response.token) {
          localStorage.setItem('authToken', response.token);
          const role = getRoleFromToken();
          if (!role) {
            setError('Xác minh OTP thành công nhưng không tìm thấy vai trò trong token.');
            localStorage.removeItem('authToken');
            return false;
          }
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