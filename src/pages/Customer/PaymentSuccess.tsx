// // src/pages/Customer/PaymentSuccess.tsx
// import React, { useEffect, useState } from 'react';
// import { useLocation, useNavigate } from 'react-router-dom';

// const PaymentSuccess: React.FC = () => {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const [params, setParams] = useState<Record<string, string>>({});

//   useEffect(() => {
//     const searchParams = new URLSearchParams(location.search);
//     const data: Record<string, string> = {};
//     searchParams.forEach((value, key) => {
//       data[key] = value;
//     });
//     setParams(data);
//   }, [location.search]);

//   return (
//     <div className="container mx-auto py-12 px-4">
//       <h1 className="text-3xl font-bold text-green-600 mb-6">
//         🎉 Thanh toán thành công!
//       </h1>
//       <p className="mb-4">Cảm ơn bạn đã mua hàng tại TerraTechGarden.</p>

//       <div className="bg-white p-6 rounded-lg shadow-md">
//         <h2 className="text-xl font-semibold mb-4">Thông tin giao dịch</h2>
//         <ul className="space-y-2">
//           <li><strong>Số tiền:</strong> {(Number(params.vnp_Amount) / 100).toLocaleString('vi-VN')} VND</li>
//           <li><strong>Ngân hàng:</strong> {params.vnp_BankCode}</li>
//           <li><strong>Mã giao dịch:</strong> {params.vnp_TransactionNo}</li>
//           <li><strong>Ngày thanh toán:</strong> {params.vnp_PayDate}</li>
//           <li><strong>Trạng thái:</strong> {params.vnp_ResponseCode === '00' ? 'Thành công' : 'Thất bại'}</li>
//         </ul>
//       </div>

//       <button
//         onClick={() => navigate('/order')}
//         className="mt-6 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded"
//       >
//         Xem đơn hàng
//       </button>
//     </div>
//   );
// };

// export default PaymentSuccess;
// src/pages/Customer/PaymentSuccess.tsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
// import { getOrderById } from "@/api/order"; // 👈 Nếu có API này

interface PaymentParams {
  vnp_Amount?: string;
  vnp_BankCode?: string;
  vnp_BankTranNo?: string;
  vnp_CardType?: string;
  vnp_OrderInfo?: string;
  vnp_PayDate?: string;
  vnp_ResponseCode?: string;
  vnp_TmnCode?: string;
  vnp_TransactionNo?: string;
  vnp_TransactionStatus?: string;
  vnp_TxnRef?: string; // Mã đơn hàng
  vnp_SecureHash?: string;
}

const PaymentSuccess: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [params, setParams] = useState<PaymentParams>({});
  const [orderData, setOrderData] = useState<any>(null);

  // ✅ Hàm format ngày từ dạng 20250806102157 → 06/08/2025 10:21:57
  const formatPayDate = (dateStr?: string) => {
    if (!dateStr || dateStr.length !== 14) return dateStr || "";
    const y = dateStr.slice(0, 4);
    const m = dateStr.slice(4, 6);
    const d = dateStr.slice(6, 8);
    const hh = dateStr.slice(8, 10);
    const mm = dateStr.slice(10, 12);
    const ss = dateStr.slice(12, 14);
    return `${d}/${m}/${y} ${hh}:${mm}:${ss}`;
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const data: PaymentParams = {};
    searchParams.forEach((value, key) => {
      (data as any)[key] = value;
    });

    // 🔹 Nếu local dev và không có params → dùng mock data
    if (import.meta.env.DEV && searchParams.size === 0) {
      Object.assign(data, {
        vnp_Amount: "46036600",
        vnp_BankCode: "NCB",
        vnp_BankTranNo: "VNP15118521",
        vnp_CardType: "ATM",
        vnp_OrderInfo: "Thanh toan don hang #15",
        vnp_PayDate: "20250806102157",
        vnp_ResponseCode: "00",
        vnp_TmnCode: "61VOOD5J",
        vnp_TransactionNo: "15118521",
        vnp_TransactionStatus: "00",
        vnp_TxnRef: "15",
      });
    }

    setParams(data);

    // 🔹 Gọi API lấy thông tin đơn hàng (chỉ production hoặc khi có API thật)
    if (data.vnp_TxnRef && import.meta.env.PROD) {
      // getOrderById(Number(data.vnp_TxnRef))
      //   .then((res) => setOrderData(res))
      //   .catch(() => toast.error("Không tìm thấy đơn hàng"));
    }
  }, [location.search]);

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-green-600 mb-6">
        🎉 Thanh toán thành công!
      </h1>
      <p className="mb-4">Cảm ơn bạn đã mua hàng tại TerraTechGarden.</p>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Thông tin giao dịch</h2>
        <ul className="space-y-2">
          <li>
            <strong>Số tiền:</strong>{" "}
            {(Number(params.vnp_Amount || 0) / 100).toLocaleString("vi-VN")} VND
          </li>
          <li>
            <strong>Ngân hàng:</strong> {params.vnp_BankCode}
          </li>
          <li>
            <strong>Mã giao dịch:</strong> {params.vnp_TransactionNo}
          </li>
          <li>
            <strong>Ngày thanh toán:</strong> {formatPayDate(params.vnp_PayDate)}
          </li>
          <li>
            <strong>Trạng thái:</strong>{" "}
            {params.vnp_ResponseCode === "00" ? "Thành công" : "Thất bại"}
          </li>
        </ul>
      </div>

      {/* 🔹 Nếu có API đơn hàng thì hiển thị thêm */}
      {orderData && (
        <div className="bg-white p-6 rounded-lg shadow-md mt-6">
          <h2 className="text-xl font-semibold mb-4">Thông tin đơn hàng</h2>
          <p>Mã đơn: {orderData.id}</p>
          <p>Tổng tiền: {orderData.total.toLocaleString("vi-VN")} VND</p>
          {/* render thêm sản phẩm nếu muốn */}
        </div>
      )}

      <button
        onClick={() => navigate("/order")}
        className="mt-6 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded"
      >
        Xem đơn hàng
      </button>
    </div>
  );
};

export default PaymentSuccess;
