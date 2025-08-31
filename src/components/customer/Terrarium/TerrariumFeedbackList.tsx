// src/components/terrarium/TerrariumFeedbackList.tsx
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { getTerrariumFeedbacks } from '@/api/feedback';
import type { FeedbackItem } from '@/types/feedback';
import { 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  Image as ImageIcon, 
  MessageSquare,
  StarHalf,
  StarOff,
  User,
  Calendar,
  Eye,
  X,
  ZoomIn,
  Filter,
  TrendingUp
} from 'lucide-react';
import gsap from 'gsap';

interface Props {
  terrariumId: number;
  pageSize?: number; // default 5
  className?: string;
}

const formatDateVN = (iso?: string) => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleString('vi-VN', { 
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return iso || '';
  }
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

// Enhanced Stars Component
const Stars: React.FC<{ value: number; size?: 'sm' | 'md' | 'lg' }> = ({ value, size = 'md' }) => {
  const rating = Math.max(0, Math.min(5, value));
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.5;
  const empty = 5 - full - (hasHalf ? 1 : 0);
  
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className="flex items-center gap-1" aria-label={`rating-${rating}`}>
      {Array.from({ length: full }).map((_, i) => (
        <Star
          key={`full-${i}`}
          className={`${sizeClasses[size]} fill-amber-400 text-amber-500 drop-shadow-sm`}
        />
      ))}
      {hasHalf && (
        <StarHalf className={`${sizeClasses[size]} fill-amber-400 text-amber-500 drop-shadow-sm`} />
      )}
      {Array.from({ length: empty }).map((_, i) => (
        <StarOff key={`empty-${i}`} className={`${sizeClasses[size]} text-gray-300`} />
      ))}
      <span className="ml-2 text-sm font-medium text-gray-700">
        {rating.toFixed(1)}
      </span>
    </div>
  );
};

// Normalize images helper
const normalizeImages = (arr: any): string[] =>
  (Array.isArray(arr) ? arr : [])
    .map((it) => (typeof it === 'string' ? it : it?.url))
    .filter((u): u is string => typeof u === 'string' && u.trim().length > 0);

