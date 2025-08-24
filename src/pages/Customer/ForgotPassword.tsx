import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Mail, Leaf, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { forgotPassword } from '@/api/auth';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // refs
  const containerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const animationInitialized = useRef(false);

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

  const validateEmail = useCallback((email: string): boolean => {
    if (!email.trim()) {
      setError('Vui lòng nhập email!');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email không hợp lệ!');
      return false;
    }
    setError(null);
    return true;
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) return;

    setLoading(true);
    setError(null);

    try {
      const response = await forgotPassword(email);
      if (response.message?.includes('thành công')) {
        setSuccess(true);
      } else {
        setError(response.message || 'Không rõ phản hồi từ server.');
      }
    } catch (error: any) {
      setError(error.message || 'Gửi email khôi phục thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [email, validateEmail]);

  const handleEmailChange = useCallback((value: string) => {
    setEmail(value);
    if (error) setError(null);
  }, [error]);

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
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-700 to-green-600 bg-clip-text text-transparent mb-4">
                Email đã được gửi!
              </h1>
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-6 rounded-xl border border-emerald-200 mb-6">
                <p className="text-gray-700 mb-2">
                  Chúng tôi đã gửi liên kết khôi phục mật khẩu đến:
                </p>
                <p className="text-emerald-600 font-semibold text-lg">{email}</p>
              </div>
              <div className="space-y-3 text-sm text-gray-600 mb-6">
                <p>• Kiểm tra hộp thư đến của bạn</p>
                <p>• Nếu không thấy email, hãy kiểm tra thư mục spam</p>
                <p>• Liên kết sẽ hết hạn sau 24 giờ</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                Quay lại đăng nhập
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
          className="w-full max-w-[480px] mx-auto bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20"
          style={{ isolation: 'isolate' }}
        >
          {/* header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent mb-2">
              Quên mật khẩu?
            </h1>
            <p className="text-gray-600">Đừng lo lắng, chúng tôi sẽ giúp bạn khôi phục</p>
          </div>

          {/* form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <p className="text-blue-800 text-sm">
                Nhập email đã đăng ký với tài khoản TerraTech của bạn. Chúng tôi sẽ gửi liên kết để đặt lại mật khẩu.
              </p>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className="relative z-20 w-full pl-10 pr-4 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors bg-white"
                  placeholder="your@email.com"
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
              {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Đang gửi email...
                </div>
              ) : (
                'Gửi liên kết khôi phục'
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

export default ForgotPassword;