// src/pages/admin/StatisticsReport.tsx
import React, { useState, useEffect } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Đăng ký các thành phần của Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

// Custom hook để quản lý API calls với auth
const useAuthenticatedFetch = () => {
  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken') || 
                  localStorage.getItem('accessToken') ||
                  sessionStorage.getItem('token') ||
                  sessionStorage.getItem('accessToken');
    
    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }

    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    const headers = getAuthHeaders();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (response.status === 401) {
      // Clear tokens if unauthorized
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('accessToken');
      throw new Error('Session expired. Please login again.');
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  };

  return { authenticatedFetch };
};

// Interfaces cho API response
interface OrderStatusData {
  status: string;
  count: number;
  percentage: number;
  totalRevenue: number;
  averageOrderValue: number;
}

interface OrdersApiResponse {
  status: number;
  message: string;
  data: {
    totalOrders: number;
    statusBreakdown: OrderStatusData[];
  };
}

interface RevenueApiResponse {
  status: number;
  message: string;
  data: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    totalCustomers: number;
    revenueByMonth: Array<{
      period: string;
      revenue: number;
      orderCount: number;
      date: string;
      averageOrderValue: number;
    }>;
  };
}

// Interface cho top products API response
interface TopProductsApiResponse {
  status: number;
  message: string;
  data: {
    topTerrariums: Array<{
      productId: number;
      productName: string;
      totalQuantitySold: number;
      totalRevenue: number;
      orderCount: number;
    }>;
    topAccessories: Array<{
      productId: number;
      productName: string;
      totalQuantitySold: number;
      totalRevenue: number;
      orderCount: number;
    }>;
    period: string;
  };
}

// Interface cho membership API response
interface MembershipApiResponse {
  status: number;
  message: string;
  data: {
    totalMemberships: number;
    activeMemberships: number;
    expiredMemberships: number;
    cancelledMemberships: number;
    totalRevenue: number;
    currentMonthRevenue: number;
    lastMonthRevenue: number;
    revenueGrowthPercent: number;
    packageSummary: Array<{
      packageId: number;
      packageType: string;
      durationDays: number;
      price: number;
      totalSold: number;
      revenue: number;
      marketSharePercent: number;
    }>;
    last12MonthsStats: Array<{
      month: string;
      newMemberships: number;
      revenue: number;
    }>;
    topUsers: Array<{
      userId: number;
      username: string;
      email: string;
      totalPurchases: number;
      totalSpent: number;
      currentPackage: string;
    }>;
  };
}

// Utility function để format date thành ISO string
const formatDateForAPI = (date: Date): string => {
  return date.toISOString();
};

// Utility function để tạo ngày mặc định (30 ngày trước)
const getDefaultFromDate = (): Date => {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  date.setHours(0, 0, 0, 0); // Đặt về đầu ngày
  return date;
};

