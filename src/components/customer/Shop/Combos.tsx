import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Star, ShoppingCart, Eye } from 'lucide-react';

interface ComboItem {
  comboItemId: number;
  terrariumVariantId: number | null;
  accessoryId: number | null;
  productType: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Combo {
  comboId: number;
  comboCategoryId: number;
  categoryName: string;
  name: string;
  description: string;
  imageUrl: string;
  originalPrice: number;
  comboPrice: number;
  discountPercent: number;
  saveAmount: number;
  isActive: boolean;
  isFeatured: boolean;
  stockQuantity: number;
  soldQuantity: number;
  isInStock: boolean;
  items: ComboItem[];
  createdAt: string;
}

interface ApiResponse {
  status: number;
  message: string;
  data: Combo[];
}

const FeaturedCombos: React.FC = () => {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  const itemsPerView = 3;
  const maxIndex = Math.max(0, combos.length - itemsPerView);

  useEffect(() => {
    fetchCombos();
  }, []);

  useEffect(() => {
    if (isAutoPlaying && combos.length > itemsPerView) {
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex(prev => (prev >= maxIndex ? 0 : prev + 1));
      }, 4000);
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying, combos.length, maxIndex]);

  const fetchCombos = async () => {
    try {
      const response = await fetch('https://terarium.shop/api/Combos/featured?take=10');
      const result: ApiResponse = await response.json();
      
      if (result.status === 200) {
        setCombos(result.data);
      }
    } catch (error) {
      console.error('Error fetching combos:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    setIsAutoPlaying(false);
    setCurrentIndex(prev => (prev >= maxIndex ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setIsAutoPlaying(false);
    setCurrentIndex(prev => (prev <= 0 ? maxIndex : prev - 1));
  };

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN') + 'đ';
  };

  const handleMouseEnter = () => {
    setIsAutoPlaying(false);
  };

  const handleMouseLeave = () => {
    setIsAutoPlaying(true);
  };

  if (loading) {
    return (
      <div className="w-full py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="h-8 bg-gray-200 rounded-lg w-64 mx-auto mb-4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mx-auto animate-pulse"></div>
          </div>
          <div className="flex gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex-1 bg-white rounded-2xl shadow-lg p-6">
                <div className="h-48 bg-gray-200 rounded-xl mb-4 animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4 animate-pulse"></div>
                <div className="flex gap-2 mb-4">
                  <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
                  <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
                </div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (combos.length === 0) {
    return (
      <div className="w-full py-12 text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Các Combo Hiện Có</h2>
        <p className="text-gray-600">Hiện tại chưa có combo nào được giới thiệu.</p>
      </div>
    );
  }

  return (
    <div className="w-full py-12 bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold text-gray-800 mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Các Combo Hiện Có
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Khám phá những combo terrarium được tuyển chọn đặc biệt với giá ưu đãi hấp dẫn
          </p>
        </div>

        {/* Slider Container */}
        <div 
          className="relative overflow-hidden"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Navigation Buttons */}
          {combos.length > itemsPerView && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white shadow-lg rounded-full p-3 transition-all duration-200 hover:scale-110"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white shadow-lg rounded-full p-3 transition-all duration-200 hover:scale-110"
              >
                <ChevronRight className="w-6 h-6 text-gray-700" />
              </button>
            </>
          )}

          {/* Combos Grid */}
          <div
            ref={scrollContainerRef}
            className="flex transition-transform duration-500 ease-out gap-6"
            style={{
              transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
              width: `${(combos.length / itemsPerView) * 100}%`
            }}
          >
            {combos.map((combo) => (
              <div
                key={combo.comboId}
                className="flex-shrink-0 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
                style={{ width: `${100 / combos.length * itemsPerView}%` }}
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={combo.imageUrl || '/api/placeholder/400/300'}
                    alt={combo.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/api/placeholder/400/300';
                    }}
                  />
                  
                  {/* Discount Badge */}
                  {combo.discountPercent > 0 && (
                    <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      -{combo.discountPercent}%
                    </div>
                  )}
                  
                  {/* Category Badge */}
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {combo.categoryName}
                  </div>

                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                    <button className="bg-white/90 p-2 rounded-full hover:bg-white transition-colors">
                      <Eye className="w-5 h-5 text-gray-700" />
                    </button>
                    <button className="bg-green-500 p-2 rounded-full hover:bg-green-600 transition-colors">
                      <ShoppingCart className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="text-sm text-gray-500 ml-1">(4.8)</span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-green-600 transition-colors">
                    {combo.name}
                  </h3>
                  
                  <p className="text-gray-600 mb-4 text-sm line-clamp-2">
                    {combo.description}
                  </p>

                  {/* Items Count */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-green-100 px-3 py-1 rounded-full">
                      <span className="text-sm font-medium text-green-800">
                        {combo.items.length} sản phẩm
                      </span>
                    </div>
                    <div className="bg-blue-100 px-3 py-1 rounded-full">
                      <span className="text-sm font-medium text-blue-800">
                        Còn {combo.stockQuantity}
                      </span>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl font-bold text-green-600">
                      {formatPrice(combo.comboPrice)}
                    </span>
                    {combo.originalPrice > combo.comboPrice && (
                      <span className="text-lg text-gray-400 line-through">
                        {formatPrice(combo.originalPrice)}
                      </span>
                    )}
                  </div>

                  {combo.saveAmount > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                      <span className="text-red-600 font-semibold text-sm">
                        🎉 Tiết kiệm {formatPrice(combo.saveAmount)}
                      </span>
                    </div>
                  )}

                  {/* Add to Cart Button */}
                  <button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-3 rounded-xl transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Thêm vào giỏ
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dots Pagination */}
        {combos.length > itemsPerView && (
          <div className="flex justify-center mt-8 gap-2">
            {Array.from({ length: maxIndex + 1 }, (_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  currentIndex === index 
                    ? 'bg-green-500 w-8' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeaturedCombos; 