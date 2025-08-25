import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, X, Check, Search, Eye, Package } from 'lucide-react';

interface TerrariumImage {
  terrariumImageId: number;
  terrariumId: number;
  imageUrl: string;
}

interface Terrarium {
  terrariumId: number;
  environmentId: number;
  shapeId: number;
  tankMethodId: number;
  variantId: number | null;
  terrariumName: string;
  description: string;
  minPrice: number;
  maxPrice: number;
  stock: number;
  status: string;
  averageRating: number;
  feedbackCount: number;
  generatedByAI: boolean;
  purchaseCount: number;
  terrariumImages: TerrariumImage[];
}

interface TerrariumVariant {
  terrariumVariantId: number;
  terrariumId: number;
  variantName: string;
  price: number;
  stockQuantity: number;
  urlImage: string | null;
  createdAt: string | null;
  updatedAt: string;
}

interface SelectedTerrariumVariant extends TerrariumVariant {
  terrariumName: string;
  quantity: number;
}

interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

interface PaginationData<T> {
  results: T[];
  totalPages: number;
  totalRecords: number;
  pageNumber: number;
  pageSize: number;
  isPagination: boolean;
}

interface Step5Props {
  selectedTerrariumVariants: SelectedTerrariumVariant[];
  onSelectionChange: (variants: SelectedTerrariumVariant[]) => void;
  onNext: () => void;
  onPrev: () => void;
}

