import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Eye, EyeOff, Lock, Leaf, ArrowLeft, CheckCircle } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { resetPassword } from '@/api/auth';

// Password validation function (từ backend)
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

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token: paramToken } = useParams<{ token?: string }>();

  const query = new URLSearchParams(location.search);
  const queryToken = query.get('token');
  const token = paramToken || queryToken || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Real-time password validation state
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
    if (password) {
      setPasswordValidation({
        length: password.length >= 9,
        special: /[\W_]/.test(password),
        uppercase: /[A-Z]/.test(password),
        digit: /[0-9]/.test(password),
        noSpace: !/\s/.test(password),
        noSequence: !hasAscendingDigitRun(password, 3),
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
  }, [password]);

  // GSAP animation
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

  // Validation
  const validateForm = useCallback((): boolean => {
    setError(null);

    if (!token) {
      setError('Token không hợp lệ. Vui lòng yêu cầu liên kết khôi phục mới.');
      return false;
    }

    if (!password) {
      setError('Vui lòng nhập mật khẩu mới!');
      return false;
    }

    const passwordValidationResult = validatePassword(password);
    if (!passwordValidationResult.isValid) {
      setError(passwordValidationResult.error);
      return false;
    }

    if (!confirmPassword) {
      setError('Vui lòng xác nhận mật khẩu!');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!');
      return false;
    }

    return true;
  }, [token, password, confirmPassword]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await resetPassword(token, password, confirmPassword);
      if (response.message?.includes('thành công')) {
        setSuccess(true);
      } else {
        setError(response.message || 'Không rõ phản hồi từ server.');
      }
    } catch (error: any) {
      setError(error.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [token, password, confirmPassword, validateForm]);

  const handlePasswordChange = useCallback((value: string) => {
    setPassword(value);
    if (error) setError(null);
  }, [error]);

  const handleConfirmPasswordChange = useCallback((value: string) => {
    setConfirmPassword(value);
    if (error) setError(null);
  }, [error]);

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

  if (success) {
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

        {/* Success content */}
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div
            ref={formRef}
            className="w-full max-w-[480px] mx-auto bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20"
            style={{ isolation: 'isolate' }}
          >
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-700 to-green-600 bg-clip-text text-transparent mb-4">
                Mật khẩu đã được đặt lại!
              </h1>
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-6 rounded-xl border border-emerald-200 mb-6">
                <p className="text-gray-700 text-lg">
                  Mật khẩu của bạn đã được cập nhật thành công. Bây giờ bạn có thể đăng nhập với mật khẩu mới.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                Đăng nhập ngay
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
          style={{ isolation: 'isolate' }}
        >
          {/* header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-indigo-600 bg-clip-text text-transparent mb-2">
              Đặt lại mật khẩu
            </h1>
            <p className="text-gray-600">Tạo mật khẩu mới cho tài khoản của bạn</p>
          </div>

          {/* form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {!token && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <p className="text-red-800 text-sm">
                  Token không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu liên kết khôi phục mật khẩu mới.
                </p>
              </div>
            )}

            {/* Password */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu mới</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className="relative z-20 w-full pl-10 pr-12 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors bg-white"
                  placeholder="Tạo mật khẩu mạnh"
                  autoComplete="new-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-30"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {password && PasswordStrengthIndicator}
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Xác nhận mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                  className="relative z-20 w-full pl-10 pr-12 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors bg-white"
                  placeholder="Nhập lại mật khẩu mới"
                  autoComplete="new-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-30"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || !token || !password || !confirmPassword}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Đang cập nhật...
                </div>
              ) : (
                'Đặt lại mật khẩu'
              )}
            </button>
          </form>

          {/* back link */}
          <div className="text-center mt-8">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="inline-flex items-center text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại đăng nhập
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;