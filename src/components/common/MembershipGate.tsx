import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type Props = {
  children: React.ReactNode;
  // optional: cho phép override điều kiện nếu cần
  forceLocked?: boolean;
  // optional: thông điệp tuỳ chỉnh
  message?: string;
};

const getHasMembership = () => {
  // '1' = đã có; mặc định coi như chưa có
  const raw = localStorage.getItem('hasMembership');
  return raw === '1';
};

const MembershipGate: React.FC<Props> = ({ children, forceLocked, message }) => {
  const navigate = useNavigate();
  const [hasMembership, setHasMembership] = useState<boolean>(getHasMembership());

  useEffect(() => {
    const onChange = (e: any) => {
      // lắng nghe sự kiện do useAuth phát: membershipChanged
      if (e?.detail && typeof e.detail.hasMembership === 'boolean') {
        setHasMembership(e.detail.hasMembership);
      } else {
        setHasMembership(getHasMembership());
      }
    };
    const onToken = () => setHasMembership(getHasMembership());

    window.addEventListener('membershipChanged', onChange as EventListener);
    window.addEventListener('tokenRefreshed', onToken);

    // đồng bộ lần đầu khi mount
    setHasMembership(getHasMembership());

    return () => {
      window.removeEventListener('membershipChanged', onChange as EventListener);
      window.removeEventListener('tokenRefreshed', onToken);
    };
  }, []);

  const locked = forceLocked ?? !hasMembership;

  return (
    <div className="relative">
      {/* Nội dung trang: làm mờ + vô hiệu tương tác nếu locked */}
      <div
        className={locked ? 'blur-sm opacity-50 pointer-events-none select-none' : ''}
        aria-hidden={locked ? 'true' : 'false'}
      >
        {children}
      </div>

      {/* Overlay cảnh báo */}
      {locked && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-[92%] max-w-md text-center">
            <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white text-xl font-bold">
              ✓
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-green-700">Tính năng chỉ dành cho thành viên</h2>
            <p className="text-gray-600 mt-2">
              {message || 'Hãy đăng ký thành viên để sử dụng tính năng này.'}
            </p>

            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/membership')}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-semibold"
              >
                Đăng ký thành viên
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2.5 rounded-lg font-semibold"
              >
                Về trang chủ
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-3">
              Nếu bạn đã mua gói, vui lòng <b>đăng nhập lại</b> hoặc chờ vài giây để hệ thống đồng bộ.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembershipGate;
