// src/components/terrarium/TerrariumFeedbackList.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { getTerrariumFeedbacks } from '@/api/feedback';
import type { FeedbackItem } from '@/types/feedback';
import { Star, ChevronLeft, ChevronRight, Image as ImageIcon, MessageSquare } from 'lucide-react';

interface Props {
  terrariumId: number;
  pageSize?: number; // default 5
  className?: string;
}

const formatDateVN = (iso?: string) => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleString('vi-VN', { hour12: false });
  } catch {
    return iso || '';
  }
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const Stars: React.FC<{ value: number }> = ({ value }) => {
  const full = clamp(Math.round(value), 0, 5);
  return (
    <div className="flex items-center gap-1" aria-label={`rating-${full}`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < full ? 'fill-yellow-400 stroke-yellow-500' : 'stroke-gray-300'}`}
        />
      ))}
      <span className="ml-1 text-sm text-gray-600">({value}/5)</span>
    </div>
  );
};

const ImagePreview: React.FC<{ images: string[] }> = ({ images }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  if (!images?.length) return null;

  return (
    <>
      <div className="mt-2 flex flex-wrap gap-2">
        {images.map((src, idx) => (
          <button
            key={idx}
            onClick={() => setOpenIndex(idx)}
            className="border rounded-md overflow-hidden hover:opacity-90 focus:outline-none"
            aria-label={`Xem ảnh feedback ${idx + 1}`}
          >
            <img
              src={src.startsWith('data:') ? src : src}
              className="w-16 h-16 object-cover"
              alt={`feedback-${idx + 1}`}
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/TerraTechLogo.png'; }}
            />
          </button>
        ))}
      </div>

      {/* Lightbox tối giản */}
      {openIndex !== null && (
        <div
          className="fixed inset-0 z-[1000] bg-black/70 flex items-center justify-center p-4"
          onClick={() => setOpenIndex(null)}
          role="dialog"
          aria-modal="true"
        >
          <img
            src={images[openIndex]}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
            alt={`preview-${openIndex + 1}`}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

const EmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center text-gray-500 py-8">
    <MessageSquare className="w-8 h-8 mb-2" />
    <p>Chưa có đánh giá nào cho terrarium này.</p>
  </div>
);

const SkeletonItem: React.FC = () => (
  <div className="animate-pulse p-4 bg-gray-50 border rounded-xl">
    <div className="h-4 w-40 bg-gray-200 rounded mb-2" />
    <div className="h-4 w-24 bg-gray-200 rounded mb-3" />
    <div className="h-4 w-full bg-gray-200 rounded mb-1" />
    <div className="h-4 w-2/3 bg-gray-200 rounded" />
  </div>
);

const TerrariumFeedbackList: React.FC<Props> = ({ terrariumId, pageSize = 5, className }) => {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Vì backend chưa trả total, ta sẽ fetch theo page; nếu trả về ít hơn pageSize → không còn trang sau
  const [hasNext, setHasNext] = useState(false);

  const avgRating = useMemo(() => {
    if (!items.length) return 0;
    const sum = items.reduce((s, it) => s + (Number(it.rating) || 0), 0);
    return Math.round((sum / items.length) * 10) / 10;
  }, [items]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    getTerrariumFeedbacks({ terrariumId, page, pageSize })
      .then((res) => {
        if (!mounted) return;
        setItems(res.items || []);
        setHasNext((res.items || []).length === pageSize);
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
    <section className={`mt-10 ${className || ''}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Đánh giá từ khách hàng
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 hidden sm:inline">Điểm trung bình</span>
          <Stars value={avgRating} />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3">
        {loading && (
          <>
            <SkeletonItem />
            <SkeletonItem />
            <SkeletonItem />
          </>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
            {error}
          </div>
        )}

        {!loading && !error && items.length === 0 && <EmptyState />}

        {!loading && !error && items.length > 0 && (
          <>
            {items.map((fb) => (
              <article
                key={fb.feedbackId}
                className="p-4 border rounded-xl bg-white shadow-sm hover:shadow transition"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Stars value={fb.rating} />
                    <span className="text-xs text-gray-500">
                      {formatDateVN(fb.createdAt)}
                    </span>
                  </div>
                  {/* Nếu muốn: tên sp */}
                  {fb.terrariumName && (
                    <span className="text-xs text-gray-600 italic truncate max-w-[40ch]">
                      {fb.terrariumName}
                    </span>
                  )}
                </div>

                {fb.comment && (
                  <p className="mt-2 text-gray-800 leading-relaxed">{fb.comment}</p>
                )}

                <ImagePreview images={fb.images || []} />
              </article>
            ))}

            {/* Pagination tối giản (prev/next) */}
            <div className="flex items-center justify-between pt-3">
              <button
                className="px-3 py-2 rounded-lg border bg-gray-50 hover:bg-gray-100 disabled:opacity-50 flex items-center gap-1"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
              >
                <ChevronLeft className="w-4 h-4" /> Trước
              </button>

              <span className="text-sm text-gray-600">
                Trang <b>{page}</b>
              </span>

              <button
                className="px-3 py-2 rounded-lg border bg-gray-50 hover:bg-gray-100 disabled:opacity-50 flex items-center gap-1"
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasNext || loading}
              >
                Sau <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default TerrariumFeedbackList;
