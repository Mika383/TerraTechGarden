import React, { useEffect, useMemo, useState } from 'react';
import AccessoryCard from './AccessoryCard';
import { getAllAccessories } from '@/api/accessory';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const PAGE_SIZE = 9;

type Accessory = {
  accessoryId: number;
  name: string;
  description?: string;
  categoryId?: number;
  price: number;
  accessoryImages?: { imageUrl: string }[];
};

interface Props {
  searchQuery: string;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}

const authHeaders = () => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const AccessoryGrid: React.FC<Props> = ({ searchQuery, page, setPage }) => {
  const [items, setItems] = useState<Accessory[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false); // true khi đang search theo tên

  useEffect(() => {
    let ignore = false;

    (async () => {
      try {
        setLoading(true);
        const keyword = searchQuery?.trim();

        if (keyword) {
          // SEARCH BY NAME (không paging BE)
          setIsSearchMode(true);
          const name = encodeURIComponent(keyword);
          const res = await axios.get(`${BASE_URL}/Accessory/get-by-name/${name}`, {
            headers: authHeaders(),
          });
          const data: any[] = res?.data?.data ?? res?.data ?? [];
          if (!ignore) {
            setItems(Array.isArray(data) ? data : []);
            setPage(1); // reset khi đổi nguồn dữ liệu
          }
        } else {
          // GET ALL (paging BE)
          setIsSearchMode(false);
          const list = await getAllAccessories(page, PAGE_SIZE, true);
          if (!ignore) setItems(Array.isArray(list) ? list : []);
        }
      } catch (e) {
        if (!ignore) setItems([]);
        console.error('Load accessories failed', e);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => { ignore = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, page]);

  // Khi search (không có paging BE) → tự cắt trang ở FE
  const paged = useMemo(() => {
    if (!isSearchMode) return items; // paging do BE trả sẵn
    const start = (page - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, page, isSearchMode]);

  // Tính “có trang tiếp không”
  const canNext = useMemo(() => {
    if (isSearchMode) return page * PAGE_SIZE < items.length;
    return items.length === PAGE_SIZE; // BE: nếu trả < PAGE_SIZE coi như hết
  }, [items, page, isSearchMode]);

  return (
    <>
      {loading && <div className="py-8 text-center text-gray-500">Đang tải...</div>}

      {!loading && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {paged.map((a) => (
              <AccessoryCard
                key={a.accessoryId}
                id={String(a.accessoryId)}
                name={a.name}
                description={a.description ?? ''}
                categoryName={String(a.categoryId ?? '')}
                price={a.price}
                image={a.accessoryImages?.[0]?.imageUrl || '/TerraTechLogo.png'}
                page={page}
              />
            ))}
          </div>

          <div className="flex justify-center mt-6 space-x-3 md:space-x-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 md:px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 text-sm md:text-base font-roboto"
            >
              Trang trước
            </button>
            <span className="px-3 md:px-4 py-2 text-sm md:text-base font-roboto">
              Trang {page}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!canNext}
              className="px-3 md:px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 text-sm md:text-base font-roboto"
            >
              Trang tiếp
            </button>
          </div>

          {!paged.length && !loading && (
            <div className="py-8 text-center text-gray-500">Không có phụ kiện để hiển thị</div>
          )}
        </>
      )}
    </>
  );
};

export default AccessoryGrid;
