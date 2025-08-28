import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import Loading from '../components/common/Loading';
import TankMethodList from '../components/manager/TankMethodList';
import TankMethodCreate from '../components/manager/TankMethodCreate';
import TankMethodEdit from '../components/manager/TankMethodEdit';
import AccountManagement from '../pages/Admin/AccountManagement';
import BlogCategoryManagement from '../pages/Admin/BlogCategoryManagement';
import BlogManagement from '../pages/Admin/BlogManagement';
import CategoryList from '../components/manager/CategoryList';
import CategoryCreate from '../components/manager/CategoryCreate';
import CategoryEdit from '../components/manager/CategoryEdit';
import TerrariumVariants from '../components/manager/TerrariumVariants';
import OrderList from '@/components/staff/OrderList';
import ChatWithCustomer from '@/components/staff/ChatWithCustomer';
import StaffLayout from '@/components/staff/StaffLayout';
import ThankYou from '@/pages/Customer/ThankYou';
import PaymentSuccess from '@/pages/Customer/PaymentSuccess';
import EditTerrariumVariant from '@/components/manager/TerrariumVariantEdit';
import VoucherManagement from '@/pages/Admin/VoucherManagement';
import MembershipManagement from '@/pages/Admin/MembershipManagement';
import OrderDetail from '@/pages/Customer/OrderDetail';
import ComboCategoryList from '@/components/manager/ComboCategoryList';
import ComboCategoryCreate from '@/components/manager/ComboCategoryCreate';
import ComboCategoryEdit from '@/components/manager/ComboCategoryEdit';
import ComboList from '@/components/manager/ComboList';
import ComboCreate from '@/components/manager/ComboCreate';
import ComboEdit from '@/components/manager/ComboEdit';
import TerrariumChatbox from '@/pages/Customer/TerrariumChatbox';
import MyLayoutsPage from '@/pages/Customer/MyLayouts';
import OrderDetailStaff from '@/components/staff/OrderDetailStaff';
import TerrariumRequestList from '@/components/staff/TerrariumRequestList';
import TerrariumCustomizePage from '@/components/staff/TerrariumCustomizePage';
import TerrariumRequestAll from '@/components/staff/TerrariumRequestAll';
import VerifyEmail from '@/pages/Customer/VerifyEmail';
import ComboDetail from '@/pages/Customer/ComboDetail';

const Layout = lazy(() => import('../components/customer/Layout/Layout'));
const CustomerLayout = lazy(() => import('../components/customer/Dashboard/CustomerLayout'));
const AdminLayout = lazy(() => import('../components/admin/AdminLayout'));
const ManagerLayout = lazy(() => import('../components/manager/ManagerLayout'));
const TerrariumList = lazy(() => import('../components/manager/TerrariumList'));
const TerrariumCreate = lazy(() => import('../components/manager/TerrariumCreate'));
const TerrariumEdit = lazy(() => import('../components/manager/TerrariumEdit'));
const AccessoryList = lazy(() => import('../components/manager/AccessoryList'));
const AccessoryCreate = lazy(() => import('../components/manager/AccessoryCreate'));
const AccessoryEdit = lazy(() => import('../components/manager/AccessoryEdit'));
const ShapeList = lazy(() => import('../components/manager/ShapeList'));
const ShapeCreate = lazy(() => import('../components/manager/ShapeCreate'));
const ShapeEdit = lazy(() => import('../components/manager/ShapeEdit'));
const ThemeList = lazy(() => import('../components/manager/ThemeList'));
const ThemeCreate = lazy(() => import('../components/manager/ThemeCreate'));
const ThemeEdit = lazy(() => import('../components/manager/ThemeEdit'));
const Home = lazy(() => import('../pages/Customer/Home'));
const Shop = lazy(() => import('../pages/Customer/Shop'));
const Membership = lazy(() => import('../pages/Customer/MemberShip'));
const Blog = lazy(() => import('../pages/Customer/Blog'));
const BlogDetails = lazy(() => import('../pages/Customer/BlogDetails'));
const About = lazy(() => import('../pages/Customer/About'));
const Login = lazy(() => import('../pages/Customer/Login'));
const Register = lazy(() => import('../pages/Customer/Register'));
const ForgotPassword = lazy(() => import('../pages/Customer/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/Customer/ResetPassword'));
const Detail = lazy(() => import('../pages/Customer/Detail'));
const AccessoryDetail = lazy(() => import('../pages/Customer/AccessoryDetail'));

