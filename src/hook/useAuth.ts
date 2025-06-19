import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register, login, verifyOTP } from '../api';
import { RegisterRequest, RegisterResponse, LoginRequest, LoginResponse, VerifyOTPRequest, VerifyOTPResponse } from '../api/types/auth';

// Define the return type of useAuth
interface AuthHook {
  handleRegister: (data: RegisterRequest) => Promise<void>;
  handleLogin: (data: LoginRequest) => Promise<boolean>;
  verifyOTP: (otp: string) => Promise<boolean>;
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
      console.log('Registration response:', response); // Debug
      if (response && response.message === 'Save data success') {
        setRegisteredEmail(data.email); // Keep this for other potential uses
        setShowOTP(true); // This is now managed by Register component
        console.log('OTP modal should display, showOTP set to true');
      } else if (response && response.message) {
        setError(response.message);
        console.log('Registration failed or incomplete:', response.message);
      } else {
        setError('Registration failed. Unexpected server response.');
        console.log('Unexpected response:', response);
      }
    } catch (error: any) {
      const message = error.message || 'Registration failed. Please try again.';
      setError(message);
      console.error('Registration error:', message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (data: LoginRequest): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response: LoginResponse = await login(data);
      if (response.token) {
        localStorage.setItem('authToken', response.token);
        navigate('/');
        return true;
      }
      setError('Login failed: No token received.');
      return false;
    } catch (error: any) {
      setError(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const verifyOTPHandler = async (otp: string) => {
    if (!registeredEmail) {
      setError('No email registered. Please try registering again.');
      return false;
    }
    setLoading(true);
    setError(null);
    try {
      console.log('Sending OTP verification with email:', registeredEmail, 'otp:', otp); // Debug
      const response: VerifyOTPResponse = await verifyOTP({ email: registeredEmail, otp });
      if (response.success) {
        setShowOTP(false);
        setOtp('');
        if (response.token) {
          localStorage.setItem('authToken', response.token);
        }
        navigate('/dashboard');
        return true;
      }
      setError(response.message || 'Invalid OTP.');
      return false;
    } catch (error: any) {
      setError(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    handleRegister,
    handleLogin,
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