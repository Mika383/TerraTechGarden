// src/route/routes.tsx
import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import TerrariumList from '../components/manager/TerrariumList';
import TerrariumCreate from '../components/manager/TerrariumCreate';
import TerrariumEdit from '../components/manager/TerrariumEdit';
import ShapeList from '../components/manager/ShapeList';
import ShapeCreate from '../components/manager/ShapeCreate';
import ShapeEdit from '../components/manager/ShapeEdit';
import ThemeList from '../components/manager/ThemeList';
import ThemeCreate from '../components/manager/ThemeCreate';
import ThemeEdit from '../components/manager/ThemeEdit';
import Layout from '../components/customer/Layout/Layout';
import Home from '../pages/Customer/Home';
import Shop from '../pages/Customer/Shop';
import Membership from '../pages/Customer/MemberShip';
import Blog from '../pages/Customer/Blog';
import BlogDetails from '../pages/Customer/BlogDetails';
import About from '../pages/Customer/About';
import Login from '../pages/Customer/Login';
import Register from '../pages/Customer/Register';
import Detail from '../pages/Customer/Detail';
import Cart from '../pages/Customer/Cart';
import Checkout from '../pages/Customer/Checkout';
import CustomerDashboardWrapper from '../components/customer/Dashboard/CustomerDashboardWrapper';
import CustomerDashboard from '../pages/Customer/CustomerDashboard';
import Orders from '../pages/Customer/Order';
import Notifications from '../pages/Customer/Notifications';
import Favorites from '../pages/Customer/Favorites';
import Wishlist from '../pages/Customer/Wishlist';
import SavedLayouts from '../pages/Customer/SavedLayouts';
import ChatWithStaff from '../pages/Customer/ChatWithStaff';
import MyReviews from '../pages/Customer/MyReviews';
import EditProfile from '../pages/Customer/EditProfile';
import AdminLayout from '../components/admin/AdminLayout';
import AdminDashboard from '../pages/Admin/AdminDashboard';
import ShiftManagement from '../pages/Admin/ShiftManagement';
import CustomerManagement from '../pages/Admin/CustomerManagement';
import StaffManagement from '../pages/Admin/StaffManagement';
import ManagerManagement from '../pages/Admin/ManagerManagement';
import ShipperManagement from '../pages/Admin/ShipperManagement';
import AllOrders from '../pages/Admin/AllOrders';
import PreparingOrders from '../pages/Admin/PreparingOrders';
import ShippingOrders from '../pages/Admin/ShippingOrders';
import CompletedOrders from '../pages/Admin/CompletedOrders';
import CanceledOrders from '../pages/Admin/CanceledOrders';
import RevenueReport from '../pages/Admin/RevenueReport';
import StatisticsReport from '../pages/Admin/StatisticsReport';
import ManagerLayout from '../components/manager/ManagerLayout';
import ManagerDashboard from '../pages/Manager/ManagerDashboard';
import StaffDashboard from '../pages/Staff/StaffDashboard';
import Unauthorized from '../pages/Unauthorized';
const AppRoutes = () => {
  return (
    <Routes>
      {/* Routes công khai (không cần bảo vệ) */}
      <Route
        element={<Suspense fallback={<div>Đang tải...</div>}><Layout /></Suspense>}
      >
        <Route path="/" element={<Suspense fallback={<div>Đang tải...</div>}><Home /></Suspense>} />
        <Route path="/shop" element={<Suspense fallback={<div>Đang tải...</div>}><Shop /></Suspense>} />
        <Route path="/membership" element={<Suspense fallback={<div>Đang tải...</div>}><Membership /></Suspense>} />
        <Route path="/blog" element={<Suspense fallback={<div>Đang tải...</div>}><Blog /></Suspense>} />
        <Route path="/blog/:id" element={<Suspense fallback={<div>Đang tải...</div>}><BlogDetails /></Suspense>} />
        <Route path="/about" element={<Suspense fallback={<div>Đang tải...</div>}><About /></Suspense>} />
        <Route path="/login" element={<Suspense fallback={<div>Đang tải...</div>}><Login /></Suspense>} />
        <Route path="/register" element={<Suspense fallback={<div>Đang tải...</div>}><Register /></Suspense>} />
        <Route path="/cart" element={<Suspense fallback={<div>Đang tải...</div>}><Cart /></Suspense>} />
        <Route path="/checkout" element={<Suspense fallback={<div>Đang tải...</div>}><Checkout /></Suspense>} />
        <Route path="/terrarium/:id" element={<Suspense fallback={<div>Đang tải...</div>}><Detail /></Suspense>} />
      </Route>

      {/* Routes bảo vệ theo role */}
      <Route
        path="/customer-dashboard/*"
        element={
          <PrivateRoute allowedRoles={['User', 'Staff', 'Manager', 'Admin']} />
        }
      >
        <Route
          index
          element={<Suspense fallback={<div>Đang tải...</div>}><CustomerDashboard /></Suspense>}
        />
        <Route
          path="orders"
          element={<Suspense fallback={<div>Đang tải...</div>}><Orders /></Suspense>}
        />
        <Route
          path="notifications"
          element={<Suspense fallback={<div>Đang tải...</div>}><Notifications /></Suspense>}
        />
        <Route
          path="favorites"
          element={<Suspense fallback={<div>Đang tải...</div>}><Favorites /></Suspense>}
        />
        <Route
          path="wishlist"
          element={<Suspense fallback={<div>Đang tải...</div>}><Wishlist /></Suspense>}
        />
        <Route
          path="layouts"
          element={<Suspense fallback={<div>Đang tải...</div>}><SavedLayouts /></Suspense>}
        />
        <Route
          path="chat"
          element={<Suspense fallback={<div>Đang tải...</div>}><ChatWithStaff /></Suspense>}
        />
        <Route
          path="reviews"
          element={<Suspense fallback={<div>Đang tải...</div>}><MyReviews /></Suspense>}
        />
        <Route
          path="edit-profile"
          element={<Suspense fallback={<div>Đang tải...</div>}><EditProfile /></Suspense>}
        />
      </Route>

      <Route
        path="/staff-dashboard"
        element={
          <PrivateRoute allowedRoles={['Staff', 'Manager', 'Admin']} />
        }
      >
        <Route
          index
          element={<Suspense fallback={<div>Đang tải...</div>}><StaffDashboard /></Suspense>}
        />
      </Route>

      <Route
        path="/manager/*"
        element={
          <PrivateRoute allowedRoles={['Manager', 'Admin']} />
        }
      >
        <Route
          path="terrarium/list"
          element={<Suspense fallback={<div>Đang tải...</div>}><TerrariumList /></Suspense>}
        />
        <Route
          path="terrarium/create"
          element={<Suspense fallback={<div>Đang tải...</div>}><TerrariumCreate /></Suspense>}
        />
        <Route
          path="terrarium/edit/:id"
          element={<Suspense fallback={<div>Đang tải...</div>}><TerrariumEdit /></Suspense>}
        />
        <Route
          path="shape/list"
          element={<Suspense fallback={<div>Đang tải...</div>}><ShapeList /></Suspense>}
        />
        <Route
          path="shape/create"
          element={<Suspense fallback={<div>Đang tải...</div>}><ShapeCreate /></Suspense>}
        />
        <Route
          path="shape/edit/:id"
          element={<Suspense fallback={<div>Đang tải...</div>}><ShapeEdit /></Suspense>}
        />
        <Route
          path="theme/list"
          element={<Suspense fallback={<div>Đang tải...</div>}><ThemeList /></Suspense>}
        />
        <Route
          path="theme/create"
          element={<Suspense fallback={<div>Đang tải...</div>}><ThemeCreate /></Suspense>}
        />
        <Route
          path="theme/edit/:id"
          element={<Suspense fallback={<div>Đang tải...</div>}><ThemeEdit /></Suspense>}
        />
        <Route
          path="dashboard"
          element={<Suspense fallback={<div>Đang tải...</div>}><ManagerDashboard /></Suspense>}
        />
      </Route>

      <Route
        path="/admin/*"
        element={
          <PrivateRoute allowedRoles={['Admin']} />
        }
      >
        <Route
          path="dashboard"
          element={<Suspense fallback={<div>Đang tải...</div>}><AdminDashboard /></Suspense>}
        />
        <Route
          path="shift-management"
          element={<Suspense fallback={<div>Đang tải...</div>}><ShiftManagement /></Suspense>}
        />
        <Route
          path="overview"
          element={<Suspense fallback={<div>Đang tải...</div>}><AdminDashboard /></Suspense>}
        />
        <Route
          path="accounts/customer"
          element={<Suspense fallback={<div>Đang tải...</div>}><CustomerManagement /></Suspense>}
        />
        <Route
          path="accounts/staff"
          element={<Suspense fallback={<div>Đang tải...</div>}><StaffManagement /></Suspense>}
        />
        <Route
          path="accounts/manager"
          element={<Suspense fallback={<div>Đang tải...</div>}><ManagerManagement /></Suspense>}
        />
        <Route
          path="accounts/shipper"
          element={<Suspense fallback={<div>Đang tải...</div>}><ShipperManagement /></Suspense>}
        />
        <Route
          path="orders/all"
          element={<Suspense fallback={<div>Đang tải...</div>}><AllOrders /></Suspense>}
        />
        <Route
          path="orders/preparing"
          element={<Suspense fallback={<div>Đang tải...</div>}><PreparingOrders /></Suspense>}
        />
        <Route
          path="orders/shipping"
          element={<Suspense fallback={<div>Đang tải...</div>}><ShippingOrders /></Suspense>}
        />
        <Route
          path="orders/completed"
          element={<Suspense fallback={<div>Đang tải...</div>}><CompletedOrders /></Suspense>}
        />
        <Route
          path="orders/canceled"
          element={<Suspense fallback={<div>Đang tải...</div>}><CanceledOrders /></Suspense>}
        />
        <Route
          path="revenue"
          element={<Suspense fallback={<div>Đang tải...</div>}><RevenueReport /></Suspense>}
        />
        <Route
          path="statistics"
          element={<Suspense fallback={<div>Đang tải...</div>}><StatisticsReport /></Suspense>}
        />
        <Route
          path="settings"
          element={<Suspense fallback={<div>Đang tải...</div>}><AdminDashboard /></Suspense>}
        />
        <Route
          path="reports"
          element={<Suspense fallback={<div>Đang tải...</div>}><AdminDashboard /></Suspense>}
        />
      </Route>

      {/* Trang không có quyền */}
      <Route
        path="/unauthorized"
        element={<Suspense fallback={<div>Đang tải...</div>}><Unauthorized /></Suspense>}
      />
    </Routes>
  );
};

export default AppRoutes;