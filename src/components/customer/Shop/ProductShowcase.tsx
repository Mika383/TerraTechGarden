import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Rate } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  getFeaturedTerrariums,
  getBestSellers,
  getTopRatedTerrariums,
  getNewestTerrariums,
  getEnvironmentById,
  getTerrariumById,
} from '@/api/terrarium';
import type { Terrarium, Environment, TankMethod } from '@/types/terrarium';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

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

const envCache = new Map<number, string>();
const tankMethodCache = new Map<number, string>();
const tankLabel = (tm?: Partial<TankMethod> | null) =>
  (tm?.tankMethodName?.trim() || tm?.tankMethodType?.trim() || '').trim();

const ProductShowcase: React.FC = () => {
  const [tab, setTab] = useState<TabKey>('featured');
  const [items, setItems] = useState<Array<Partial<Terrarium> & { environmentName?: string; tankMethodLabel?: string }>>([]);
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
        let list: Partial<Terrarium>[] = [];
        if (tab === 'featured') {
          list = await getFeaturedTerrariums(3);
        } else if (tab === 'bestSelling') {
          list = await getBestSellers(7, 3);
        } else {
          try {
            list = await getTopRatedTerrariums(3);
          } catch {
            const newest = await getNewestTerrariums(24);
            list = [...(newest || [])]
              .sort((a: any, b: any) => {
                const ar = Number(a?.averageRating ?? 0);
                const br = Number(b?.averageRating ?? 0);
                if (br !== ar) return br - ar;
                const ac = Number(a?.feedbackCount ?? 0);
                const bc = Number(b?.feedbackCount ?? 0);
                return bc - ac;
              })
              .slice(0, 3);
          }
        }

        // Enrich để có environmentName & tankMethodLabel giống Shop
        const enriched = await Promise.all(
          (list || []).filter((i) => i?.terrariumId).map(async (raw) => {
            const t = { ...raw };

            let envName: string | undefined;
            if (typeof t.environmentId === 'number') {
              if (envCache.has(t.environmentId)) {
                envName = envCache.get(t.environmentId);
              } else {
                try {
                  const env = await getEnvironmentById(t.environmentId);
                  envName = (env as Environment)?.environmentName;
                  if (envName) envCache.set(t.environmentId, envName);
                } catch {}
              }
            }

            let tmLabel: string | undefined;
            if (typeof t.tankMethodId === 'number') {
              if (tankMethodCache.has(t.tankMethodId)) {
                tmLabel = tankMethodCache.get(t.tankMethodId);
              } else {
                try {
                  const full = await getTerrariumById(Number(t.terrariumId));
                  const tmObj = full?.tankMethod ?? { tankMethodId: t.tankMethodId, tankMethodName: undefined, tankMethodType: undefined };
                  tmLabel = tankLabel(tmObj);
                  if (tmLabel) tankMethodCache.set(Number(tmObj.tankMethodId), tmLabel);
                } catch {}
              }
            }

            return { ...t, environmentName: envName, tankMethodLabel: tmLabel };
          })
        );

        if (!mountedRef.current) return;
        setItems(enriched);
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
        gsap.fromTo(card, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, delay: index * 0.1, ease: 'power2.out' });
      });
    }, sectionRef);

    return () => gsapContext.current?.revert();
  }, [loading, items, tab]);

  const top3 = useMemo(() => items.slice(0, 3), [items]);

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
              const t = raw as Partial<Terrarium> & { environmentName?: string; tankMethodLabel?: string };
              const image =
                (t as any)?.thumbnailUrl ||
                (t as any)?.terrariumImages?.[0]?.imageUrl ||
                miniForest;
              const rating = Number((t as any)?.averageRating ?? (t as any)?.rating ?? 0);
              const purchases = Number((t as any)?.purchaseCount ?? (t as any)?.soldQuantity ?? (t as any)?.purchases ?? 0);

              return (
                <div
                  key={loading ? idx : (t?.terrariumId ?? idx)}
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
                          alt={t?.terrariumName || 'Terrarium'}
                          className="w-full h-full object-cover transition-transform duration-200 hover:scale-110"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = miniForest; }}
                        />
                        {/* 👇 Badge môi trường học từ Shop */}
                        {!!t?.environmentName && (
                          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
                            <EnvironmentOutlined style={{ fontSize: 16 }} className="text-emerald-700" />
                            <span className="text-xs font-medium text-emerald-700">{t.environmentName}</span>
                          </div>
                        )}
                      </div>

                      <div className="p-5">
                        <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-2">
                          {t?.terrariumName}
                        </h3>

                        {/* 👇 Tag tank method (VD: “Mở hoàn toàn”) */}
                        {!!t?.tankMethodLabel && (
                          <div className="inline-block text-xs px-2 py-1 rounded-full bg-green-50 text-emerald-700 border border-emerald-100 mb-2">
                            {t.tankMethodLabel}
                          </div>
                        )}

                        <div className="flex items-center justify-between mb-3">
                          <div className="text-emerald-600 font-bold text-lg">
                            {Number(t?.minPrice ?? 0).toLocaleString('vi-VN')} ₫
                          </div>
                          <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full flex items-center gap-1">
                            <HeartFilled className="text-emerald-500" />
                            {purchases} đã bán
                          </span>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                          <Rate allowHalf disabled value={rating} className="text-sm" />
                          <span className="text-xs text-gray-500">({rating.toFixed(1)}/5)</span>
                        </div>

                        <Button
                          type="primary"
                          className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 border-none font-semibold"
                          icon={<SearchOutlined />}
                          onClick={() => t?.terrariumId && navigate(`/terrarium/${t.terrariumId}`)}
                          disabled={!t?.terrariumId}
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
