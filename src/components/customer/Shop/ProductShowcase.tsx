import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Rate } from 'antd';
import { useNavigate } from 'react-router-dom';
import { getAllTerrariums } from '@/api/terrarium';
import type { Terrarium } from '@/types/terrarium';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Ant Design Icons (thay toàn bộ Heroicons)
import {
  StarFilled,
  FireOutlined,
  LikeOutlined,
  BulbOutlined,
  SearchOutlined,
  HeartFilled,
  ExperimentOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';

import miniForest from '@/assets/image/1.jpg';

gsap.registerPlugin(ScrollTrigger);

type TabKey = 'featured' | 'bestSelling' | 'topRated';
const FETCH_SIZE = 24;

const ProductShowcase: React.FC = () => {
  const [tab, setTab] = useState<TabKey>('featured');
  const [items, setItems] = useState<Terrarium[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const mountedRef = useRef(true);
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<Array<HTMLDivElement | null>>([]);
  const gsapContext = useRef<gsap.Context | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      try {
        setLoading(true);
        const list = await getAllTerrariums(1, FETCH_SIZE, true, 'TerrariumImages');
        if (!mountedRef.current) return;
        setItems((list || []).filter((i: any) => i?.terrariumId));
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    })();
    return () => { mountedRef.current = false; };
  }, [tab]);

  useEffect(() => {
    if (loading || !items.length) return;

    gsapContext.current = gsap.context(() => {
      cardsRef.current.forEach((card, index) => {
        if (!card) return;
        gsap.fromTo(
          card,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, delay: index * 0.1, ease: 'power2.out' }
        );
      });
    }, sectionRef);

    return () => gsapContext.current?.revert();
  }, [loading, items, tab]);

  const top3 = useMemo(() => {
    const arr = [...items];
    if (tab === 'featured') {
      arr.sort((a, b) => {
        const af = (a as any).isFeatured ?? (a as any).isFeature ?? false;
        const bf = (b as any).isFeatured ?? (b as any).isFeature ?? false;
        if (af !== bf) return bf ? 1 : -1;
        const ad = (a as any).createdAt ? +new Date((a as any).createdAt) : 0;
        const bd = (b as any).createdAt ? +new Date((b as any).createdAt) : 0;
        return bd - ad;
      });
    } else if (tab === 'bestSelling') {
      arr.sort((a, b) => ((b as any).soldQuantity ?? 0) - ((a as any).soldQuantity ?? 0));
    } else {
      arr.sort((a, b) => {
        const ar = (a as any).averageRating ?? (a as any).rating ?? 0;
        const br = (b as any).averageRating ?? (b as any).rating ?? 0;
        if (br !== ar) return br - ar;
        const ac = (a as any).ratingCount ?? (a as any).reviewCount ?? 0;
        const bc = (b as any).ratingCount ?? (b as any).reviewCount ?? 0;
        return bc - ac;
      });
    }
    return arr.slice(0, 3);
  }, [items, tab]);

  const tabData = [
    { key: 'featured', label: 'Terrarium Nổi Bật', icon: <StarFilled />, color: 'from-emerald-500 to-green-600' },
    { key: 'bestSelling', label: 'Bán Chạy Nhất', icon: <FireOutlined />, color: 'from-orange-500 to-red-600' },
    { key: 'topRated', label: 'Được Yêu Thích', icon: <LikeOutlined />, color: 'from-yellow-500 to-orange-600' },
  ] as const;

  return (
    <div ref={sectionRef} className="font-inter">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full lg:w-72 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg p-6 border border-green-100">
          <div className="mb-6 text-center">
            <ExperimentOutlined className="text-3xl mb-2 text-emerald-700" />
            <h3 className="text-lg font-bold text-emerald-800">Danh Mục Terrarium</h3>
          </div>

          <div className="space-y-3">
            {tabData.map((item) => (
              <button
                key={item.key}
                className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 ${
                  tab === item.key
                    ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                    : 'bg-white/70 hover:bg-white text-emerald-700 shadow-sm hover:shadow-md'
                }`}
                onClick={() => setTab(item.key as TabKey)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <span className="truncate text-sm">{item.label}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Tips */}
          <div className="mt-8 p-4 bg-white/60 rounded-lg border border-green-200 text-sm text-emerald-700">
            <div className="font-semibold mb-2 flex items-center gap-2">
              <BulbOutlined /> Mẹo chăm sóc
            </div>
            <div className="text-xs space-y-1">
              <div>• Đặt ở nơi ánh sáng gián tiếp</div>
              <div>• Tưới nước 1-2 tuần/lần</div>
              <div>• Kiểm tra độ ẩm thường xuyên</div>
            </div>
          </div>
        </aside>

        {/* Product grid */}
        <section className="flex-1">
          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-emerald-800 mb-2 flex items-center gap-2">
              {tab === 'featured' && (<><StarFilled className="text-emerald-600" /> Terrarium Nổi Bật</>)}
              {tab === 'bestSelling' && (<><FireOutlined className="text-orange-500" /> Terrarium Bán Chạy</>)}
              {tab === 'topRated' && (<><LikeOutlined className="text-yellow-500" /> Terrarium Được Yêu Thích</>)}
            </h2>
            <p className="text-emerald-600 text-sm">Khám phá những khu vườn mini tuyệt đẹp trong lọ thủy tinh</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(loading ? Array.from({ length: 3 }) : top3).map((raw, idx) => {
              const t = raw as Terrarium;
              const image = t?.terrariumImages?.[0]?.imageUrl || miniForest;
              const rating = (t as any)?.averageRating ?? (t as any)?.rating ?? 4.5;
              const purchases = (t as any)?.soldQuantity ?? (t as any)?.purchases ?? 0;

              return (
                <div
                  key={loading ? idx : t.terrariumId}
                  ref={(el) => { cardsRef.current[idx] = el; }}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 border border-green-50 opacity-0"
                >
                  {loading ? (
                    <div className="animate-pulse">
                      <div className="h-48 bg-gradient-to-br from-green-100 to-emerald-100 rounded-t-2xl mb-4" />
                      <div className="p-4 space-y-3">
                        <div className="h-4 bg-green-200 rounded w-3/4" />
                        <div className="h-4 bg-green-200 rounded w-1/2" />
                        <div className="h-8 bg-green-200 rounded w-1/3" />
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Image */}
                      <div className="relative h-48 bg-gradient-to-br from-green-50 to-emerald-50 rounded-t-2xl overflow-hidden">
                        <img
                          src={image}
                          alt={t.terrariumName}
                          className="w-full h-full object-cover transition-transform duration-200 hover:scale-110"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = miniForest; }}
                        />
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
                          <EnvironmentOutlined style={{ fontSize: 16 }} className="text-emerald-700" />
                          <span className="text-xs font-medium text-emerald-700">Terrarium</span>
                        </div>
                      </div>

                      <div className="p-5">
                        <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-2">
                          {t.terrariumName}
                        </h3>

                        <div className="flex items-center justify-between mb-3">
                          <div className="text-emerald-600 font-bold text-lg">
                            {t.minPrice.toLocaleString('vi-VN')} ₫
                          </div>
                          <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full flex items-center gap-1">
                            <HeartFilled className="text-emerald-500" />
                            {purchases} đã bán
                          </span>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                          <Rate allowHalf disabled value={Number(rating)} className="text-sm" />
                          <span className="text-xs text-gray-500">({Number(rating).toFixed(1)}/5)</span>
                        </div>

                        <Button
                          type="primary"
                          className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 border-none font-semibold"
                          icon={<SearchOutlined />}
                          onClick={() => navigate(`/terrarium/${t.terrariumId}`)}
                        >
                          Xem Chi Tiết
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* View all */}
          <div className="text-center mt-8">
            <Button
              size="large"
              className="bg-white border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-600 font-semibold px-8"
              onClick={() => navigate('/shop')}
              icon={<EnvironmentOutlined style={{ color: '#047857' }} />}
            >
              Xem Tất Cả Terrarium
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProductShowcase;
