import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Dropdown, MenuProps } from 'antd';
import {
  HomeOutlined,
  ShopOutlined,
  TeamOutlined,
  ReadOutlined,
  InfoCircleOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import logo from '../../../assets/Logo.png';
import { getRoleFromToken } from '../../../utils/jwt';

gsap.registerPlugin(ScrollTrigger);

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
  const userRole = getRoleFromToken ? getRoleFromToken() : null;
  const isAuthenticated = !!userRole;

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
          <Button
            icon={<SearchOutlined />}
            className="!text-teal-700 hover:!text-teal-500 transition-colors p-1 sm:p-2"
            onClick={() => handleNavigate('/search')}
          />
          <Button
            icon={<ShoppingCartOutlined />}
            onClick={() => handleNavigate('/cart')}
            className={`!text-teal-700 ${
              isActive('/cart') ? 'bg-green-100 !text-green-600' : ''
            } hover:!text-teal-500 transition-colors p-1 sm:p-2`}
          />
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
      `}</style>
    </nav>
  );
};

export default Navbar;