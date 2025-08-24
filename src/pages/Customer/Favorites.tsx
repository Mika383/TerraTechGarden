import React, { useEffect, useState, useMemo } from 'react';
import { FavoriteItem, getFavorites, removeFavorite } from '@/api/favorite';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const ITEMS_PER_PAGE = 8;

const Favorite: React.FC = () => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'accessory' | 'terrarium'>('all');
  const [page, setPage] = useState(1);

  // Load danh sách yêu thích
  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const list = await getFavorites();
      setFavorites(list);
    } catch {
      toast.error('Không thể tải danh sách yêu thích.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  // Filter + Pagination
  const filteredList = useMemo(() => {
    if (filter === 'all') return favorites;
    return favorites.filter(f => f.type === filter);
  }, [favorites, filter]);

  const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE);
  const paginatedList = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredList.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredList, page]);

  // Xử lý bỏ thích
  const onUnfavorite = async (favoriteId: number) => {
    try {
      setRemovingId(favoriteId);
      await removeFavorite(favoriteId);
      setFavorites(prev => prev.filter(f => f.favoriteId !== favoriteId));
      toast.info('Đã xoá khỏi yêu thích.');
    } catch {
      toast.error('Không thể xoá. Vui lòng thử lại.');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Sản phẩm yêu thích</h1>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value as any);
              setPage(1);
            }}
            className="border rounded px-3 py-1.5"
          >
            <option value="all">Tất cả</option>
            <option value="accessory">Phụ kiện</option>
            <option value="terrarium">Terrarium</option>
          </select>
          <button
            onClick={fetchFavorites}
            className="px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-sm"
          >
            Tải lại
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
            <div key={i} className="animate-pulse border rounded-lg p-3">
              <div className="h-28 bg-gray-200 rounded mb-2" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-1" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : paginatedList.length === 0 ? (
        <p className="text-gray-600">Không có sản phẩm yêu thích nào.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {paginatedList.map((f) => {
              const href =
                f.type === 'accessory'
                  ? `/accessory/${f.productId}`
                  : `/terrarium/${f.productId}`;
              return (
                <div
                  key={f.favoriteId}
                  className="border rounded-lg overflow-hidden bg-white shadow-sm flex flex-col"
                >
                  <Link to={href} className="block flex-1">
                    <img
                      src={f.thumbnailUrl || '/TerraTechLogo.png'}
                      alt={f.name}
                      className="w-full h-28 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          '/TerraTechLogo.png';
                      }}
                    />
                    <div className="px-3 py-2">
                      <div className="text-sm font-medium line-clamp-2">{f.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5 capitalize">{f.type}</div>
                      <div className="text-sm font-semibold text-green-700 mt-1">
                        {f.price.toLocaleString('vi-VN')} VND
                      </div>
                    </div>
                  </Link>
                  <div className="px-3 pb-3">
                    <button
                      onClick={() => onUnfavorite(f.favoriteId)}
                      disabled={removingId === f.favoriteId}
                      className={`w-full text-sm rounded px-3 py-1.5 border ${
                        removingId === f.favoriteId
                          ? 'opacity-60'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {removingId === f.favoriteId ? 'Đang xoá...' : 'Bỏ thích'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 border rounded disabled:opacity-50"
              >
                Trước
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setPage(idx + 1)}
                  className={`px-3 py-1.5 border rounded ${
                    page === idx + 1 ? 'bg-green-600 text-white' : ''
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 border rounded disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Favorite;
