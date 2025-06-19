
const Unauthorized = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Không có quyền truy cập</h1>
        <p className="text-gray-600 mb-4">Bạn không có quyền truy cập vào trang này. Vui lòng liên hệ quản trị viên nếu cần hỗ trợ.</p>
        <a href="/login" className="text-blue-500 hover:underline">Quay lại trang đăng nhập</a>
      </div>
    </div>
  );
};

export default Unauthorized;