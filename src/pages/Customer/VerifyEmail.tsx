// src/pages/Customer/VerifyEmail.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// OTP APIs (đang dùng trong dự án)
import { verifyOTP as apiVerifyOTP, resendOTP as apiResendOTP } from '@/api/auth';
import { useMembership } from '@/store/membership';

// ===== Helpers =====
function decodeJwtPayload(token?: string | null): Record<string, any> | null {
  try {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function extractRole(payload: Record<string, any> | null): string | null {
  if (!payload) return null;
  const dotnetRole = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
  const role =
    dotnetRole ??
    payload.role ??
    (Array.isArray(payload.roles) ? payload.roles[0] : payload.roles) ??
    payload.Role;
  if (!role) return null;
  return (Array.isArray(role) ? role[0] : role).toString().trim();
}

type OtpStage = 'request' | 'verify';

const VerifyEmail: React.FC = () => {
  const navigate = useNavigate();
  const { refreshMembership } = useMembership();

  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const [redirecting, setRedirecting] = useState<boolean>(false); // chặn render khi không đủ điều kiện
  const [stage, setStage] = useState<OtpStage>('request');
  const [email, setEmail] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  // Guard: chỉ hiển thị khi isOtp === false && role === 'User'
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }
    const payload = decodeJwtPayload(token);

    const isOtp = String(
      payload?.isOtp ?? payload?.IsOtp ?? payload?.is_otp ?? true
    ).toLowerCase() === 'true';

    const role = (extractRole(payload) || '').toLowerCase();
    const isUser = role === 'user';

    // Nếu đã xác thực email -> route theo personalize luôn
    if (isOtp) {
      routeAfterToken(token);
      return;
    }

    // Nếu KHÔNG phải role User -> không hiển thị, về home
    if (!isUser) {
      setRedirecting(true);
      navigate('/', { replace: true });
      return;
    }

    // Prefill email nếu claim có
    const emailFromToken = payload?.email || payload?.Email || payload?.unique_name || '';
    setEmail(String(emailFromToken || ''));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cooldown timer cho resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  function routeAfterToken(token: string | null) {
    const payload = decodeJwtPayload(token);
    const isPersonalize = String(
      payload?.isPersonalize ?? payload?.IsPersonalize ?? payload?.is_personalize ?? false
    ).toLowerCase() === 'true';

    // Làm tươi membership (không chặn điều hướng)
    refreshMembership().catch(() => {});
    if (isPersonalize) navigate('/', { replace: true });
    else navigate('/personalize', { replace: true });
  }

  // Bước 1: Gửi OTP
  const handleSendOtp = async () => {
    const mail = String(email || '').trim();
    if (!mail) {
      toast.error('Vui lòng nhập email để nhận OTP.');
      return;
    }
    try {
      setSending(true);
      await apiResendOTP(mail);
      toast.success('Đã gửi OTP đến email của bạn.');
      setOtp('');
      setStage('verify');
      setResendCooldown(30);
    } catch (e: any) {
      toast.error(e?.message || 'Gửi OTP thất bại.');
    } finally {
      setSending(false);
    }
  };

  // Bước 2: Xác nhận OTP
  const handleVerifyOtp = async () => {
    const mail = String(email || '').trim();
    if (!mail) {
      toast.error('Vui lòng nhập email để xác thực OTP.');
      return;
    }
    if (!otp) {
      toast.error('Vui lòng nhập mã OTP.');
      return;
    }
    try {
      setVerifying(true);
      const res = await apiVerifyOTP({ email: mail, otp });
      if (!res?.success) {
        toast.error(res?.message || 'OTP không hợp lệ.');
        return;
      }
      // Nếu API trả token mới sau verify -> dùng luôn
      const newToken = res?.token || null;
      if (newToken) {
        localStorage.setItem('authToken', newToken);
        routeAfterToken(newToken);
        return;
      }
      // Nếu không có token mới -> yêu cầu đăng nhập lại
      toast.success('Xác thực thành công. Vui lòng đăng nhập lại.');
      navigate('/login', { replace: true });
    } catch (e: any) {
      toast.error(e?.message || 'Xác thực OTP thất bại.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    const mail = String(email || '').trim();
    if (!mail) {
      toast.error('Vui lòng nhập email để gửi lại OTP.');
      return;
    }
    try {
      await apiResendOTP(mail);
      toast.success('Đã gửi lại OTP.');
      setResendCooldown(30);
    } catch (e: any) {
      toast.error(e?.message || 'Gửi lại OTP thất bại.');
    }
  };

  const backToLogin = () => navigate('/login');

  // Không render gì trong lúc redirect để tránh flicker
  if (redirecting) return null;

  return (
    <div
      ref={containerRef}
      className="min-h-screen relative overflow-hidden gradient-bg flex items-center justify-center px-4"
      style={{
        background:
          'linear-gradient(-45deg, #064e3b, #065f46, #047857, #059669, #10b981, #34d399)',
        backgroundSize: '400% 400%',
      }}
    >
      <ToastContainer />
      <div
        ref={cardRef}
        className="w-full max-w-md bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full mb-4">
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-green-600 bg-clip-text text-transparent">
            Xác thực Email
          </h1>
          <p className="text-gray-600 mt-1">
            Tài khoản của bạn chưa xác thực email. Hoàn tất 2 bước dưới đây để tiếp tục.
          </p>
        </div>

        {stage === 'request' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border-2 border-green-200 py-3 px-3 focus:outline-none focus:border-emerald-500 bg-white/80"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={backToLogin}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Quay lại đăng nhập
              </button>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={!email || sending}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-60"
              >
                {sending ? 'Đang gửi...' : 'Gửi OTP'}
              </button>
            </div>
          </div>
        )}

        {stage === 'verify' && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Mã OTP đã được gửi tới <span className="font-medium">{email}</span>.
              Nếu bạn muốn đổi email, bấm{' '}
              <button
                type="button"
                className="text-emerald-700 hover:underline font-medium"
                onClick={() => {
                  setStage('request');
                  setOtp('');
                }}
              >
                đổi email
              </button>.
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã OTP</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Nhập OTP (6 chữ số)"
                className="w-full rounded-xl border-2 border-green-200 py-3 px-3 focus:outline-none focus:border-emerald-500 bg-white/80"
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="text-sm text-emerald-700 hover:underline disabled:opacity-60"
              >
                Gửi lại OTP {resendCooldown > 0 ? `(${resendCooldown}s)` : ''}
              </button>
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={!otp || verifying}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-60"
              >
                {verifying ? 'Đang xác thực...' : 'Xác nhận'}
              </button>
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={backToLogin}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Quay lại đăng nhập
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
