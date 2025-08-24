import React, { useEffect, useState } from 'react';
import { Button, Rate, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';

// Ant Design Icons
import {
  SearchOutlined,
  StarFilled,
  HeartFilled,
  ExperimentOutlined,
  EnvironmentOutlined,
  BgColorsOutlined,
  SmileOutlined
} from '@ant-design/icons';

// ❤️ Favorite button dùng chung
import FavoriteButton from '@/components/common/FavoriteButton';

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

  /** 👇 Thêm prop mới để hiển thị nhãn như “Mở hoàn toàn” */
  tankMethodLabel?: string;
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
  environmentName,
  isNew = false,
  tankMethodLabel,            // 👈 nhận prop mới
}) => {
  const navigate = useNavigate();

  const fallbackSrc = '/TerraTechLogo.png';
  const [imgSrc, setImgSrc] = useState(image);

  useEffect(() => setImgSrc(image), [image]);

  return (
    <div className="relative group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-green-50 overflow-hidden h-full flex flex-col">
      {/* Image section */}
      <div className="relative h-48 bg-gradient-to-br from-green-50 to-emerald-50 overflow-hidden">
        <img
          src={imgSrc}
          alt={name}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
          onError={(e) => {
            const el = e.currentTarget as HTMLImageElement;
            if (!el.src.includes(fallbackSrc)) {
              el.src = fallbackSrc;
              setImgSrc(fallbackSrc);
            }
          }}
        />

        {/* ❤️ Favorite (GÓC TRÁI TRÊN) */}
        <FavoriteButton
          type="terrarium"
          productId={Number(id)}
          className="!absolute top-2 left-2 sm:top-3 sm:left-3 text-lg sm:text-xl z-10"
        />

        {/* Badge Mới */}
        {isNew && (
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
            <Tag color="green" className="border-none font-semibold flex items-center gap-1">
              <StarFilled /> Mới
            </Tag>
          </div>
        )}

        {/* Nhãn môi trường / loại */}
        <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
          <EnvironmentOutlined className="text-emerald-700" />
          <span className="text-xs font-medium text-emerald-700">
            {environmentName || 'Terrarium'}
          </span>
        </div>

        {/* Accent icon (trang trí) */}
        <div className="absolute bottom-2 left-2 text-white/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <ExperimentOutlined className="text-2xl drop-shadow" />
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-2 min-h-[3.25rem]">
          {name}
        </h3>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2 leading-relaxed min-h-[2.5rem]">
          {description || 'Một khu vườn mini tuyệt đẹp trong lọ thủy tinh, hoàn hảo để trang trí không gian sống.'}
        </p>

        {/* Type + Tank method tags */}
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium">
            {type}
          </span>
          {tankMethodLabel && (
            <span className="bg-green-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium border border-emerald-100">
              {tankMethodLabel}
            </span>
          )}
        </div>

        {/* Price & purchases */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-emerald-600 font-bold text-xl">
            {price.toLocaleString('vi-VN')} ₫
          </div>
          <span className="text-gray-500 text-xs bg-gray-50 px-2 py-1 rounded-full flex items-center gap-1">
            <HeartFilled className="text-emerald-500" />
            {purchases} đã bán
          </span>
        </div>

        {/* Rating */}
        <div className="flex items-center justify-between mb-4">
          <Rate allowHalf disabled value={Number(rating)} className="text-sm" />
          <span className="text-xs text-gray-500 ml-2">({Number(rating).toFixed(1)}/5)</span>
        </div>

        {/* Actions */}
        <div className="mt-auto space-y-2">
          <Button
            type="primary"
            className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 border-none font-medium group-hover:shadow-lg transition-all"
            icon={<SearchOutlined />}
            onClick={() => navigate(`/terrarium/${id}`)}
          >
            Xem Chi Tiết
          </Button>

          {/* Quick info */}
          <div className="flex justify-center gap-4 text-xs text-gray-500 pt-1">
            <span className="flex items-center gap-1">
              <BgColorsOutlined /> Dễ chăm sóc
            </span>
            <span className="flex items-center gap-1">
              <SmileOutlined /> Thân thiện
            </span>
          </div>
        </div>
      </div>

      {/* Hover border decoration */}
      <div className="pointer-events-none absolute inset-0 border-2 border-emerald-200 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
};

export default TerrariumCard;