const Cart = lazy(() => import('../pages/Customer/Cart'));
const Checkout = lazy(() => import('../pages/Customer/Checkout'));
const CustomerDashboard = lazy(() => import('../pages/Customer/CustomerDashboard'));
const Orders = lazy(() => import('../pages/Customer/Order'));
const Notifications = lazy(() => import('../pages/Customer/Notifications'));
const Favorites = lazy(() => import('../pages/Customer/Favorites'));
const Wishlist = lazy(() => import('../pages/Customer/Wishlist'));
const SavedLayouts = lazy(() => import('../pages/Customer/SavedLayouts'));
const ChatWithStaff = lazy(() => import('../pages/Customer/ChatWithStaff'));
const MyReviews = lazy(() => import('../pages/Customer/MyReviews'));
const EditProfile = lazy(() => import('../pages/Customer/EditProfile'));
const Personalize = lazy(() => import('../pages/Customer/Personalize'));
const AdminDashboard = lazy(() => import('../pages/Admin/AdminDashboard'));
const ShiftManagement = lazy(() => import('../pages/Admin/ShiftManagement'));
const AllOrders = lazy(() => import('../pages/Admin/AllOrders'));
const PreparingOrders = lazy(() => import('../pages/Admin/PreparingOrders'));
const ShippingOrders = lazy(() => import('../pages/Admin/ShippingOrders'));
const CompletedOrders = lazy(() => import('../pages/Admin/CompletedOrders'));
const CanceledOrders = lazy(() => import('../pages/Admin/CanceledOrders'));
const RevenueReport = lazy(() => import('../pages/Admin/RevenueReport'));
const StatisticsReport = lazy(() => import('../pages/Admin/StatisticsReport'));
const ManagerDashboard = lazy(() => import('../pages/Manager/ManagerDashboard'));
const StaffDashboard = lazy(() => import('../pages/Staff/StaffDashboard'));
const Unauthorized = lazy(() => import('../pages/Unauthorized'));
const NotFound = lazy(() => import('../pages/NotFound'));

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<Suspense fallback={<Loading />}><Layout /></Suspense>}>
        <Route index element={<Suspense fallback={<Loading />}><Home /></Suspense>} />
        <Route path="shop" element={<Suspense fallback={<Loading />}><Shop /></Suspense>} />
        <Route path="membership" element={<Suspense fallback={<Loading />}><Membership /></Suspense>} />
        <Route path="blog" element={<Suspense fallback={<Loading />}><Blog /></Suspense>} />
        <Route path="blog/:id" element={<Suspense fallback={<Loading />}><BlogDetails /></Suspense>} />
        <Route path="about" element={<Suspense fallback={<Loading />}><About /></Suspense>} />
        <Route path="login" element={<Suspense fallback={<Loading />}><Login /></Suspense>} />
        <Route path="register" element={<Suspense fallback={<Loading />}><Register /></Suspense>} />
        <Route path="forgot-password" element={<Suspense fallback={<Loading />}><ForgotPassword /></Suspense>} />
        <Route path="reset-password" element={<Suspense fallback={<Loading />}><ResetPassword /></Suspense>} />
        <Route path="reset-password/:token?" element={<Suspense fallback={<Loading />}><ResetPassword /></Suspense>} />
        <Route path="cart" element={<Suspense fallback={<Loading />}><Cart /></Suspense>} />
        <Route path="checkout" element={<Suspense fallback={<Loading />}><Checkout /></Suspense>} />
        <Route path="terrarium/:id" element={<Suspense fallback={<Loading />}><Detail /></Suspense>} />
        <Route path="accessory/:id" element={<Suspense fallback={<Loading />}><AccessoryDetail /></Suspense>} />
        <Route path="personalize" element={<Suspense fallback={<Loading />}><Personalize /></Suspense>} />
        <Route path="thank-you/:id" element={<Suspense fallback={<Loading />}><ThankYou /></Suspense>} />
        <Route path="payment-success" element={<Suspense fallback={<Loading />}><PaymentSuccess /></Suspense>} />
        <Route path="verify-email" element={<Suspense fallback={<Loading />}><VerifyEmail /></Suspense>} />
        <Route path="combo/:id" element={<Suspense fallback={<Loading />}><ComboDetail /></Suspense>} />
        <Route
          path="customer-dashboard"
          element={<PrivateRoute allowedRoles={['User', 'Staff', 'Manager', 'Admin']} />}
        >
          <Route
            element={<Suspense fallback={<Loading />}><CustomerLayout /></Suspense>}
          >
            <Route index element={<Suspense fallback={<Loading />}><CustomerDashboard /></Suspense>} />
            <Route path="orders" element={<Suspense fallback={<Loading />}><Orders /></Suspense>} />
            <Route path="order-detail/:orderId" element={<Suspense fallback={<Loading />}><OrderDetail /></Suspense>} />
            <Route path="notifications" element={<Suspense fallback={<Loading />}><Notifications /></Suspense>} />
            <Route path="favorites" element={<Suspense fallback={<Loading />}><Favorites /></Suspense>} />
            <Route path="wishlist" element={<Suspense fallback={<Loading />}><Wishlist /></Suspense>} />
            <Route path="layouts" element={<Suspense fallback={<Loading />}><SavedLayouts /></Suspense>} />
            <Route path="chat" element={<Suspense fallback={<Loading />}><ChatWithStaff /></Suspense>} />
            <Route path="reviews" element={<Suspense fallback={<Loading />}><MyReviews /></Suspense>} />
            <Route path="edit-profile" element={<Suspense fallback={<Loading />}><EditProfile /></Suspense>} />
            <Route path="create-layout" element={<Suspense fallback={<Loading />}><TerrariumChatbox /></Suspense>} />
            <Route path="my-layouts" element={<Suspense fallback={<Loading />}><MyLayoutsPage /></Suspense>} />
            <Route path="orders/:id" element={<Suspense fallback={<Loading />}><OrderDetail /></Suspense>} />
          </Route>
        </Route>
      </Route>
      <Route path="staff" element={<PrivateRoute allowedRoles={['Staff', 'Manager', 'Admin']} />}>
  <Route element={<Suspense fallback={<Loading />}><StaffLayout /></Suspense>}>
    <Route path="dashboard" element={<Suspense fallback={<Loading />}><StaffDashboard /></Suspense>} />
    <Route path="order/list" element={<Suspense fallback={<Loading />}><OrderList /></Suspense>} />
    <Route path="order/:id/detail" element={<Suspense fallback={<Loading />}><OrderDetailStaff /></Suspense>} />
    <Route path="support/messages" element={<Suspense fallback={<Loading />}><ChatWithCustomer /></Suspense>} />
    <Route path="support/requests" element={<Suspense fallback={<Loading />}><TerrariumRequestList /></Suspense>} />
    <Route path="terrarium-requests" element={<Suspense fallback={<Loading />}><TerrariumRequestAll /></Suspense>} />
    <Route path="terrarium-customize/:id" element={<Suspense fallback={<Loading />}><TerrariumCustomizePage /></Suspense>} />
  </Route>
