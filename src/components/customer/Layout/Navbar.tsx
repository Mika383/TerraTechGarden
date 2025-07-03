import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Dropdown, MenuProps } from 'antd';
import { HomeOutlined, ShopOutlined, TeamOutlined, ReadOutlined, InfoCircleOutlined, SearchOutlined, ShoppingCartOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import logo from '../../../assets/Logo.png'; // Đảm bảo đường dẫn đúng đến logo
// Note: Ensure 'getRoleFromToken' is defined in '../../../utils/jwt' or implement it as shown below
import { getRoleFromToken } from '../../../utils/jwt';

gsap.registerPlugin(ScrollTrigger);

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const navbarRef = useRef<HTMLDivElement>(null);
  const logoContainerRef = useRef<HTMLDivElement>(null); // Đổi tên ref để rõ ràng
  const logoImageRef = useRef<HTMLImageElement>(null); // Ref cho hình ảnh logo
  const logoTextRef = useRef<HTMLSpanElement>(null); // Ref cho tên website
  const menuRef = useRef<HTMLDivElement>(null);
  const gsapContext = useRef<gsap.Context | null>(null);
  const userRole = getRoleFromToken ? getRoleFromToken() : null;
  const isAuthenticated = !!userRole;

  useEffect(() => {
    gsapContext.current = gsap.context(() => {
      // Animation cho toàn bộ navbar
      gsap.fromTo(
        navbarRef.current,
        { y: -100, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, ease: 'power4.out' }
      );

      // Animation cho logo (hình ảnh)
      if (logoImageRef.current) {
        gsap.fromTo(
          logoImageRef.current,
          { opacity: 0, x: -20 },
          { opacity: 1, x: 0, duration: 1, delay: 0.3, ease: 'power4.out' }
        );
      }

      // Animation cho tên website
      if (logoTextRef.current) {
        gsap.fromTo(
          logoTextRef.current,
          { opacity: 0, x: -20 },
          { opacity: 1, x: 0, duration: 1, delay: 0.4, ease: 'power4.out' }
        );
      }

      // Animation cho menu items
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
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const dropdownItems: MenuProps['items'] = [
    ...(userRole === 'User'
      ? [
          {
            key: '1',
            label: 'Quản Lý Người Dùng',
            onClick: () => handleNavigate('/customer-dashboard'),
          },
        ]
      : []),
    ...(userRole === 'Staff' || userRole === 'Manager' || userRole === 'Admin'
      ? [
          {
            key: '2',
            label: 'Bảng Điều Khiển Nhân Viên',
            onClick: () => handleNavigate('/staff-dashboard'),
          },
        ]
      : []),
    ...(userRole === 'Manager' || userRole === 'Admin'
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

  return (
    <nav
      ref={navbarRef}
      className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-md shadow-md py-4 font-roboto z-50 will-change-transform-opacity"
    >
      <div className="container mx-auto flex justify-between items-center">
        <div
          ref={logoContainerRef}
          className="flex items-center space-x-3 cursor-pointer hover:text-green-700 transition-colors will-change-transform-opacity"
          onClick={() => handleNavigate('/')}
        >
          <img
            ref={logoImageRef}
            src={logo}
            alt="GreenHaven Logo"
            className="h-10 object-contain"
          />
          <span
            ref={logoTextRef}
            className="text-3xl font-bold text-green-600"
          >
            TerraTech
          </span>
        </div>
        <div ref={menuRef} className="flex space-x-6">
          <Button
            type="link"
            icon={<HomeOutlined />}
            onClick={() => handleNavigate('/')}
            className={`!text-teal-700 text-lg font-semibold ${isActive('/') ? 'bg-green-100 !text-green-600' : ''} hover:!text-teal-500 transition-colors flex items-center will-change-transform-opacity`}
          >
            Trang Chủ
          </Button>
          <Button
            type="link"
            icon={<ShopOutlined />}
            onClick={() => handleNavigate('/shop')}
            className={`!text-teal-700 text-lg font-semibold ${isActive('/shop') ? 'bg-green-100 !text-green-600' : ''} hover:!text-teal-500 transition-colors flex items-center will-change-transform-opacity`}
          >
            Cửa Hàng
          </Button>
          <Button
            type="link"
            icon={<TeamOutlined />}
            onClick={() => handleNavigate('/membership')}
            className={`!text-teal-700 text-lg font-semibold ${isActive('/membership') ? 'bg-green-100 !text-green-600' : ''} hover:!text-teal-500 transition-colors flex items-center will-change-transform-opacity`}
          >
            Thành Viên
          </Button>
          <Button
            type="link"
            icon={<ReadOutlined />}
            onClick={() => handleNavigate('/blog')}
            className={`!text-teal-700 text-lg font-semibold ${isActive('/blog') ? 'bg-green-100 !text-green-600' : ''} hover:!text-teal-500 transition-colors flex items-center will-change-transform-opacity`}
          >
            Blog
          </Button>
          <Button
            type="link"
            icon={<InfoCircleOutlined />}
            onClick={() => handleNavigate('/about')}
            className={`!text-teal-700 text-lg font-semibold ${isActive('/about') ? 'bg-green-100 !text-green-600' : ''} hover:!text-teal-500 transition-colors flex items-center will-change-transform-opacity`}
          >
            Giới Thiệu
          </Button>
        </div>
        <div className="flex space-x-4">
          <Button
            icon={<SearchOutlined />}
            className="!text-teal-700 hover:!text-teal-500 transition-colors will-change-transform-opacity"
          />
          <Button
            icon={<ShoppingCartOutlined />}
            onClick={() => handleNavigate('/cart')}
            className={`!text-teal-700 ${isActive('/cart') ? 'bg-green-100 !text-green-600' : ''} hover:!text-teal-500 transition-colors will-change-transform-opacity`}
          />
          {isAuthenticated ? (
            <Dropdown menu={{ items: dropdownItems }} trigger={['hover']}>
              <Button
                icon={<UserOutlined />}
                className="!text-teal-700 hover:!text-teal-500 transition-colors will-change-transform-opacity"
              />
            </Dropdown>
          ) : (
            <Button
              icon={<UserOutlined />}
              onClick={() => handleNavigate('/login')}
              className="!text-teal-700 text-lg font-semibold hover:!text-teal-500 transition-colors flex items-center will-change-transform-opacity"
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
      `}</style>
    </nav>
  );
};

export default Navbar;