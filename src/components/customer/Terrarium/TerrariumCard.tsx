import React from 'react';
import { Button, Rate, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';

interface TerrariumCardProps {
  id: string;
  name: string;
  description: string;
  type: string;
  price: number;
  rating: number;
  purchases: number;
  image: string;
  environmentName?: string;
  isNew?: boolean;
}

const TerrariumCard: React.FC<TerrariumCardProps> = ({
  id,
  name,
  description,
  type,
  price,
  rating,
  purchases,
  image,
  isNew = false
}) => {
  const navigate = useNavigate();

  return (
    <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-green-50 overflow-hidden">
      {/* Image section with terrarium styling */}
      <div className="relative h-48 bg-gradient-to-br from-green-50 to-emerald-50 overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/assets/image/1.jpg';
          }}
        />
        
        {/* Overlay with terrarium icon */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-3 left-3 text-white/90">
            <span className="text-2xl">🏺</span>
          </div>
        </div>
        
        {/* New badge */}
        {isNew && (
          <div className="absolute top-3 left-3">
            <Tag color="green" className="border-none font-semibold">
              🌟 Mới
            </Tag>
          </div>
        )}
        
        {/* Category badge */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
          <span className="text-xs font-medium text-emerald-700">🌿 Terrarium</span>
        </div>
      </div>

      {/* Content section */}
      <div className="p-5">
        {/* Title */}
        <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-2 group-hover:text-emerald-700 transition-colors">
          {name}
        </h3>
        
        {/* Description */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-2 leading-relaxed">
          {description || 'Một khu vườn mini tuyệt đẹp trong lọ thủy tinh, hoàn hảo để trang trí không gian sống.'}
        </p>
        
        {/* Type tag */}
        <div className="mb-3">
          <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium">
            {type}
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-emerald-600 font-bold text-xl">
            {price.toLocaleString('vi-VN')} ₫
          </div>
          <div className="text-gray-500 text-xs bg-gray-50 px-2 py-1 rounded-full">
            💚 {purchases} lượt mua
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center justify-between mb-4">
          <Rate 
            allowHalf 
            disabled 
            value={rating} 
            className="text-sm"
          />
          <span className="text-xs text-gray-500 ml-2">
            ({rating}/5)
          </span>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <Button
            type="primary"
            className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 border-none font-medium group-hover:shadow-lg transition-all"
            onClick={() => navigate(`/terrarium/${id}`)}
          >
            🔍 Xem Chi Tiết
          </Button>
          
          {/* Quick info */}
          <div className="flex justify-center space-x-4 text-xs text-gray-500 pt-2">
            <div className="flex items-center">
              <span className="mr-1">💧</span>
              Dễ chăm sóc
            </div>
            <div className="flex items-center">
              <span className="mr-1">🌱</span>
              Thân thiện
            </div>
          </div>
        </div>
      </div>

      {/* Hover effect decoration */}
      <div className="absolute inset-0 border-2 border-emerald-200 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  );
};

export default TerrariumCard;