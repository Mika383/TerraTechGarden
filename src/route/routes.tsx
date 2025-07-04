import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import Loading from '../components/Loading';
import TankMethodList from '../components/manager/TankMethodList';
import TankMethodCreate from '../components/manager/TankMethodCreate';
import TankMethodEdit from '../components/manager/TankMethodEdit';

// Lazy-loaded components
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
const Detail = lazy(() => import('../pages/Customer/Detail'));
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
const CustomerManagement = lazy(() => import('../pages/Admin/CustomerManagement'));
const StaffManagement = lazy(() => import('../pages/Admin/StaffManagement'));
const ManagerManagement = lazy(() => import('../pages/Admin/ManagerManagement'));
const ShipperManagement = lazy(() => import('../pages/Admin/ShipperManagement'));
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

// Component để đặt lại vị trí cuộn
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
        <Route path="cart" element={<Suspense fallback={<Loading />}><Cart /></Suspense>} />
        <Route path="checkout" element={<Suspense fallback={<Loading />}><Checkout /></Suspense>} />
        <Route path="terrarium/:id" element={<Suspense fallback={<Loading />}><Detail /></Suspense>} />
        <Route path="personalize" element={<Suspense fallback={<Loading />}><Personalize /></Suspense>} />
        <Route
          path="customer-dashboard"
          element={<PrivateRoute allowedRoles={['User', 'Staff', 'Manager', 'Admin']} />}
        >
          <Route
            element={<Suspense fallback={<Loading />}><CustomerLayout /></Suspense>}
          >
            <Route index element={<Suspense fallback={<Loading />}><CustomerDashboard /></Suspense>} />
            <Route path="orders" element={<Suspense fallback={<Loading />}><Orders /></Suspense>} />
            <Route path="notifications" element={<Suspense fallback={<Loading />}><Notifications /></Suspense>} />
            <Route path="favorites" element={<Suspense fallback={<Loading />}><Favorites /></Suspense>} />
            <Route path="wishlist" element={<Suspense fallback={<Loading />}><Wishlist /></Suspense>} />
            <Route path="layouts" element={<Suspense fallback={<Loading />}><SavedLayouts /></Suspense>} />
            <Route path="chat" element={<Suspense fallback={<Loading />}><ChatWithStaff /></Suspense>} />
            <Route path="reviews" element={<Suspense fallback={<Loading />}><MyReviews /></Suspense>} />
            <Route path="edit-profile" element={<Suspense fallback={<Loading />}><EditProfile /></Suspense>} />
            
          </Route>
        </Route>
      </Route>
      <Route path="staff-dashboard" element={<PrivateRoute allowedRoles={['Staff', 'Manager', 'Admin']} />}>
        <Route index element={<Suspense fallback={<Loading />}><StaffDashboard /></Suspense>} />
      </Route>
      <Route path="manager" element={<PrivateRoute allowedRoles={['Manager', 'Admin']} />}>
        <Route element={<Suspense fallback={<Loading />}><ManagerLayout /></Suspense>}>
          <Route path="dashboard" element={<Suspense fallback={<Loading />}><ManagerDashboard /></Suspense>} />
          <Route path="terrarium/list" element={<Suspense fallback={<Loading />}><TerrariumList /></Suspense>} />
          <Route path="terrarium/create" element={<Suspense fallback={<Loading />}><TerrariumCreate /></Suspense>} />
          <Route path="terrarium/edit/:id" element={<Suspense fallback={<Loading />}><TerrariumEdit /></Suspense>} />
           <Route path="accessory/list" element={<Suspense fallback={<Loading />}><AccessoryList /></Suspense>} />
          <Route path="accessory/create" element={<Suspense fallback={<Loading />}><AccessoryCreate /></Suspense>} />
          <Route path="accessory/edit/:id" element={<Suspense fallback={<Loading />}><AccessoryEdit /></Suspense>} />
          <Route path="shape/list" element={<Suspense fallback={<Loading />}><ShapeList /></Suspense>} />
          <Route path="shape/create" element={<Suspense fallback={<Loading />}><ShapeCreate /></Suspense>} />
          <Route path="shape/edit/:id" element={<Suspense fallback={<Loading />}><ShapeEdit /></Suspense>} />
          <Route path="theme/list" element={<Suspense fallback={<Loading />}><ThemeList /></Suspense>} />
          <Route path="theme/create" element={<Suspense fallback={<Loading />}><ThemeCreate /></Suspense>} />
          <Route path="theme/edit/:id" element={<Suspense fallback={<Loading />}><ThemeEdit /></Suspense>} />
          <Route path="tank-method/list" element={<Suspense fallback={<Loading />}><TankMethodList /></Suspense>} />
          <Route path="tank-method/create" element={<Suspense fallback={<Loading />}><TankMethodCreate /></Suspense>} />
          <Route path="tank-method/edit/:id" element={<Suspense fallback={<Loading />}><TankMethodEdit /></Suspense>} />
        </Route>
      </Route>
      <Route path="admin" element={<PrivateRoute allowedRoles={['Admin']} />}>
        <Route element={<Suspense fallback={<Loading />}><AdminLayout /></Suspense>}>
          <Route index element={<Suspense fallback={<Loading />}><AdminDashboard /></Suspense>} />
          <Route path="dashboard" element={<Suspense fallback={<Loading />}><AdminDashboard /></Suspense>} />
          <Route path="shift-management" element={<Suspense fallback={<Loading />}><ShiftManagement /></Suspense>} />
          <Route path="overview" element={<Suspense fallback={<Loading />}><AdminDashboard /></Suspense>} />
          <Route path="accounts/customer" element={<Suspense fallback={<Loading />}><CustomerManagement /></Suspense>} />
          <Route path="accounts/staff" element={<Suspense fallback={<Loading />}><StaffManagement /></Suspense>} />
          <Route path="accounts/manager" element={<Suspense fallback={<Loading />}><ManagerManagement /></Suspense>} />
          <Route path="accounts/shipper" element={<Suspense fallback={<Loading />}><ShipperManagement /></Suspense>} />
          <Route path="orders/all" element={<Suspense fallback={<Loading />}><AllOrders /></Suspense>} />
          <Route path="orders/preparing" element={<Suspense fallback={<Loading />}><PreparingOrders /></Suspense>} />
          <Route path="orders/shipping" element={<Suspense fallback={<Loading />}><ShippingOrders /></Suspense>} />
          <Route path="orders/completed" element={<Suspense fallback={<Loading />}><CompletedOrders /></Suspense>} />
          <Route path="orders/canceled" element={<Suspense fallback={<Loading />}><CanceledOrders /></Suspense>} />
          <Route path="revenue" element={<Suspense fallback={<Loading />}><RevenueReport /></Suspense>} />
          <Route path="statistics" element={<Suspense fallback={<Loading />}><StatisticsReport /></Suspense>} />
          <Route path="settings" element={<Suspense fallback={<Loading />}><AdminDashboard /></Suspense>} />
          <Route path="reports" element={<Suspense fallback={<Loading />}><AdminDashboard /></Suspense>} />
        </Route>
      </Route>
      <Route path="unauthorized" element={<Suspense fallback={<Loading />}><Unauthorized /></Suspense>} />
      <Route path="*" element={<Suspense fallback={<Loading />}><NotFound /></Suspense>} />
      <Route element={<ScrollToTop />} />
    </Routes>
  );
};

export default AppRoutes;