import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import TerrariumList from './components/manager/TerrariumList';
import TerrariumCreate from './components/manager/TerrariumCreate';
import TerrariumEdit from './components/manager/TerrariumEdit';
import ShapeList from './components/manager/ShapeList';
import ShapeCreate from './components/manager/ShapeCreate';
import ShapeEdit from './components/manager/ShapeEdit';
import ThemeList from './components/manager/ThemeList';
import ThemeCreate from './components/manager/ThemeCreate';
import ThemeEdit from './components/manager/ThemeEdit';

const Home = lazy(() => import('./pages/Customer/Home'));
const Layout = lazy(() => import('./components/customer/Layout/Layout'));
const Detail = lazy(() => import('./pages/Customer/Detail'));
const Register = lazy(() => import('./pages/Customer/Register'));
const BlogDetails = lazy(() => import('./pages/Customer/BlogDetails'));
const Checkout = lazy(() => import('./pages/Customer/Checkout'));
const EditProfile = lazy(() => import('./pages/Customer/EditProfile'));
const ShiftManagement = lazy(() => import('./pages/Admin/ShiftManagement'));
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const CustomerManagement = lazy(() => import('./pages/Admin/CustomerManagement'));
const StaffManagement = lazy(() => import('./pages/Admin/StaffManagement'));
const ManagerManagement = lazy(() => import('./pages/Admin/ManagerManagement'));
const ShipperManagement = lazy(() => import('./pages/Admin/ShipperManagement'));
const AllOrders = lazy(() => import('./pages/Admin/AllOrders'));
const PreparingOrders = lazy(() => import('./pages/Admin/PreparingOrders'));
const ShippingOrders = lazy(() => import('./pages/Admin/ShippingOrders'));
const CompletedOrders = lazy(() => import('./pages/Admin/CompletedOrders'));
const CanceledOrders = lazy(() => import('./pages/Admin/CanceledOrders'));
const RevenueReport = lazy(() => import('./pages/Admin/RevenueReport'));
const StatisticsReport = lazy(() => import('./pages/Admin/StatisticsReport'));
const Orders = lazy(() => import('./pages/Customer/Order'));
const CustomerLayout = lazy(() => import('./components/customer/Dashboard/CustomerLayout'));
const CustomerDashboard = lazy(() => import('./pages/Customer/CustomerDashboard'));
const CustomerDashboardWrapper = lazy(() => import('./components/customer/Dashboard/CustomerDashboardWrapper'));
const Notifications = lazy(() => import('./pages/Customer/Notifications'));
const Favorites = lazy(() => import('./pages/Customer/Favorites'));
const Wishlist = lazy(() => import('./pages/Customer/Wishlist'));
const SavedLayouts = lazy(() => import('./pages/Customer/SavedLayouts'));
const ChatWithStaff = lazy(() => import('./pages/Customer/ChatWithStaff'));
const MyReviews = lazy(() => import('./pages/Customer/MyReviews'));
const Shop = lazy(() => import('./pages/Customer/Shop'));
const Membership = lazy(() => import('./pages/Customer/MemberShip'));
const Blog = lazy(() => import('./pages/Customer/Blog'));
const About = lazy(() => import('./pages/Customer/About'));
const Login = lazy(() => import('./pages/Customer/Login'));
const Cart = lazy(() => import('./pages/Customer/Cart'));
const StaffDashboard = lazy(() => import('./pages/Staff/StaffDashboard'));
const ManagerDashboard = lazy(() => import('./pages/Manager/ManagerDashboard'));
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard'));
const ManagerLayout = lazy(() => import('./components/manager/ManagerLayout'));