</Route>
      <Route path="manager" element={<PrivateRoute allowedRoles={['Manager', 'Admin']} />}>
        <Route element={<Suspense fallback={<Loading />}><ManagerLayout /></Suspense>}>
          <Route path="dashboard" element={<Suspense fallback={<Loading />}><ManagerDashboard /></Suspense>} />
          <Route path="terrarium/list" element={<Suspense fallback={<Loading />}><TerrariumList /></Suspense>} />
          <Route path="terrarium/:id/variants" element={<Suspense fallback={<Loading />}><TerrariumVariants /></Suspense>} />
          <Route path="terrarium/:id/variant/edit/:id" element={<Suspense fallback={<Loading />}><EditTerrariumVariant /></Suspense>} />
          <Route path="terrarium/create" element={<Suspense fallback={<Loading />}><TerrariumCreate /></Suspense>} />
          <Route path="terrarium/edit/:id" element={<Suspense fallback={<Loading />}><TerrariumEdit /></Suspense>} />
          <Route path="accessory/list" element={<Suspense fallback={<Loading />}><AccessoryList /></Suspense>} />
          <Route path="accessory/create" element={<Suspense fallback={<Loading />}><AccessoryCreate /></Suspense>} />
          <Route path="accessory/edit/:id" element={<Suspense fallback={<Loading />}><AccessoryEdit /></Suspense>} />
          <Route path="category/list" element={<Suspense fallback={<Loading />}><CategoryList /></Suspense>} />
          <Route path="category/create" element={<Suspense fallback={<Loading />}><CategoryCreate /></Suspense>} />
          <Route path="category/edit/:id" element={<Suspense fallback={<Loading />}><CategoryEdit /></Suspense>} />
          <Route path="shape/list" element={<Suspense fallback={<Loading />}><ShapeList /></Suspense>} />
          <Route path="shape/create" element={<Suspense fallback={<Loading />}><ShapeCreate /></Suspense>} />
          <Route path="shape/edit/:id" element={<Suspense fallback={<Loading />}><ShapeEdit /></Suspense>} />
          <Route path="theme/list" element={<Suspense fallback={<Loading />}><ThemeList /></Suspense>} />
          <Route path="theme/create" element={<Suspense fallback={<Loading />}><ThemeCreate /></Suspense>} />
          <Route path="theme/edit/:id" element={<Suspense fallback={<Loading />}><ThemeEdit /></Suspense>} />
          <Route path="tank-method/list" element={<Suspense fallback={<Loading />}><TankMethodList /></Suspense>} />
          <Route path="tank-method/create" element={<Suspense fallback={<Loading />}><TankMethodCreate /></Suspense>} />
          <Route path="tank-method/edit/:id" element={<Suspense fallback={<Loading />}><TankMethodEdit /></Suspense>} />
          <Route path="combo-category/list" element={<Suspense fallback={<Loading />}><ComboCategoryList /></Suspense>} />
          <Route path="combo-category/create" element={<Suspense fallback={<Loading />}><ComboCategoryCreate /></Suspense>} />
          <Route path="combo-category/edit/:id" element={<Suspense fallback={<Loading />}><ComboCategoryEdit /></Suspense>} />
          <Route path="combo/list" element={<Suspense fallback={<Loading />}><ComboList /></Suspense>} />
          <Route path="combo/create" element={<Suspense fallback={<Loading />}><ComboCreate /></Suspense>} />
          <Route path="combo/edit/:id" element={<Suspense fallback={<Loading />}><ComboEdit /></Suspense>} />
        </Route>
      </Route>
      <Route path="admin" element={<PrivateRoute allowedRoles={['Admin']} />}>
        <Route element={<Suspense fallback={<Loading />}><AdminLayout /></Suspense>}>
          <Route index element={<Suspense fallback={<Loading />}><AdminDashboard /></Suspense>} />
          <Route path="dashboard" element={<Suspense fallback={<Loading />}><AdminDashboard /></Suspense>} />
          <Route path="shift-management" element={<Suspense fallback={<Loading />}><ShiftManagement /></Suspense>} />
          <Route path="overview" element={<Suspense fallback={<Loading />}><AdminDashboard /></Suspense>} />
          <Route path="/admin/accounts" element={<AccountManagement />} />
          <Route path="orders" element={<Suspense fallback={<Loading />}><OrderList /></Suspense>} />
          <Route path="orders/preparing" element={<Suspense fallback={<Loading />}><PreparingOrders /></Suspense>} />
          <Route path="orders/shipping" element={<Suspense fallback={<Loading />}><ShippingOrders /></Suspense>} />
          <Route path="orders/completed" element={<Suspense fallback={<Loading />}><CompletedOrders /></Suspense>} />
          <Route path="orders/canceled" element={<Suspense fallback={<Loading />}><CanceledOrders /></Suspense>} />
          <Route path="revenue" element={<Suspense fallback={<Loading />}><RevenueReport /></Suspense>} />
          <Route path="statistics" element={<Suspense fallback={<Loading />}><StatisticsReport /></Suspense>} />
          <Route path="settings" element={<Suspense fallback={<Loading />}><AdminDashboard /></Suspense>} />
          <Route path="reports" element={<Suspense fallback={<Loading />}><AdminDashboard /></Suspense>} />
          <Route path="blog-categories" element={<Suspense fallback={<Loading />}><BlogCategoryManagement /></Suspense>} />
          <Route path="blogs" element={<Suspense fallback={<Loading />}><BlogManagement /></Suspense>} />
          <Route path="vouchers" element={<Suspense fallback={<Loading />}><VoucherManagement /></Suspense>} />
          <Route path="memberships" element={<Suspense fallback={<Loading />}><MembershipManagement /></Suspense>} />
        </Route>
      </Route>
      <Route path="unauthorized" element={<Suspense fallback={<Loading />}><Unauthorized /></Suspense>} />
      <Route path="*" element={<Suspense fallback={<Loading />}><NotFound /></Suspense>} />
      <Route element={<ScrollToTop />} />
    </Routes>
  );
};

export default AppRoutes;