import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Leaf, Phone, Calendar, UserCheck } from 'lucide-react';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { RegisterRequest } from '@/types';
import { resendOTP } from '@/api';

type FormData = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phone: string;
  gender: 'male' | 'female' | 'other' | '';
  birthYear: string;
  acceptTerms: boolean;
};

// Password validation function (mirroring backend logic)
const validatePassword = (password: string): { isValid: boolean; error: string } => {
  if (!password) {
    return { isValid: false, error: "Mật khẩu không được để trống" };
  }

  // 1) ≥ 9 ký tự
  if (password.length < 9) {
    return { isValid: false, error: "Mật khẩu phải có ít nhất 9 ký tự" };
  }

  // 2) ít nhất 1 ký tự đặc biệt (kể cả '_')
  if (!/[\W_]/.test(password)) {
    return { isValid: false, error: "Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt" };
  }

  // 3) ít nhất 1 chữ in hoa
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: "Mật khẩu phải chứa ít nhất 1 chữ in hoa" };
  }

  // 4) ít nhất 1 số
  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: "Mật khẩu phải chứa ít nhất 1 chữ số" };
  }

  // 5) không chứa khoảng trắng
  if (/\s/.test(password)) {
    return { isValid: false, error: "Mật khẩu không được chứa khoảng trắng" };
  }

  // 6) không chứa chuỗi số liền mạch tăng dần (>=3): 123, 456, 6789,...
  if (hasAscendingDigitRun(password, 3)) {
    return { isValid: false, error: "Mật khẩu không được chứa chuỗi số liền mạch như 123, 456..." };
  }

  return { isValid: true, error: "Mật khẩu hợp lệ" };
};

// Helper function to check ascending digit runs
const hasAscendingDigitRun = (password: string, minLength: number): boolean => {
  const digits = password.match(/\d/g);
  if (!digits || digits.length < minLength) return false;
  
  let consecutiveCount = 1;
  for (let i = 1; i < digits.length; i++) {
    const current = parseInt(digits[i]);
    const previous = parseInt(digits[i - 1]);
    
    if (current === previous + 1) {
      consecutiveCount++;
      if (consecutiveCount >= minLength) {
        return true;
      }
    } else {
      consecutiveCount = 1;
    }
  }
  return false;
};

