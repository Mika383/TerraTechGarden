// src/components/accessory/AccessoryFeedbackList.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { getAccessoryFeedbacks } from '@/api/feedback';
import type { FeedbackItem } from '@/types/feedback';
import { Star, ChevronLeft, ChevronRight, MessageSquare, Images } from 'lucide-react';

interface Props {
  accessoryId: number;
  pageSize?: number; // default 20
  className?: string;
}

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const fmtVN = (iso?: string) => {
  if (!iso) return '';
  try { return new Date(iso).toLocaleString('vi-VN', { hour12: false }); } catch { return iso || ''; }
};

const Stars: React.FC<{ value: number }> = ({ value }) => {
  const full = clamp(Math.round(value), 0, 5);
  return (
    <div className="flex items-center gap-1">
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

// 🔧 Chuẩn hóa mảng ảnh về string[] để tránh lỗi .startsWith
const normalizeImages = (arr: any): string[] =>
  (Array.isArray(arr) ? arr : [])
    .map((it) => (typeof it === 'string' ? it : it?.url))
    .filter((u): u is string => typeof u === 'string' && u.trim().length > 0);

const ImagePreview: React.FC<{ images: any[] }> = ({ images }) => {
  const [open, setOpen] = useState<number | null>(null);
  const urls = useMemo(() => normalizeImages(images), [images]);
  if (!urls.length) return null;

  return (
    <>
      <div className="mt-2 flex flex-wrap gap-2">
        {urls.map((u, i) => (
          <button
            key={i}
            onClick={() => setOpen(i)}
            className="border rounded-md overflow-hidden hover:opacity-90"
            aria-label={`Xem ảnh ${i + 1}`}
          >
            <img
              src={u}
              alt={`fb-${i + 1}`}
              className="w-16 h-16 object-cover"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/TerraTechLogo.png'; }}
            />
          </button>
        ))}
      </div>

      {open !== null && (
        <div
          className="fixed inset-0 z-[1000] bg-black/70 flex items-center justify-center p-4"
          onClick={() => setOpen(null)}
        >
          <img
            src={urls[open]}
            alt={`preview-${open + 1}`}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center text-gray-500 py-8">
    <MessageSquare className="w-8 h-8 mb-2" />
    <p>Chưa có đánh giá nào cho phụ kiện này.</p>
  </div>
);

const Skeleton = () => (
  <div className="animate-pulse p-4 bg-gray-50 border rounded-xl">
    <div className="h-4 w-40 bg-gray-200 rounded mb-2" />
    <div className="h-4 w-24 bg-gray-200 rounded mb-3" />
    <div className="h-4 w-full bg-gray-200 rounded mb-1" />
    <div className="h-4 w-2/3 bg-gray-200 rounded" />
  </div>
);

const AccessoryFeedbackList: React.FC<Props> = ({ accessoryId, pageSize = 20, className }) => {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);

  const avg = useMemo(() => {
    if (!items.length) return 0;
    const s = items.reduce((acc, it) => acc + (Number(it.rating) || 0), 0);
    return Math.round((s / items.length) * 10) / 10;
  }, [items]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr(null);

    getAccessoryFeedbacks({ accessoryId, page, pageSize })
      .then((res) => {
        if (!alive) return;
        // an toàn dữ liệu: nếu API chưa normalize, vẫn hoạt động
        const safe = (res.items || []).map((it) => ({
          ...it,
          images: normalizeImages((it as any).images),
        }));
        setItems(safe);
        setHasNext(safe.length === pageSize);
      })
      .catch((e) => alive && setErr(e?.message || 'Không thể tải feedback'))
      .finally(() => alive && setLoading(false));

    return () => { alive = false; };
  }, [accessoryId, page, pageSize]);

  return (
    <section className={`mt-10 ${className || ''}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <Images className="w-5 h-5" />
          Đánh giá phụ kiện
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 hidden sm:inline">Điểm trung bình</span>
          <Stars value={avg} />
        </div>
      </div>

      <div className="space-y-3">
        {loading && (<><Skeleton /><Skeleton /><Skeleton /></>)}
        {err && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">{err}</div>}
        {!loading && !err && items.length === 0 && <EmptyState />}

        {!loading && !err && items.length > 0 && (
          <>
            {items.map((fb) => (
              <article key={fb.feedbackId} className="p-4 border rounded-xl bg-white shadow-sm hover:shadow transition">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Stars value={fb.rating} />
                    <span className="text-xs text-gray-500">{fmtVN(fb.createdAt)}</span>
                  </div>
                  {fb.accessoryName && (
                    <span className="text-xs text-gray-600 italic truncate max-w-[40ch]">
                      {fb.accessoryName}
                    </span>
                  )}
                </div>

                {fb.comment && <p className="mt-2 text-gray-800 leading-relaxed">{fb.comment}</p>}
                {/* Truyền "any[]" để ImagePreview tự normalize */}
                <ImagePreview images={(fb as any).images} />
              </article>
            ))}

            <div className="flex items-center justify-between pt-3">
              <button
                className="px-3 py-2 rounded-lg border bg-gray-50 hover:bg-gray-100 disabled:opacity-50 flex items-center gap-1"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
              >
                <ChevronLeft className="w-4 h-4" /> Trước
              </button>

              <span className="text-sm text-gray-600">Trang <b>{page}</b></span>

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

export default AccessoryFeedbackList;
