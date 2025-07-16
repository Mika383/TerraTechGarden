// src/components/customer/Terrarium/TerrariumDetail.tsx
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import miniForest from '../../../assets/image/1.jpg';
interface TerrariumDetailProps {
  id: string;
  name: string;
  description: string;
  type: string;
  price: number;
  rating: number;
  purchases: number;
  image: string;
}

const TerrariumDetail: React.FC<TerrariumDetailProps> = ({
  id,
  name,
  description,
  type,
  price,
  rating,
  purchases,
  image,
}) => {
  const [backgroundPosition, setBackgroundPosition] = useState('center center');
  const [isZooming, setIsZooming] = useState(false);

  const handleAddToCart = () => {
    const cartItem = { id, name, price, image, quantity: 1, selected: false };
    const storedCart = JSON.parse(localStorage.getItem('cartItems') || '[]');
    const existingItemIndex = storedCart.findIndex((item: any) => item.id === id);
    if (existingItemIndex > -1) {
      storedCart[existingItemIndex].quantity += 1;
      toast.success(`${name} đã được tăng số lượng trong giỏ hàng!`, {
        position: 'top-right',
        autoClose: 2000,
      });
    } else {
      storedCart.push(cartItem);
      toast.success(`${name} đã được thêm vào giỏ hàng!`, {
        position: 'top-right',
        autoClose: 2000,
      });
    }
    localStorage.setItem('cartItems', JSON.stringify(storedCart));
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= rating ? 'text-yellow-400' : 'text-gray-300'}>
          ★
        </span>
      );
    }
    return stars;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setBackgroundPosition(`${x}% ${y}%`);
    setIsZooming(true);
  };

  const handleMouseLeave = () => {
    setBackgroundPosition('center center');
    setIsZooming(false);
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl mb-8 transform transition-all duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-center">
        <div className="relative overflow-hidden">
          <div
            className="w-full h-80 sm:h-96 rounded-xl border-2 border-gray-200 shadow-md transition-transform duration-300"
            style={{
              backgroundImage: `url(${image})`,
              backgroundSize: isZooming ? '200%' : 'cover', // Zoom 2x khi di chuột
              backgroundPosition: backgroundPosition,
              backgroundRepeat: 'no-repeat',
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onError={(e) => {
              e.currentTarget.style.backgroundImage = miniForest; // Placeholder nếu ảnh lỗi
            }}
          />
        </div>
        <div className="space-y-4 sm:space-y-6">
          <h2 className="text-2xl sm:text-4xl font-bold text-gray-800">{name}</h2>
          <p className="text-xl sm:text-2xl font-semibold text-green-600">
            {price.toLocaleString('vi-VN')} VND
          </p>
          <p className="text-gray-600 text-base sm:text-lg">
            Loại: <span className="font-medium">{type}</span>
          </p>
          <p className="text-gray-700 text-sm sm:text-base leading-relaxed">{description}</p>
          <div className="flex items-center space-x-2">
            <span className="text-gray-700 font-medium">Đánh giá:</span>
            <div className="flex">{renderStars(rating)}</div>
          </div>
          <p className="text-gray-600 text-sm sm:text-base">
            Số lượt mua: <span className="font-medium">{purchases}</span>
          </p>
          <button
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-md hover:shadow-lg"
            onClick={handleAddToCart}
          >
            Thêm vào giỏ
          </button>
        </div>
      </div>
    </div>
  );
};

export default TerrariumDetail;