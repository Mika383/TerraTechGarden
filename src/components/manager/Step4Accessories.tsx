import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, X, Check, Search } from 'lucide-react';

// Define a more specific type for accessory images
interface AccessoryImage {
  id: number;
  url: string;
  alt?: string;
}

interface Category {
  categoryId: number;
  categoryName: string;
  description: string;
}

interface Accessory {
  accessoryId: number;
  name: string;
  size: string;
  description: string;
  price: number;
  stockQuantity: number;
  categoryId: number;
  createdAt: string;
  updatedAt: string;
  status: string;
  accessoryImages: AccessoryImage[];
}

interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

interface Step4Props {
  selectedAccessories: Accessory[];
  onSelectionChange: (accessories: Accessory[]) => void;
  onNext: () => void;
  onPrev: () => void;
}

const Step4Accessories: React.FC<Step4Props> = ({
  selectedAccessories,
  onSelectionChange,
  onNext,
  onPrev,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [filteredAccessories, setFilteredAccessories] = useState<Accessory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingAccessories, setLoadingAccessories] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCategories();

    return () => {
      // No need to clean up searchTimeout since we use useCallback for search
    };
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchAccessoriesByCategory(selectedCategory.categoryId);
      setSearchTerm('');
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      setError(null);
      const response = await fetch('https://terarium.shop/api/Category/get-all');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result: ApiResponse<Category[]> = await response.json();
      if (result.status !== 200) throw new Error(result.message || 'Failed to fetch categories');
      setCategories(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchAccessoriesByCategory = async (categoryId: number) => {
    try {
      setLoadingAccessories(true);
      setError(null);
      const response = await fetch(`https://terarium.shop/api/Accessory/filter-by-category/${categoryId}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result: ApiResponse<Accessory[]> = await response.json();
      if (result.status !== 200) throw new Error(result.message || 'Failed to fetch accessories');
      setAccessories(result.data);
      setFilteredAccessories(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setAccessories([]);
      setFilteredAccessories([]);
    } finally {
      setLoadingAccessories(false);
    }
  };

  // Use useCallback to memoize the search function
  const searchAccessories = useCallback((term: string) => {
    if (!term.trim()) {
      setFilteredAccessories(accessories);
      return;
    }

    const lowerTerm = term.toLowerCase();
    const filtered = accessories.filter(
      (accessory) =>
        accessory.name.toLowerCase().includes(lowerTerm) ||
        accessory.description.toLowerCase().includes(lowerTerm)
    );
    setFilteredAccessories(filtered);
  }, [accessories]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    searchAccessories(value);
  }, [searchAccessories]);

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
  };

  const handleToggleAccessory = (accessory: Accessory) => {
    const newSelection = selectedAccessories.some((a) => a.accessoryId === accessory.accessoryId)
      ? selectedAccessories.filter((a) => a.accessoryId !== accessory.accessoryId)
      : [...selectedAccessories, accessory];
    onSelectionChange(newSelection);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setFilteredAccessories(accessories);
  };

  const removeAccessory = (accessoryId: number) => {
    onSelectionChange(selectedAccessories.filter((a) => a.accessoryId !== accessoryId));
  };

  const clearAllSelected = () => {
    onSelectionChange([]);
  };

  // Helper function to highlight search term safely
  const highlightText = (text: string, term: string) => {
    if (!term.trim()) return text;
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$1')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 px-0.5">$1</mark>');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Bước 4: Chọn Phụ Kiện</h2>
        <p className="text-gray-600">Chọn các phụ kiện bổ sung cho terrarium của bạn (tùy chọn)</p>
      </div>

      {/* Selected Accessories */}
      {selectedAccessories.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-blue-900">
              Phụ kiện đã chọn ({selectedAccessories.length})
            </h3>
            <button
              onClick={clearAllSelected}
              className="text-sm text-blue-600 hover:text-blue-800"
              type="button"
              aria-label="Xóa tất cả phụ kiện đã chọn"
            >
              Xóa tất cả
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedAccessories.map((accessory) => (
              <div
                key={accessory.accessoryId}
                className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-blue-100 text-blue-800 border border-blue-300"
              >
                <span className="truncate max-w-32" title={accessory.name}>
                  {accessory.name}
                </span>
                <span className="ml-2 text-xs text-blue-600">
                  ({accessory.price.toLocaleString()} VNĐ)
                </span>
                <button
                  onClick={() => removeAccessory(accessory.accessoryId)}
                  className="ml-2 inline-flex items-center p-0.5 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-600"
                  type="button"
                  aria-label={`Xóa ${accessory.name}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-blue-200">
            <span className="text-sm font-medium text-blue-900">
              Tổng giá trị: {selectedAccessories.reduce((sum, acc) => sum + acc.price, 0).toLocaleString()} VNĐ
            </span>
          </div>
        </div>
      )}

      {/* Category Selection */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Chọn danh mục phụ kiện</h3>
        {loadingCategories ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600">Đang tải danh mục...</span>
          </div>
        ) : error ? (
          <div className="px-4 py-8 text-center text-red-600">
            <AlertCircle className="w-6 h-6 mx-auto mb-2" />
            {error}
            <button
              onClick={fetchCategories}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              type="button"
              aria-label="Thử lại tải danh mục"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {categories.map((category) => (
              <button
                key={category.categoryId}
                onClick={() => handleCategorySelect(category)}
                className={`p-3 text-left border-2 rounded-lg transition-all duration-200 hover:shadow-sm ${
                  selectedCategory?.categoryId === category.categoryId
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                aria-label={`Chọn danh mục ${category.categoryName}`}
              >
                <div className="font-medium text-sm">{category.categoryName}</div>
                <div className="text-xs text-gray-500 mt-1 line-clamp-2">{category.description}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Accessories List */}
      {selectedCategory && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Phụ kiện từ danh mục "{selectedCategory.categoryName}"
          </h3>
          <div className="border border-gray-300 rounded-lg bg-white">
            {/* Search */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm phụ kiện..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Tìm kiếm phụ kiện"
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

            {/* Results */}
            <div className="max-h-80 overflow-auto">
              {loadingAccessories ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Đang tải phụ kiện...
                </div>
              ) : error ? (
                <div className="px-4 py-8 text-center text-red-600">
                  <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                  {error}
                  <button
                    onClick={() => fetchAccessoriesByCategory(selectedCategory.categoryId)}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                    type="button"
                    aria-label="Thử lại tải phụ kiện"
                  >
                    Thử lại
                  </button>
                </div>
              ) : filteredAccessories.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  {searchTerm
                    ? `Không tìm thấy phụ kiện nào cho "${searchTerm}"`
                    : 'Không có phụ kiện trong danh mục này'}
                </div>
              ) : (
                <>
                  {searchTerm && (
                    <div className="px-4 py-2 text-xs text-gray-600 bg-blue-50 border-b border-gray-200">
                      Tìm thấy {filteredAccessories.length} kết quả cho "{searchTerm}"
                    </div>
                  )}
                  {filteredAccessories.map((accessory) => (
                    <div
                      key={accessory.accessoryId}
                      onClick={() => handleToggleAccessory(accessory)}
                      className={`px-4 py-4 hover:bg-blue-50 transition-colors duration-150 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                        selectedAccessories.some((a) => a.accessoryId === accessory.accessoryId)
                          ? 'bg-blue-100'
                          : ''
                      }`}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleToggleAccessory(accessory);
                        }
                      }}
                      aria-label={`Chọn hoặc bỏ chọn ${accessory.name}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900">
                            <span
                              dangerouslySetInnerHTML={{
                                __html: highlightText(accessory.name, searchTerm),
                              }}
                            />
                          </div>
                          <div className="text-sm text-gray-500 mt-1 space-y-1">
                            <div>
                              Mô tả:{' '}
                              <span
                                dangerouslySetInnerHTML={{
                                  __html: highlightText(accessory.description, searchTerm),
                                }}
                              />
                            </div>
                            <div className="flex space-x-4">
                              <span>Kích thước: {accessory.size || 'Không có'}</span>
                              <span>Giá: {accessory.price.toLocaleString()} VNĐ</span>
                              <span>Tồn kho: {accessory.stockQuantity}</span>
                            </div>
                          </div>
                        </div>
                        {selectedAccessories.some((a) => a.accessoryId === accessory.accessoryId) && (
                          <Check className="w-5 h-5 text-blue-600 ml-3 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
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

export default Step4Accessories;