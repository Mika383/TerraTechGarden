import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, ChevronDown, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Editor } from '@tinymce/tinymce-react';

// Type definitions for API responses
interface TerrariumData {
  terrariumId: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  status: number;
  environments: string[];
  shapes: string[];
  tankMethods: string[];
  createdAt: string;
  updatedAt: string;
  bodyHTML: string;
}

interface TerrariumApiResponse {
  status: number;
  message: string;
  data: TerrariumData;
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
  shapeSize: string;
  shapeHeight: number;
  shapeWidth: number;
  shapeLength: number;
  shapeVolume: number;
  shapeMaterial: string;
}

interface Environment {
  environmentId: number;
  environmentName: string;
  environmentDescription: string;
}

interface ApiResponse<T> {
  status: number;
  message: string;
  data: T[];
}

interface TerrariumFormData {
  terrariumId: number;
  tankMethodType: string;
  shape: string;
  environment: string;
  terrariumName: string;
  description: string;
  price: number;
  stock: number;
  status: number;
  bodyHTML: string;
}

interface TerrariumUpdatePayload {
  terrariumId: number;
  tankMethodType: string;
  shape: string;
  environment: string;
  terrariumName: string;
  description: string;
  price: number;
  stock: number;
  status: number;
  bodyHTML: string;
}

interface ApiDropdownProps<T> {
  apiUrl: string;
  placeholder: string;
  valueKey: keyof T;
  labelKey: keyof T;
  onSelect?: (value: T) => void;
  className?: string;
  disabled?: boolean;
  selectedValue?: string;
  customRenderer?: (item: T) => React.ReactNode;
}

