// src/pages/Customer/AccessoryDetail.tsx
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { addAccessoryToCart } from '@/api/cart';
import { useParams } from 'react-router-dom';
import {
  getAccessoryById,
  getAccessoryImagesByAccessoryId,
  getAllAccessoryCategories,
} from '@/api/accessory';
import type { Accessory } from '@/types/accessory';
import { Button, Image, Spin, Tag } from 'antd';
import { toast } from 'react-toastify';
import FavoriteButton from '@/components/common/FavoriteButton';
import { InfoCircleOutlined, ShoppingCartOutlined, StarFilled } from '@ant-design/icons';

const FALLBACK_IMG = '/TerraTechLogo.png';

const numberFmt = (n: number | null | undefined): string =>
  typeof n === 'number' && !Number.isNaN(n) ? n.toLocaleString('vi-VN') : '0';

const formatDateVN = (iso?: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', {
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const statusChip = (status?: string) => {
  const s = (status || '').toLowerCase();
  if (s === 'active') return <Tag className="border-green-200 bg-green-50 text-green-700 font-medium">Đang bán</Tag>;
  if (s === 'inactive') return <Tag className="border-orange-200 bg-orange-50 text-orange-700 font-medium">Tạm ẩn</Tag>;
  if (s === 'archived') return <Tag className="border-gray-200 bg-gray-50 text-gray-700 font-medium">Lưu trữ</Tag>;
  return <Tag className="border-gray-200 bg-gray-50 text-gray-700 font-medium">{status || '—'}</Tag>;
};

const clamp = (n: number, min: number = 1, max: number = 9999): number =>
  Math.max(min, Math.min(max, Math.trunc(n || 0)));

const AccessoryDetail: React.FC = () => {
  const { id } = useParams();
  const [accessory, setAccessory] = useState<Accessory | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [categoryName, setCategoryName] = useState<string>('Không rõ');
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);

  // Refs for GSAP animations (khai báo kiểu an toàn)
  const containerRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLDivElement | null>(null);
  const imageGalleryRef = useRef<HTMLDivElement | null>(null);
  const infoCardRef = useRef<HTMLDivElement | null>(null);
  const statsRef = useRef<HTMLDivElement | null>(null);
  const actionButtonsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return;
        const [accRes, imgRes, categories] = await Promise.all([
          getAccessoryById(+id),
          getAccessoryImagesByAccessoryId(+id),
          getAllAccessoryCategories(),
        ]);
        if (!accRes) {
          toast.error('Không tìm thấy phụ kiện!');
          setLoading(false);
          return;
        }
        const imgUrls = (imgRes || []).map((img) => img.imageUrl) || [];
        const fallbackFromAcc = (accRes.accessoryImages || [])
          .map((i: any) => i?.imageUrl)
          .filter(Boolean);
        const finalImages = (imgUrls.length > 0 ? imgUrls : fallbackFromAcc).filter(Boolean);
        setAccessory(accRes as any);
        setImages(finalImages.length ? finalImages : [FALLBACK_IMG]);

        const foundCategory = categories.find((c) => c.categoryId === accRes.categoryId);
        setCategoryName(foundCategory?.categoryName || 'Không rõ');
      } catch (err) {
        toast.error('Lỗi khi tải dữ liệu phụ kiện');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    // GSAP animations (chỉ chạy nếu đã có window.gsap)
    const gsapAny: any = (window as any).gsap;
    if (gsapAny) {
      gsapAny.set(
        [titleRef.current, imageGalleryRef.current, infoCardRef.current, statsRef.current, actionButtonsRef.current],
        { opacity: 0, y: 30 }
      );
      const tl = gsapAny.timeline();
      tl.to(titleRef.current, { duration: 0.8, opacity: 1, y: 0, ease: 'power2.out' })
        .to(imageGalleryRef.current, { duration: 0.6, opacity: 1, y: 0, ease: 'power2.out' }, '-=0.4')
        .to(infoCardRef.current, { duration: 0.6, opacity: 1, y: 0, ease: 'power2.out' }, '-=0.3')
        .to(statsRef.current, { duration: 0.5, opacity: 1, y: 0, ease: 'power2.out' }, '-=0.2')
        .to(actionButtonsRef.current, { duration: 0.5, opacity: 1, y: 0, ease: 'power2.out' }, '-=0.1');

      gsapAny.to('.main-image', { duration: 3, y: -10, ease: 'power1.inOut', yoyo: true, repeat: -1 });
    } else {
      // fallback: không bắt buộc nạp GSAP động để tránh reload
    }
  }, []);

  const increaseQuantity = () => {
    const max = Math.max(1, Number(accessory?.stockQuantity || 1));
    setQuantity((prev) => clamp(prev + 1, 1, max));
  };

  const decreaseQuantity = () =>
    setQuantity((prev) => clamp(prev - 1, 1, Math.max(1, Number(accessory?.stockQuantity || 1))));

  const canAdd = useMemo(() => {
    const stock = Number(accessory?.stockQuantity || 0);
    return stock > 0 && quantity > 0 && quantity <= stock;
  }, [accessory?.stockQuantity, quantity]);

  const handleAddToCart = async () => {
    if (!accessory || !canAdd) {
      toast.info('Số lượng vượt quá tồn kho hoặc bằng 0');
      return;
    }
    const gsapAny: any = (window as any).gsap;
    if (gsapAny) {
      gsapAny.to('.add-to-cart-btn', { duration: 0.1, scale: 0.95, yoyo: true, repeat: 1, ease: 'power2.inOut' });
    }

    const isLoggedIn = !!localStorage.getItem('authToken');
    if (isLoggedIn) {
      try {
        await addAccessoryToCart(accessory.accessoryId, quantity);
        toast.success('Đã thêm sản phẩm vào giỏ hàng!');
      } catch {
        toast.error('Không thể thêm vào giỏ hàng. Vui lòng thử lại!');
      }
    } else {
      const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
      const newItem = {
        id: `accessory-${accessory.accessoryId}`,
        accessoryId: accessory.accessoryId,
        name: accessory.name,
        price: accessory.price,
        image: images[0] || accessory.accessoryImages?.[0]?.imageUrl || FALLBACK_IMG,
        quantity,
        selected: false,
      };
      const existingIndex = cartItems.findIndex((item: any) => item.id === newItem.id);
      if (existingIndex >= 0) {
        cartItems[existingIndex].quantity += quantity;
        toast.info('Đã tăng số lượng trong giỏ hàng (local)');
      } else {
        cartItems.push(newItem);
        toast.success('Đã thêm sản phẩm vào giỏ hàng (local)');
      }
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
    }
  };

  if (loading || !accessory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <Spin size="large" className="text-green-600" />
          <p className="mt-4 text-green-700 font-medium">Đang tải thông tin sản phẩm...</p>
        </div>
      </div>
    );
  }

  // Trường mới từ API
  const size = (accessory as any)?.size as string | undefined;
  const quantitative = (accessory as any)?.quantitative as string | undefined;
  const avgRating = Number((accessory as any)?.averageRating ?? 0);
  const feedbackCount = Number((accessory as any)?.feedbackCount ?? 0);
  const purchaseCount = Number((accessory as any)?.purchaseCount ?? 0);
  const status = (accessory as any)?.status as string | undefined;
  const createdAt = (accessory as any)?.createdAt as string | undefined;
  const updatedAt = (accessory as any)?.updatedAt as string | undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50" ref={containerRef}>
      {/* BG decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-green-200 rounded-full opacity-20 blur-xl"></div>
        <div className="absolute top-40 right-20 w-48 h-48 bg-emerald-200 rounded-full opacity-15 blur-2xl"></div>
        <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-teal-200 rounded-full opacity-25 blur-xl"></div>
      </div>

      <div className="relative container mx-auto py-12 px-4 md:px-8 max-w-7xl">
        {/* Breadcrumb */}
        <div className="mb-8 text-sm text-green-700">
          <span className="opacity-70">Trang chủ</span>
          <span className="mx-2 opacity-50">/</span>
          <span className="opacity-70">Phụ kiện</span>
          <span className="mx-2 opacity-50">/</span>
          <span className="font-medium">{categoryName}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Image Gallery */}
          <div className="space-y-6" ref={imageGalleryRef}>
            <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden p-8 backdrop-blur-sm bg-white/80">
              <div className="aspect-square relative main-image">
                <img
                  src={images[selectedImageIndex] || FALLBACK_IMG}
                  alt={accessory.name}
                  className="w-full h-full object-cover rounded-2xl shadow-lg"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-2xl"></div>
              </div>
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium text-green-700">
                {selectedImageIndex + 1} / {images.length}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className={`aspect-square rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${
                    selectedImageIndex === idx
                      ? 'ring-4 ring-green-400 shadow-lg scale-105'
                      : 'hover:scale-105 hover:shadow-md opacity-70 hover:opacity-100'
                  }`}
                  onClick={() => setSelectedImageIndex(idx)}
                >
                  <img
                    src={img || FALLBACK_IMG}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG;
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-8">
            {/* Header */}
            <div className="space-y-4" ref={titleRef}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 leading-tight mb-2">{accessory.name}</h1>
                  <p className="text-green-700 font-medium text-lg">{categoryName}</p>
                </div>
                <div className="p-3 rounded-full bg-white shadow-lg">
                  <FavoriteButton type="accessory" productId={accessory.accessoryId} size="middle" />
                </div>
              </div>

              <div className="flex items-center gap-4">
                {statusChip(status)}
                <div className="flex items-center gap-2">
                  {[...Array(5)].map((_, i) => (
                    <StarFilled
                      key={i}
                      className={`text-lg ${i < Math.floor(avgRating) ? 'text-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                  <span className="text-gray-700 font-medium">
                    {avgRating.toFixed(1)} ({numberFmt(feedbackCount)} đánh giá)
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            {accessory.description && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                <h3 className="font-semibold text-gray-900 mb-3 text-lg">Mô tả sản phẩm</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{accessory.description}</p>
              </div>
            )}

            {/* Specifications */}
            <div className="bg-gradient-to-br from-white to-green-50 rounded-2xl p-6 shadow-xl border border-green-100" ref={infoCardRef}>
              <h3 className="font-bold text-xl text-gray-900 mb-6 flex items-center gap-2">
                <div className="w-2 h-6 bg-gradient-to-b from-green-400 to-green-600 rounded-full"></div>
                Thông số kỹ thuật
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { label: 'Kích thước', value: size || '—', icon: '📏' },
                  { label: 'Đơn vị', value: quantitative || '—', icon: '📦' },
                  { label: 'Tồn kho', value: numberFmt(accessory.stockQuantity), icon: '📊' },
                  { label: 'Đã bán', value: numberFmt(purchaseCount), icon: '🚀' },
                ].map((spec, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-white/60 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{spec.icon}</span>
                      <span className="text-gray-700 font-medium">{spec.label}</span>
                    </div>
                    <span className="font-bold text-gray-900">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Card (nền xanh đậm → chữ trắng OK) */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-8 text-white shadow-2xl" ref={statsRef}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-lg mb-2">Giá bán</p>
                  <p className="text-4xl font-bold">
                    {numberFmt(accessory.price)} VND
                    {quantitative && <span className="text-xl font-normal"> / {quantitative}</span>}
                  </p>
                </div>
                <div className="text-right">
                  <div className="bg-white/20 rounded-full px-4 py-2 mb-2">
                    <span className="text-sm font-medium">Còn lại</span>
                  </div>
                  <p className="text-2xl font-bold">{numberFmt(accessory.stockQuantity)}</p>
                </div>
              </div>
            </div>

            {/* Quantity & Add to Cart */}
            <div className="space-y-6" ref={actionButtonsRef}>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <span className="font-semibold text-gray-900 text-lg">Số lượng:</span>
                  <div className="flex items-center bg-green-50 rounded-full overflow-hidden border-2 border-green-200">
                    <button onClick={decreaseQuantity} className="px-6 py-3 text-green-700 hover:bg-green-100 transition-colors font-bold text-xl">
                      −
                    </button>
                    <span className="px-8 py-3 font-bold text-xl text-green-800 bg-white min-w-[80px] text-center">{quantity}</span>
                    <button
                      onClick={increaseQuantity}
                      className="px-6 py-3 text-green-700 hover:bg-green-100 transition-colors font-bold text-xl"
                      disabled={quantity >= (accessory.stockQuantity || 0)}
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={!canAdd}
                  className="add-to-cart-btn w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-lg py-4 px-8 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  <ShoppingCartOutlined className="text-xl" />
                  {canAdd ? 'Thêm vào giỏ hàng' : 'Hết hàng'}
                </button>
              </div>

              {/* Timestamps */}
              <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-3">
                    <InfoCircleOutlined className="text-green-600" />
                    <div>
                      <p className="text-gray-600">Ngày tạo</p>
                      <p className="font-medium text-gray-900">{formatDateVN(createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <InfoCircleOutlined className="text-green-600" />
                    <div>
                      <p className="text-gray-600">Cập nhật</p>
                      <p className="font-medium text-gray-900">{formatDateVN(updatedAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* /Quantity & Add to Cart */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessoryDetail;
