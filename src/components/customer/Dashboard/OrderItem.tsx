// src/components/customer/Profile/OrderItem.tsx
import React from 'react';
import { Button } from 'antd';

interface OrderItemProps {
  name: string;
  price: number;
  image: string;
  date: string;
  status: string;
  onClick?: () => void;
}

const OrderItem: React.FC<OrderItemProps> = ({ name, price, image, date, status }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow mb-4 flex items-center">
      <img src={image} alt={name} className="w-24 h-24 object-cover mr-4" />
      <div className="flex-1">
        <h3 className="text-lg font-semibold">{name}</h3>
        <p className="text-gray-600">Giá: {price.toLocaleString('vi-VN')} VND</p>
        <p className="text-gray-600">Ngày đặt: {date}</p>
        <p className="text-gray-600">Trạng thái: {status}</p>
      </div>
      <div className="space-x-2">
        <Button type="primary" danger>
          Đánh Giá
        </Button>
        <Button type="default">Yêu cầu Trả hàng/Hoàn tiền</Button>
        <Button>Thêm</Button>
      </div>
    </div>
  );
};

export default OrderItem;