const Step5TerrariumVariant: React.FC<Step5Props> = ({
  selectedTerrariumVariants,
  onSelectionChange,
  onNext,
  onPrev,
}) => {
  const [terrariums, setTerrariums] = useState<Terrarium[]>([]);
  const [selectedTerrarium, setSelectedTerrarium] = useState<Terrarium | null>(null);
  const [terrariumVariants, setTerrariumVariants] = useState<TerrariumVariant[]>([]);
  const [filteredTerrariums, setFilteredTerrariums] = useState<Terrarium[]>([]);
  const [loadingTerrariums, setLoadingTerrariums] = useState(true);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 6,
    totalPages: 1,
  });
  const [isModalOpen, setIsModalOpen] = useState(false); // New state for modal

  useEffect(() => {
    fetchTerrariums();
  }, [pagination.pageNumber]);

  useEffect(() => {
    if (selectedTerrarium) {
      fetchTerrariumVariants(selectedTerrarium.terrariumId);
      setSearchTerm('');
    }
  }, [selectedTerrarium]);

  const fetchTerrariums = async () => {
    try {
      setLoadingTerrariums(true);
      setError(null);
      const response = await fetch(
        `https://terarium.shop/api/Terrarium/get-all?Pagination.PageNumber=${pagination.pageNumber}&Pagination.PageSize=${pagination.pageSize}&IncludeProperties=TerrariumImages`
      );
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const result: ApiResponse<PaginationData<Terrarium>> = await response.json();
      if (result.status !== 200) throw new Error(result.message || 'Failed to fetch terrariums');
      
      setTerrariums(result.data.results);
      setFilteredTerrariums(result.data.results);
      setPagination(prev => ({
        ...prev,
        totalPages: result.data.totalPages,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoadingTerrariums(false);
    }
  };

  const fetchTerrariumVariants = async (terrariumId: number) => {
    try {
      setLoadingVariants(true);
      setError(null);
      const response = await fetch(`https://terarium.shop/api/TerrariumVariant/get-VariantByTerrarium/${terrariumId}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const result: ApiResponse<TerrariumVariant[]> = await response.json();
      if (result.status !== 200) throw new Error(result.message || 'Failed to fetch terrarium variants');
      
      setTerrariumVariants(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setTerrariumVariants([]);
    } finally {
      setLoadingVariants(false);
    }
  };

  const searchTerrariums = useCallback((term: string) => {
    if (!term.trim()) {
      setFilteredTerrariums(terrariums);
      return;
    }

    const lowerTerm = term.toLowerCase();
    const filtered = terrariums.filter(
      (terrarium) =>
        terrarium.terrariumName.toLowerCase().includes(lowerTerm) ||
        terrarium.description.toLowerCase().includes(lowerTerm)
    );
    setFilteredTerrariums(filtered);
  }, [terrariums]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    searchTerrariums(value);
  }, [searchTerrariums]);

  const handleTerrariumSelect = (terrarium: Terrarium) => {
    setSelectedTerrarium(terrarium);
    setIsModalOpen(true); // Open modal when selecting terrarium
    setTerrariumVariants([]); // Reset variants
  };

  const handleVariantQuantityChange = (variant: TerrariumVariant, quantity: number) => {
    if (!selectedTerrarium) return;

    const newSelection = [...selectedTerrariumVariants];
    const existingIndex = newSelection.findIndex(
      (v) => v.terrariumVariantId === variant.terrariumVariantId
    );

    if (quantity > 0) {
      const selectedVariant: SelectedTerrariumVariant = {
        ...variant,
        terrariumName: selectedTerrarium.terrariumName,
        quantity,
      };

      if (existingIndex >= 0) {
        newSelection[existingIndex] = selectedVariant;
      } else {
        newSelection.push(selectedVariant);
      }
    } else {
      if (existingIndex >= 0) {
        newSelection.splice(existingIndex, 1);
      }
    }

    onSelectionChange(newSelection);
  };

  const getSelectedQuantity = (variantId: number): number => {
    const selected = selectedTerrariumVariants.find(
      (v) => v.terrariumVariantId === variantId
    );
    return selected ? selected.quantity : 0;
  };

  const clearSearch = () => {
    setSearchTerm('');
    setFilteredTerrariums(terrariums);
  };

  const removeVariant = (variantId: number) => {
    onSelectionChange(selectedTerrariumVariants.filter((v) => v.terrariumVariantId !== variantId));
  };

  const clearAllSelected = () => {
    onSelectionChange([]);
  };

  const highlightText = (text: string, term: string) => {
    if (!term.trim()) return text;
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$1')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 px-0.5">$1</mark>');
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, pageNumber: newPage }));
  };

  const closeModal = () => {
    setIsModalOpen(false);
    // Optional: setSelectedTerrarium(null); if you want to reset selection
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Bước 5: Chọn Terrarium Variant</h2>
        <p className="text-gray-600">Chọn các biến thể terrarium cho combo của bạn (tùy chọn)</p>
      </div>

      {/* Selected Terrarium Variants */}
      {selectedTerrariumVariants.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-green-900">
              Terrarium Variant đã chọn ({selectedTerrariumVariants.length})
            </h3>
            <button
              onClick={clearAllSelected}
              className="text-sm text-green-600 hover:text-green-800"
              type="button"
              aria-label="Xóa tất cả terrarium variant đã chọn"
            >
              Xóa tất cả
            </button>
          </div>
          <div className="space-y-2">
            {selectedTerrariumVariants.map((variant) => (
              <div
                key={variant.terrariumVariantId}
                className="flex items-center justify-between p-3 bg-green-100 rounded-lg border border-green-300"
              >
                <div className="flex-1">
                  <div className="font-medium text-green-900">
                    {variant.terrariumName} - {variant.variantName}
                  </div>
                  <div className="text-sm text-green-700">
                    Giá: {variant.price.toLocaleString()} VNĐ | Số lượng: {variant.quantity} | 
                    Tồn kho: {variant.stockQuantity}
                  </div>
                </div>
                <button
                  onClick={() => removeVariant(variant.terrariumVariantId)}
                  className="ml-2 p-1 rounded-full text-green-400 hover:bg-green-200 hover:text-green-600"
                  type="button"
                  aria-label={`Xóa ${variant.variantName}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-green-200">
            <span className="text-sm font-medium text-green-900">
              Tổng giá trị: {selectedTerrariumVariants.reduce((sum, variant) => sum + (variant.price * variant.quantity), 0).toLocaleString()} VNĐ
            </span>
          </div>
        </div>
      )}

      {/* Terrarium Selection */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Chọn Terrarium</h3>
        
        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm terrarium..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Tìm kiếm terrarium"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                type="button"
                aria-label="Xóa tìm kiếm"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {loadingTerrariums ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600">Đang tải terrarium...</span>
          </div>
        ) : error ? (
          <div className="px-4 py-8 text-center text-red-600">
            <AlertCircle className="w-6 h-6 mx-auto mb-2" />
            {error}
            <button
              onClick={fetchTerrariums}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              type="button"
              aria-label="Thử lại tải terrarium"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {filteredTerrariums.map((terrarium) => (
                <div
                  key={terrarium.terrariumId}
                  onClick={() => handleTerrariumSelect(terrarium)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedTerrarium?.terrariumId === terrarium.terrariumId
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleTerrariumSelect(terrarium);
                    }
                  }}
                  aria-label={`Chọn terrarium ${terrarium.terrariumName}`}
                >
                  {terrarium.terrariumImages.length > 0 ? (
                    <img
                      src={terrarium.terrariumImages[0].imageUrl}
                      alt={terrarium.terrariumName}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCA0OEM0MCA0NC42ODYzIDQyLjY4NjMgNDIgNDYgNDJINDhDNTEuMzEzNyA0MiA1NCA0NC42ODYzIDU0IDQ4VjUwQzU0IDUzLjMxMzcgNTEuMzEzNyA1NiA0OCA1Nkg0NkM0Mi42ODYzIDU2IDQwIDUzLjMxMzcgNDAgNTBWNDhaIiBmaWxsPSIjOUI5Qjk4Ii8+CjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMzIgMzJDMjcuNTgyIDMyIDI0IDM1LjU4MiAyNCA0MEwyNCA4OEMyNCA5Mi40MTggMjcuNTgyIDk2IDMyIDk2TDk2IDk2QzEwMC40MTggOTYgMTA0IDkyLjQxOCAxMDQgODhMMTA0IDQwQzEwNCAzNS41ODIgMTAwLjQxOCAzMiA5NiAzMkwzMiAzMlpNMzIgODhMNzIuODQzIDQ3LjE1N0M3My42MjUgNDYuMzc1IDc0Ljg3NSA0Ni4zNzUgNzUuNjU3IDQ3LjE1N0w4OCA2MEw5MiA1NkM5Mi43ODEgNTUuMjE5IDk0LjIxOSA1NS4yMTkgOTUgNTZMOTYgNTdWODhDOTYgODguNzk2IDk1LjM2NCA4OS40MyA5NC41NjggODkuNDNMMzIgODhaTTMyIDQwQzMyIDM5LjIwNCAzMi42MzYgMzguNTY4IDMzLjQzMiAzOC41NjhMNzYuNjYgMzguNTY4SDk2Qzk2Ljc5NiAzOC41NjggOTcuNDMyIDM5LjIwNCA5Ny40MzIgNDBWNDguNjU3TDkzIDUzLjY1N0w5MCA1MC42NTdDODkuMjE5IDQ5Ljg3NiA4Ny43ODEgNDkuODc2IDg3IDUwLjY1N0w4NiA1MS42NTdMODQgNTMuNjU3TDczLjI1NyA0NC4yNzVDNzIuNDc1IDQzLjQ5MyA3MS4xMjUgNDMuNDkzIDcwLjM0MyA0NC4yNzVMMzIgODIuNjE4TDMyIDQwWiIgZmlsbD0iIzlCOUI5OCIvPgo8L3N2Zz4K';
                      }}
                    />
                  ) : (
                    <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center mb-3">
                      <Package className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <h4 className="font-medium text-gray-900 mb-2">
                    <span
                      dangerouslySetInnerHTML={{
                        __html: highlightText(terrarium.terrariumName, searchTerm),
                      }}
                    />
                  </h4>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    <span
                      dangerouslySetInnerHTML={{
                        __html: highlightText(terrarium.description, searchTerm),
                      }}
                    />
                  </p>
                  <div className="text-sm text-gray-500">
                    <div>Giá: {terrarium.minPrice.toLocaleString()} - {terrarium.maxPrice.toLocaleString()} VNĐ</div>
                    <div>Tồn kho: {terrarium.stock}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.pageNumber - 1)}
                  disabled={pagination.pageNumber === 1}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                >
                  Trước
                </button>
                <span className="px-3 py-1 text-sm">
                  Trang {pagination.pageNumber} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.pageNumber + 1)}
                  disabled={pagination.pageNumber === pagination.totalPages}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal for Terrarium Variants */}
      {isModalOpen && selectedTerrarium && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 p-6 relative max-h-[80vh] overflow-y-auto">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              aria-label="Đóng modal"
            >
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Biến thể của "{selectedTerrarium.terrariumName}"
            </h3>
            <div className="border border-gray-300 rounded-lg bg-white">
              {loadingVariants ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Đang tải biến thể...
                </div>
              ) : error ? (
                <div className="px-4 py-8 text-center text-red-600">
                  <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                  {error}
                  <button
                    onClick={() => fetchTerrariumVariants(selectedTerrarium.terrariumId)}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                    type="button"
                    aria-label="Thử lại tải biến thể"
                  >
                    Thử lại
                  </button>
                </div>
              ) : terrariumVariants.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  Terrarium này không có biến thể nào
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {terrariumVariants.map((variant) => (
                    <div key={variant.terrariumVariantId} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{variant.variantName}</h4>
                          <div className="text-sm text-gray-600 mt-1">
                            <div>Giá: {variant.price.toLocaleString()} VNĐ</div>
                            <div>Tồn kho: {variant.stockQuantity}</div>
                            {variant.updatedAt && (
                              <div>Cập nhật: {new Date(variant.updatedAt).toLocaleDateString()}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <label className="text-sm text-gray-600">Số lượng:</label>
                          <input
                            type="number"
                            min="0"
                            max={variant.stockQuantity}
                            value={getSelectedQuantity(variant.terrariumVariantId)}
                            onChange={(e) => handleVariantQuantityChange(variant, parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      {variant.urlImage && (
                        <div className="mt-3">
                          <img
                            src={variant.urlImage}
                            alt={variant.variantName}
                            className="w-20 h-20 object-cover rounded border"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onPrev}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800"
          aria-label="Quay lại bước trước"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Quay lại
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          aria-label="Tiếp tục đến bước tiếp theo"
        >
          Tiếp theo
          <ChevronRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default Step5TerrariumVariant;