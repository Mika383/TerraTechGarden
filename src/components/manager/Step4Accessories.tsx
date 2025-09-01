import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, X, Check, Search, Plus, Minus } from 'lucide-react';

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

interface SelectedAccessory {
  accessoryId: number;
  quantity: number;
  accessory: Accessory;
}

interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

interface Step4Props {
  selectedAccessories: SelectedAccessory[];
  onSelectionChange: (accessories: SelectedAccessory[]) => void;
  onNext: () => void;
  onPrev: () => void;
  showPrevButton?: boolean;
}

const Step4Accessories: React.FC<Step4Props> = ({
  selectedAccessories,
  onSelectionChange,
  onNext,
  onPrev,
  showPrevButton = true,
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

  const addAccessory = (accessory: Accessory) => {
    const existingIndex = selectedAccessories.findIndex(a => a.accessoryId === accessory.accessoryId);
    if (existingIndex >= 0) {
      // Increase quantity if already exists
      const newSelection = [...selectedAccessories];
      newSelection[existingIndex].quantity += 1;
      onSelectionChange(newSelection);
    } else {
      // Add new accessory with quantity 1
      const newSelection = [...selectedAccessories, { 
        accessoryId: accessory.accessoryId, 
        quantity: 1, 
        accessory 
      }];
      onSelectionChange(newSelection);
    }
  };

  const updateAccessoryQuantity = (accessoryId: number, quantity: number) => {
    if (quantity <= 0) {
      removeAccessory(accessoryId);
      return;
    }

    const newSelection = selectedAccessories.map(a => 
      a.accessoryId === accessoryId ? { ...a, quantity } : a
    );
    onSelectionChange(newSelection);
  };

  const removeAccessory = (accessoryId: number) => {
    onSelectionChange(selectedAccessories.filter(a => a.accessoryId !== accessoryId));
  };

  const clearSearch = () => {
    setSearchTerm('');
    setFilteredAccessories(accessories);
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

  const getTotalPrice = () => {
    return selectedAccessories.reduce((sum, acc) => sum + (acc.accessory.price * acc.quantity), 0);
  };

  const getTotalQuantity = () => {
    return selectedAccessories.reduce((sum, acc) => sum + acc.quantity, 0);
  };

  const isAccessorySelected = (accessoryId: number) => {
    return selectedAccessories.some(a => a.accessoryId === accessoryId);
  };

  const getSelectedQuantity = (accessoryId: number) => {
    const selected = selectedAccessories.find(a => a.accessoryId === accessoryId);
    return selected ? selected.quantity : 0;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Chọn Phụ Kiện</h2>
        <p className="text-gray-600">Chọn các phụ kiện bổ sung cho terrarium của bạn (tùy chọn)</p>
      </div>

      {/* Selected Accessories */}
      {selectedAccessories.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-blue-900">
              Phụ kiện đã chọn ({getTotalQuantity()} sản phẩm)
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
          
          <div className="space-y-3">
            {selectedAccessories.map((selectedAcc) => (
              <div
                key={selectedAcc.accessoryId}
                className="flex items-center justify-between bg-white p-3 rounded-lg border border-blue-300"
              >
                <div className="flex-1">
                  <div className="font-medium text-blue-900">{selectedAcc.accessory.name}</div>
                  <div className="text-sm text-blue-600">
                    {selectedAcc.accessory.price.toLocaleString()} VNĐ × {selectedAcc.quantity} = {' '}
                    {(selectedAcc.accessory.price * selectedAcc.quantity).toLocaleString()} VNĐ
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Kích thước: {selectedAcc.accessory.size || 'Không có'} • 
                    Tồn kho: {selectedAcc.accessory.stockQuantity}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => updateAccessoryQuantity(selectedAcc.accessoryId, selectedAcc.quantity - 1)}
                      className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
                      type="button"
                      aria-label={`Giảm số lượng ${selectedAcc.accessory.name}`}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-medium">{selectedAcc.quantity}</span>
                    <button
                      onClick={() => updateAccessoryQuantity(selectedAcc.accessoryId, selectedAcc.quantity + 1)}
                      className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
                      type="button"
                      aria-label={`Tăng số lượng ${selectedAcc.accessory.name}`}
                      disabled={selectedAcc.quantity >= selectedAcc.accessory.stockQuantity}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <button
                    onClick={() => removeAccessory(selectedAcc.accessoryId)}
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded"
                    type="button"
                    aria-label={`Xóa ${selectedAcc.accessory.name}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-blue-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-900">
                Tổng số lượng: {getTotalQuantity()} sản phẩm
              </span>
              <span className="text-lg font-bold text-blue-900">
                Tổng giá trị phụ kiện: {getTotalPrice().toLocaleString()} VNĐ
              </span>
            </div>
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
                  {filteredAccessories.map((accessory) => {
                    const selectedQuantity = getSelectedQuantity(accessory.accessoryId);
                    const isSelected = isAccessorySelected(accessory.accessoryId);
                    
                    return (
                      <div
                        key={accessory.accessoryId}
                        className={`px-4 py-4 border-b border-gray-100 last:border-b-0 transition-colors duration-150 ${
                          isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <div className="font-medium text-gray-900">
                                <span
                                  dangerouslySetInnerHTML={{
                                    __html: highlightText(accessory.name, searchTerm),
                                  }}
                                />
                              </div>
                              {isSelected && (
                                <div className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                  <Check className="w-3 h-3 mr-1" />
                                  {selectedQuantity}
                                </div>
                              )}
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
                                <span className="font-medium text-green-600">
                                  Giá: {accessory.price.toLocaleString()} VNĐ
                                </span>
                                <span className={`font-medium ${
                                  accessory.stockQuantity > 10 ? 'text-green-600' :
                                  accessory.stockQuantity > 0 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  Tồn kho: {accessory.stockQuantity}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            {isSelected ? (
                              <div className="flex items-center space-x-2">
                                <div className="flex items-center space-x-1 bg-white border border-gray-300 rounded-lg p-1">
                                  <button
                                    onClick={() => updateAccessoryQuantity(accessory.accessoryId, selectedQuantity - 1)}
                                    className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                                    type="button"
                                    aria-label={`Giảm số lượng ${accessory.name}`}
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <span className="w-8 text-center font-medium">{selectedQuantity}</span>
                                  <button
                                    onClick={() => updateAccessoryQuantity(accessory.accessoryId, selectedQuantity + 1)}
                                    className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                                    type="button"
                                    aria-label={`Tăng số lượng ${accessory.name}`}
                                    disabled={selectedQuantity >= accessory.stockQuantity}
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                                <button
                                  onClick={() => removeAccessory(accessory.accessoryId)}
                                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                                  type="button"
                                  aria-label={`Xóa ${accessory.name}`}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => addAccessory(accessory)}
                                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                type="button"
                                disabled={accessory.stockQuantity === 0}
                                aria-label={`Thêm ${accessory.name} vào giỏ`}
                              >
                                {accessory.stockQuantity === 0 ? 'Hết hàng' : 'Thêm'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        {showPrevButton ? (
          <button
            type="button"
            onClick={onPrev}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800"
            aria-label="Quay lại bước trước"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Quay lại
          </button>
        ) : (
          <div></div>
        )}
        <div className="flex items-center space-x-4">
          {selectedAccessories.length > 0 && (
            <div className="text-sm text-gray-600">
              {getTotalQuantity()} phụ kiện • {getTotalPrice().toLocaleString()} VNĐ
            </div>
          )}
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
    </div>
  );
};

export default Step4Accessories;