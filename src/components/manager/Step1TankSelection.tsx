import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, Search, X, Check } from 'lucide-react';

interface TankCategory {
  categoryId: number;
  categoryName: string;
  description: string;
}

interface TankImage {
  id: number;
  url: string;
  alt?: string;
}

interface Tank {
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
  accessoryImages: TankImage[];
}

interface SelectedTank {
  accessoryId: number;
  tank: Tank;
}

interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

interface Step1Props {
  selectedTank: SelectedTank | null;
  onSelectionChange: (tank: SelectedTank | null) => void;
  onNext: () => void;
  onPrev: () => void;
  showPrevButton?: boolean;
}

const Step1TankSelection: React.FC<Step1Props> = ({
  selectedTank,
  onSelectionChange,
  onNext,
  onPrev,
  showPrevButton = false,
}) => {
  const [categories, setCategories] = useState<TankCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<TankCategory | null>(null);
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [filteredTanks, setFilteredTanks] = useState<Tank[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingTanks, setLoadingTanks] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTankCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchTanksByCategory(selectedCategory.categoryId);
      setSearchTerm('');
    }
  }, [selectedCategory]);

  const fetchTankCategories = async () => {
    try {
      setLoadingCategories(true);
      setError(null);
      const response = await fetch('https://terarium.shop/api/Category/get-all');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result: ApiResponse<TankCategory[]> = await response.json();
      if (result.status !== 200) throw new Error(result.message || 'Failed to fetch categories');
      
      // Filter categories to show "Bể" category or categoryId === 6
      const tankCategories = result.data.filter(category => 
        category.categoryId === 6 || 
        category.categoryName.toLowerCase().includes('Bể')
      );
      
      setCategories(tankCategories);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchTanksByCategory = async (categoryId: number) => {
    try {
      setLoadingTanks(true);
      setError(null);
      const response = await fetch(`https://terarium.shop/api/Accessory/filter-by-category/${categoryId}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result: ApiResponse<Tank[]> = await response.json();
      if (result.status !== 200) throw new Error(result.message || 'Failed to fetch tanks');
      
      // Filter only active tanks/accessories
      const activeTanks = result.data.filter(tank => tank.status === 'ACTIVE' || tank.status === 'Active' || tank.status === 'active');
      setTanks(activeTanks);
      setFilteredTanks(activeTanks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setTanks([]);
      setFilteredTanks([]);
    } finally {
      setLoadingTanks(false);
    }
  };

  const searchTanks = useCallback((term: string) => {
    if (!term.trim()) {
      setFilteredTanks(tanks);
      return;
    }

    const lowerTerm = term.toLowerCase();
    const filtered = tanks.filter(
      (tank) =>
        tank.name.toLowerCase().includes(lowerTerm) ||
        tank.description.toLowerCase().includes(lowerTerm) ||
        tank.size.toLowerCase().includes(lowerTerm)
    );
    setFilteredTanks(filtered);
  }, [tanks]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    searchTanks(value);
  }, [searchTanks]);

  const handleCategorySelect = (category: TankCategory) => {
    setSelectedCategory(category);
  };

  const selectTank = (tank: Tank) => {
    const newSelection: SelectedTank = {
      accessoryId: tank.accessoryId,
      tank
    };
    onSelectionChange(newSelection);
  };

  const clearSelection = () => {
    onSelectionChange(null);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setFilteredTanks(tanks);
  };

  const highlightText = (text: string, term: string) => {
    if (!term.trim()) return text;
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$1')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 px-0.5">$1</mark>');
  };

  const isTankSelected = (accessoryId: number) => {
    return selectedTank?.accessoryId === accessoryId;
  };

  const canProceed = () => {
    return selectedTank !== null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Chọn Loại Bể</h2>
        <p className="text-gray-600">Chọn một loại bể cho terrarium của bạn</p>
      </div>

      {/* Selected Tank */}
      {selectedTank && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-green-900">Bể đã chọn</h3>
            <button
              onClick={clearSelection}
              className="text-sm text-green-600 hover:text-green-800"
              type="button"
              aria-label="Bỏ chọn bể"
            >
              Bỏ chọn
            </button>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-green-300">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium text-green-900 flex items-center">
                  <Check className="w-4 h-4 mr-2" />
                  {selectedTank.tank.name}
                </div>
                <div className="text-sm text-green-600 mt-1">
                  Giá: {selectedTank.tank.price.toLocaleString()} VNĐ
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Kích thước: {selectedTank.tank.size || 'Không có'} • 
                  Tồn kho: {selectedTank.tank.stockQuantity}
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  {selectedTank.tank.description}
                </div>
              </div>
              
              {selectedTank.tank.accessoryImages && selectedTank.tank.accessoryImages.length > 0 && (
                <div className="ml-4">
                  <img
                    src={selectedTank.tank.accessoryImages[0].url}
                    alt={selectedTank.tank.accessoryImages[0].alt || selectedTank.tank.name}
                    className="w-16 h-16 object-cover rounded-lg border"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Category Selection */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Chọn danh mục bể</h3>
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
              onClick={fetchTankCategories}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              type="button"
              aria-label="Thử lại tải danh mục"
            >
              Thử lại
            </button>
          </div>
        ) : categories.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500">
            Không tìm thấy danh mục bể nào
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

      {/* Tanks List */}
      {selectedCategory && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Bể từ danh mục "{selectedCategory.categoryName}"
          </h3>
          <div className="border border-gray-300 rounded-lg bg-white">
            {/* Search */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm bể..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Tìm kiếm bể"
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
              {loadingTanks ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Đang tải bể...
                </div>
              ) : error ? (
                <div className="px-4 py-8 text-center text-red-600">
                  <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                  {error}
                  <button
                    onClick={() => fetchTanksByCategory(selectedCategory.categoryId)}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                    type="button"
                    aria-label="Thử lại tải bể"
                  >
                    Thử lại
                  </button>
                </div>
              ) : filteredTanks.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  {searchTerm
                    ? `Không tìm thấy bể nào cho "${searchTerm}"`
                    : 'Không có bể trong danh mục này'}
                </div>
              ) : (
                <>
                  {searchTerm && (
                    <div className="px-4 py-2 text-xs text-gray-600 bg-blue-50 border-b border-gray-200">
                      Tìm thấy {filteredTanks.length} kết quả cho "{searchTerm}"
                    </div>
                  )}
                  {filteredTanks.map((tank) => {
                    const isSelected = isTankSelected(tank.accessoryId);
                    
                    return (
                      <div
                        key={tank.accessoryId}
                        className={`px-4 py-4 border-b border-gray-100 last:border-b-0 transition-colors duration-150 cursor-pointer ${
                          isSelected ? 'bg-green-50' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => selectTank(tank)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <div className="font-medium text-gray-900">
                                <span
                                  dangerouslySetInnerHTML={{
                                    __html: highlightText(tank.name, searchTerm),
                                  }}
                                />
                              </div>
                              {isSelected && (
                                <div className="flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                  <Check className="w-3 h-3 mr-1" />
                                  Đã chọn
                                </div>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 mt-1 space-y-1">
                              <div>
                                Mô tả:{' '}
                                <span
                                  dangerouslySetInnerHTML={{
                                    __html: highlightText(tank.description, searchTerm),
                                  }}
                                />
                              </div>
                              <div className="flex space-x-4">
                                <span>
                                  Kích thước:{' '}
                                  <span
                                    dangerouslySetInnerHTML={{
                                      __html: highlightText(tank.size || 'Không có', searchTerm),
                                    }}
                                  />
                                </span>
                                <span className="font-medium text-blue-600">
                                  Giá: {tank.price.toLocaleString()} VNĐ
                                </span>
                                <span className={`font-medium ${
                                  tank.stockQuantity > 10 ? 'text-green-600' :
                                  tank.stockQuantity > 0 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  Tồn kho: {tank.stockQuantity}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            {tank.accessoryImages && tank.accessoryImages.length > 0 && (
                              <img
                                src={tank.accessoryImages[0].url}
                                alt={tank.accessoryImages[0].alt || tank.name}
                                className="w-16 h-16 object-cover rounded-lg border"
                              />
                            )}
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              isSelected 
                                ? 'bg-green-600 border-green-600' 
                                : tank.stockQuantity === 0
                                  ? 'border-gray-300 bg-gray-100'
                                  : 'border-gray-300 hover:border-blue-500'
                            }`}>
                              {isSelected && <Check className="w-4 h-4 text-white" />}
                            </div>
                          </div>
                        </div>
                        {tank.stockQuantity === 0 && (
                          <div className="mt-2 text-sm text-red-600 font-medium">
                            Hết hàng
                          </div>
                        )}
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
          {selectedTank && (
            <div className="text-sm text-gray-600">
              Bể đã chọn: {selectedTank.tank.name} • {selectedTank.tank.price.toLocaleString()} VNĐ
            </div>
          )}
          <button
            type="button"
            onClick={onNext}
            disabled={!canProceed()}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
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

export default Step1TankSelection;