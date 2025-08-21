import React, { useState } from 'react';
import { ArrowLeft, Save, ChevronDown, Loader2, AlertCircle, X, Check } from 'lucide-react';
import { Editor } from '@tinymce/tinymce-react';
import axios from 'axios';
import {notification} from 'antd';
import { useNavigate } from 'react-router-dom';

const CLOUDINARY_UPLOAD_URL = 'https://api.cloudinary.com/v1_1/dsp6pjeey/upload';
const CLOUDINARY_UPLOAD_PRESET = 'TerraTech';

interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

interface AccessoryApiResponse {
  results: Accessory[];
  includeProperties: null;
  totalPages: number;
  totalRecords: number;
  pageNumber: number;
  pageSize: number;
  isPagination: boolean;
}

interface ApiDropdownProps<T> {
  apiUrl: string;
  placeholder: string;
  valueKey: keyof T;
  labelKey: keyof T;
  onSelect?: (value: T) => void;
  className?: string;
  disabled?: boolean;
  customRenderer?: (item: T) => React.ReactNode;
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
  accessoryImages: any[];
}

interface FormData {
  terrariumName: string;
  description: string;
  status: string;
  bodyHTML: string;
  tankMethodId: number;
  shapeId: number;
  environmentId: number;
  accessories: Accessory[];
}

interface TankMethod {
  tankMethodId: number;
  tankMethodType: string;
  tankMethodDescription: string;
}

interface Shape {
  shapeId: number;
  shapeName: string;
  shapeDescription: string;
  shapeMaterial: string;
}

interface Environment {
  environmentId: number;
  environmentName: string;
  environmentDescription: string;
}

