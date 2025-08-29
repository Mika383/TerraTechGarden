import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Star, ShoppingCart, Package, Eye, Tag, Clock, TrendingUp, Heart, Sparkles } from 'lucide-react';
import { Button, Spin } from 'antd';
import { toast } from 'react-toastify';
import { getAccessoryById } from '@/api/accessory';
import { getTerrariumById, getTerrariumVariantById } from '@/api/terrarium';
import { getComboById, handleAddComboToCart, type Combo, type ComboItem } from '@/api/combo';

interface ItemDetail {
  id: number;
  name: string;
  description: string;
  image: string;
  price: number;
  type: 'terrarium' | 'accessory';
  category?: string;
  quantity: number;
  stockQuantity?: number;
}

const ComboDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [combo, setCombo] = useState<Combo | null>(null);
  const [itemDetails, setItemDetails] = useState<ItemDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [quantity, setQuantity] = useState<number>(1);

  useEffect(() => {
    if (id) {
      fetchComboDetail();
    }
  }, [id]);

  const fetchComboDetail = async () => {
    try {
      setLoading(true);
      
      const comboId = parseInt(id!);
      const comboData = await getComboById(comboId);
      
      setCombo(comboData);
      await fetchItemDetails(comboData.items);
    } catch (error) {
      console.error('Error fetching combo:', error);
      toast.error('Không thể tải thông tin combo');
      navigate('/combos');
    } finally {
      setLoading(false);
    }
  };

  const fetchItemDetails = async (items: ComboItem[]) => {
    const details: ItemDetail[] = [];
    
    for (const item of items) {
      try {
        if (item.accessoryId) {
          // Fetch accessory details using existing API
          const accessory = await getAccessoryById(item.accessoryId);
          if (accessory) {
            details.push({
              id: item.accessoryId,
              name: accessory.name,
              description: accessory.description,
              image: accessory.accessoryImages?.[0]?.imageUrl || '/TerraTechLogo.png',
              price: item.unitPrice,
              type: 'accessory',
              quantity: item.quantity,
              stockQuantity: accessory.stockQuantity
            });
          }
        } else if (item.terrariumVariantId) {
          // Fetch terrarium variant details using existing API
          const variant = await getTerrariumVariantById(item.terrariumVariantId);
          if (variant) {
            // Also fetch main terrarium info
            const terrarium = await getTerrariumById(variant.terrariumId);
            details.push({
              id: variant.terrariumId,
              name: terrarium?.terrariumName || variant.variantName || 'Terrarium',
              description: terrarium?.description || 'Terrarium variant',
              image: variant.urlImage || terrarium?.terrariumImages?.[0]?.imageUrl || '/TerraTechLogo.png',
              price: item.unitPrice,
              type: 'terrarium',
              quantity: item.quantity,
              stockQuantity: variant.stockQuantity
            });
          }
        }
      } catch (error) {
        console.error('Error fetching item details:', error);
        // Add a fallback item if API fails
        details.push({
          id: item.accessoryId || item.terrariumVariantId || 0,
          name: 'Sản phẩm',
          description: 'Thông tin sản phẩm',
          image: '/TerraTechLogo.png',
          price: item.unitPrice,
          type: item.accessoryId ? 'accessory' : 'terrarium',
          quantity: item.quantity
        });
      }
    }
    
    setItemDetails(details);
  };

  const handleAddToCart = async () => {
    if (!combo) return;

    setAddingToCart(true);
    try {
      const message = await handleAddComboToCart(combo, quantity);
      toast.success(message);
    } catch (error) {
      console.error('Error adding combo to cart:', error);
      toast.error(error instanceof Error ? error.message : 'Không thể thêm combo vào giỏ hàng');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleViewItemDetail = (item: ItemDetail) => {
    if (item.type === 'terrarium') {
      navigate(`/terrarium/${item.id}`);
    } else if (item.type === 'accessory') {
      navigate(`/accessory/${item.id}`);
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN') + 'đ';
  };

  const increaseQuantity = () => {
    if (combo && quantity < combo.stockQuantity) {
      setQuantity(prev => prev + 1);
    }
  };
  
  const decreaseQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="text-center">
          <div className="relative">
            <Spin size="large" />
            <div className="mt-6">
              <h3 className="text-xl font-semibold text-gray-700">Đang tải thông tin combo...</h3>
              <p className="text-gray-500 mt-2">Vui lòng chờ trong giây lát</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!combo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="text-center bg-white rounded-3xl shadow-xl p-12 max-w-md mx-4">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Không tìm thấy combo</h2>
          <p className="text-gray-600 mb-6">Combo bạn tìm kiếm có thể đã không còn tồn tại hoặc đã bị xóa.</p>
          <Button onClick={() => navigate(-1)} type="primary" size="large">
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-8 text-gray-600 hover:text-gray-800 transition-all duration-200 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-md hover:shadow-lg"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-medium">Quay lại</span>
        </button>

        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-white/20">
          {/* Header Section with Gradient Background */}
          <div className="relative bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 p-8">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* Image Section */}
              <div className="relative">
                <div className="aspect-square rounded-2xl overflow-hidden bg-white/20 backdrop-blur-sm shadow-2xl border border-white/30">
                  <img
                    src={combo.imageUrl || '/TerraTechLogo.png'}
                    alt={combo.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/TerraTechLogo.png';
                    }}
                  />
                </div>
                
                {/* Floating Badges */}
                {combo.discountPercent > 0 && (
                  <div className="absolute -top-2 -left-2 bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-2xl text-sm font-bold shadow-xl transform rotate-12">
                    -{combo.discountPercent}%
                  </div>
                )}
                {combo.isFeatured && (
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-2xl text-sm font-bold shadow-xl flex items-center gap-1 transform -rotate-12">
                    <Sparkles className="w-3 h-3" />
                    Nổi bật
                  </div>
                )}
              </div>

              {/* Info Section */}
              <div className="text-white space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-white/80 mb-3">
                    <Tag className="w-4 h-4" />
                    <span className="text-lg font-medium">{combo.categoryName}</span>
                  </div>
                  <h1 className="text-4xl font-extrabold mb-4 leading-tight">{combo.name}</h1>
                  <p className="text-white/90 text-lg leading-relaxed">{combo.description}</p>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-300 text-yellow-300" />
                    ))}
                  </div>
                  <span className="text-white/90 text-lg font-medium">(4.8 • 127 đánh giá)</span>
                </div>

                {/* Pricing */}
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl font-bold text-white">
                      {formatPrice(combo.comboPrice)}
                    </span>
                    {combo.originalPrice > combo.comboPrice && (
                      <span className="text-2xl text-white/60 line-through">
                        {formatPrice(combo.originalPrice)}
                      </span>
                    )}
                  </div>
                  
                  {combo.saveAmount > 0 && (
                    <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl p-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-yellow-300" />
                        <span className="text-white font-bold text-lg">
                          Tiết kiệm {formatPrice(combo.saveAmount)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="bg-white px-8 py-6 border-b border-gray-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-100">
                <Package className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <div className="text-sm text-green-600 font-medium">Tồn kho</div>
                <div className="text-2xl font-bold text-green-700">{combo.stockQuantity}</div>
              </div>
              <div className="text-center bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 border border-blue-100">
                <TrendingUp className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <div className="text-sm text-blue-600 font-medium">Đã bán</div>
                <div className="text-2xl font-bold text-blue-700">{combo.soldQuantity}</div>
              </div>
              <div className="text-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-100">
                <Eye className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <div className="text-sm text-purple-600 font-medium">Sản phẩm</div>
                <div className="text-2xl font-bold text-purple-700">{combo.items.length}</div>
              </div>
              <div className="text-center bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-4 border border-orange-100">
                <Clock className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                <div className="text-sm text-orange-600 font-medium">Ngày tạo</div>
                <div className="text-sm font-bold text-orange-700">
                  {new Date(combo.createdAt).toLocaleDateString('vi-VN')}
                </div>
              </div>
            </div>
          </div>

          {/* Quantity and Cart Section */}
          <div className="bg-white px-8 py-6 border-b border-gray-100">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              {/* Quantity Selector */}
              <div className="flex items-center gap-4">
                <span className="font-semibold text-gray-800 text-lg">Số lượng:</span>
                <div className="flex border-2 border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                  <button
                    onClick={decreaseQuantity}
                    className="px-4 py-3 bg-white hover:bg-gray-100 transition-colors font-bold text-lg"
                  >
                    −
                  </button>
                  <span className="px-6 py-3 border-x-2 border-gray-200 bg-white font-bold text-lg min-w-[60px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={increaseQuantity}
                    className="px-4 py-3 bg-white hover:bg-gray-100 transition-colors font-bold text-lg"
                  >
                    +
                  </button>
                </div>
                <span className="text-gray-500">
                  (Tối đa: {combo.stockQuantity})
                </span>
              </div>

              {/* Add to Cart Button */}
              <Button
                type="primary"
                size="large"
                icon={<ShoppingCart className="w-5 h-5" />}
                onClick={handleAddToCart}
                loading={addingToCart}
                disabled={!combo.isInStock || quantity > combo.stockQuantity}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 border-none h-14 px-8 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {combo.isInStock ? `Thêm vào giỏ hàng • ${formatPrice(combo.comboPrice * quantity)}` : 'Hết hàng'}
              </Button>
            </div>
          </div>

          {/* Items Section */}
          <div className="bg-white p-8">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Package className="w-8 h-8 text-green-600" />
                <h2 className="text-3xl font-bold text-gray-800">
                  Sản phẩm trong combo
                </h2>
              </div>
              <p className="text-gray-600 text-lg">
                Combo này bao gồm {combo.items.length} sản phẩm với tổng giá trị {formatPrice(combo.originalPrice)}
              </p>
            </div>

            {itemDetails.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {itemDetails.map((item, index) => (
                  <div
                    key={`${item.type}-${item.id}-${index}`}
                    className="group bg-gradient-to-br from-white to-gray-50 border-2 border-gray-100 rounded-2xl overflow-hidden hover:shadow-2xl hover:border-green-200 transition-all duration-300 transform hover:scale-105"
                  >
                    {/* Item Image */}
                    <div className="relative h-48 overflow-hidden bg-gray-100">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/TerraTechLogo.png';
                        }}
                      />
                      
                      {/* Quantity Badge */}
                      <div className="absolute top-3 left-3 bg-black/80 text-white px-3 py-1 rounded-full text-sm font-bold">
                        x{item.quantity}
                      </div>

                      {/* Type Badge */}
                      <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-sm font-semibold ${
                        item.type === 'terrarium' 
                          ? 'bg-gradient-to-r from-green-400 to-emerald-400 text-white' 
                          : 'bg-gradient-to-r from-blue-400 to-cyan-400 text-white'
                      }`}>
                        {item.type === 'terrarium' ? 'Terrarium' : 'Phụ kiện'}
                      </div>
                    </div>
                    
                    {/* Item Content */}
                    <div className="p-6 space-y-4">
                      <h3 className="font-bold text-gray-800 text-lg line-clamp-2 group-hover:text-green-600 transition-colors">
                        {item.name}
                      </h3>
                      
                      <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                        {item.description}
                      </p>

                      {/* Price and Stock */}
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-green-600">
                          {formatPrice(item.price)}
                        </span>
                        {item.stockQuantity && (
                          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                            Còn {item.stockQuantity}
                          </span>
                        )}
                      </div>
                      
                      {/* Action Button */}
                      <Button
                        type="default"
                        icon={<Eye className="w-4 h-4" />}
                        onClick={() => handleViewItemDetail(item)}
                        className="w-full mt-4 h-10 rounded-xl font-semibold border-2 border-gray-200 hover:border-green-300 hover:text-green-600 transition-all duration-200"
                      >
                        Xem chi tiết sản phẩm
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Đang tải thông tin sản phẩm...</p>
              </div>
            )}
          </div>
        </div>

        {/* Floating Action Bar for Mobile */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 p-4 md:hidden shadow-2xl">
          <div className="flex items-center justify-between max-w-sm mx-auto gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-500">Giá combo</div>
              <div className="text-xl font-bold text-green-600">
                {formatPrice(combo.comboPrice)}
              </div>
            </div>
            <Button
              type="primary"
              icon={<ShoppingCart className="w-5 h-5" />}
              onClick={handleAddToCart}
              loading={addingToCart}
              disabled={!combo.isInStock}
              className="bg-gradient-to-r from-green-500 to-emerald-500 border-none h-12 px-6 rounded-xl font-bold shadow-lg"
            >
              Thêm vào giỏ
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComboDetail;