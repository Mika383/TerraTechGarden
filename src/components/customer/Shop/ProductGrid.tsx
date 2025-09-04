import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import TerrariumCard from '../Terrarium/TerrariumCard';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface ProductGridProps {
  searchQuery: string;
  environmentId: number | null;
  shapeId: number | null;
  tankMethodId: number | null;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}

type Terrarium = {
  terrariumId: number;
  terrariumName: string;
  description?: string;
  minPrice?: number;
  environmentId: number;
  tankMethodId: number;
  terrariumImages?: { imageUrl: string }[];
};

const authHeaders = () => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const PAGE_SIZE = 9;

const ProductGrid: React.FC<ProductGridProps> = ({
  searchQuery,
  environmentId,
  shapeId,
  tankMethodId,
  page,
  setPage,
}) => {
  const [items, setItems] = useState<Terrarium[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        let data: any[] = [];
        if (searchQuery?.trim()) {
          const name = encodeURIComponent(searchQuery.trim());
          const res = await axios.get(`${BASE_URL}/Terrarium/get-by-terrariumname/${name}`, { headers: authHeaders() });
          data = res?.data?.data ?? res?.data ?? [];
        } else {
          const params: Record<string, any> = {};
          if (environmentId != null) params.environmentId = environmentId;
          if (shapeId != null) params.shapeId = shapeId;
          if (tankMethodId != null) params.tankMethodId = tankMethodId;
          const qs = new URLSearchParams(params).toString();
          const url = `${BASE_URL}/Terrarium/filter${qs ? `?${qs}` : ''}`;
          const res = await axios.get(url, { headers: authHeaders() });
          data = res?.data?.data ?? res?.data ?? [];
        }
        if (!ignore) {
          setItems(Array.isArray(data) ? data : []);
          setPage(1);
        }
      } catch (e) {
        if (!ignore) setItems([]);
        console.error('Load terrariums failed', e);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, environmentId, shapeId, tankMethodId]);

  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, page]);

  return (
    <>
      {loading && <div className="py-8 text-center text-gray-500">Đang tải...</div>}

      {!loading && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {paged.map((p) => (
              <TerrariumCard
                key={p.terrariumId}
                id={String(p.terrariumId)}
                name={p.terrariumName}
                description={p.description ?? ''}
                type={String(p.tankMethodId)}
                price={p.minPrice ?? 0}
                rating={0}
                purchases={0}
                image={p.terrariumImages?.[0]?.imageUrl || '/TerraTechLogo.png'}
                environmentName={String(p.environmentId)}
              />
            ))}
          </div>

          <div className="flex justify-center mt-6 space-x-3 md:space-x-4">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="px-3 md:px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 text-sm md:text-base font-roboto"
            >
              Trang trước
            </button>
            <span className="px-3 md:px-4 py-2 text-sm md:text-base font-roboto">
              Trang {page} / {Math.max(1, Math.ceil(items.length / PAGE_SIZE))}
            </span>
            <button
              onClick={() => setPage((prev) => (PAGE_SIZE * prev < items.length ? prev + 1 : prev))}
              disabled={PAGE_SIZE * page >= items.length}
              className="px-3 md:px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 text-sm md:text-base font-roboto"
            >
              Trang tiếp
            </button>
          </div>

          {!items.length && <div className="py-8 text-center text-gray-500">Không có terrarium phù hợp</div>}
        </>
      )}
    </>
  );
};

export default ProductGrid;
