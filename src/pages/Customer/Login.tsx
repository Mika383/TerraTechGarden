// src/pages/Customer/Login.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, Lock, User, Leaf } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { LoginRequest } from '@/types';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useGoogleLogin } from '@react-oauth/google';
import { useMembership } from '@/store/membership'; // ⬅️ dùng để refresh membership sau login

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { handleLogin, handleGoogleLogin, loading, error } = useAuth();
  const { refreshMembership } = useMembership();

  const containerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // ===== GSAP animation =====
  useEffect(() => {
    const loadGSAPAndAnimate = () => {
      const script1 = document.createElement('script');
      script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js';
      script1.onload = () => {
        const script2 = document.createElement('script');
        script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js';
        script2.onload = () => {
          const gsap = (window as any).gsap;
          if (!gsap) return;

          gsap.set(formRef.current, { opacity: 0, y: 50, scale: 0.9 });
          gsap.set('.floating-leaf', { opacity: 0 });

          gsap.to(formRef.current, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1.2,
            ease: 'back.out(1.7)',
            delay: 0.5,
          });

          gsap.to('.floating-leaf', {
            opacity: 1,
            duration: 1,
            stagger: 0.2,
            delay: 0.3,
          });

          document.querySelectorAll('.floating-leaf').forEach((leaf, index) => {
            gsap.to(leaf, {
              y: -20,
              rotation: 5,
              duration: 3 + index * 0.5,
              repeat: -1,
              yoyo: true,
              ease: 'sine.inOut',
              delay: index * 0.8,
            });
          });

          gsap.to('.gradient-bg', {
            backgroundPosition: '200% 50%',
            duration: 8,
            repeat: -1,
            yoyo: true,
            ease: 'none',
          });

          const inputs = document.querySelectorAll('.form-input');
          inputs.forEach((input) => {
            input.addEventListener('focus', () => gsap.to(input, { scale: 1.02, duration: 0.2 }));
            input.addEventListener('blur', () => gsap.to(input, { scale: 1, duration: 0.2 }));
          });
        };
        document.head.appendChild(script2);
      };
      document.head.appendChild(script1);
    };

    if (!(window as any).gsap) loadGSAPAndAnimate();
  }, []);

  // ===== Google Login =====
  const googleLogin = useGoogleLogin({
    scope: 'email profile',
    onSuccess: async (tokenResponse) => {
      try {
        const success = await handleGoogleLogin(tokenResponse.access_token);
        if (success) {
          // refresh membership ngay sau khi token đã được lưu bởi handleGoogleLogin
          try {
            await refreshMembership(); // ⬅️ rất quan trọng
          } catch (e) {
            // không chặn luồng nếu lỗi
            console.warn('refreshMembership (google) failed:', e);
          }
          toast.success('Đăng nhập Google thành công! Chào mừng bạn!', {
            position: 'top-right',
            autoClose: 3000,
          });
          navigate('/personalize');
        }
      } catch (e) {
        console.error('Đăng nhập Google thất bại:', e);
        toast.error('Đăng nhập Google thất bại. Vui lòng thử lại.', {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    },
    onError: (err) => {
      console.error('Lỗi đăng nhập Google:', err);
      toast.error('Không thể kết nối với Google. Vui lòng thử lại.', {
        position: 'top-right',
        autoClose: 3000,
      });
    },
  });

  // ===== Đăng nhập thường =====
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    const credentials: LoginRequest = { username, password };
    try {
      const success = await handleLogin(credentials);
      if (success) {
        // refresh membership ngay sau khi token đã được lưu bởi handleLogin
        try {
          await refreshMembership(); // ⬅️ rất quan trọng
        } catch (e) {
          console.warn('refreshMembership failed:', e);
        }

        toast.success(`Đăng nhập thành công! Chào mừng ${username}`, {
          position: 'top-right',
          autoClose: 3000,
        });
        navigate('/personalize');
      }
    } catch (e) {
      toast.error('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen relative overflow-hidden gradient-bg"
      style={{
        background:
          'linear-gradient(-45deg, #064e3b, #065f46, #047857, #059669, #10b981, #34d399)',
        backgroundSize: '400% 400%',
      }}
    >
      <ToastContainer />

      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="floating-leaf absolute top-20 left-10 w-16 h-16 opacity-30">
          <Leaf className="w-full h-full text-emerald-300" />
        </div>
        <div className="floating-leaf absolute top-40 right-20 w-12 h-12 opacity-25">
          <Leaf className="w-full h-full text-green-300" />
        </div>
        <div className="floating-leaf absolute bottom-40 left-1/4 w-20 h-20 opacity-20">
          <Leaf className="w-full h-full text-teal-300" />
        </div>
        <div className="floating-leaf absolute bottom-60 right-1/3 w-14 h-14 opacity-30">
          <Leaf className="w-full h-full text-emerald-400" />
        </div>
        <div className="floating-leaf absolute top-1/2 left-20 w-10 h-10 opacity-25">
          <Leaf className="w-full h-full text-green-400" />
        </div>
        <div className="floating-leaf absolute top-60 right-10 w-18 h-18 opacity-20">
          <Leaf className="w-full h-full text-teal-400" />
        </div>

        {/* Organic Shapes */}
        <div className="absolute top-0 left-0 w-full h-full">
          <svg className="absolute top-10 left-10" width="200" height="200" viewBox="0 0 200 200">
            <path
              d="M40,120 Q60,80 100,100 Q140,120 160,80 Q180,100 160,140 Q140,160 100,140 Q60,160 40,120 Z"
              fill="rgba(16, 185, 129, 0.1)"
            />
          </svg>
          <svg className="absolute bottom-20 right-20" width="150" height="150" viewBox="0 0 150 150">
            <path
              d="M30,90 Q45,60 75,75 Q105,90 120,60 Q135,75 120,105 Q105,120 75,105 Q45,120 30,90 Z"
              fill="rgba(52, 211, 153, 0.1)"
            />
          </svg>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div
          ref={formRef}
          className="w-full max-w-md bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full mb-4">
              <Leaf className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-700 to-green-600 bg-clip-text text-transparent mb-2">
              Chào mừng trở lại
            </h1>
            <p className="text-gray-600">Đăng nhập vào thế giới Terrarium của bạn</p>
          </div>

          {/* Login Form */}
          <form className="space-y-6" onSubmit={onSubmit}>
            {/* Username */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tên đăng nhập</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="form-input w-full pl-10 pr-4 py-3 border-2 border-green-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-all duration-300 bg-white/80"
                  placeholder="Nhập tên đăng nhập của bạn"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input w-full pl-10 pr-12 py-3 border-2 border-green-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-all duration-300 bg-white/80"
                  placeholder="Nhập mật khẩu"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-emerald-600 hover:text-emerald-700 text-sm font-medium transition-colors"
              >
                Quên mật khẩu?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Đang đăng nhập...
                </div>
              ) : (
                'Đăng Nhập'
              )}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Hoặc đăng nhập với</span>
              </div>
            </div>

            {/* Google Login */}
            <button
              type="button"
              onClick={() => googleLogin()}
              disabled={loading}
              className="w-full py-3 px-4 border-2 border-gray-300 hover:border-emerald-500 bg-white hover:bg-emerald-50 text-gray-700 font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center disabled:opacity-70"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Đăng nhập bằng Google
            </button>
          </form>

          {/* Register Link */}
          <div className="text-center mt-8">
            <p className="text-gray-600">
              Bạn chưa có tài khoản?{' '}
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
              >
                Đăng ký ngay
              </button>
            </p>
            {error && <p className="text-red-500 text-center mt-3">{error}</p>}
          </div>
        </div>
      </div>

      {/* Decorative Wave */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden">
        <svg
          className="relative block w-full h-20"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
            opacity=".25"
            fill="rgba(255,255,255,0.3)"
          />
          <path
            d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z"
            opacity=".5"
            fill="rgba(255,255,255,0.2)"
          />
          <path
            d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"
            fill="rgba(255,255,255,0.1)"
          />
        </svg>
      </div>
    </div>
  );
};

export default Login;
