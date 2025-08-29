import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Star, ShoppingCart, Eye, Package, TrendingUp, Heart, Sparkles } from 'lucide-react';
import { toast } from 'react-toastify';
import { getFeaturedCombos, handleAddComboToCart, type Combo } from '@/api/combo';

const FeaturedCombos: React.FC = () => {
  const navigate = useNavigate();
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [addingToCart, setAddingToCart] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  const itemsPerView = 3;
  const maxIndex = Math.max(0, combos.length - itemsPerView);

  useEffect(() => {
    fetchCombos();
  }, []);

  // Enhanced auto-scroll with smooth animation
  useEffect(() => {
    if (isAutoPlaying && combos.length > itemsPerView) {
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex(prev => {
          const nextIndex = prev >= maxIndex ? 0 : prev + 1;
          return nextIndex;
        });
      }, 5000); // Slower for better user experience
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying, combos.length, maxIndex]);

  const fetchCombos = async () => {
    try {
      const combosData = await getFeaturedCombos(10);
      setCombos(combosData);
    } catch (error) {
      console.error('Error fetching combos:', error);
      toast.error('Không thể tải danh sách combo');
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    setIsAutoPlaying(false);
    setCurrentIndex(prev => (prev >= maxIndex ? 0 : prev + 1));
    setTimeout(() => setIsAutoPlaying(true), 10000); // Resume auto-play after 10s
  };

  const prevSlide = () => {
    setIsAutoPlaying(false);
    setCurrentIndex(prev => (prev <= 0 ? maxIndex : prev - 1));
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
    setTimeout(() => setIsAutoPlaying(true), 10000);
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

  const handleAddToCart = async (combo: Combo, e: React.MouseEvent) => {
    e.stopPropagation();
    setAddingToCart(combo.comboId);
    
    try {
      const message = await handleAddComboToCart(combo, 1);
      toast.success(message);
    } catch (error) {
      console.error('Error adding combo to cart:', error);
      toast.error(error instanceof Error ? error.message : 'Không thể thêm combo vào giỏ hàng');
    } finally {
      setAddingToCart(null);
    }
  };

  const handleViewDetail = (comboId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/combo/${comboId}`);
  };

  const handleQuickView = (comboId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/combo/${comboId}`);
  };

  if (loading) {
    return (
      <div className="w-full py-16 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <div className="max-w-7xl mx-auto px-4">
          {/* Enhanced Loading Header */}
          <div className="text-center mb-12">
            <div className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl w-80 mx-auto mb-6 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded-lg w-96 mx-auto mb-4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-64 mx-auto animate-pulse"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-3xl shadow-xl p-6 animate-pulse">
                <div className="h-56 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl mb-6"></div>
                <div className="h-6 bg-gray-200 rounded-lg mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="flex gap-2 mb-4">
                  <div className="h-6 bg-gray-200 rounded-full w-24"></div>
                  <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                </div>
                <div className="h-12 bg-gray-200 rounded-xl"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (combos.length === 0) {
    return (
      <div className="w-full py-20 text-center bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-3xl shadow-xl p-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Chưa có combo nào</h2>
            <p className="text-gray-600 text-lg">Hiện tại chưa có combo nào được giới thiệu. Hãy quay lại sau nhé!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-16 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        {/* Enhanced Header */}
        <div className="text-center mb-16 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-green-200/30 via-emerald-200/30 to-teal-200/30 blur-3xl"></div>
          <div className="relative">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sparkles className="w-8 h-8 text-green-600" />
              <h2 className="text-5xl font-extrabold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Combo Đặc Biệt
              </h2>
              <Sparkles className="w-8 h-8 text-teal-600" />
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Khám phá những bộ sưu tập terrarium được tuyển chọn đặc biệt với mức giá ưu đãi không thể bỏ lỡ
            </p>
          </div>
        </div>

        {/* Enhanced Slider Container */}
        <div 
          className="relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Stylized Navigation Buttons */}
          {combos.length > itemsPerView && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-white/95 backdrop-blur-sm hover:bg-white shadow-2xl rounded-full p-4 transition-all duration-300 hover:scale-110 hover:shadow-green-200/50 group"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700 group-hover:text-green-600 transition-colors" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-white/95 backdrop-blur-sm hover:bg-white shadow-2xl rounded-full p-4 transition-all duration-300 hover:scale-110 hover:shadow-green-200/50 group"
              >
                <ChevronRight className="w-6 h-6 text-gray-700 group-hover:text-green-600 transition-colors" />
              </button>
            </>
          )}

          {/* Enhanced Combos Grid */}
          <div className="overflow-hidden rounded-3xl">
            <div
              ref={scrollContainerRef}
              className="flex transition-all duration-700 ease-in-out gap-8 px-4"
              style={{
                transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
                width: `${(combos.length / itemsPerView) * 100}%`
              }}
            >
              {combos.map((combo, index) => (
                <div
                  key={combo.comboId}
                  className="flex-shrink-0 group cursor-pointer"
                  style={{ width: `${100 / combos.length * itemsPerView}%` }}
                  onClick={() => handleViewDetail(combo.comboId, {} as React.MouseEvent)}
                >
                  <div className="bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden transform group-hover:scale-[1.02] group-hover:-translate-y-2">
                    {/* Enhanced Image Container */}
                    <div className="relative h-64 overflow-hidden">
                      {/* Background Gradient */}
                      <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-emerald-600/20"></div>
                      
                      <img
                        src={combo.imageUrl || '/TerraTechLogo.png'}
                        alt={combo.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/TerraTechLogo.png';
                        }}
                      />
                      
                      {/* Enhanced Badges */}
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        {combo.discountPercent > 0 && (
                          <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                            -{combo.discountPercent}%
                          </div>
                        )}
                        {combo.isFeatured && (
                          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            Hot
                          </div>
                        )}
                      </div>
                      
                      <div className="absolute top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                        {combo.categoryName}
                      </div>

                      {/* Enhanced Overlay Actions */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-6">
                        <div className="flex gap-3">
                          <button 
                            onClick={(e) => handleQuickView(combo.comboId, e)}
                            className="bg-white/90 backdrop-blur-sm p-3 rounded-full hover:bg-white transition-all duration-200 transform hover:scale-110 shadow-lg"
                          >
                            <Eye className="w-5 h-5 text-gray-700" />
                          </button>
                          <button 
                            onClick={(e) => handleAddToCart(combo, e)}
                            disabled={addingToCart === combo.comboId || !combo.isInStock}
                            className="bg-gradient-to-r from-green-500 to-emerald-500 p-3 rounded-full hover:from-green-600 hover:to-emerald-600 transition-all duration-200 transform hover:scale-110 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {addingToCart === combo.comboId ? (
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <ShoppingCart className="w-5 h-5 text-white" />
                            )}
                          </button>
                          <button className="bg-white/90 backdrop-blur-sm p-3 rounded-full hover:bg-white transition-all duration-200 transform hover:scale-110 shadow-lg">
                            <Heart className="w-5 h-5 text-gray-700" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Content */}
                    <div className="p-8">
                      {/* Rating */}
                      <div className="flex items-center gap-1 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                        <span className="text-sm text-gray-500 ml-2 font-medium">(0)</span>
                      </div>

                      <h3 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-green-600 transition-colors line-clamp-2">
                        {combo.name}
                      </h3>
                      
                      <p className="text-gray-600 mb-6 text-sm leading-relaxed line-clamp-3">
                        {combo.description}
                      </p>

                      {/* Enhanced Stats */}
                      <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded-xl border border-green-100">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">
                              {combo.items.length} sản phẩm
                            </span>
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-3 rounded-xl border border-blue-100">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">
                              Còn {combo.stockQuantity}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Enhanced Pricing */}
                      <div className="mb-6">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-3xl font-bold text-green-600">
                            {formatPrice(combo.comboPrice)}
                          </span>
                          {combo.originalPrice > combo.comboPrice && (
                            <span className="text-lg text-gray-400 line-through">
                              {formatPrice(combo.originalPrice)}
                            </span>
                          )}
                        </div>

                        {combo.saveAmount > 0 && (
                          <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-4">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-red-600" />
                              <span className="text-red-600 font-bold text-sm">
                                Tiết kiệm {formatPrice(combo.saveAmount)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Enhanced Action Buttons */}
                      <div className="flex gap-3">
                        <button
                          onClick={(e) => handleViewDetail(combo.comboId, e)}
                          className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105 shadow-lg"
                        >
                          <Eye className="w-5 h-5" />
                          Xem chi tiết
                        </button>
                        <button
                          onClick={(e) => handleAddToCart(combo, e)}
                          disabled={addingToCart === combo.comboId || !combo.isInStock}
                          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg disabled:cursor-not-allowed"
                        >
                          {addingToCart === combo.comboId ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <ShoppingCart className="w-5 h-5" />
                          )}
                          {combo.isInStock ? 'Thêm vào giỏ' : 'Hết hàng'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Enhanced Dots Pagination */}
        {combos.length > itemsPerView && (
          <div className="flex justify-center mt-12 gap-3">
            {Array.from({ length: maxIndex + 1 }, (_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 rounded-full ${
                  currentIndex === index 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 w-10 h-3 shadow-lg' 
                    : 'bg-white/60 hover:bg-white w-3 h-3 shadow-md hover:shadow-lg'
                }`}
              />
            ))}
          </div>
        )}

        {/* Progress Bar */}
        {combos.length > itemsPerView && (
          <div className="mt-8 max-w-md mx-auto">
            <div className="h-1 bg-white/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-700 ease-out"
                style={{ width: `${((currentIndex + 1) / (maxIndex + 1)) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeaturedCombos;