// src/components/layout/Navbar.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Dropdown, MenuProps } from 'antd';
import {
  HomeOutlined,
  ShopOutlined,
  TeamOutlined,
  ReadOutlined,
  InfoCircleOutlined,
  BellOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  WalletOutlined,
  LogoutOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import logo from '../../../assets/Logo.png';
import { getRoleFromToken } from '../../../utils/jwt';

gsap.registerPlugin(ScrollTrigger);

const BASE_URL = 'https://terarium.shop/api';

interface Notification {
  notificationId: number;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

/* ---------- Badge gắn vào góc của chính Button ---------- */
const CornerBadge: React.FC<{ count?: number; className?: string }> = ({ count = 0, className }) => {
  if (!count || count <= 0) return null;
  return (
    <span
      className={
        `pointer-events-none select-none absolute top-0 right-0 translate-x-1/4 -translate-y-1/4
         bg-red-500 text-white rounded-full px-1.5 min-w-[18px] h-[18px]
         text-[10px] leading-[18px] text-center font-semibold shadow-sm z-10 ${className || ''}`
      }
      title={`${count}`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
};
/* -------------------------------------------------------- */

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const navbarRef = useRef<HTMLDivElement>(null);
  const logoContainerRef = useRef<HTMLDivElement>(null);
  const logoImageRef = useRef<HTMLImageElement>(null);
  const logoTextRef = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const gsapContext = useRef<gsap.Context | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Cart state
  const [cartCount, setCartCount] = useState(0);

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0); // ✅ dùng API unread-count

  // Wallet state
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  const userRole = getRoleFromToken ? getRoleFromToken() : null;
  const isAuthenticated = !!userRole;
  const userId = Number(localStorage.getItem('userId') || 0);

  const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // ---- Utils cho notifications ----
  const extractArray = (payload: any) => {
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload)) return payload;
    return [];
  };
  const coerceNotification = (n: any): Notification => ({
    notificationId: Number(n?.notificationId ?? 0),
    title: String(n?.title ?? ''),
    message: String(n?.message ?? ''),
    createdAt: String(n?.createdAt ?? new Date().toISOString()),
    isRead: Boolean(n?.isRead ?? false),
  });

  // Fetch cart summary
  const fetchCartSummary = async () => {
    if (!isAuthenticated || !userId) {
      setCartCount(0);
      return;
    }
    try {
      const response = await fetch(`${BASE_URL}/Cart/summary`, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setCartCount(Number(data?.data?.totalItems ?? 0));
      } else if (response.status === 401) {
        setCartCount(0);
      }
    } catch (error) {
      console.error('Failed to fetch cart summary:', error);
      setCartCount(0);
    }
  };

  // Fetch unread-count (badge)
  const fetchUnreadCount = async () => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}/Notification/web/unread-count/${userId}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        if (res.status === 401) { setUnreadCount(0); return; }
        setUnreadCount(0);
        return;
      }
      const json = await res.json();
      const count = Number(json?.unreadCount ?? 0);
      setUnreadCount(isNaN(count) ? 0 : count);
    } catch (e) {
      console.error('Failed to fetch unread-count:', e);
      setUnreadCount(0);
    }
  };

  // Fetch notifications list (dropdown preview)
  const fetchNotifications = async () => {
    if (!userId) return;
    try {
      const response = await fetch(`${BASE_URL}/Notification/get-by-user/${userId}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        if (response.status === 401) {
          setNotifications([]);
          return;
        }
        const text = await response.text();
        console.error('Fetch notifications failed:', response.status, text);
        setNotifications([]);
        return;
      }
      const json = await response.json();
      const list: Notification[] = extractArray(json).map(coerceNotification);
      setNotifications(list.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setNotifications([]);
    }
  };

  // Fetch wallet balance
  const fetchWalletBalance = async () => {
    if (!userId) return;
    try {
      const response = await fetch(`${BASE_URL}/Wallet/balance?userId=${userId}`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await response.json();
          const balance = typeof data === 'number' ? data : (data.data ?? data.balance ?? 0);
          setWalletBalance(Number(balance) || 0);
        } else {
          const text = await response.text();
          const balance = Number(text.replace(/[^\d.-]/g, ''));
          setWalletBalance(isNaN(balance) ? 0 : balance);
        }
      }
    } catch (error) {
      console.error('Failed to fetch wallet balance:', error);
    }
  };

  // Realtime FE-only: poll 10s + focus/online + custom events + storage
  useEffect(() => {
    if (!isAuthenticated || !userId) {
      setCartCount(0);
      setNotifications([]);
      setUnreadCount(0);
      setWalletBalance(null);
      return;
    }

    const refetchAll = () => {
      fetchCartSummary();
      fetchUnreadCount();   // ✅ luôn cập nhật badge
      fetchNotifications(); // preview list
      fetchWalletBalance();
    };

    refetchAll();

    const itv = setInterval(refetchAll, 10000);
    const onFocus = () => refetchAll();
    const onOnline = () => refetchAll();
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onOnline);

    const onCart = () => fetchCartSummary();
    const onNoti = () => { fetchUnreadCount(); fetchNotifications(); };
    window.addEventListener('cart:updated', onCart as EventListener);
    window.addEventListener('notification:received', onNoti as EventListener);

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'cartItems' || e.key === 'checkoutItems') fetchCartSummary();
    };
    window.addEventListener('storage', onStorage);

    return () => {
      clearInterval(itv);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('cart:updated', onCart as EventListener);
      window.removeEventListener('notification:received', onNoti as EventListener);
      window.removeEventListener('storage', onStorage);
    };
  }, [isAuthenticated, userId]);

  // GSAP animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(navbarRef.current, { y: -100, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, ease: 'power4.out' });
      if (logoImageRef.current) gsap.fromTo(logoImageRef.current, { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 1, delay: 0.3, ease: 'power4.out' });
      if (logoTextRef.current) gsap.fromTo(logoTextRef.current, { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 1, delay: 0.4, ease: 'power4.out' });
      if (menuRef.current) {
        const menuItems = Array.from(menuRef.current.children);
        gsap.fromTo(menuItems, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1, delay: 0.5, stagger: 0.15, ease: 'power4.out' });
      }
    }, navbarRef);
    return () => ctx.revert();
  }, []);

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
    setIsMobileMenuOpen(false);
  };
  const isActive = (path: string) => location.pathname === path;

  const formatCurrency = (amount: number) => (amount || 0).toLocaleString('vi-VN') + ' VND';
  const formatDate = (dateString: string) => new Date(dateString).toLocaleString('vi-VN');

  // User dropdown items
  const dropdownItems: MenuProps['items'] = [
    ...(userRole === 'User' || userRole === 'Staff' || userRole === 'Manager' || userRole === 'Admin'
      ? [{ key: '1', label: 'Quản Lý Người Dùng', onClick: () => handleNavigate('/customer-dashboard') }]
      : []),
    ...(userRole === 'Staff' ? [{ key: '2', label: 'Bảng Điều Khiển Nhân Viên', onClick: () => handleNavigate('/staff/dashboard') }] : []),
    ...(userRole === 'Manager' ? [{ key: '3', label: 'Bảng Điều Khiển Quản Lý', onClick: () => handleNavigate('/manager/dashboard') }] : []),
    ...(userRole === 'Admin' ? [{ key: '4', label: 'Bảng Điều Khiển Quản Trị', onClick: () => handleNavigate('/admin/dashboard') }] : []),
    {
      key: '5',
      label: (
        <span className="flex items-center text-red-500">
          <LogoutOutlined className="mr-2" /> Đăng xuất
        </span>
      ),
      onClick: handleLogout,
    },
  ];

  const notificationItems: MenuProps['items'] = [
    ...notifications.map((n) => ({
      key: String(n.notificationId),
      label: (
        <div className="p-2 max-w-xs">
          <div className={`font-medium ${!n.isRead ? 'text-blue-600' : 'text-gray-700'}`}>{n.title}</div>
          <div className="text-sm text-gray-500 mt-1">{n.message.length > 50 ? n.message.substring(0, 50) + '...' : n.message}</div>
          <div className="text-xs text-gray-400 mt-1">{formatDate(n.createdAt)}</div>
        </div>
      ),
    })),
    ...(notifications.length
      ? [
          { type: 'divider' as const },
          { key: 'view-all', label: <div className="text-center text-blue-600 font-medium">Xem tất cả thông báo</div>, onClick: () => handleNavigate('/customer-dashboard/notifications') },
        ]
      : [{ key: 'no-notifications', label: <div className="text-center text-gray-500 p-2">Không có thông báo mới</div> }]),
  ];

  return (
    <nav
      ref={navbarRef}
      className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-md shadow-md py-2 md:py-3 font-roboto z-50 will-change-transform-opacity"
    >
      <div className="container mx-auto px-2 sm:px-4 md:px-6 lg:px-8 flex justify-between items-center">
        {/* Logo */}
        <div
          ref={logoContainerRef}
          className="flex items-center space-x-2 cursor-pointer hover:text-green-700 transition-colors"
          onClick={() => handleNavigate('/')}
        >
          <img ref={logoImageRef} src={logo} alt="TerraTech Logo" className="h-8 sm:h-10 object-contain" />
          <span ref={logoTextRef} className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">
            TerraTech
          </span>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden">
          <Button
            icon={<MenuOutlined />}
            className="!text-teal-700 hover:!text-teal-500 transition-colors p-1 sm:p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />
        </div>

        {/* Navigation Menu */}
        <div
          ref={menuRef}
          className={`${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row md:space-x-4 lg:space-x-6 absolute md:static top-12 left-0 w-full md:w-auto bg-white md:bg-transparent shadow-md md:shadow-none p-2 md:p-0 transition-all duration-300`}
        >
          <Button
            type="link"
            icon={<HomeOutlined />}
            onClick={() => handleNavigate('/')}
            className={`!text-teal-700 text-base sm:text-lg font-semibold ${isActive('/') ? 'bg-green-100 !text-green-600' : ''} hover:!text-teal-500 transition-colors flex items-center p-1 sm:p-2 mb-1 md:mb-0`}
          >
            Trang Chủ
          </Button>
          <Button
            type="link"
            icon={<ShopOutlined />}
            onClick={() => handleNavigate('/shop')}
            className={`!text-teal-700 text-base sm:text-lg font-semibold ${isActive('/shop') ? 'bg-green-100 !text-green-600' : ''} hover:!text-teal-500 transition-colors flex items-center p-1 sm:p-2 mb-1 md:mb-0`}
          >
            Cửa Hàng
          </Button>
          <Button
            type="link"
            icon={<TeamOutlined />}
            onClick={() => handleNavigate('/membership')}
            className={`!text-teal-700 text-base sm:text-lg font-semibold ${isActive('/membership') ? 'bg-green-100 !text-green-600' : ''} hover:!text-teal-500 transition-colors flex items-center p-1 sm:p-2 mb-1 md:mb-0`}
          >
            Thành Viên
          </Button>
          <Button
            type="link"
            icon={<ReadOutlined />}
            onClick={() => handleNavigate('/blog')}
            className={`!text-teal-700 text-base sm:text-lg font-semibold ${isActive('/blog') ? 'bg-green-100 !text-green-600' : ''} hover:!text-teal-500 transition-colors flex items-center p-1 sm:p-2 mb-1 md:mb-0`}
          >
            Blog
          </Button>
          <Button
            type="link"
            icon={<InfoCircleOutlined />}
            onClick={() => handleNavigate('/about')}
            className={`!text-teal-700 text-base sm:text-lg font-semibold ${isActive('/about') ? 'bg-green-100 !text-green-600' : ''} hover:!text-teal-500 transition-colors flex items-center p-1 sm:p-2 mb-1 md:mb-0`}
          >
            Giới Thiệu
          </Button>
        </div>

        {/* Actions */}
        <div className="hidden md:flex items-center space-x-2 sm:space-x-3">
          {/* Notifications */}
          {isAuthenticated && (
            <Dropdown menu={{ items: notificationItems }} trigger={['click']} placement="bottomRight">
              <Button className="relative !text-teal-700 hover:!text-teal-500 transition-colors p-1 sm:p-2">
                <BellOutlined />
                <CornerBadge count={unreadCount} />
              </Button>
            </Dropdown>
          )}

          {/* Cart */}
          <Button
            onClick={() => handleNavigate('/cart')}
            className={`relative !text-teal-700 ${isActive('/cart') ? 'bg-green-100 !text-green-600' : ''} hover:!text-teal-500 transition-colors p-1 sm:p-2`}
          >
            <ShoppingCartOutlined />
            <CornerBadge count={cartCount} />
          </Button>

          {/* Wallet */}
          {isAuthenticated && (
            <Button
              onClick={() => handleNavigate('/customer-dashboard/wallet')}
              className="!text-teal-700 hover:!text-teal-500 transition-colors p-1 sm:p-2 flex items-center gap-1"
              title={walletBalance !== null ? (amount => amount.toLocaleString('vi-VN') + ' VND')(walletBalance) : 'Đang tải...'}
            >
              <WalletOutlined />
              <span className="text-xs hidden lg:inline">
                {walletBalance !== null
                  ? ((walletBalance > 999999
                      ? Math.round(walletBalance / 1000000) + 'M'
                      : walletBalance > 999
                      ? Math.round(walletBalance / 1000) + 'K'
                      : walletBalance.toLocaleString()) + 'đ')
                  : '...'}
              </span>
            </Button>
          )}

          {/* User */}
          {isAuthenticated ? (
            <Dropdown menu={{ items: dropdownItems }} trigger={['click']}>
              <Button icon={<UserOutlined />} className="!text-teal-700 hover:!text-teal-500 transition-colors p-1 sm:p-2" />
            </Dropdown>
          ) : (
            <Button
              icon={<UserOutlined />}
              onClick={() => handleNavigate('/login')}
              className="!text-teal-700 text-base sm:text-lg font-semibold hover:!text-teal-500 transition-colors p-1 sm:p-2"
            >
              Đăng nhập/Đăng ký
            </Button>
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
        .font-roboto { font-family: 'Roboto', sans-serif; }
        .will-change-transform-opacity { will-change: transform, opacity; }
      `}</style>
    </nav>
  );
};

export default Navbar;
