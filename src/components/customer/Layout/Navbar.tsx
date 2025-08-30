import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Dropdown, MenuProps, Badge } from 'antd';
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

interface CartSummary {
  totalItems: number;
  totalQuantity: number;
  totalAmount: number;
  itemTypes: {
    comboItems: number;
    singleItems: number;
    bundleItems: number;
    bundleAccessories: number;
  };
  lastUpdated: string;
}

interface Notification {
  notificationId: number;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

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
  
  // Wallet state
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  
  const userRole = getRoleFromToken ? getRoleFromToken() : null;
  const isAuthenticated = !!userRole;
  const userId = Number(localStorage.getItem('userId') || 0);

  // Auth headers helper
  const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch cart summary
  const fetchCartSummary = async () => {
    if (!isAuthenticated || !userId) {
      setCartCount(0);
      return;
    }
    try {
      const response = await fetch(`${BASE_URL}/Cart/summary`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setCartCount(data.data?.totalItems || 0);
      } else if (response.status === 401) {
        setCartCount(0);
      }
    } catch (error) {
      console.error('Failed to fetch cart summary:', error);
      setCartCount(0);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!userId) return;
    try {
      const response = await fetch(`${BASE_URL}/Notification/user/${userId}`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.slice(0, 5)); // Only get latest 5
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
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
          const balance = typeof data === 'number' ? data : (data.data || data.balance || 0);
          setWalletBalance(balance);
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

  // Real-time polling
  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchCartSummary();
      fetchNotifications();
      fetchWalletBalance();
      
      // Poll every 30 seconds for real-time updates
      const interval = setInterval(() => {
        fetchCartSummary();
        fetchNotifications();
        fetchWalletBalance();
      }, 30000);
      
      return () => clearInterval(interval);
    } else {
      // Reset states when not authenticated
      setCartCount(0);
      setNotifications([]);
      setWalletBalance(null);
    }
  }, [isAuthenticated, userId]);

  // GSAP animations
  useEffect(() => {
    gsapContext.current = gsap.context(() => {
      gsap.fromTo(
        navbarRef.current,
        { y: -100, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, ease: 'power4.out' }
      );

      if (logoImageRef.current) {
        gsap.fromTo(
          logoImageRef.current,
          { opacity: 0, x: -20 },
          { opacity: 1, x: 0, duration: 1, delay: 0.3, ease: 'power4.out' }
        );
      }

      if (logoTextRef.current) {
        gsap.fromTo(
          logoTextRef.current,
          { opacity: 0, x: -20 },
          { opacity: 1, x: 0, duration: 1, delay: 0.4, ease: 'power4.out' }
        );
      }

      if (menuRef.current) {
        const menuItems = Array.from(menuRef.current.children);
        gsap.fromTo(
          menuItems,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 1, delay: 0.5, stagger: 0.15, ease: 'power4.out' }
        );
      }
    }, navbarRef);

    return () => {
      gsapContext.current?.revert();
    };
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

  const formatCurrency = (amount: number) => {
    return (amount || 0).toLocaleString('vi-VN') + ' VND';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  // User dropdown items
  const dropdownItems: MenuProps['items'] = [
    ...(userRole === 'User' ||userRole === 'Staff' || userRole === 'Manager' || userRole === 'Admin'
      ? [
          {
            key: '1',
            label: 'Quản Lý Người Dùng',
            onClick: () => handleNavigate('/customer-dashboard'),
          },
        ]
      : []),
    ...(userRole === 'Staff' 
      ? [
          {
            key: '2',
            label: 'Bảng Điều Khiển Nhân Viên',
            onClick: () => handleNavigate('/staff/dashboard'),
          },
        ]
      : []),
    ...(userRole === 'Manager' 
      ? [
          {
            key: '3',
            label: 'Bảng Điều Khiển Quản Lý',
            onClick: () => handleNavigate('/manager/dashboard'),
          },
        ]
      : []),
    ...(userRole === 'Admin'
      ? [
          {
            key: '4',
            label: 'Bảng Điều Khiển Quản Trị',
            onClick: () => handleNavigate('/admin/dashboard'),
          },
        ]
      : []),
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

  // Notifications dropdown items
  const notificationItems: MenuProps['items'] = [
    ...notifications.map((notification) => ({
      key: notification.notificationId.toString(),
      label: (
        <div className="p-2 max-w-xs">
          <div className={`font-medium ${!notification.isRead ? 'text-blue-600' : 'text-gray-700'}`}>
            {notification.title}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {notification.message.length > 50 ? 
              notification.message.substring(0, 50) + '...' : 
              notification.message
            }
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {formatDate(notification.createdAt)}
          </div>
        </div>
      ),
    })),
    ...(notifications.length > 0 ? [
      {
        type: 'divider' as const,
      },
      {
        key: 'view-all',
        label: (
          <div className="text-center text-blue-600 font-medium">
            Xem tất cả thông báo
          </div>
        ),
        onClick: () => handleNavigate('/customer-dashboard/notifications'),
      },
    ] : [
      {
        key: 'no-notifications',
        label: (
          <div className="text-center text-gray-500 p-2">
            Không có thông báo mới
          </div>
        ),
      },
    ]),
  ];

  const unreadCount = notifications.filter(n => !n.isRead).length;

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
          <img
            ref={logoImageRef}
            src={logo}
            alt="TerraTech Logo"
            className="h-8 sm:h-10 object-contain"
          />
          <span
            ref={logoTextRef}
            className="text-lg sm:text-xl md:text-2xl font-bold text-green-600"
          >
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
          className={`${
            isMobileMenuOpen ? 'flex' : 'hidden'
          } md:flex flex-col md:flex-row md:space-x-4 lg:space-x-6 absolute md:static top-12 left-0 w-full md:w-auto bg-white md:bg-transparent shadow-md md:shadow-none p-2 md:p-0 transition-all duration-300`}
        >
          <Button
            type="link"
            icon={<HomeOutlined />}
            onClick={() => handleNavigate('/')}
            className={`!text-teal-700 text-base sm:text-lg font-semibold ${
              isActive('/') ? 'bg-green-100 !text-green-600' : ''
            } hover:!text-teal-500 transition-colors flex items-center p-1 sm:p-2 mb-1 md:mb-0`}
          >
            Trang Chủ
          </Button>
          <Button
            type="link"
            icon={<ShopOutlined />}
            onClick={() => handleNavigate('/shop')}
            className={`!text-teal-700 text-base sm:text-lg font-semibold ${
              isActive('/shop') ? 'bg-green-100 !text-green-600' : ''
            } hover:!text-teal-500 transition-colors flex items-center p-1 sm:p-2 mb-1 md:mb-0`}
          >
            Cửa Hàng
          </Button>
          <Button
            type="link"
            icon={<TeamOutlined />}
            onClick={() => handleNavigate('/membership')}
            className={`!text-teal-700 text-base sm:text-lg font-semibold ${
              isActive('/membership') ? 'bg-green-100 !text-green-600' : ''
            } hover:!text-teal-500 transition-colors flex items-center p-1 sm:p-2 mb-1 md:mb-0`}
          >
            Thành Viên
          </Button>
          <Button
            type="link"
            icon={<ReadOutlined />}
            onClick={() => handleNavigate('/blog')}
            className={`!text-teal-700 text-base sm:text-lg font-semibold ${
              isActive('/blog') ? 'bg-green-100 !text-green-600' : ''
            } hover:!text-teal-500 transition-colors flex items-center p-1 sm:p-2 mb-1 md:mb-0`}
          >
            Blog
          </Button>
          <Button
            type="link"
            icon={<InfoCircleOutlined />}
            onClick={() => handleNavigate('/about')}
            className={`!text-teal-700 text-base sm:text-lg font-semibold ${
              isActive('/about') ? 'bg-green-100 !text-green-600' : ''
            } hover:!text-teal-500 transition-colors flex items-center p-1 sm:p-2 mb-1 md:mb-0`}
          >
            Giới Thiệu
          </Button>
        </div>

        {/* Actions */}
        <div className="hidden md:flex items-center space-x-2 sm:space-x-3">
          {/* Notifications */}
          {isAuthenticated && (
            <Dropdown 
              menu={{ items: notificationItems }} 
              trigger={['click']}
              placement="bottomRight"
            >
              <Button className="!text-teal-700 hover:!text-teal-500 transition-colors p-1 sm:p-2">
                <Badge count={unreadCount} size="small">
                  <BellOutlined />
                </Badge>
              </Button>
            </Dropdown>
          )}

          {/* Cart with badge */}
          <Button
            onClick={() => handleNavigate('/cart')}
            className={`!text-teal-700 ${
              isActive('/cart') ? 'bg-green-100 !text-green-600' : ''
            } hover:!text-teal-500 transition-colors p-1 sm:p-2`}
          >
            <Badge count={cartCount} size="small">
              <ShoppingCartOutlined />
            </Badge>
          </Button>

          {/* Wallet */}
          {isAuthenticated && (
            <Button
              onClick={() => handleNavigate('/customer-dashboard/wallet')}
              className="!text-teal-700 hover:!text-teal-500 transition-colors p-1 sm:p-2 flex items-center gap-1"
              title={walletBalance !== null ? formatCurrency(walletBalance) : 'Đang tải...'}
            >
              <WalletOutlined />
              <span className="text-xs hidden lg:inline">
                {walletBalance !== null ? 
                  (walletBalance > 999999 ? 
                    Math.round(walletBalance / 1000000) + 'M' : 
                    walletBalance > 999 ? 
                      Math.round(walletBalance / 1000) + 'K' : 
                      walletBalance.toLocaleString()
                  ) + 'đ' 
                  : '...'
                }
              </span>
            </Button>
          )}

          {/* User */}
          {isAuthenticated ? (
            <Dropdown menu={{ items: dropdownItems }} trigger={['click']}>
              <Button
                icon={<UserOutlined />}
                className="!text-teal-700 hover:!text-teal-500 transition-colors p-1 sm:p-2"
              />
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
        .font-roboto {
          font-family: 'Roboto', sans-serif;
        }
        .will-change-transform-opacity {
          will-change: transform, opacity;
        }
        .ant-badge-count {
          font-size: 10px !important;
          height: 16px !important;
          min-width: 16px !important;
          line-height: 14px !important;
        }
      `}</style>
    </nav>
  );
};

export default Navbar;