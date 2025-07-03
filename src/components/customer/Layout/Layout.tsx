import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import FloatingChat from './FloatingChat';

const Layout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 pt-16"> 
        <Outlet />
      </main>
      <Footer />
      <FloatingChat />
    </div>
  );
};

export default Layout;