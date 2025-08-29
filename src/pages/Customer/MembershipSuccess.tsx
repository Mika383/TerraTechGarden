import React from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";

const MembershipSuccess: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full text-center">
        <CheckCircle className="mx-auto text-green-500 w-16 h-16 mb-4" />
        <h1 className="text-2xl font-bold text-green-700 mb-2">
          Thanh toán thành công!
        </h1>
        <p className="text-gray-600 mb-6">
          Cảm ơn bạn đã mua gói <b>thành viên</b>. 
          Quyền lợi của bạn sẽ được kích hoạt ngay lập tức.
        </p>

        <button
          onClick={() => navigate("/")}
          className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
        >
          Về trang chủ
        </button>
      </div>
    </div>
  );
};

export default MembershipSuccess;