const ApiDropdown = <T extends Record<string, any>>({
  apiUrl,
  placeholder,
  valueKey,
  labelKey,
  onSelect,
  className = '',
  disabled = false,
  selectedValue = '',
  customRenderer
}: ApiDropdownProps<T>) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selected, setSelected] = useState<T | null>(null);

  useEffect(() => {
    fetchData();
  }, [apiUrl]);

  useEffect(() => {
    if (selectedValue && data.length > 0) {
      const found = data.find(item => String(item[labelKey]) === selectedValue);
      if (found) {
        setSelected(found);
      }
    }
  }, [selectedValue, data, labelKey]);

  const fetchData = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<T> = await response.json();
      
      if (result.status === 200 && result.data) {
        setData(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch data');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item: T): void => {
    setSelected(item);
    setIsOpen(false);
    if (onSelect) {
      onSelect(item);
    }
  };

  const getDisplayValue = (item: T): string => {
    const value = item[labelKey];
    return typeof value === 'string' ? value : String(value || 'Unknown');
  };

  const toggleDropdown = (): void => {
    if (!disabled && !loading) {
      setIsOpen(!isOpen);
    }
  };

  const getDescriptionKey = (labelKey: keyof T): keyof T => {
    const labelStr = String(labelKey);
    const descriptionKey = labelStr.replace('Name', 'Description').replace('Type', 'Description');
    return descriptionKey as keyof T;
  };

  const renderDefaultItem = (item: T) => (
    <>
      <div className="font-medium">{getDisplayValue(item)}</div>
      {item[getDescriptionKey(labelKey)] && (
        <div className="text-sm text-gray-500 mt-1">
          {String(item[getDescriptionKey(labelKey)])}
        </div>
      )}
    </>
  );

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={toggleDropdown}
        disabled={disabled || loading}
        className={`
          w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-lg
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          hover:bg-gray-50 transition-colors duration-200
          ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${error ? 'border-red-300' : ''}
        `}
      >
        <div className="flex items-center justify-between">
          <span className={`block truncate ${selected ? 'text-gray-900' : 'text-gray-500'}`}>
            {loading ? 'Đang tải...' : 
             selected ? getDisplayValue(selected) : 
             placeholder}
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
          <button
            onClick={fetchData}
            className="ml-2 text-blue-600 hover:text-blue-800 underline"
          >
            Thử lại
          </button>
        </div>
      )}

      {isOpen && !loading && !error && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {data.length === 0 ? (
            <div className="px-4 py-3 text-gray-500 text-center">
              Không có dữ liệu
            </div>
          ) : (
            data.map((item) => (
              <button
                key={String(item[valueKey])}
                onClick={() => handleSelect(item)}
                className={`
                  w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors duration-150
                  ${selected && item[valueKey] === selected[valueKey]
                    ? 'bg-blue-100 text-blue-900' 
                    : 'text-gray-900'}
                `}
              >
                {customRenderer ? customRenderer(item) : renderDefaultItem(item)}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// Custom renderer for Shape dropdown
const ShapeRenderer: React.FC<{ item: Shape }> = ({ item }) => (
  <div>
    <div className="font-medium">{item.shapeName}</div>
    <div className="text-sm text-gray-500 mt-1 space-y-1">
      <div>Kích thước: {item.shapeSize}</div>
      <div>Kích thước: {item.shapeHeight} x {item.shapeWidth} x {item.shapeLength} cm</div>
      <div>Thể tích: {item.shapeVolume} L</div>
    </div>
  </div>
);

const TerrariumEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [formData, setFormData] = useState<TerrariumFormData>({
    terrariumId: 0,
    tankMethodType: '',
    shape: '',
    environment: '',
    terrariumName: '',
    description: '',
    price: 0,
    stock: 0,
    status: 1,
    bodyHTML: ''
  });

  useEffect(() => {
    const loadTerrarium = async () => {
      try {
        const response = await fetch(`https://terarium.shop/api/Terrarium/get-${id}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result: TerrariumApiResponse = await response.json();
        
        if (result.status === 200 && result.data) {
          const data = result.data;
          setFormData({
            terrariumId: data.terrariumId,
            tankMethodType: data.tankMethods[0] || '',
            shape: data.shapes[0] || '',
            environment: data.environments[0] || '',
            terrariumName: data.name,
            description: data.description,
            price: data.price,
            stock: data.stock,
            status: data.status,
            bodyHTML: data.bodyHTML
          });
        } else {
          throw new Error(result.message || 'Failed to load terrarium data');
        }
      } catch (error) {
        console.error('Error loading terrarium:', error);
        alert('Có lỗi xảy ra khi tải dữ liệu terrarium');
        navigate('/manager/terrarium/list');
      } finally {
        setInitialLoading(false);
      }
    };

    if (id) {
      loadTerrarium();
    }
  }, [id, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'stock' || name === 'status' ? Number(value) : value
    }));
  };

  const handleEditorChange = (content: string) => {
    setFormData(prev => ({
      ...prev,
      bodyHTML: content
    }));
  };

  const handleDropdownSelect = (type: 'tankMethodType' | 'shape' | 'environment', item: any) => {
    let value = '';
    if (type === 'tankMethodType') {
      value = item.tankMethodType;
    } else if (type === 'shape') {
      value = item.shapeName;
    } else if (type === 'environment') {
      value = item.environmentName;
    }
    
    setFormData(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.terrariumName || !formData.description || !formData.tankMethodType || !formData.shape || !formData.environment) {
        throw new Error('Vui lòng điền đầy đủ thông tin bắt buộc');
      }

      const updateData: TerrariumUpdatePayload = {
        terrariumId: formData.terrariumId,
        tankMethodType: formData.tankMethodType,
        shape: formData.shape,
        environment: formData.environment,
        terrariumName: formData.terrariumName,
        description: formData.description,
        price: formData.price,
        stock: formData.stock,
        status: formData.status,
        bodyHTML: formData.bodyHTML
      };

      console.log('Sending update data:', updateData);

      const response = await fetch(`https://terarium.shop/api/Terrarium/update-terrarium-${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 200) {
        alert('Terrarium đã được cập nhật thành công!');
        navigate('/manager/terrarium/list');
      } else {
        throw new Error(result.message || 'Failed to update terrarium');
      }
    } catch (error) {
      console.error('Error updating terrarium:', error);
      alert(error instanceof Error ? error.message : 'Có lỗi xảy ra khi cập nhật terrarium');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Đang tải dữ liệu...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/manager/terrarium/list')}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa Terrarium</h1>
          <p className="text-gray-600">Cập nhật thông tin terrarium #{formData.terrariumId}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin cơ bản</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên Terrarium *
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mô tả *
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nội dung HTML
                  </label>
                  <Editor
                    apiKey="lfiqogz55f5k6y6cuza7ih9b59tc7t8h62v0z9lp8661yu2w"
                    value={formData.bodyHTML}
                    onEditorChange={handleEditorChange}
                    init={{
                      height: 300,
                      menubar: false,
                      plugins: [
                        'advlist autolink lists link image charmap print preview anchor',
                        'searchreplace visualblocks code fullscreen',
                        'insertdatetime media table paste code help wordcount'
                      ],
                      toolbar:
                        'undo redo | formatselect | bold italic backcolor | \
                        alignleft aligncenter alignright alignjustify | \
                        bullist numlist outdent indent | removeformat | help'
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Giá (VNĐ) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      required
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số lượng *
                    </label>
                    <input
                      type="number"
                      name="stock"
                      required
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.stock}
                      onChange={handleInputChange}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Cấu hình Terrarium</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phương pháp Tank *
                  </label>
                  <ApiDropdown<TankMethod>
                    apiUrl="https://terarium.shop/api/TankMethod"
                    placeholder="Chọn phương pháp tank"
                    valueKey="tankMethodId"
                    labelKey="tankMethodType"
                    selectedValue={formData.tankMethodType}
                    onSelect={(value) => handleDropdownSelect('tankMethodType', value)}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hình dạng *
                  </label>
                  <ApiDropdown<Shape>
                    apiUrl="https://terarium.shop/api/Shape/get-all"
                    placeholder="Chọn hình dạng"
                    valueKey="shapeId"
                    labelKey="shapeName"
                    selectedValue={formData.shape}
                    onSelect={(value) => handleDropdownSelect('shape', value)}
                    className="w-full"
                    customRenderer={(item) => <ShapeRenderer item={item} />}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Môi trường *
                  </label>
                  <ApiDropdown<Environment>
                    apiUrl="https://terarium.shop/api/Environment"
                    placeholder="Chọn môi trường"
                    valueKey="environmentId"
                    labelKey="environmentName"
                    selectedValue={formData.environment}
                    onSelect={(value) => handleDropdownSelect('environment', value)}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Trạng thái</h3>
              <select
                name="status"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.status}
                onChange={handleInputChange}
              >
                <option value={1}>Hoạt động</option>
                <option value={0}>Không hoạt động</option>
              </select>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Cấu hình hiện tại</h3>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-700 text-sm">Tank Method</h4>
                  <p className="text-sm text-gray-600">
                    {formData.tankMethodType || 'Chưa chọn'}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-700 text-sm">Shape</h4>
                  <p className="text-sm text-gray-600">
                    {formData.shape || 'Chưa chọn'}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-700 text-sm">Environment</h4>
                  <p className="text-sm text-gray-600">
                    {formData.environment || 'Chưa chọn'}
                  </p>
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
                  <span>{loading ? 'Đang cập nhật...' : 'Cập nhật Terrarium'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/manager/terrarium/list')}
                  className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default TerrariumEdit;