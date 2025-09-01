// src/components/customer/TerrariumDetail.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Terrarium, TerrariumVariant, TerrariumVariantAccessory } from '@/types/terrarium';
import {
  ChevronDown,
  ChevronUp,
  Star,
  StarHalf,
  StarOff,
  ShoppingCart,
  Package2,
  Heart,
  Eye,
  TrendingUp,
  Info,
  Image as ImageIcon
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import FavoriteButton from '@/components/common/FavoriteButton';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { EffectFade, Navigation, Pagination, Autoplay } from 'swiper/modules';

import {
  getEnvironmentById,
  getShapeById,
  getTankMethodById,
} from '@/api/terrarium';
import { getAccessoryById } from '@/api/accessory';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

interface Props {
  terrarium: Terrarium | null;
  variants: TerrariumVariant[];
  selectedVariant: TerrariumVariant | null;
  onSelectVariant: (variant: TerrariumVariant) => void;
  onAddToCart: (qty?: number) => void;
  // Backend mới: mua phụ kiện theo {id, qty}[]
  onBuyAccessories: (selected: { id: number; qty: number }[]) => void;
}

const FALLBACK_IMG = '/TerraTechLogo.png';

const RatingStars: React.FC<{ rating?: number }> = ({ rating = 0 }) => {
  const r = Math.max(0, Math.min(5, rating));
  const full = Math.floor(r);
  const hasHalf = r - full >= 0.25 && r - full < 0.75;
  const empty = 5 - full - (hasHalf ? 1 : 0);

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`f-${i}`} className="w-4 h-4 text-amber-400 fill-amber-400 drop-shadow-sm" />
      ))}
      {hasHalf && <StarHalf className="w-4 h-4 text-amber-400 fill-amber-400 drop-shadow-sm" />}
      {Array.from({ length: empty }).map((_, i) => (
        <StarOff key={`e-${i}`} className="w-4 h-4 text-gray-300" />
      ))}
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; value: string; label: string }> = ({ icon, value, label }) => (
  <div className="bg-gradient-to-br from-white to-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group">
    <div className="flex items-center gap-3">
      <div className="text-emerald-600 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <div>
        <p className="text-lg font-bold text-gray-800">{value}</p>
        <p className="text-sm text-gray-600">{label}</p>
      </div>
    </div>
  </div>
);

const QuantityControl: React.FC<{
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
}> = ({ value, onChange, min = 1, max = 99, className = "" }) => {
  const clampQty = (n: number) => Math.max(min, Math.min(max, Math.trunc(n || 0)));

  return (
    <div className={`flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden ${className}`}>
      <button
        className="px-3 py-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors duration-200"
        onClick={() => onChange(clampQty(value - 1))}
        disabled={value <= min}
      >
        −
      </button>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(clampQty(Number(e.target.value)))}
        className="w-16 text-center py-2 border-0 focus:ring-0 focus:outline-none"
      />
      <button
        className="px-3 py-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors duration-200"
        onClick={() => onChange(clampQty(value + 1))}
        disabled={value >= max}
      >
        +
      </button>
    </div>
  );
};