const Register: React.FC = () => {
  const navigate = useNavigate();

  // lấy API + state từ hook gốc
  const {
    handleRegister,
    loading: authLoading,
    error: authError,
    showOTP,
    setShowOTP,
    otp,
    setOtp,
    verifyOTP,
    setError,      // error setter trong hook
    setLoading,    // loading setter trong hook (để dùng cho resend)
  } = useAuth();

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    gender: '',
    birthYear: '',
    acceptTerms: false,
  });

  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [emailForOTP, setEmailForOTP] = useState('');

  // New state for real-time password validation
  const [passwordValidation, setPasswordValidation] = useState<{
    length: boolean;
    special: boolean;
    uppercase: boolean;
    digit: boolean;
    noSpace: boolean;
    noSequence: boolean;
  }>({
    length: false,
    special: false,
    uppercase: false,
    digit: false,
    noSpace: true,
    noSequence: true,
  });

  // refs
  const containerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const animationInitialized = useRef(false);

  // Real-time password validation
  useEffect(() => {
    if (formData.password) {
      setPasswordValidation({
        length: formData.password.length >= 9,
        special: /[\W_]/.test(formData.password),
        uppercase: /[A-Z]/.test(formData.password),
        digit: /[0-9]/.test(formData.password),
        noSpace: !/\s/.test(formData.password),
        noSequence: !hasAscendingDigitRun(formData.password, 3),
      });
    } else {
      setPasswordValidation({
        length: false,
        special: false,
        uppercase: false,
        digit: false,
        noSpace: true,
        noSequence: true,
      });
    }
  }, [formData.password]);

  // input handler (giữ fix không mất focus)
  const handleFormInputChange = useCallback((field: keyof FormData, value: string | boolean) => {
    setFieldErrors((prev) => {
      if (prev[field]) {
        const { [field]: _, ...rest } = prev;
        return rest;
      }
      return prev;
    });
    setFormData((prev) => ({ ...prev, [field]: value as any }));
  }, []);

  // GSAP only-once (không đụng input)
  useEffect(() => {
    if (animationInitialized.current) return;
    let timeoutId: ReturnType<typeof setTimeout>;
    const init = () => {
      const gsap = (window as any).gsap;
      if (!gsap || !formRef.current) {
        timeoutId = setTimeout(init, 100);
        return;
      }
      gsap.set(formRef.current, { opacity: 0, y: 30 });
      gsap.to(formRef.current, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', delay: 0.1 });
      gsap.to('.floating-element', { y: -20, duration: 3, repeat: -1, yoyo: true, ease: 'sine.inOut', stagger: 0.5 });
      animationInitialized.current = true;
    };
    timeoutId = setTimeout(init, 200);
    return () => clearTimeout(timeoutId);
  }, []);

  // validate theo step
  const validateStep = useCallback((step: 1 | 2 | 3 | 4): boolean => {
    const errors: Partial<Record<keyof FormData, string>> = {};
    let ok = true;

    if (step === 1) {
      if (!formData.username.trim()) { errors.username = 'Vui lòng nhập tên tài khoản!'; ok = false; }
      if (!formData.email.trim()) { errors.email = 'Vui lòng nhập email!'; ok = false; }
      else if (!/\S+@\S+\.\S+/.test(formData.email)) { errors.email = 'Email không hợp lệ!'; ok = false; }
      
      // Use backend validation for password
      if (!formData.password) { 
        errors.password = 'Vui lòng nhập mật khẩu!'; 
        ok = false; 
      } else {
        const passwordValidationResult = validatePassword(formData.password);
        if (!passwordValidationResult.isValid) {
          errors.password = passwordValidationResult.error;
          ok = false;
        }
      }
      
      if (!formData.confirmPassword) { errors.confirmPassword = 'Vui lòng xác nhận mật khẩu!'; ok = false; }
      else if (formData.password !== formData.confirmPassword) { errors.confirmPassword = 'Mật khẩu xác nhận không khớp!'; ok = false; }
    }

    if (step === 2) {
      if (!formData.fullName.trim()) { errors.fullName = 'Vui lòng nhập họ và tên!'; ok = false; }
      if (!formData.phone) { errors.phone = 'Vui lòng nhập số điện thoại!'; ok = false; }
      else if (!/^[0-9]{10}$/.test(formData.phone)) { errors.phone = 'Số điện thoại không hợp lệ!'; ok = false; }
      if (!formData.gender) { errors.gender = 'Vui lòng chọn giới tính!'; ok = false; }
      if (!formData.birthYear) { errors.birthYear = 'Vui lòng chọn năm sinh!'; ok = false; }
    }

    if (step === 3) {
      if (!formData.acceptTerms) { errors.acceptTerms = 'Bạn phải đồng ý với các chính sách!'; ok = false; }
    }

    if (step === 4) {
      if (!otp || otp.length !== 6) { setError('Vui lòng nhập mã OTP 6 chữ số.'); ok = false; }
      else setError('');
    }

    setFieldErrors(errors);
    return ok;
  }, [formData, otp, setError]);

  // Theo dõi showOTP từ hook gốc -> chuyển sang bước 4
  useEffect(() => {
    if (showOTP) {
      setEmailForOTP(formData.email);
      setCurrentStep(4);
      // focus ô OTP đầu
      setTimeout(() => {
        const first = document.querySelector('input[data-otp-index="0"]') as HTMLInputElement | null;
        first?.focus();
      }, 80);
    }
  }, [showOTP, formData.email]);

  // next/prev
  const handleNext = useCallback(async () => {
    if (!validateStep(currentStep)) return;

    if (currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as 2 | 3 | 4);
      return;
    }

    // currentStep === 3 -> gọi API register (giữ logic gốc)
    try {
      const registerData: RegisterRequest = {
        username: formData.username,
        passwordHash: formData.password,
        email: formData.email,
        phoneNumber: formData.phone,
        dateOfBirth: moment(formData.birthYear, 'YYYY').startOf('year').toISOString(), // tương đương DatePicker year
        gender: formData.gender || 'other',
        fullName: formData.fullName,
      };

      await handleRegister(registerData);
      // useAuth sẽ set showOTP=true nếu đăng ký OK -> useEffect phía trên sẽ tự chuyển step 4
      // map lỗi server sang field (nếu hook set error string phù hợp)
      if (authError) {
        if (authError.includes('Username')) setFieldErrors((p) => ({ ...p, username: 'Tên tài khoản đã tồn tại!' }));
        if (authError.includes('Email')) setFieldErrors((p) => ({ ...p, email: 'Email đã tồn tại!' }));
      }
    } catch (e) {
      // Nếu hook ném lỗi khác, bạn có thể show chung:
      if (!authError) setError('Đăng ký thất bại. Vui lòng thử lại.');
    }
  }, [currentStep, validateStep, formData, handleRegister, authError, setError]);

  const handlePrev = useCallback(() => {
    if (currentStep === 4) {
      setOtp('');
      setError('');
      setShowOTP(false);
    }
    setCurrentStep((prev) => (prev > 1 ? (prev - 1) as 1 | 2 | 3 : prev));
  }, [currentStep, setOtp, setError, setShowOTP]);

  // OTP actions (dùng API gốc)
  const handleVerifyOTP = useCallback(async () => {
    if (!validateStep(4)) return;
    try {
      await verifyOTP(otp, emailForOTP);
      // Nếu hook đã điều hướng hoặc đặt state — ở bản gốc modal đóng + navigate login
      setOtp('');
      setError('');
      setShowOTP(false);
      navigate('/login');
    } catch {
      if (!authError) setError('Xác thực OTP thất bại. Vui lòng kiểm tra lại mã OTP.');
    }
  }, [validateStep, verifyOTP, otp, emailForOTP, setOtp, setError, setShowOTP, navigate, authError]);

  const handleResendOTP = useCallback(async () => {
    setLoading(true);
    try {
      await resendOTP(emailForOTP);
      setError('Mã OTP đã được gửi lại.');
    } catch (e: any) {
      setError(e?.message || 'Gửi lại OTP thất bại.');
    } finally {
      setLoading(false);
    }
  }, [emailForOTP, setLoading, setError]);

  // Error helper
  const ErrorMessage = useMemo(
    () =>
      ({ field }: { field: keyof FormData }) =>
        fieldErrors[field] ? <p className="text-red-500 text-sm mt-1">{fieldErrors[field]}</p> : null,
    [fieldErrors]
  );

  // Password Strength Indicator Component
  const PasswordStrengthIndicator = useMemo(() => (
    <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
      <h4 className="text-sm font-medium text-gray-700 mb-2">Yêu cầu mật khẩu:</h4>
      <div className="space-y-1">
        <div className={`flex items-center text-xs ${passwordValidation.length ? 'text-green-600' : 'text-gray-500'}`}>
          <span className={`mr-2 ${passwordValidation.length ? '✓' : '○'}`}></span>
          Ít nhất 9 ký tự
        </div>
        <div className={`flex items-center text-xs ${passwordValidation.special ? 'text-green-600' : 'text-gray-500'}`}>
          <span className={`mr-2 ${passwordValidation.special ? '✓' : '○'}`}></span>
          Chứa ít nhất 1 ký tự đặc biệt
        </div>
        <div className={`flex items-center text-xs ${passwordValidation.uppercase ? 'text-green-600' : 'text-gray-500'}`}>
          <span className={`mr-2 ${passwordValidation.uppercase ? '✓' : '○'}`}></span>
          Chứa ít nhất 1 chữ in hoa
        </div>
        <div className={`flex items-center text-xs ${passwordValidation.digit ? 'text-green-600' : 'text-gray-500'}`}>
          <span className={`mr-2 ${passwordValidation.digit ? '✓' : '○'}`}></span>
          Chứa ít nhất 1 chữ số
        </div>
        <div className={`flex items-center text-xs ${passwordValidation.noSpace ? 'text-green-600' : 'text-red-500'}`}>
          <span className={`mr-2 ${passwordValidation.noSpace ? '✓' : '✗'}`}></span>
          Không chứa khoảng trắng
        </div>
        <div className={`flex items-center text-xs ${passwordValidation.noSequence ? 'text-green-600' : 'text-red-500'}`}>
          <span className={`mr-2 ${passwordValidation.noSequence ? '✓' : '✗'}`}></span>
          Không chứa chuỗi số liền mạch (123, 456...)
        </div>
      </div>
    </div>
  ), [passwordValidation]);

  // Step 1 với password strength indicator
  const Step1 = useMemo(() => (
    <div className="step-content space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Thông tin tài khoản</h2>
        <p className="text-gray-600">Tạo tài khoản TerraTech của bạn</p>
      </div>

      {/* Username */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">Tên đăng nhập</label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
          <input
            type="text"
            value={formData.username}
            onChange={(e) => handleFormInputChange('username', e.target.value)}
            className="relative z-20 w-full pl-10 pr-4 py-3 border-2 border-green-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors bg-white"
            placeholder="Chọn tên đăng nhập"
            autoComplete="username"
          />
        </div>
        <ErrorMessage field="username" />
      </div>

      {/* Email */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleFormInputChange('email', e.target.value)}
            className="relative z-20 w-full pl-10 pr-4 py-3 border-2 border-green-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors bg-white"
            placeholder="your@email.com"
            autoComplete="email"
          />
        </div>
        <ErrorMessage field="email" />
      </div>

      {/* Password */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => handleFormInputChange('password', e.target.value)}
            className="relative z-20 w-full pl-10 pr-12 py-3 border-2 border-green-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors bg-white"
            placeholder="Tạo mật khẩu mạnh"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-30"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        <ErrorMessage field="password" />
        {formData.password && PasswordStrengthIndicator}
      </div>

      {/* Confirm Password */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">Xác nhận mật khẩu</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={(e) => handleFormInputChange('confirmPassword', e.target.value)}
            className="relative z-20 w-full pl-10 pr-12 py-3 border-2 border-green-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors bg-white"
            placeholder="Nhập lại mật khẩu"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-30"
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        <ErrorMessage field="confirmPassword" />
      </div>
    </div>
  ), [formData, showPassword, showConfirmPassword, handleFormInputChange, ErrorMessage, PasswordStrengthIndicator]);

  // Step 2
  const Step2 = useMemo(() => (
    <div className="step-content space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Thông tin cá nhân</h2>
        <p className="text-gray-600">Cho chúng tôi biết thêm về bạn</p>
      </div>

      {/* Full Name */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên</label>
        <div className="relative">
          <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => handleFormInputChange('fullName', e.target.value)}
            className="relative z-20 w-full pl-10 pr-4 py-3 border-2 border-green-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors bg-white"
            placeholder="Nhập họ và tên đầy đủ"
            autoComplete="name"
          />
        </div>
        <ErrorMessage field="fullName" />
      </div>

      {/* Phone */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
        <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleFormInputChange('phone', e.target.value)}
            className="relative z-20 w-full pl-10 pr-4 py-3 border-2 border-green-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors bg-white"
            placeholder="0123456789"
            pattern="[0-9]{10}"
            autoComplete="tel"
          />
        </div>
        <ErrorMessage field="phone" />
      </div>

      {/* Gender */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">Giới tính</label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Nam', value: 'male' as const },
            { label: 'Nữ', value: 'female' as const },
            { label: 'Khác', value: 'other' as const },
          ].map(({ label, value }) => (
            <button
              type="button"
              key={value}
              onClick={() => handleFormInputChange('gender', value)}
              className={`py-3 px-4 rounded-xl border-2 transition-all duration-300 ${
                formData.gender === value
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-green-200 bg-white hover:border-emerald-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <ErrorMessage field="gender" />
      </div>

      {/* Birth Year */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">Năm sinh</label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
          <select
            value={formData.birthYear}
            onChange={(e) => handleFormInputChange('birthYear', e.target.value)}
            className="relative z-20 w-full pl-10 pr-4 py-3 border-2 border-green-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors bg-white"
          >
            <option value="">Chọn năm sinh</option>
            {Array.from({ length: 80 }, (_, i) => {
              const year = new Date().getFullYear() - i - 16; // >=16
              return <option key={year} value={year}>{year}</option>;
            })}
          </select>
        </div>
        <ErrorMessage field="birthYear" />
      </div>
    </div>
  ), [formData, handleFormInputChange, ErrorMessage]);

  // Step 3
  const Step3 = useMemo(() => (
    <div className="step-content space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Xác nhận thông tin</h2>
        <p className="text-gray-600">Kiểm tra lại thông tin trước khi đăng ký</p>
      </div>

      <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-6 rounded-xl border border-emerald-200">
        <h3 className="font-semibold text-gray-800 mb-4">Thông tin đăng ký:</h3>
        <div className="space-y-2 text-sm">
          <p><span className="font-medium">Tên đăng nhập:</span> {formData.username}</p>
          <p><span className="font-medium">Email:</span> {formData.email}</p>
          <p><span className="font-medium">Họ tên:</span> {formData.fullName}</p>
          <p><span className="font-medium">Số điện thoại:</span> {formData.phone}</p>
          <p><span className="font-medium">Giới tính:</span> {{ male: 'Nam', female: 'Nữ', other: 'Khác', '': '' }[formData.gender]}</p>
          <p><span className="font-medium">Năm sinh:</span> {formData.birthYear}</p>
        </div>
      </div>

      <div className="flex items-start space-x-3">
        <input
          type="checkbox"
          checked={formData.acceptTerms}
          onChange={(e) => handleFormInputChange('acceptTerms', e.target.checked)}
          className="mt-1 w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
        />
        <label className="text-sm text-gray-700 leading-relaxed">
          Tôi đồng ý với <span className="text-emerald-600 font-medium">Điều khoản sử dụng</span> và <span className="text-emerald-600 font-medium">Chính sách bảo mật</span> của TerraTech
        </label>
      </div>
      <ErrorMessage field="acceptTerms" />

      {authError && <p className="text-red-500 text-sm">{authError}</p>}

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-blue-800 text-sm">
          <span className="font-semibold">Bước tiếp theo:</span> Chúng tôi sẽ gửi mã xác thực đến email của bạn để hoàn tất đăng ký.
        </p>
      </div>
    </div>
  ), [formData, handleFormInputChange, ErrorMessage, authError]);

  // Step 4 – OTP
  const Step4 = useMemo(() => {
    const handleOTPChangeLocal = (index: number, value: string) => {
      const digit = value.replace(/[^0-9]/g, '').slice(-1);
      const chars = (otp || '').split('');
      chars[index] = digit;
      setOtp(chars.join(''));
      if (digit && index < 5) {
        (document.querySelector(`input[data-otp-index="${index + 1}"]`) as HTMLInputElement | null)?.focus();
      }
    };

    const handleOTPKeyDownLocal = (e: React.KeyboardEvent, index: number) => {
      if (e.key === 'Backspace' && !(otp?.[index] ?? '') && index > 0) {
        (document.querySelector(`input[data-otp-index="${index - 1}"]`) as HTMLInputElement | null)?.focus();
      }
    };

    const handleOTPPasteLocal = (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
      setOtp(pasted.padEnd(6, ''));
    };

    return (
      <div className="step-content space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Xác thực Email</h2>
          <p className="text-gray-600 mb-2">Chúng tôi đã gửi mã xác thực đến</p>
          <p className="text-emerald-600 font-semibold">{emailForOTP}</p>
        </div>

        <div className="flex justify-center gap-3 my-8">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <input
              key={i}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={otp?.[i] ?? ''}
              data-otp-index={i}
              onChange={(e) => handleOTPChangeLocal(i, e.target.value)}
              onKeyDown={(e) => handleOTPKeyDownLocal(e, i)}
              onPaste={handleOTPPasteLocal}
              className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none transition-all duration-300 bg-white"
              autoComplete="one-time-code"
            />
          ))}
        </div>

        {authError && <p className="text-center text-sm text-red-500">{authError}</p>}

        <div className="text-center">
          <button
            type="button"
            onClick={handleResendOTP}
            disabled={authLoading}
            className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors disabled:opacity-50"
          >
            {authLoading ? 'Đang gửi...' : 'Gửi lại mã OTP'}
          </button>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <p className="text-gray-600 text-sm text-center">
            Không nhận được mã? Kiểm tra thư mục spam hoặc thử gửi lại sau 60 giây.
          </p>
        </div>
      </div>
    );
  }, [otp, authError, emailForOTP, authLoading, handleResendOTP, setOtp]);

  return (
    <div
      ref={containerRef}
      className="min-h-screen relative overflow-hidden"
      style={{ background: 'linear-gradient(-45deg, #064e3b, #065f46, #047857, #059669)', backgroundSize: '400% 400%' }}
    >
      {/* GSAP */}
      <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>

      {/* bg elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="floating-element absolute top-10 left-10 w-20 h-20 opacity-20">
          <Leaf className="w-full h-full text-emerald-300" />
        </div>
        <div className="floating-element absolute top-1/3 right-20 w-16 h-16 opacity-25">
          <Leaf className="w-full h-full text-green-400" />
        </div>
        <div className="floating-element absolute bottom-1/3 left-20 w-24 h-24 opacity-15">
          <Leaf className="w-full h-full text-teal-300" />
        </div>
      </div>

      {/* content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div
          ref={formRef}
          className="w-full max-w-[560px] mx-auto bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20"
          style={{ isolation: 'isolate' }}  // ✅ fix mất focus
        >
          {/* header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full mb-4">
              <Leaf className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-700 to-green-600 bg-clip-text text-transparent mb-2">
              Tham gia TerraTech
            </h1>
            <p className="text-gray-600">Bắt đầu hành trình terrarium của bạn</p>
          </div>

          {/* progress - FIXED VERSION */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4 relative">
              {[1, 2, 3, 4].map((step, index) => (
                <React.Fragment key={step}>
                  <div
                    className={`relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-500 z-10 ${
                      step <= currentStep 
                        ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg' 
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step === 4 ? <Mail className="w-5 h-5" /> : step}
                  </div>
                  {/* Connection line */}
                  {index < 3 && (
                    <div className="flex-1 h-1 mx-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r from-emerald-500 to-green-600 rounded-full transition-all duration-500 ease-out ${
                          step < currentStep ? 'w-full' : 'w-0'
                        }`}
                      />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
            
            {/* Step labels */}
            <div className="flex justify-between text-xs text-gray-500 px-1">
              <span className={`transition-colors duration-300 ${currentStep >= 1 ? 'text-emerald-600 font-medium' : ''}`}>
                Tài khoản
              </span>
              <span className={`transition-colors duration-300 ${currentStep >= 2 ? 'text-emerald-600 font-medium' : ''}`}>
                Cá nhân
              </span>
              <span className={`transition-colors duration-300 ${currentStep >= 3 ? 'text-emerald-600 font-medium' : ''}`}>
                Xác nhận
              </span>
              <span className={`transition-colors duration-300 ${currentStep >= 4 ? 'text-emerald-600 font-medium' : ''}`}>
                OTP
              </span>
            </div>
          </div>

          {/* steps */}
          <div>
            {currentStep === 1 && Step1}
            {currentStep === 2 && Step2}
            {currentStep === 3 && Step3}
            {currentStep === 4 && Step4}
          </div>

          {/* nav buttons */}
          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStep === 1 || authLoading}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Trở lại
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={authLoading}
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                {currentStep === 3
                  ? (authLoading ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Đang gửi OTP...
                      </div>
                    ) : 'Gửi mã xác thực')
                  : 'Tiếp tục'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleVerifyOTP}
                disabled={authLoading || (otp || '').length !== 6}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {authLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Đang xác thực...
                  </div>
                ) : (
                  'Hoàn tất đăng ký'
                )}
              </button>
            )}
          </div>

          {/* login link */}
          <div className="text-center mt-8">
            <p className="text-gray-600">
              Bạn đã có tài khoản?{' '}
              <button type="button" className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors" onClick={() => navigate('/login')}>
                Đăng nhập ngay
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;