const ApiDropdown = <T extends Record<string, any>>({
  apiUrl,
  placeholder,
  valueKey,
  labelKey,
  onSelect,
  className = '',
  disabled = false,
  customRenderer
}: ApiDropdownProps<T>) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<T | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result: ApiResponse<T[]> = await response.json();
      if (result.status !== 200) throw new Error(result.message || 'Failed to fetch data');
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, [apiUrl]);

  const handleSelect = (item: T) => {
    setSelected(item);
    setIsOpen(false);
    onSelect?.(item);
  };

  const getDisplayValue = (item: T) => String(item[labelKey] || 'Unknown');
  const getItemValue = (item: T) => item[valueKey];
  const getDescriptionKey = (label: keyof T) => String(label).replace(/Name|Type/, 'Description') as keyof T;

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
        disabled={disabled || loading}
        className={`w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-gray-50 transition-colors duration-200 ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${error ? 'border-red-300' : ''}`}
      >
        <div className="flex items-center justify-between">
          <span className={`truncate ${selected ? 'text-gray-900' : 'text-gray-500'}`}>
            {loading ? 'Đang tải...' : selected ? getDisplayValue(selected) : placeholder}
          </span>
          <div className="flex items-center space-x-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
            {error && <AlertCircle className="w-4 h-4 text-red-400" />}
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </button>

      {error && (
        <div className="mt-1 text-sm text-red-600 flex items-center">
          <AlertCircle className="w-4 h-4 mr-1" />
          {error}
          <button onClick={fetchData} className="ml-2 text-blue-600 hover:text-blue-800 underline">Thử lại</button>
        </div>
      )}

      {isOpen && !loading && !error && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {data.length === 0 ? (
            <div className="px-4 py-3 text-gray-500 text-center">Không có dữ liệu</div>
          ) : (
            data.map((item) => (
              <button
                key={String(getItemValue(item))}
                onClick={() => handleSelect(item)}
                className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors duration-150 ${selected && getItemValue(selected) === getItemValue(item) ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}`}
              >
                {customRenderer ? customRenderer(item) : (
                  <div>
                    <div className="font-medium">{getDisplayValue(item)}</div>
                    {item[getDescriptionKey(labelKey)] && (
                      <div className="text-sm text-gray-500 mt-1">{String(item[getDescriptionKey(labelKey)])}</div>
                    )}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const AccessoryMultiSelect: React.FC<{
  apiUrl: string;
  placeholder: string;
  selectedAccessories: Accessory[];
  onSelectionChange: (accessories: Accessory[]) => void;
  className?: string;
  disabled?: boolean;
}> = ({ apiUrl, placeholder, selectedAccessories, onSelectionChange, className = '', disabled = false }) => {
  const [data, setData] = useState<Accessory[]>([]);
  const [filteredData, setFilteredData] = useState<Accessory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result: ApiResponse<AccessoryApiResponse> = await response.json();
      if (result.status !== 200) throw new Error(result.message || 'Failed to fetch data');
      setData(result.data.results);
      setFilteredData(result.data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const searchAccessories = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setFilteredData(data);
      return;
    }

    try {
      setSearchLoading(true);
      const encodedSearchTerm = encodeURIComponent(searchTerm.trim());
      const searchUrl = `https://terarium.shop/api/Accessory/get-by-name/${encodedSearchTerm}`;
      
      const response = await fetch(searchUrl);
      if (!response.ok) {
        // If search fails, fall back to local filtering
        const localFiltered = data.filter(accessory => 
          accessory.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          accessory.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredData(localFiltered);
        return;
      }
      
      const result: ApiResponse<Accessory[]> = await response.json();
      if (result.status === 200) {
        setFilteredData(result.data);
      } else {
        // Fall back to local filtering if API search fails
        const localFiltered = data.filter(accessory => 
          accessory.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          accessory.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredData(localFiltered);
      }
    } catch (err) {
      // Fall back to local filtering on error
      const localFiltered = data.filter(accessory => 
        accessory.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        accessory.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredData(localFiltered);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      searchAccessories(value);
    }, 300); // 300ms delay

    setSearchTimeout(timeout);
  };

  React.useEffect(() => {
    fetchData();
    
    // Cleanup timeout on unmount
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [apiUrl]);

  React.useEffect(() => {
    // Reset search when dropdown closes
    if (!isOpen) {
      setSearchTerm('');
      setFilteredData(data);
    }
  }, [isOpen, data]);

  const handleToggleAccessory = (accessory: Accessory) => {
    const newSelection = selectedAccessories.some(a => a.accessoryId === accessory.accessoryId)
      ? selectedAccessories.filter(a => a.accessoryId !== accessory.accessoryId)
      : [...selectedAccessories, accessory];
    onSelectionChange(newSelection);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setFilteredData(data);
  };

  return (
    <div className={`relative ${className}`}>
      <div
        onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-gray-50 transition-colors duration-200 cursor-pointer ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''} ${error ? 'border-red-300' : ''}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {selectedAccessories.length === 0 ? (
              <span className="text-gray-500">{placeholder}</span>
            ) : (
              <div className="flex flex-wrap gap-1">
                {selectedAccessories.map((accessory) => (
                  <div key={accessory.accessoryId} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                    <span className="truncate max-w-20">{accessory.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectionChange(selectedAccessories.filter(a => a.accessoryId !== accessory.accessoryId));
                      }}
                      className="ml-1 inline-flex items-center p-0.5 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2 ml-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
            {error && <AlertCircle className="w-4 h-4 text-red-400" />}
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-1 text-sm text-red-600 flex items-center">
          <AlertCircle className="w-4 h-4 mr-1" />
          {error}
          <button onClick={fetchData} className="ml-2 text-blue-600 hover:text-blue-800 underline">Thử lại</button>
        </div>
      )}

      {isOpen && !loading && !error && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm phụ kiện..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                onClick={(e) => e.stopPropagation()}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {searchLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                ) : (
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </div>
              {searchTerm && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearSearch();
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="max-h-60 overflow-auto">
            {filteredData.length === 0 ? (
              <div className="px-4 py-3 text-gray-500 text-center">
                {searchTerm ? 'Không tìm thấy phụ kiện nào' : 'Không có phụ kiện'}
              </div>
            ) : (
              <>
                {searchTerm && (
                  <div className="px-3 py-2 text-xs text-gray-600 bg-blue-50 border-b border-gray-200">
                    Tìm thấy {filteredData.length} kết quả cho "{searchTerm}"
                  </div>
                )}
                {filteredData.map((accessory) => (
                  <div
                    key={accessory.accessoryId}
                    onClick={() => handleToggleAccessory(accessory)}
                    className={`px-4 py-3 hover:bg-blue-50 transition-colors duration-150 cursor-pointer border-b border-gray-100 last:border-b-0 ${selectedAccessories.some(a => a.accessoryId === accessory.accessoryId) ? 'bg-blue-100' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">
                          {searchTerm && accessory.name.toLowerCase().includes(searchTerm.toLowerCase()) ? (
                            <span dangerouslySetInnerHTML={{
                              __html: accessory.name.replace(
                                new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
                                '<mark class="bg-yellow-200 px-0.5">$1</mark>'
                              )
                            }} />
                          ) : (
                            accessory.name
                          )}
                        </div>
                        <div className="text-sm text-gray-500 mt-1 space-y-1">
                          <div>
                            Mô tả: {searchTerm && accessory.description.toLowerCase().includes(searchTerm.toLowerCase()) ? (
                              <span dangerouslySetInnerHTML={{
                                __html: accessory.description.replace(
                                  new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
                                  '<mark class="bg-yellow-200 px-0.5">$1</mark>'
                                )
                              }} />
                            ) : (
                              accessory.description
                            )}
                          </div>
                          <div>Kích thước: {accessory.size || 'Không có'}</div>
                          <div>Giá: {accessory.price.toLocaleString()} VNĐ</div>
                          <div>Tồn kho: {accessory.stockQuantity}</div>
                        </div>
                      </div>
                      {selectedAccessories.some(a => a.accessoryId === accessory.accessoryId) && (
                        <Check className="w-5 h-5 text-blue-600 ml-3 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const TerrariumCreate: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    terrariumName: '',
    description: '',
    status: 'active',
    bodyHTML: '',
    tankMethodId: 0,
    shapeId: 0,
    environmentId: 0,
    accessories: []
  });
  const [loading, setLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const navigate = useNavigate();
  // Navigation function
  const navigateToTerrariumList = () => {
    window.location.href = '/manager/terrarium/list';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'price' || name === 'stock' ? Number(value) : value }));
  };

  const handleApiSelection = (type: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [type]: type === 'accessories' ? value : value[type === 'tankMethodId' ? 'tankMethodId' : type === 'shapeId' ? 'shapeId' : 'environmentId'],
      ...(type === 'tankMethodId' && { tankMethodId: value.tankMethodId }),
      ...(type === 'shapeId' && { shapeId: value.shapeId }),
      ...(type === 'environmentId' && { environmentId: value.environmentId })
    }));
  };

  const validateForm = (): { type: 'success' | 'error'; text: string } | null => {
    if (!formData.terrariumName.trim()) return { type: 'error', text: 'Vui lòng nhập tên terrarium' };
    if (!formData.description.trim()) return { type: 'error', text: 'Vui lòng nhập mô tả' };
    if (formData.tankMethodId === 0) return { type: 'error', text: 'Vui lòng chọn phương pháp tank' };
    if (formData.shapeId === 0) return { type: 'error', text: 'Vui lòng chọn hình dạng' };
    if (formData.environmentId === 0) return { type: 'error', text: 'Vui lòng chọn môi trường' };
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSubmitMessage(null);

    const payload = {
      ...formData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      accessoryIds: formData.accessories.map(a => a.accessoryId),
    };

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://terarium.shop/api/Terrarium/add-terrarium', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        if (response.status === 401) {
          notification.error({
            message: 'Lỗi',
            description: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.',
            placement: 'topRight',
          });
          navigate('/login');
          return;
        }
        throw new Error((await response.json())?.message || `HTTP error! status: ${response.status}`);
      }
      const result = await response.json();

      if (result.status === 200 || result.message === "Save data success") {
        setSubmitMessage({ type: 'success', text: 'Terrarium đã được tạo thành công! Đang chuyển hướng...' });
        // Navigate to terrarium list after 1.5 seconds
        setTimeout(() => {
          navigateToTerrariumList();
        }, 1500);
      } else {
        throw new Error(result.message || 'Có lỗi xảy ra khi tạo terrarium');
      }
    } catch (error) {
      setSubmitMessage({ type: 'error', text: `Có lỗi xảy ra khi tạo terrarium: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <button 
              type="button" 
              onClick={navigateToTerrariumList} 
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Thêm Terrarium Mới</h1>
              <p className="text-gray-600">Tạo một terrarium mới trong hệ thống</p>
            </div>
          </div>

          {submitMessage && (
            <div className={`p-4 rounded-lg ${submitMessage.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
              <div className="flex items-center">
                {submitMessage.type === 'success' ? (
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <AlertCircle className="w-5 h-5 mr-3" />
                )}
                {submitMessage.text}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Cấu hình Terrarium</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Loại bể *</label>
                    <ApiDropdown<TankMethod>
                      apiUrl="https://terarium.shop/api/TankMethod/get-all"
                      placeholder="Chọn loại bể"
                      valueKey="tankMethodId"
                      labelKey="tankMethodType"
                      onSelect={(value) => handleApiSelection('tankMethodId', value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hình dạng *</label>
                    <ApiDropdown<Shape>
                      apiUrl="https://terarium.shop/api/Shape/get-all"
                      placeholder="Chọn hình dạng"
                      valueKey="shapeId"
                      labelKey="shapeName"
                      onSelect={(value) => handleApiSelection('shapeId', value)}
                      className="w-full"
                      customRenderer={(shape) => (
                        <div>
                          <div className="font-medium">{shape.shapeName}</div>
                          <div className="text-sm text-gray-500 mt-1 space-y-1">
                            <div>Mô tả: {shape.shapeDescription}</div>
                            <div>Chất liệu: {shape.shapeMaterial}</div>
                          </div>
                        </div>
                      )}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Môi trường *</label>
                    <ApiDropdown<Environment>
                      apiUrl="https://terarium.shop/api/Environment/get-all"
                      placeholder="Chọn môi trường"
                      valueKey="environmentId"
                      labelKey="environmentName"
                      onSelect={(value) => handleApiSelection('environmentId', value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phụ kiện (Tùy chọn)</label>
                    <AccessoryMultiSelect
                      apiUrl="https://terarium.shop/api/Accessory/get-all?Pagination.PageSize=100"
                      placeholder="Chọn phụ kiện"
                      selectedAccessories={formData.accessories}
                      onSelectionChange={(accessories) => handleApiSelection('accessories', accessories)}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin cơ bản</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tên Terrarium *</label>
                    <input
                      type="text"
                      name="terrariumName"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.terrariumName}
                      onChange={handleInputChange}
                      placeholder="Nhập tên terrarium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả *</label>
                    <textarea
                      name="description"
                      required
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Mô tả chi tiết về terrarium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung HTML (Tùy chọn)</label>
                    <Editor
                      apiKey="lfiqogz55f5k6y6cuza7ih9b59tc7t8h62v0z9lp8661yu2w"
                      value={formData.bodyHTML}
                      init={{
                        height: 500,
                        resize: true,
                        plugins: ['advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen', 'insertdatetime', 'media', 'table', 'paste', 'help', 'wordcount'],
                        toolbar: 'undo redo | formatselect | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | image | help',
                        images_upload_handler: async (blobInfo: any, success: (url: string) => void, failure: (err: string) => void) => {
                          const formDataUpload = new FormData();
                          formDataUpload.append('file', blobInfo.blob());
                          formDataUpload.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
                          try {
                            const res = await axios.post(CLOUDINARY_UPLOAD_URL, formDataUpload);
                            success(res.data.secure_url || '');
                          } catch {
                            failure('Upload ảnh thất bại');
                          }
                        },
                        content_style: 'img { max-width: 400px; height: auto; }'
                      }}
                      onEditorChange={(content) => setFormData(prev => ({ ...prev, bodyHTML: content }))}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái *</label>
                      <select
                        name="status"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={formData.status}
                        onChange={handleInputChange}
                      >
                        <option value="active">Hoạt động</option>
                        <option value="inactive">Không hoạt động</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Lựa chọn hiện tại</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-700 text-sm">Tank Method</div>
                    <div className="text-sm text-gray-600">{formData.tankMethodId ? `ID: ${formData.tankMethodId}` : 'Chưa chọn'}</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-700 text-sm">Shape</div>
                    <div className="text-sm text-gray-600">{formData.shapeId ? `ID: ${formData.shapeId}` : 'Chưa chọn'}</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-700 text-sm">Environment</div>
                    <div className="text-sm text-gray-600">{formData.environmentId ? `ID: ${formData.environmentId}` : 'Chưa chọn'}</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-700 text-sm">Phụ kiện</div>
                    <div className="text-sm text-gray-600">
                      {formData.accessories.length === 0 ? 'Chưa chọn' : `${formData.accessories.length} phụ kiện đã chọn`}
                    </div>
                    {formData.accessories.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1 space-y-1">
                        {formData.accessories.map(accessory => (
                          <div key={accessory.accessoryId} className="flex justify-between">
                            <span>{accessory.name}</span>
                            <span>{accessory.price.toLocaleString()} VNĐ</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{loading ? 'Đang lưu...' : 'Lưu Terrarium'}</span>
                  </button>
                  <button type="button" onClick={() => {}} className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">Hủy</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default TerrariumCreate;