const TerrariumDetail: React.FC<Props> = ({
  terrarium,
  variants,
  selectedVariant,
  onSelectVariant,
  onAddToCart,
  onBuyAccessories,
}) => {
  const [showAccessories, setShowAccessories] = React.useState(false);

  // === STATE mới: quản lý phụ kiện theo Variant ===
  const [selectedAccessories, setSelectedAccessories] = useState<number[]>([]);
  const [accessoryQuantities, setAccessoryQuantities] = useState<Record<number, number>>({});
  const [accessoryDetails, setAccessoryDetails] = useState<
    Array<{
      accessoryId: number;
      name: string;
      price: number;
      description?: string;
      accessoryImages?: { imageUrl: string }[];
      quantityDefault?: number;
    }>
  >([]);

  const [variantQty, setVariantQty] = useState<number>(1);
  const [imageLoaded, setImageLoaded] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const accessoriesRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);

  // local name nếu prop chưa enrich
  const [envName, setEnvName] = useState<string | undefined>();
  const [shapeName, setShapeName] = useState<string | undefined>();
  const [tankMethodType, setTankMethodType] = useState<string | undefined>();

  // Enhanced animations
  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      if (imageRef.current) {
        gsap.set(imageRef.current, {
          opacity: 0,
          scale: 0.8,
          rotationY: -15
        });

        tl.to(imageRef.current, {
          opacity: 1,
          scale: 1,
          rotationY: 0,
          duration: 1.2,
          ease: "power3.out",
          delay: 0.2
        });
      }

      if (infoRef.current) {
        gsap.set(infoRef.current.children, {
          opacity: 0,
          x: 50,
          y: 20
        });

        tl.to(infoRef.current.children, {
          opacity: 1,
          x: 0,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power2.out"
        }, "-=0.8");
      }

      if (detailsRef.current) {
        gsap.fromTo(detailsRef.current,
          {
            opacity: 0,
            y: 60,
            scale: 0.95
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: detailsRef.current,
              start: "top 80%",
              toggleActions: "play none none reverse"
            }
          }
        );
      }

      gsap.to(".stat-card", {
        y: -5,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
        stagger: 0.3
      });

    }, containerRef);

    return () => ctx.revert();
  }, [terrarium, imageLoaded]);

  // Accessories animation
  useEffect(() => {
    if (showAccessories && accessoriesRef.current) {
      const items = accessoriesRef.current.children;

      gsap.fromTo(items,
        {
          opacity: 0,
          y: 30,
          scale: 0.9
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: 'back.out(1.7)'
        }
      );
    }
  }, [showAccessories]);

  // === ENRICH info theo id (giữ nguyên logic cũ) ===
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!terrarium) return;

      if (terrarium.environment?.environmentName) {
        setEnvName(terrarium.environment.environmentName);
      } else if (terrarium.environmentId) {
        try {
          const env = await getEnvironmentById(terrarium.environmentId);
          if (alive) setEnvName(env?.environmentName);
        } catch {}
      }

      if (terrarium.shape?.shapeName) {
        setShapeName(terrarium.shape.shapeName);
      } else if (terrarium.shapeId) {
        try {
          const shape = await getShapeById(terrarium.shapeId);
          if (alive) setShapeName(shape?.shapeName);
        } catch {}
      }

      const tmFromProp =
        terrarium.tankMethod?.tankMethodType || terrarium.tankMethod?.tankMethodName;
      if (tmFromProp) {
        setTankMethodType(tmFromProp);
      } else if (terrarium.tankMethodId) {
        try {
          const tank = await getTankMethodById(terrarium.tankMethodId);
          if (alive) setTankMethodType(tank?.tankMethodType || tank?.tankMethodName);
        } catch {}
      }
    })();
    return () => {
      alive = false;
    };
  }, [terrarium]);

  // === FETCH chi tiết phụ kiện theo selectedVariant (điểm thay đổi chính) ===
  useEffect(() => {
  let alive = true;

  const run = async () => {
    if (!selectedVariant?.terrariumVariantAccessories?.length) {
      if (alive) {
        setAccessoryDetails([]);
        setSelectedAccessories([]);
        setAccessoryQuantities({});
      }
      return;
    }

    const list = selectedVariant.terrariumVariantAccessories as TerrariumVariantAccessory[];

    // Không văng lỗi toàn mảng nếu 1 API fail
    const settled = await Promise.allSettled(
      list.map(va => getAccessoryById(va.accessoryId))
    );
    if (!alive) return;

    // Lọc kết quả thành công và có dữ liệu
    const okResults = settled
      .map((r, idx) => (r.status === 'fulfilled' ? { acc: r.value, idx } : null))
      .filter((x): x is { acc: any; idx: number } => !!x && !!x.acc);

    // Map sang AccessoryDetail, bỏ hẳn item lỗi (không tạo id=0)
    const enriched = okResults.map(({ acc, idx }) => ({
      accessoryId: acc.accessoryId,
      name: acc.name,
      price: acc.price ?? 0,
      description: acc.description,
      accessoryImages: acc.accessoryImages || [],
      quantityDefault: list[idx]?.quantity ?? 1,
    }));

    setAccessoryDetails(enriched);

    // Chọn mặc định các phụ kiện hợp lệ
    const defaultSelected = enriched.map(a => a.accessoryId);
    const defaultQty = Object.fromEntries(
      enriched.map(a => [a.accessoryId, Math.max(0, Math.trunc(a.quantityDefault || 1))])
    );

    setSelectedAccessories(defaultSelected);
    setAccessoryQuantities(defaultQty);
  };

  run();
  return () => { alive = false; };
}, [selectedVariant]);


  if (!terrarium) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-cyan-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 animate-pulse"></div>
          <p className="text-xl text-gray-600">Không tìm thấy thông tin bể cá</p>
        </div>
      </div>
    );
  }

  const fallbackImage = terrarium.terrariumImages?.[0]?.imageUrl || FALLBACK_IMG;
  const mainImage = selectedVariant?.urlImage || fallbackImage;

  const clampQty = (n: number, min = 0, max = 99) => Math.max(min, Math.min(max, Math.trunc(n || 0)));

  // === Helpers cho phụ kiện (giữ UI, đổi data) ===
  const setAccQty = (id: number, qty: number) => {
    const q = clampQty(qty, 0, 99);
    setAccessoryQuantities((prev) => ({ ...prev, [id]: q }));
    if (!selectedAccessories.includes(id) && q > 0) {
      setSelectedAccessories((p) => [...p, id]);
    }
    if (q <= 0) {
      setSelectedAccessories((p) => p.filter((x) => x !== id));
    }
  };

  const toggleAccessory = (id: number) => {
    setSelectedAccessories((prev) => {
      if (prev.includes(id)) return prev.filter((aid) => aid !== id);
      // nếu chưa có qty thì set = 1
      setAccessoryQuantities((q) => ({ ...q, [id]: q[id] && q[id] > 0 ? q[id] : 1 }));
      return [...prev, id];
    });
  };

  const variantPrice = selectedVariant?.price ?? terrarium.minPrice ?? 0;

  const totalSelectedPrice = accessoryDetails
    .filter((acc) => selectedAccessories.includes(acc.accessoryId))
    .reduce((sum, acc) => {
      const qty = accessoryQuantities[acc.accessoryId] || 0;
      return sum + (acc.price ?? 0) * qty;
    }, 0);

  const extraImages = useMemo(
    () =>
      Array.isArray(terrarium.terrariumImages)
        ? terrarium.terrariumImages.map((i) => i.imageUrl).filter(Boolean)
        : [],
    [terrarium.terrariumImages]
  );

  const details: { label: string; value: string; icon: React.ReactNode }[] = [
    {
      label: 'Môi trường',
      value: envName || `#${terrarium.environmentId}`,
      icon: <div className="w-4 h-4 bg-green-400 rounded-full"></div>
    },
    {
      label: 'Hình dạng',
      value: shapeName || `#${terrarium.shapeId}`,
      icon: <div className="w-4 h-4 bg-blue-400 rounded-sm"></div>
    },
    {
      label: 'Phân loại bể',
      value: tankMethodType || `#${terrarium.tankMethodId}`,
      icon: <div className="w-4 h-4 bg-purple-400 rounded-full"></div>
    },
    {
      label: 'Giá dao động',
      value:
        typeof terrarium.minPrice === 'number' && typeof terrarium.maxPrice === 'number'
          ? `${terrarium.minPrice.toLocaleString('vi-VN')} - ${terrarium.maxPrice.toLocaleString('vi-VN')} VND`
          : '—',
      icon: <div className="w-4 h-4 bg-amber-400 rounded-full"></div>
    },
  ];

  const handleAddToCart = () => {
    onAddToCart?.(variantQty);
  };

  const handleBuyAccessories = () => {
    const payload = selectedAccessories.map((id) => ({
      id,
      qty: accessoryQuantities[id] || 1,
    }));
    onBuyAccessories?.(payload);
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50">
      {/* Hero Section */}
      <div ref={heroRef} className="relative">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-200/30 to-cyan-200/30 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Image Section */}
            <div className="relative">
              <div className="relative overflow-hidden rounded-3xl shadow-2xl bg-white p-2">
                <img
                  ref={imageRef}
                  src={mainImage}
                  alt={terrarium.terrariumName}
                  className="w-full h-96 object-cover rounded-2xl transition-transform duration-500 hover:scale-105"
                  onLoad={() => setImageLoaded(true)}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).onerror = null;
                    (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG;
                  }}
                />
                <div className="absolute inset-2 bg-gradient-to-t from-black/20 via-transparent to-transparent rounded-2xl pointer-events-none"></div>
              </div>

              <div className="absolute -top-4 -right-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-4 py-2 rounded-full shadow-lg text-sm font-semibold">
                ⭐ Bán chạy
              </div>
            </div>

            {/* Info Section */}
            <div ref={infoRef} className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-4xl font-bold text-gray-800 leading-tight">
                  {terrarium.terrariumName}
                </h1>
                <FavoriteButton type="terrarium" productId={terrarium.terrariumId} size="middle" />
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="stat-card">
                  <StatCard
                    icon={<Star className="w-5 h-5" />}
                    value={(terrarium.averageRating ?? 0).toFixed(1)}
                    label="Đánh giá"
                  />
                </div>
                <div className="stat-card">
                  <StatCard
                    icon={<Eye className="w-5 h-5" />}
                    value={(terrarium.feedbackCount ?? 0).toLocaleString('vi-VN')}
                    label="Lượt đánh giá"
                  />
                </div>
                <div className="stat-card col-span-2 lg:col-span-1">
                  <StatCard
                    icon={<TrendingUp className="w-5 h-5" />}
                    value={(terrarium.purchaseCount ?? 0).toLocaleString('vi-VN')}
                    label="Đã bán"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200">
                <RatingStars rating={terrarium.averageRating ?? 0} />
                <span className="text-lg font-semibold text-gray-700">
                  {(terrarium.averageRating ?? 0).toFixed(1)} / 5.0
                </span>
              </div>

              {terrarium.description && (
                <div className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200">
                  <p className="text-gray-700 leading-relaxed">{terrarium.description}</p>
                </div>
              )}

              {/* Price and Quantity */}
              <div className="p-6 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl text-white shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-emerald-100 mb-1">Giá bán</p>
                    <p className="text-3xl font-bold">
                      {(variantPrice || 0).toLocaleString('vi-VN')} VND
                    </p>
                    {variantQty > 1 && (
                      <p className="text-emerald-100 mt-1">
                        Tổng: <span className="font-semibold text-white">
                          {(variantPrice * variantQty).toLocaleString('vi-VN')} VND
                        </span>
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-100 mb-2">Số lượng</p>
                    <QuantityControl
                      value={variantQty}
                      onChange={setVariantQty}
                      className="bg-white/20 border-white/30"
                    />
                  </div>
                </div>
              </div>

              {/* Variants */}
              {!!variants.length && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <Package2 className="w-5 h-5 text-emerald-600" />
                    Phân loại sản phẩm
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {variants.map((variant) => {
                      const isSelected = selectedVariant?.terrariumVariantId === variant.terrariumVariantId;
                      const variantImage = variant.urlImage || FALLBACK_IMG;

                      return (
                        <button
                          key={variant.terrariumVariantId}
                          onClick={() => onSelectVariant(variant)}
                          className={`group relative p-4 rounded-xl border-2 transition-all duration-300 ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50 shadow-lg scale-105'
                              : 'border-gray-200 bg-white hover:border-emerald-300 hover:shadow-md hover:scale-102'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <img
                                src={variantImage}
                                alt={variant.variantName}
                                className="w-12 h-12 rounded-lg object-cover"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).onerror = null;
                                  (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG;
                                }}
                              />
                              {isSelected && (
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs">✓</span>
                                </div>
                              )}
                            </div>
                            <span className={`font-medium transition-colors ${
                              isSelected ? 'text-emerald-700' : 'text-gray-700 group-hover:text-emerald-600'
                            }`}>
                              {variant.variantName}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add to Cart Button */}
              <button
                className={`w-full py-4 px-6 rounded-2xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-3 ${
                  selectedVariant
                    ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                disabled={!selectedVariant}
                onClick={handleAddToCart}
              >
                <ShoppingCart className="w-6 h-6" />
                {selectedVariant ? 'Thêm vào giỏ hàng' : 'Vui lòng chọn phân loại'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Accessories Section (ĐÃ CẬP NHẬT: lấy theo selectedVariant) */}
      {Array.isArray(accessoryDetails) && accessoryDetails.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <Package2 className="w-6 h-6 text-white" />
                  </div>
                  Phụ kiện của biến thể
                </h2>
                <button
                  onClick={() => setShowAccessories(!showAccessories)}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors duration-200 font-medium"
                >
                  {showAccessories ? (
                    <>
                      <ChevronUp className="w-5 h-5" />
                      Thu gọn
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-5 h-5" />
                      Xem chi tiết ({accessoryDetails.length} phụ kiện)
                    </>
                  )}
                </button>
              </div>

              {/* Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-200 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-700 font-semibold text-lg">
                      Tổng giá trị phụ kiện
                    </p>
                    <p className="text-3xl font-bold text-blue-800">
                      {totalSelectedPrice.toLocaleString('vi-VN')} VND
                    </p>
                    <p className="text-blue-600 text-sm mt-1">
                      {selectedAccessories.length} / {accessoryDetails.length} phụ kiện đã chọn
                    </p>
                  </div>
                  <button
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
                    onClick={handleBuyAccessories}
                  >
                    Mua riêng lẻ
                  </button>
                </div>
              </div>

              {/* Accessories Grid */}
              {showAccessories && (
                <div ref={accessoriesRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {accessoryDetails.map((acc) => {
                    const id = acc.accessoryId;
                    const qty = accessoryQuantities[id] ?? (acc.quantityDefault ?? 1);
                    const isChecked = selectedAccessories.includes(id);

                    const accImage =
                      Array.isArray(acc.accessoryImages) && acc.accessoryImages.length > 0
                        ? acc.accessoryImages[0].imageUrl
                        : undefined;

                    return (
                      <div
                        key={id}
                        className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                          isChecked
                            ? 'border-blue-400 bg-blue-50 shadow-lg'
                            : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                        }`}
                        onClick={() => toggleAccessory(id)}
                      >
                        {/* Checkbox */}
                        <div className="absolute top-4 right-4">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            isChecked
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300 group-hover:border-blue-400'
                          }`}>
                            {isChecked && <span className="text-white text-xs">✓</span>}
                          </div>
                        </div>

                        {/* Image */}
                        {accImage && (
                          <div className="mb-4">
                            <img
                              src={accImage}
                              alt={acc.name}
                              className="w-full h-32 object-cover rounded-xl"
                              onError={(e) => ((e.currentTarget as HTMLImageElement).src = FALLBACK_IMG)}
                            />
                          </div>
                        )}

                        {/* Content */}
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-bold text-gray-800 text-lg group-hover:text-blue-600 transition-colors">
                              {acc.name}
                            </h4>
                            <p className="text-2xl font-bold text-blue-600">
                              {(acc.price ?? 0).toLocaleString('vi-VN')} VND
                            </p>
                          </div>

                          {acc.description && (
                            <p className="text-gray-600 text-sm leading-relaxed">
                              {acc.description}
                            </p>
                          )}

                          {/* Quantity Control */}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                            <span className="text-sm text-gray-600">Số lượng:</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAccQty(id, (qty || 0) - 1);
                                }}
                              >
                                −
                              </button>
                              <input
                                type="number"
                                min={0}
                                max={99}
                                value={qty}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  setAccQty(id, Number(e.target.value));
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-16 h-8 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                              <button
                                type="button"
                                className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAccQty(id, (qty || 0) + 1);
                                }}
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Subtotal */}
                          <div className="text-right">
                            <p className="text-sm text-gray-600">
                              Tạm tính:{' '}
                              <span className="font-semibold text-gray-800">
                                {(((acc.price ?? 0) * (qty || 0)) || 0).toLocaleString('vi-VN')} VND
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Details Section */}
      <div ref={detailsRef} className="max-w-7xl mx-auto px-6 pb-12">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Info className="w-6 h-6 text-white" />
              </div>
              Chi tiết sản phẩm
            </h2>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
              {/* Images Section */}
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                  <ImageIcon className="w-6 h-6 text-emerald-600" />
                  Thư viện ảnh
                </h3>

                {extraImages.length > 0 ? (
                  <div className="relative">
                    <Swiper
                      modules={[EffectFade, Navigation, Pagination, Autoplay]}
                      effect="fade"
                      slidesPerView={1}
                      spaceBetween={30}
                      navigation={{
                        nextEl: '.swiper-button-next-custom',
                        prevEl: '.swiper-button-prev-custom',
                      }}
                      pagination={{
                        clickable: true,
                        bulletClass: 'swiper-pagination-bullet-custom',
                        bulletActiveClass: 'swiper-pagination-bullet-custom-active'
                      }}
                      autoplay={{
                        delay: 4000,
                        disableOnInteraction: false
                      }}
                      className="rounded-2xl overflow-hidden shadow-lg"
                      style={{ height: '400px' }}
                    >
                      {extraImages.map((url, idx) => (
                        <SwiperSlide key={idx}>
                          <div className="relative h-full">
                            <img
                              src={url || FALLBACK_IMG}
                              alt={`Ảnh ${idx + 1}`}
                              className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                              loading="lazy"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).onerror = null;
                                (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG;
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                            <div className="absolute bottom-4 left-4 text-white">
                              <p className="text-sm font-medium">Ảnh {idx + 1} / {extraImages.length}</p>
                            </div>
                          </div>
                        </SwiperSlide>
                      ))}
                    </Swiper>

                    {/* Custom Navigation */}
                    <button className="swiper-button-prev-custom absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-white transition-all duration-200">
                      ←
                    </button>
                    <button className="swiper-button-next-custom absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-white transition-all duration-200">
                      →
                    </button>

                    <style>{`
                      .swiper-pagination-bullet-custom {
                        width: 12px;
                        height: 12px;
                        background: rgba(255, 255, 255, 0.5);
                        border-radius: 50%;
                        opacity: 1;
                        transition: all 0.3s ease;
                      }
                      .swiper-pagination-bullet-custom-active {
                        background: white;
                        transform: scale(1.2);
                      }
                    `}</style>
                  </div>
                ) : (
                  <div className="h-64 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Không có hình ảnh bổ sung</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Specifications */}
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold text-gray-800">Thông tin bể</h3>

                <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200">
                  <div className="space-y-4">
                    {details.map((detail, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all duration-300 group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="group-hover:scale-110 transition-transform duration-200">
                            {detail.icon}
                          </div>
                          <span className="font-medium text-gray-700">{detail.label}</span>
                        </div>
                        <span className="font-semibold text-gray-800 text-right max-w-xs">
                          {detail.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-2xl border border-emerald-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                        <Heart className="w-4 h-4 text-white" />
                      </div>
                      <h4 className="font-semibold text-emerald-800">Cam kết chất lượng</h4>
                    </div>
                    <p className="text-emerald-700 text-sm">
                      Sản phẩm được kiểm tra kỹ lưỡng và có bảo hành chính hãng
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <ShoppingCart className="w-4 h-4 text-white" />
                      </div>
                      <h4 className="font-semibold text-blue-800">Giao hàng nhanh</h4>
                    </div>
                    <p className="text-blue-700 text-sm">
                      Miễn phí vận chuyển cho đơn hàng trên 500k trong nội thành
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {terrarium.bodyHTML && (
              <div className="mt-12 pt-8 border-t border-gray-200">
                <h3 className="text-2xl font-semibold text-gray-800 mb-6">Mô tả chi tiết</h3>
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-200">
                  <div
                    className="prose prose-lg max-w-none prose-headings:text-gray-800 prose-p:text-gray-700 prose-a:text-emerald-600 hover:prose-a:text-emerald-700 prose-strong:text-gray-800 prose-ul:text-gray-700 prose-ol:text-gray-700"
                    dangerouslySetInnerHTML={{ __html: terrarium.bodyHTML }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TerrariumDetail;