// Enhanced Image Preview with lightbox
const ImagePreview: React.FC<{ images: any[] }> = ({ images }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const urls = useMemo(() => normalizeImages(images), [images]);
  const lightboxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (openIndex !== null && lightboxRef.current) {
      gsap.fromTo(lightboxRef.current,
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" }
      );
    }
  }, [openIndex]);

  if (!urls.length) return null;

  const handleNext = () => {
    setOpenIndex((prev) => prev !== null ? (prev + 1) % urls.length : 0);
  };

  const handlePrev = () => {
    setOpenIndex((prev) => prev !== null ? (prev - 1 + urls.length) % urls.length : 0);
  };

  return (
    <>
      <div className="mt-4">
        <div className="flex items-center gap-2 mb-2">
          <ImageIcon className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">
            Hình ảnh ({urls.length})
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {urls.slice(0, 4).map((src, idx) => (
            <button
              key={idx}
              onClick={() => setOpenIndex(idx)}
              className="relative group border-2 border-gray-200 rounded-xl overflow-hidden hover:border-emerald-400 transition-all duration-300 hover:shadow-lg"
              aria-label={`Xem ảnh feedback ${idx + 1}`}
            >
              <img
                src={src}
                className="w-20 h-20 object-cover group-hover:scale-110 transition-transform duration-300"
                alt={`feedback-${idx + 1}`}
                onError={(e) => { 
                  (e.currentTarget as HTMLImageElement).src = '/TerraTechLogo.png'; 
                }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                <ZoomIn className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </button>
          ))}
          {urls.length > 4 && (
            <button
              onClick={() => setOpenIndex(4)}
              className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-500 hover:border-emerald-400 hover:text-emerald-600 transition-all duration-300"
            >
              <span className="text-sm font-medium">+{urls.length - 4}</span>
            </button>
          )}
        </div>
      </div>

      {/* Enhanced Lightbox */}
      {openIndex !== null && (
        <div
          ref={lightboxRef}
          className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpenIndex(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <img
              src={urls[openIndex]}
              className="max-h-full max-w-full object-contain rounded-xl shadow-2xl"
              alt={`preview-${openIndex + 1}`}
            />
            
            {/* Navigation */}
            {urls.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-gray-800 hover:bg-white transition-all duration-200"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-gray-800 hover:bg-white transition-all duration-200"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Close button */}
            <button
              onClick={() => setOpenIndex(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-gray-800 hover:bg-white transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Image counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm font-medium">
              {openIndex + 1} / {urls.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Enhanced Empty State
const EmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center text-gray-500 py-16 bg-gradient-to-br from-gray-50 to-white rounded-3xl border-2 border-dashed border-gray-200">
    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
      <MessageSquare className="w-10 h-10 text-gray-400" />
    </div>
    <h4 className="text-xl font-semibold text-gray-700 mb-2">Chưa có đánh giá</h4>
    <p className="text-gray-500 text-center max-w-md">
      Hãy trở thành người đầu tiên đánh giá sản phẩm này để giúp những khách hàng khác!
    </p>
  </div>
);

// Enhanced Skeleton
const SkeletonItem: React.FC = () => (
  <div className="animate-pulse p-6 bg-white border border-gray-200 rounded-2xl">
    <div className="flex items-start gap-4 mb-4">
      <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0" />
      <div className="flex-1">
        <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
        <div className="h-3 w-24 bg-gray-200 rounded" />
      </div>
    </div>
    <div className="space-y-2 mb-4">
      <div className="h-4 w-full bg-gray-200 rounded" />
      <div className="h-4 w-3/4 bg-gray-200 rounded" />
      <div className="h-4 w-1/2 bg-gray-200 rounded" />
    </div>
    <div className="flex gap-2">
      <div className="w-16 h-16 bg-gray-200 rounded-lg" />
      <div className="w-16 h-16 bg-gray-200 rounded-lg" />
      <div className="w-16 h-16 bg-gray-200 rounded-lg" />
    </div>
  </div>
);

// Rating Distribution Component
const RatingDistribution: React.FC<{ items: FeedbackItem[] }> = ({ items }) => {
  const distribution = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    items.forEach(item => {
      const rating = Math.max(1, Math.min(5, Math.floor(item.rating))) - 1;
      counts[rating]++;
    });
    const total = items.length || 1;
    return counts.map((count, index) => ({
      stars: 5 - index,
      count,
      percentage: (count / total) * 100
    }));
  }, [items]);

  const avgRating = useMemo(() => {
    if (!items.length) return 0;
    const sum = items.reduce((s, it) => s + (Number(it.rating) || 0), 0);
    return Math.round((sum / items.length) * 10) / 10;
  }, [items]);

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl border border-amber-200 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Overall Rating */}
        <div className="text-center md:text-left">
          <h4 className="text-lg font-semibold text-gray-800 mb-2">Đánh giá tổng quan</h4>
          <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
            <span className="text-4xl font-bold text-amber-600">{avgRating}</span>
            <div>
              <Stars value={avgRating} size="lg" />
              <p className="text-sm text-gray-600 mt-1">{items.length} đánh giá</p>
            </div>
          </div>
        </div>

        {/* Rating Bars */}
        <div className="space-y-2">
          {distribution.map((item) => (
            <div key={item.stars} className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 w-8">
                {item.stars}★
              </span>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-500"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
              <span className="text-sm text-gray-600 w-12 text-right">
                {item.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Main Component
const TerrariumFeedbackList: React.FC<Props> = ({ terrariumId, pageSize = 5, className }) => {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [filterRating, setFilterRating] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLDivElement>(null);

  // Animate items on load
  useEffect(() => {
    if (!loading && itemsRef.current && items.length > 0) {
      gsap.fromTo(itemsRef.current.children,
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1, ease: "power2.out" }
      );
    }
  }, [loading, items]);

  const filteredItems = useMemo(() => {
    if (filterRating === null) return items;
    return items.filter(item => Math.floor(item.rating) === filterRating);
  }, [items, filterRating]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    getTerrariumFeedbacks({ terrariumId, page, pageSize })
      .then((res) => {
        if (!mounted) return;
        const safe = (res.items || []).map((it) => ({
          ...it,
          images: normalizeImages((it as any).images),
        }));
        setItems(safe);
        setHasNext(safe.length === pageSize);
      })
      .catch((e) => {
        if (!mounted) return;
        setError(e?.message || 'Không thể tải feedback');
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [terrariumId, page, pageSize]);

  return (
    <section ref={containerRef} className={`mt-16 ${className || ''}`}>
      <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              Đánh giá từ khách hàng
            </h2>
            
            {/* Filter */}
            {items.length > 0 && (
              <div className="flex items-center gap-3">
                <Filter className="w-4 h-4 text-gray-600" />
                <select
                  value={filterRating || ''}
                  onChange={(e) => setFilterRating(e.target.value ? Number(e.target.value) : null)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="">Tất cả đánh giá</option>
                  <option value="5">5 sao</option>
                  <option value="4">4 sao</option>
                  <option value="3">3 sao</option>
                  <option value="2">2 sao</option>
                  <option value="1">1 sao</option>
                </select>
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonItem key={i} />
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-6 bg-red-50 border-2 border-red-200 text-red-700 rounded-2xl text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <X className="w-6 h-6 text-red-500" />
              </div>
              <p className="font-medium">{error}</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && items.length === 0 && <EmptyState />}

          {/* Content */}
          {!loading && !error && items.length > 0 && (
            <>
              {/* Rating Distribution */}
              <RatingDistribution items={items} />

              {/* Feedback Items */}
              <div ref={itemsRef} className="space-y-6">
                {filteredItems.map((fb) => (
                  <article
                    key={fb.feedbackId}
                    className="group p-6 border border-gray-200 rounded-2xl bg-white hover:shadow-lg hover:border-amber-300 transition-all duration-300"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center text-white font-semibold">
                          <User className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <Stars value={fb.rating} />
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDateVN(fb.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {fb.terrariumName && (
                        <div className="text-right">
                          <p className="text-sm text-gray-500 mb-1">Sản phẩm:</p>
                          <p className="text-sm font-medium text-gray-800 max-w-48 truncate">
                            {fb.terrariumName}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Comment */}
                    {fb.comment && (
                      <div className="mb-4">
                        <p className="text-gray-800 leading-relaxed text-base">
                          "{fb.comment}"
                        </p>
                      </div>
                    )}

                    {/* Images */}
                    <ImagePreview images={(fb as any).images || []} />
                  </article>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-8 mt-8 border-t border-gray-200">
                <button
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="font-medium">Trang trước</span>
                </button>

                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    Trang <span className="font-semibold text-gray-800">{page}</span>
                  </span>
                  {filteredItems.length !== items.length && (
                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                      Đã lọc: {filteredItems.length}/{items.length}
                    </span>
                  )}
                </div>

                <button
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!hasNext || loading}
                >
                  <span className="font-medium">Trang sau</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default TerrariumFeedbackList;