const StatisticsReport: React.FC = () => {
  // State cho date range
  const [fromDate, setFromDate] = useState<Date>(getDefaultFromDate());
  const [toDate] = useState<Date>(new Date()); // Luôn là thời điểm hiện tại
  
  // State cho dữ liệu từ API
  const [ordersData, setOrdersData] = useState<OrdersApiResponse['data'] | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueApiResponse['data'] | null>(null);
  const [topProductsData, setTopProductsData] = useState<TopProductsApiResponse['data'] | null>(null);
  const [membershipData, setMembershipData] = useState<MembershipApiResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Sử dụng custom hook cho authenticated fetch
  const { authenticatedFetch } = useAuthenticatedFetch();

  // Function để fetch tất cả dữ liệu
  const fetchAllData = async (from: Date, to: Date) => {
    const fromDateStr = formatDateForAPI(from);
    const toDateStr = formatDateForAPI(to);
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch tất cả API cùng lúc
      const [ordersResponse, revenueResponse, topProductsResponse, membershipResponse] = await Promise.all([
        authenticatedFetch(
          `https://terarium.shop/api/Analytics/orders/status?From=${encodeURIComponent(fromDateStr)}&To=${encodeURIComponent(toDateStr)}`
        ),
        authenticatedFetch(
          `https://terarium.shop/api/Analytics/revenue/overview?From=${encodeURIComponent(fromDateStr)}&To=${encodeURIComponent(toDateStr)}`
        ),
        authenticatedFetch(
          `https://terarium.shop/api/Analytics/products/top-selling?From=${encodeURIComponent(fromDateStr)}&To=${encodeURIComponent(toDateStr)}`
        ),
        authenticatedFetch(
          'https://terarium.shop/api/Analytics/GetMembership'
        )
      ]);

      const [ordersResult, revenueResult, topProductsResult, membershipResult] = await Promise.all([
        ordersResponse.json() as Promise<OrdersApiResponse>,
        revenueResponse.json() as Promise<RevenueApiResponse>,
        topProductsResponse.json() as Promise<TopProductsApiResponse>,
        membershipResponse.json() as Promise<MembershipApiResponse>
      ]);

      // Kiểm tra API response status
      if (ordersResult.status !== 200) {
        throw new Error(`Orders API Error: ${ordersResult.message}`);
      }
      
      if (revenueResult.status !== 200) {
        throw new Error(`Revenue API Error: ${revenueResult.message}`);
      }

      if (topProductsResult.status !== 200) {
        throw new Error(`Top Products API Error: ${topProductsResult.message}`);
      }

      if (membershipResult.status !== 200) {
        throw new Error(`Membership API Error: ${membershipResult.message}`);
      }

      setOrdersData(ordersResult.data);
      setRevenueData(revenueResult.data);
      setTopProductsData(topProductsResult.data);
      setMembershipData(membershipResult.data);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      
      // Handle authentication errors
      if (errorMessage.includes('login') || errorMessage.includes('Session expired')) {
        console.warn('Authentication required. Redirecting to login...');
        // window.location.href = '/login';
        // or using React Router: navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData(fromDate, toDate);
  }, [fromDate]);

  // Handle date change
  const handleFromDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFromDate = new Date(event.target.value);
    setFromDate(newFromDate);
  };

  // Refresh data function
  const handleRefresh = () => {
    setError(null);
    fetchAllData(fromDate, new Date()); // Luôn sử dụng thời điểm hiện tại làm toDate
  };

  // Tính toán dữ liệu cho biểu đồ tỷ lệ đơn hàng
  const getOrderRateData = () => {
    if (!ordersData) return null;

    const completedOrders = ordersData.statusBreakdown.find(s => s.status === 'Completed')?.count || 0;
    const canceledOrders = ordersData.statusBreakdown.find(s => s.status === 'Cancle')?.count || 0;
    const failedOrders = ordersData.statusBreakdown.find(s => s.status === 'Failed')?.count || 0;
    
    const totalProcessedOrders = completedOrders + canceledOrders + failedOrders;
    const successRate = totalProcessedOrders > 0 ? (completedOrders / totalProcessedOrders) * 100 : 0;
    const canceledRate = totalProcessedOrders > 0 ? ((canceledOrders + failedOrders) / totalProcessedOrders) * 100 : 0;
    const otherRate = 100 - successRate - canceledRate;

    return {
      labels: ['Tỷ lệ hủy đơn', 'Tỷ lệ đơn thành công', 'Tỷ lệ khác'],
      datasets: [
        {
          data: [canceledRate, successRate, otherRate],
          backgroundColor: ['rgba(255, 99, 132, 0.6)', 'rgba(75, 192, 192, 0.6)', 'rgba(201, 203, 207, 0.6)'],
          borderColor: ['rgba(255, 99, 132, 1)', 'rgba(75, 192, 192, 1)', 'rgba(201, 203, 207, 1)'],
          borderWidth: 1,
        },
      ],
    };
  };

  // Dữ liệu cho biểu đồ đăng ký thành viên
  const getMembershipChartData = () => {
    if (!membershipData) return null;
    
    return {
      labels: membershipData.last12MonthsStats.map((item) => {
        const date = new Date(item.month + '-01');
        return date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
      }),
      datasets: [
        {
          label: 'Số lượng đăng ký membership',
          data: membershipData.last12MonthsStats.map((item) => item.newMemberships),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  // Function để lấy top sản phẩm theo từng loại
  const getTopProducts = () => {
    if (!topProductsData) return null;

    const topTerrariumBySales = topProductsData.topTerrariums.reduce((prev, current) => 
      prev.totalQuantitySold > current.totalQuantitySold ? prev : current
    );

    const topTerrariumByRevenue = topProductsData.topTerrariums.reduce((prev, current) => 
      prev.totalRevenue > current.totalRevenue ? prev : current
    );

    const topAccessoryBySales = topProductsData.topAccessories.reduce((prev, current) => 
      prev.totalQuantitySold > current.totalQuantitySold ? prev : current
    );

    const topAccessoryByRevenue = topProductsData.topAccessories.reduce((prev, current) => 
      prev.totalRevenue > current.totalRevenue ? prev : current
    );

    return {
      topSellingTerrarium: topTerrariumBySales,
      topRevenueTerrarium: topTerrariumByRevenue,
      topSellingAccessory: topAccessoryBySales,
      topRevenueAccessory: topAccessoryByRevenue
    };
  };

  // Format date cho input
  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-gray-800">Báo Cáo & Thống Kê</h1>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Đang tải dữ liệu...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-gray-800">Báo Cáo & Thống Kê</h1>
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <div className="text-lg text-red-600">Lỗi: {error}</div>
          <button 
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const orderRateData = getOrderRateData();
  const membershipChartData = getMembershipChartData();
  const topProducts = getTopProducts();

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Báo Cáo & Thống Kê</h1>
        <button 
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Làm mới</span>
        </button>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Chọn khoảng thời gian</h2>
        <div className="flex items-center space-x-4">
          <div>
            <label htmlFor="fromDate" className="block text-sm font-medium text-gray-700 mb-2">
              Từ ngày:
            </label>
            <input
              type="date"
              id="fromDate"
              value={formatDateForInput(fromDate)}
              onChange={handleFromDateChange}
              max={formatDateForInput(new Date())}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="toDate" className="block text-sm font-medium text-gray-700 mb-2">
              Đến ngày:
            </label>
            <input
              type="text"
              id="toDate"
              value={`${formatDateForInput(toDate)} (Hiện tại)`}
              disabled
              className="px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
            />
          </div>
          <div className="pt-6">
            <button
              onClick={() => setFromDate(getDefaultFromDate())}
              className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              30 ngày gần đây
            </button>
          </div>
        </div>
      </div>

      {/* Tổng quan - Sử dụng dữ liệu từ API */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-lg font-semibold text-gray-700">Tổng số đơn</h2>
          <p className="text-2xl font-bold text-blue-600">
            {ordersData?.totalOrders.toLocaleString('vi-VN') || 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-lg font-semibold text-gray-700">Tổng doanh thu</h2>
          <p className="text-2xl font-bold text-green-600">
            {revenueData?.totalRevenue.toLocaleString('vi-VN') || 0} VND
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-lg font-semibold text-gray-700">Giá trị đơn hàng trung bình</h2>
          <p className="text-2xl font-bold text-blue-600">
            {Math.round(revenueData?.averageOrderValue || 0).toLocaleString('vi-VN')} VND
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-lg font-semibold text-gray-700">Tổng số khách hàng</h2>
          <p className="text-2xl font-bold text-purple-600">
            {revenueData?.totalCustomers.toLocaleString('vi-VN') || 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-lg font-semibold text-gray-700">Đơn hàng đang chờ</h2>
          <p className="text-2xl font-bold text-orange-600">
            {ordersData?.statusBreakdown.find(s => s.status === 'Pending')?.count.toLocaleString('vi-VN') || 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-lg font-semibold text-gray-700">Đơn hàng hoàn thành</h2>
          <p className="text-2xl font-bold text-green-600">
            {ordersData?.statusBreakdown.find(s => s.status === 'Completed')?.count.toLocaleString('vi-VN') || 0}
          </p>
        </div>
      </div>

      {/* Chi tiết trạng thái đơn hàng */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Chi tiết trạng thái đơn hàng</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {ordersData?.statusBreakdown.map((status, index) => (
            <div key={index} className="border rounded-lg p-4">
              <h3 className="font-medium text-gray-700">{status.status}</h3>
              <p className="text-2xl font-bold text-blue-600">{status.count}</p>
              <p className="text-sm text-gray-500">{status.percentage.toFixed(2)}%</p>
              <p className="text-sm text-gray-600">
                Doanh thu: {status.totalRevenue.toLocaleString('vi-VN')} VND
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Thống kê Membership */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Thống kê Membership</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-gray-700">Tổng số Membership</h3>
            <p className="text-2xl font-bold text-blue-600">{membershipData?.totalMemberships || 0}</p>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-gray-700">Membership đang hoạt động</h3>
            <p className="text-2xl font-bold text-green-600">{membershipData?.activeMemberships || 0}</p>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-gray-700">Doanh thu tháng này</h3>
            <p className="text-2xl font-bold text-purple-600">
              {membershipData?.currentMonthRevenue.toLocaleString('vi-VN') || 0} VND
            </p>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-gray-700">Tỷ lệ tăng trưởng</h3>
            <p className={`text-2xl font-bold ${(membershipData?.revenueGrowthPercent || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {membershipData?.revenueGrowthPercent.toFixed(1) || 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Sản phẩm nổi bật - Dữ liệu thực từ API */}
      {topProducts && (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Sản phẩm nổi bật</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Terrariums */}
            <div>
              <h3 className="text-lg font-medium text-gray-600 mb-3">Terrarium nổi bật</h3>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-blue-600">Bán chạy nhất</h4>
                  <p className="text-lg font-bold">{topProducts.topSellingTerrarium.productName}</p>
                  <div className="flex justify-between text-sm text-gray-600 mt-2">
                    <span>Đã bán: {topProducts.topSellingTerrarium.totalQuantitySold}</span>
                    <span>Doanh thu: {topProducts.topSellingTerrarium.totalRevenue.toLocaleString('vi-VN')} VND</span>
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-green-600">Doanh thu cao nhất</h4>
                  <p className="text-lg font-bold">{topProducts.topRevenueTerrarium.productName}</p>
                  <div className="flex justify-between text-sm text-gray-600 mt-2">
                    <span>Đã bán: {topProducts.topRevenueTerrarium.totalQuantitySold}</span>
                    <span>Doanh thu: {topProducts.topRevenueTerrarium.totalRevenue.toLocaleString('vi-VN')} VND</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Top Accessories */}
            <div>
              <h3 className="text-lg font-medium text-gray-600 mb-3">Phụ kiện nổi bật</h3>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-blue-600">Bán chạy nhất</h4>
                  <p className="text-lg font-bold">{topProducts.topSellingAccessory.productName}</p>
                  <div className="flex justify-between text-sm text-gray-600 mt-2">
                    <span>Đã bán: {topProducts.topSellingAccessory.totalQuantitySold}</span>
                    <span>Doanh thu: {topProducts.topSellingAccessory.totalRevenue.toLocaleString('vi-VN')} VND</span>
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-green-600">Doanh thu cao nhất</h4>
                  <p className="text-lg font-bold">{topProducts.topRevenueAccessory.productName}</p>
                  <div className="flex justify-between text-sm text-gray-600 mt-2">
                    <span>Đã bán: {topProducts.topRevenueAccessory.totalQuantitySold}</span>
                    <span>Doanh thu: {topProducts.topRevenueAccessory.totalRevenue.toLocaleString('vi-VN')} VND</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Biểu đồ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {orderRateData && (
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Tỷ lệ đơn hàng</h2>
            <Pie
              data={orderRateData}
              options={{
                responsive: true,
                plugins: { 
                  legend: { position: 'top' }, 
                  title: { display: true, text: 'Tỷ lệ đơn hàng' } 
                },
              }}
            />
          </div>
        )}
        {membershipChartData && (
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Đăng ký Membership 12 tháng gần đây</h2>
            <Bar
              data={membershipChartData}
              options={{
                responsive: true,
                plugins: { 
                  legend: { position: 'top' }, 
                  title: { display: true, text: 'Membership mới theo tháng' } 
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1
                    }
                  }
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Top Users và Package Summary */}
      {membershipData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Package Summary */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Thống kê gói Membership</h2>
            <div className="space-y-4">
              {membershipData.packageSummary.map((pkg, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-700">{pkg.packageType}</h3>
                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {pkg.durationDays} ngày
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Giá:</span>
                      <p className="font-semibold">{pkg.price.toLocaleString('vi-VN')} VND</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Đã bán:</span>
                      <p className="font-semibold">{pkg.totalSold}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Doanh thu:</span>
                      <p className="font-semibold text-green-600">{pkg.revenue.toLocaleString('vi-VN')} VND</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Thị phần:</span>
                      <p className="font-semibold text-blue-600">{pkg.marketSharePercent.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Users */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Top khách hàng Membership</h2>
            <div className="space-y-3">
              {membershipData.topUsers.slice(0, 6).map((user, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-700">{user.username}</h3>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      {user.currentPackage}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-600">{user.totalPurchases} lần mua</span>
                    <span className="font-semibold text-purple-600">
                      {user.totalSpent.toLocaleString('vi-VN')} VND
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatisticsReport;