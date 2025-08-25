import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, AlertCircle, X, Check, Search, Grid, List, ChevronRight } from 'lucide-react';
import { Editor } from '@tinymce/tinymce-react';
import axios from 'axios';
import { notification } from 'antd';

const CLOUDINARY_UPLOAD_URL = 'https://api.cloudinary.com/v1_1/dsp6pjeey/upload';
const CLOUDINARY_UPLOAD_PRESET = 'TerraTech';

// Types (same as original)
interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

interface Category {
  categoryId: number;
  categoryName: string;
  description: string;
}

interface Accessory {
  accessoryId: number;
  name: string;
  description: string;
  price: number;
  size?: string;
  stockQuantity?: number;
  categoryId?: number;
  createdAt?: string;
  updatedAt?: string;
  status?: string;
  accessoryImages?: any[];
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

interface FormData {
  terrariumId: number;
  tankMethodId: number;
  shapeId: number;
  environmentId: number;
  terrariumName: string;
  description: string;
  status: string;
  bodyHTML: string;
  accessories: Accessory[];
}

interface ExtendedFormData extends FormData {
  selectedTankMethod?: TankMethod;
  selectedShape?: Shape;
  selectedEnvironment?: Environment;
}

// Card Selection Grid Component
interface CardSelectionGridProps<T> {
  title: string;
  apiUrl: string;
  selectedId?: number;
  onSelect: (item: T) => void;
  renderCard: (item: T, isSelected: boolean) => React.ReactNode;
  keyField: keyof T;
  loading?: boolean;
}

const CardSelectionGrid = <T extends Record<string, any>>({
  title,
  apiUrl,
  selectedId,
  onSelect,
  renderCard,
  keyField,
  loading: externalLoading = false
}: CardSelectionGridProps<T>) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    fetchData();
  }, [apiUrl]);

  if (loading || externalLoading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 border border-gray-200 rounded-lg animate-pulse">
              <div className="h-4 bg-gray-300 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>
        <div className="flex items-center justify-center py-8 text-red-600">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
          <button onClick={fetchData} className="ml-2 text-blue-600 hover:text-blue-800 underline">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((item) => {
          const isSelected = selectedId === item[keyField];
          return (
            <div
              key={String(item[keyField])}
              onClick={() => onSelect(item)}
              className={`cursor-pointer transition-all duration-200 transform hover:scale-105 ${
                isSelected
                  ? 'ring-2 ring-blue-500 shadow-lg'
                  : 'hover:shadow-md hover:border-blue-300'
              }`}
            >
              {renderCard(item, isSelected)}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Status Toggle Component
interface StatusToggleProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const StatusToggle: React.FC<StatusToggleProps> = ({ value, onChange, disabled = false }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Trạng thái</h3>
      <div className="flex space-x-4">
        <button
          type="button"
          onClick={() => onChange('active')}
          disabled={disabled}
          className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
            value === 'active'
              ? 'bg-green-100 text-green-800 border-2 border-green-300'
              : 'bg-gray-50 text-gray-600 border border-gray-300 hover:bg-gray-100'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Check className="w-5 h-5" />
            <span>Hoạt động</span>
          </div>
        </button>
        <button
          type="button"
          onClick={() => onChange('inactive')}
          disabled={disabled}
          className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
            value === 'inactive'
              ? 'bg-red-100 text-red-800 border-2 border-red-300'
              : 'bg-gray-50 text-gray-600 border border-gray-300 hover:bg-gray-100'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="flex items-center justify-center space-x-2">
            <X className="w-5 h-5" />
            <span>Không hoạt động</span>
          </div>
        </button>
      </div>
    </div>
  );
};

// Visual Accessory Selector with Tabs
interface VisualAccessorySelectorProps {
  selectedAccessories: Accessory[];
  onSelectionChange: (accessories: Accessory[]) => void;
  disabled?: boolean;
}

const VisualAccessorySelector: React.FC<VisualAccessorySelectorProps> = ({
  selectedAccessories,
  onSelectionChange,
  disabled = false
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [filteredAccessories, setFilteredAccessories] = useState<Accessory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingAccessories, setLoadingAccessories] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await fetch('https://terarium.shop/api/Category/get-all');
      const result: ApiResponse<Category[]> = await response.json();
      if (result.status === 200) {
        setCategories(result.data);
        if (result.data.length > 0 && !selectedCategory) {
          setSelectedCategory(result.data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Fetch accessories by category
  const fetchAccessoriesByCategory = async (categoryId: number) => {
    try {
      setLoadingAccessories(true);
      const response = await fetch(`https://terarium.shop/api/Accessory/filter-by-category/${categoryId}`);
      const result: ApiResponse<Accessory[]> = await response.json();
      if (result.status === 200) {
        setAccessories(result.data);
        setFilteredAccessories(result.data);
      }
    } catch (error) {
      console.error('Error fetching accessories:', error);
      setAccessories([]);
      setFilteredAccessories([]);
    } finally {
      setLoadingAccessories(false);
    }
  };

  // Search accessories
  const searchAccessories = (term: string) => {
    if (!term.trim()) {
      setFilteredAccessories(accessories);
      return;
    }
    const filtered = accessories.filter(accessory =>
      accessory.name.toLowerCase().includes(term.toLowerCase()) ||
      accessory.description.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredAccessories(filtered);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchAccessoriesByCategory(selectedCategory.categoryId);
      setSearchTerm('');
    }
  }, [selectedCategory]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchAccessories(searchTerm);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, accessories]);

  const toggleAccessory = (accessory: Accessory) => {
    const isSelected = selectedAccessories.some(a => a.accessoryId === accessory.accessoryId);
    if (isSelected) {
      onSelectionChange(selectedAccessories.filter(a => a.accessoryId !== accessory.accessoryId));
    } else {
      onSelectionChange([...selectedAccessories, accessory]);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header with selected count */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Phụ kiện</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              Đã chọn: {selectedAccessories.length}
            </span>
            <div className="flex rounded-lg bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Selected accessories display */}
        {selectedAccessories.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {selectedAccessories.map((accessory) => (
                <div
                  key={accessory.accessoryId}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                >
                  <span className="max-w-32 truncate" title={accessory.name}>
                    {accessory.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleAccessory(accessory)}
                    className="ml-2 hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Category tabs */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        {loadingCategories ? (
          <div className="flex space-x-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 w-24 bg-gray-300 rounded animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="flex space-x-1 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category.categoryId}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200 ${
                  selectedCategory?.categoryId === category.categoryId
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category.categoryName}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search */}
      {selectedCategory && (
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm phụ kiện..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Accessories display */}
      <div className="p-6">
        {loadingAccessories ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Đang tải phụ kiện...</span>
          </div>
        ) : filteredAccessories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? `Không tìm thấy phụ kiện cho "${searchTerm}"` : 'Không có phụ kiện trong danh mục này'}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAccessories.map((accessory) => {
              const isSelected = selectedAccessories.some(a => a.accessoryId === accessory.accessoryId);
              return (
                <div
                  key={accessory.accessoryId}
                  onClick={() => !disabled && toggleAccessory(accessory)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 transform hover:scale-105 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500 shadow-lg'
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900 text-sm">{accessory.name}</h4>
                    {isSelected && <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{accessory.description}</p>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>Kích thước: {accessory.size || 'Không có'}</div>
                    <div className="font-medium text-blue-600">
                      {accessory.price.toLocaleString()} VNĐ
                    </div>
                    <div>Tồn kho: {accessory.stockQuantity}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAccessories.map((accessory) => {
              const isSelected = selectedAccessories.some(a => a.accessoryId === accessory.accessoryId);
              return (
                <div
                  key={accessory.accessoryId}
                  onClick={() => !disabled && toggleAccessory(accessory)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{accessory.name}</h4>
                      <p className="text-sm text-gray-600">{accessory.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                        <span>Kích thước: {accessory.size || 'Không có'}</span>
                        <span className="font-medium text-blue-600">
                          {accessory.price.toLocaleString()} VNĐ
                        </span>
                        <span>Tồn kho: {accessory.stockQuantity}</span>
                      </div>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-blue-600 ml-4" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// Step Progress Indicator
interface StepProgressProps {
  currentStep: number;
  steps: { name: string; description: string }[];
}

const StepProgress: React.FC<StepProgressProps> = ({ currentStep, steps }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
      <nav aria-label="Progress">
        <ol className="flex items-center">
          {steps.map((step, index) => (
            <li key={step.name} className={`relative ${index !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
              <div className="flex items-center">
                <div
                  className={`relative flex h-8 w-8 items-center justify-center rounded-full ${
                    index < currentStep
                      ? 'bg-blue-600 hover:bg-blue-900'
                      : index === currentStep
                      ? 'border-2 border-blue-600 bg-white'
                      : 'border-2 border-gray-300 bg-white hover:border-gray-400'
                  }`}
                >
                  {index < currentStep ? (
                    <Check className="h-5 w-5 text-white" />
                  ) : (
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        index === currentStep ? 'bg-blue-600' : 'bg-transparent'
                      }`}
                    />
                  )}
                </div>
                <span className="ml-4 min-w-0 flex flex-col">
                  <span
                    className={`text-sm font-medium ${
                      index <= currentStep ? 'text-blue-600' : 'text-gray-500'
                    }`}
                  >
                    {step.name}
                  </span>
                  <span className="text-sm text-gray-500 hidden sm:block">{step.description}</span>
                </span>
              </div>
              {index !== steps.length - 1 && (
                <div
                  className="absolute top-4 left-4 -ml-px mt-0.5 h-full w-0.5 bg-gray-300"
                  aria-hidden="true"
                />
              )}
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
};

// Main TerrariumEdit Component
const TerrariumEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<ExtendedFormData>({
    terrariumId: 0,
    tankMethodId: 0,
    shapeId: 0,
    environmentId: 0,
    terrariumName: '',
    description: '',
    status: 'active',
    bodyHTML: '',
    accessories: [],
    selectedTankMethod: undefined,
    selectedShape: undefined,
    selectedEnvironment: undefined
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const steps = [
    { name: 'Cấu hình', description: 'Loại bể, Hình dạng, Chủ đề' },
    { name: 'Phụ kiện', description: 'Chọn phụ kiện' },
    { name: 'Thông tin', description: 'Tên, mô tả, nội dung' },
    { name: 'Hoàn tất', description: 'Xem lại và lưu' }
  ];

  // Thay thế phần Load initial data trong useEffect:
useEffect(() => {
  const loadTerrarium = async () => {
    try {
      const response = await fetch(`https://terarium.shop/api/Terrarium/get/${id}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result: ApiResponse<FormData> = await response.json();
      if (result.status !== 200) throw new Error(result.message || 'Failed to load terrarium data');
      
      // Fetch chi tiết các thông tin liên quan
      const [tankMethodResponse, shapeResponse, environmentResponse] = await Promise.all([
        fetch('https://terarium.shop/api/TankMethod/get-all'),
        fetch('https://terarium.shop/api/Shape/get-all'),
        fetch('https://terarium.shop/api/Environment/get-all')
      ]);

      const [tankMethodResult, shapeResult, environmentResult] = await Promise.all([
        tankMethodResponse.json() as Promise<ApiResponse<TankMethod[]>>,
        shapeResponse.json() as Promise<ApiResponse<Shape[]>>,
        environmentResponse.json() as Promise<ApiResponse<Environment[]>>
      ]);

      // Tìm các object tương ứng với ID
      const selectedTankMethod = tankMethodResult.data?.find(
        tm => tm.tankMethodId === result.data.tankMethodId
      );
      const selectedShape = shapeResult.data?.find(
        s => s.shapeId === result.data.shapeId
      );
      const selectedEnvironment = environmentResult.data?.find(
        e => e.environmentId === result.data.environmentId
      );

      setFormData({
        ...result.data,
        accessories: result.data.accessories || [],
        selectedTankMethod,
        selectedShape,
        selectedEnvironment
      });
    } catch (error) {
      notification.error({
        message: 'Lỗi',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra khi tải dữ liệu terrarium',
        placement: 'topRight',
      });
      setTimeout(() => navigate('/manager/terrarium/list'), 2000);
    } finally {
      setInitialLoading(false);
    }
  };

  if (id) loadTerrarium();
}, [id, navigate]);

  // Handle form submission
  const handleSubmit = async () => {
    setLoading(true);
    
    const payload = {
      ...formData,
      updatedAt: new Date().toISOString(),
      accessoryNames: formData.accessories.map(a => a.name),
    };

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`https://terarium.shop/api/Terrarium/update-terrarium/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(payload),
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.status === 200) {
        notification.success({
          message: 'Thành công',
          description: 'Terrarium đã được cập nhật thành công!',
          placement: 'topRight',
        });
        navigate('/manager/terrarium/list');
      } else {
        throw new Error(result.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      notification.error({
        message: 'Lỗi',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra khi cập nhật terrarium',
        placement: 'topRight',
      });
    } finally {
      setLoading(false);
    }
  };

  // Update form data handlers
  const handleTankMethodSelect = (tankMethod: TankMethod) => {
    setFormData(prev => ({
      ...prev,
      tankMethodId: tankMethod.tankMethodId,
      selectedTankMethod: tankMethod
    }));
  };

  const handleShapeSelect = (shape: Shape) => {
    setFormData(prev => ({
      ...prev,
      shapeId: shape.shapeId,
      selectedShape: shape
    }));
  };

  const handleEnvironmentSelect = (environment: Environment) => {
    setFormData(prev => ({
      ...prev,
      environmentId: environment.environmentId,
      selectedEnvironment: environment
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 0:
        return formData.tankMethodId && formData.shapeId && formData.environmentId;
      case 1:
        return true; // Accessories are optional
      case 2:
        return formData.terrariumName.trim() && formData.description.trim();
      case 3:
        return true;
      default:
        return false;
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Đang tải dữ liệu...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <button
          type="button"
          onClick={() => navigate('/manager/terrarium/list')}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Chỉnh sửa Terrarium</h1>
          <p className="text-gray-600">Cập nhật thông tin terrarium #{formData.terrariumId}</p>
        </div>
      </div>

      {/* Step Progress */}
      <StepProgress currentStep={currentStep} steps={steps} />

      {/* Step Content */}
      <div className="space-y-8">
        {currentStep === 0 && (
          <div className="space-y-6">
            {/* Tank Method Selection */}
            <CardSelectionGrid<TankMethod>
              title="Chọn loại bể *"
              apiUrl="https://terarium.shop/api/TankMethod/get-all"
              selectedId={formData.tankMethodId}
              onSelect={handleTankMethodSelect}
              keyField="tankMethodId"
              renderCard={(item, isSelected) => (
                <div className={`p-4 border rounded-xl transition-all duration-200 ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50 shadow-lg' 
                    : 'border-gray-200 hover:border-blue-300 bg-white'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900">{item.tankMethodType}</h4>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{item.tankMethodDescription}</p>
                </div>
              )}
            />

            {/* Shape Selection */}
            <CardSelectionGrid<Shape>
              title="Chọn hình dạng *"
              apiUrl="https://terarium.shop/api/Shape/get-all"
              selectedId={formData.shapeId}
              onSelect={handleShapeSelect}
              keyField="shapeId"
              renderCard={(item, isSelected) => (
                <div className={`p-4 border rounded-xl transition-all duration-200 ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50 shadow-lg' 
                    : 'border-gray-200 hover:border-blue-300 bg-white'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900">{item.shapeName}</h4>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>{item.shapeDescription}</p>
                    <p className="font-medium text-gray-700">Chất liệu: {item.shapeMaterial}</p>
                  </div>
                </div>
              )}
            />

            {/* Environment Selection */}
            <CardSelectionGrid<Environment>
              title="Chọn chủ đề *"
              apiUrl="https://terarium.shop/api/Environment/get-all"
              selectedId={formData.environmentId}
              onSelect={handleEnvironmentSelect}
              keyField="environmentId"
              renderCard={(item, isSelected) => (
                <div className={`p-4 border rounded-xl transition-all duration-200 ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50 shadow-lg' 
                    : 'border-gray-200 hover:border-blue-300 bg-white'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900">{item.environmentName}</h4>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{item.environmentDescription}</p>
                </div>
              )}
            />
          </div>
        )}

        {currentStep === 1 && (
          <VisualAccessorySelector
            selectedAccessories={formData.accessories}
            onSelectionChange={(accessories) => 
              setFormData(prev => ({ ...prev, accessories }))
            }
          />
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Thông tin cơ bản</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên Terrarium *
                  </label>
                  <input
                    type="text"
                    name="terrariumName"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={formData.terrariumName}
                    onChange={handleInputChange}
                    placeholder="Nhập tên terrarium"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mô tả *
                  </label>
                  <textarea
                    name="description"
                    required
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Mô tả chi tiết về terrarium"
                  />
                </div>
              </div>
            </div>

            {/* Status Selection */}
            <StatusToggle
              value={formData.status}
              onChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
            />

            {/* HTML Content Editor */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Nội dung HTML (Tùy chọn)</h3>
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <Editor
                  apiKey="2pcpzgtdmmp5f43t7bqpc9rmxkok9ben1axiy628f53zad6s"
                  value={formData.bodyHTML}
                  init={{
                    height: 400,
                    resize: true,
                    plugins: [
                      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 
                      'preview', 'anchor', 'searchreplace', 'visualblocks', 'code', 
                      'fullscreen', 'insertdatetime', 'media', 'table', 'paste', 
                      'help', 'wordcount'
                    ],
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
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Xem lại thông tin</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left column - Configuration Summary */}
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Cấu hình Terrarium</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Loại bể:</span>
                      <span className="font-medium">
                        {formData.selectedTankMethod?.tankMethodType || `ID: ${formData.tankMethodId}`}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Hình dạng:</span>
                      <span className="font-medium">
                        {formData.selectedShape?.shapeName || `ID: ${formData.shapeId}`}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Chủ đề:</span>
                      <span className="font-medium">
                        {formData.selectedEnvironment?.environmentName || `ID: ${formData.environmentId}`}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Thông tin cơ bản</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Tên:</span>
                      <span className="font-medium">{formData.terrariumName}</span>
                    </div>
                    <div className="py-2 border-b border-gray-100">
                      <span className="text-gray-600">Mô tả:</span>
                      <p className="font-medium mt-1">{formData.description}</p>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Trạng thái:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        formData.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {formData.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right column - Accessories */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  Phụ kiện đã chọn ({formData.accessories.length})
                </h4>
                {formData.accessories.length === 0 ? (
                  <p className="text-gray-500 italic">Chưa chọn phụ kiện nào</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {formData.accessories.map((accessory) => (
                      <div key={accessory.accessoryId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-sm">{accessory.name}</div>
                          <div className="text-xs text-gray-500">{accessory.size}</div>
                        </div>
                        <div className="text-sm font-medium text-blue-600">
                          {accessory.price.toLocaleString()} VNĐ
                        </div>
                      </div>
                    ))}
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex justify-between items-center font-medium">
                        <span>Tổng giá trị phụ kiện:</span>
                        <span className="text-blue-600">
                          {formData.accessories.reduce((sum, acc) => sum + acc.price, 0).toLocaleString()} VNĐ
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-6">
          <button
            type="button"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="flex items-center space-x-2 px-6 py-3 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => navigate('/manager/terrarium/list')}
              className="px-6 py-3 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200"
            >
              Hủy
            </button>
            
            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceedToNextStep()}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <span>Tiếp theo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center space-x-2 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{loading ? 'Đang cập nhật...' : 'Cập nhật Terrarium'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TerrariumEdit;