const App: React.FC = () => {
  return (
    <>
      <Routes>
        <Route element={<Suspense fallback={<div>Đang tải...</div>}><Layout /></Suspense>}>
          <Route path="/" element={<Suspense fallback={<div>Đang tải...</div>}><Home /></Suspense>} />
          <Route path="/shop" element={<Suspense fallback={<div>Đang tải...</div>}><Shop /></Suspense>} />
          <Route path="/membership" element={<Suspense fallback={<div>Đang tải...</div>}><Membership /></Suspense>} />
          <Route path="/blog" element={<Suspense fallback={<div>Đang tải...</div>}><Blog /></Suspense>} />
          <Route path="/blog/:id" element={<Suspense fallback={<div>Đang tải...</div>}><BlogDetails /></Suspense>} />
          <Route path="/about" element={<Suspense fallback={<div>Đang tải...</div>}><About /></Suspense>} />
          <Route path="/customer-dashboard" element={<Suspense fallback={<div>Đang tải...</div>}><CustomerDashboardWrapper /></Suspense>}>
            <Route index element={<Suspense fallback={<div>Đang tải...</div>}><CustomerDashboard /></Suspense>} />
            <Route path="orders" element={<Suspense fallback={<div>Đang tải...</div>}><Orders /></Suspense>} />
            <Route path="notifications" element={<Suspense fallback={<div>Đang tải...</div>}><Notifications /></Suspense>} />
            <Route path="favorites" element={<Suspense fallback={<div>Đang tải...</div>}><Favorites /></Suspense>} />
            <Route path="wishlist" element={<Suspense fallback={<div>Đang tải...</div>}><Wishlist /></Suspense>} />
            <Route path="layouts" element={<Suspense fallback={<div>Đang tải...</div>}><SavedLayouts /></Suspense>} />
            <Route path="chat" element={<Suspense fallback={<div>Đang tải...</div>}><ChatWithStaff /></Suspense>} />
            <Route path="reviews" element={<Suspense fallback={<div>Đang tải...</div>}><MyReviews /></Suspense>} />
            <Route path="edit-profile" element={<Suspense fallback={<div>Đang tải...</div>}><EditProfile /></Suspense>} />
          </Route>
          <Route path="/cart" element={<Suspense fallback={<div>Đang tải...</div>}><Cart /></Suspense>} />
          <Route path="/checkout" element={<Suspense fallback={<div>Đang tải...</div>}><Checkout /></Suspense>} />
          <Route path="/terrarium/:id" element={<Suspense fallback={<div>Đang tải...</div>}><Detail /></Suspense>} />
          <Route path="/register" element={<Suspense fallback={<div>Đang tải...</div>}><Register /></Suspense>} />
          <Route path="/login" element={<Suspense fallback={<div>Đang tải...</div>}><Login /></Suspense>} />
        </Route>
        <Route element={<Suspense fallback={<div>Đang tải...</div>}><AdminLayout /></Suspense>}>
          <Route path="/admin/dashboard" element={<Suspense fallback={<div>Đang tải...</div>}><AdminDashboard /></Suspense>} />
          <Route path="/admin/shift-management" element={<Suspense fallback={<div>Đang tải...</div>}><ShiftManagement /></Suspense>} />
          <Route path="/admin/overview" element={<Suspense fallback={<div>Đang tải...</div>}><AdminDashboard /></Suspense>} />
          <Route path="/admin/accounts/customer" element={<Suspense fallback={<div>Đang tải...</div>}><CustomerManagement /></Suspense>} />
          <Route path="/admin/accounts/staff" element={<Suspense fallback={<div>Đang tải...</div>}><StaffManagement /></Suspense>} />
          <Route path="/admin/accounts/manager" element={<Suspense fallback={<div>Đang tải...</div>}><ManagerManagement /></Suspense>} />
          <Route path="/admin/accounts/shipper" element={<Suspense fallback={<div>Đang tải...</div>}><ShipperManagement /></Suspense>} />
          <Route path="/admin/orders/all" element={<Suspense fallback={<div>Đang tải...</div>}><AllOrders /></Suspense>} />
          <Route path="/admin/orders/preparing" element={<Suspense fallback={<div>Đang tải...</div>}><PreparingOrders /></Suspense>} />
          <Route path="/admin/orders/shipping" element={<Suspense fallback={<div>Đang tải...</div>}><ShippingOrders /></Suspense>} />
          <Route path="/admin/orders/completed" element={<Suspense fallback={<div>Đang tải...</div>}><CompletedOrders /></Suspense>} />
          <Route path="/admin/orders/canceled" element={<Suspense fallback={<div>Đang tải...</div>}><CanceledOrders /></Suspense>} />
          <Route path="/admin/revenue" element={<Suspense fallback={<div>Đang tải...</div>}><RevenueReport /></Suspense>} />
          <Route path="/admin/statistics" element={<Suspense fallback={<div>Đang tải...</div>}><StatisticsReport /></Suspense>} /> 
          <Route path="/admin/settings" element={<Suspense fallback={<div>Đang tải...</div>}><AdminDashboard /></Suspense>} />
          <Route path="/admin/reports" element={<Suspense fallback={<div>Đang tải...</div>}><AdminDashboard /></Suspense>} />
        </Route>
        <Route element={<Suspense fallback={<div>Đang tải...</div>}><ManagerLayout /></Suspense>}>
          <Route path="/manager/terrarium/list" element={<Suspense fallback={<div>Đang tải...</div>}><TerrariumList /></Suspense>} />
          <Route path="/manager/terrarium/create" element={<Suspense fallback={<div>Đang tải...</div>}><TerrariumCreate /></Suspense>} />
          <Route path="/manager/terrarium/edit/:id" element={<Suspense fallback={<div>Đang tải...</div>}><TerrariumEdit /></Suspense>} />
          <Route path="/manager/shape/list" element={<Suspense fallback={<div>Đang tải...</div>}><ShapeList /></Suspense>} />
          <Route path="/manager/shape/create" element={<Suspense fallback={<div>Đang tải...</div>}><ShapeCreate /></Suspense>} />
          <Route path="/manager/shape/edit/:id" element={<Suspense fallback={<div>Đang tải...</div>}><ShapeEdit /></Suspense>} />
          <Route path="/manager/theme/list" element={<Suspense fallback={<div>Đang tải...</div>}><ThemeList /></Suspense>} />
          <Route path="/manager/theme/create" element={<Suspense fallback={<div>Đang tải...</div>}><ThemeCreate /></Suspense>} />
          <Route path="/manager/theme/edit/:id" element={<Suspense fallback={<div>Đang tải...</div>}><ThemeEdit /></Suspense>} />
        </Route>
        <Route path="/staff-dashboard" element={<Suspense fallback={<div>Đang tải...</div>}><StaffDashboard /></Suspense>} />
        <Route path="/manager-dashboard" element={<Suspense fallback={<div>Đang tải...</div>}><ManagerDashboard /></Suspense>} />
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
      />
    </>
  );
};

export default App;