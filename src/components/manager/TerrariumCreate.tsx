import React, { useState } from 'react';
import { ArrowLeft, Save, ChevronDown, Loader2, AlertCircle } from 'lucide-react';
import { Editor } from '@tinymce/tinymce-react';

interface TankMethod {
  tankMethodId: number;
  tankMethodType: string;
  tankMethodDescription: string;
  terrariumTankMethods: any[];
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
  terrariumEnvironments: any[];
}

interface ApiResponse<T> {
  status: number;
  message: string;
  data: T[];
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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedValue, setSelectedValue] = useState<T | null>(null);

  React.useEffect(() => {
    fetchData();
  }, [apiUrl]);

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
    setSelectedValue(item);
    setIsOpen(false);
    if (onSelect) {
      onSelect(item);
    }
  };

  const getDisplayValue = (item: T): string => {
    const value = item[labelKey];
    return typeof value === 'string' ? value : String(value || 'Unknown');
  };

  const getItemValue = (item: T): any => {
    return item[valueKey];
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
          <span className={`block truncate ${selectedValue ? 'text-gray-900' : 'text-gray-500'}`}>
            {loading ? 'Đang tải...' : 
             selectedValue ? getDisplayValue(selectedValue) : 
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
                key={String(getItemValue(item))}
                onClick={() => handleSelect(item)}
                className={`
                  w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors duration-150
                  ${selectedValue && getItemValue(selectedValue) === getItemValue(item) 
                    ? 'bg-blue-100 text-blue-900' 
                    : 'text-gray-900'}
                `}
              >
                {customRenderer ? customRenderer(item) : (
                  <div>
                    <div className="font-medium">{getDisplayValue(item)}</div>
                    {item[getDescriptionKey(labelKey)] && (
                      <div className="text-sm text-gray-500 mt-1">
                        {String(item[getDescriptionKey(labelKey)])}
                      </div>
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

interface TerrariumFormData {
  terrariumName: string;
  description: string;
  price: number;
  stock: number;
  status: number;
  bodyHTML: string;
  tankMethodType: string;
  shape: string;
  environment: string;
}

interface ApiSelections {
  tankMethod: TankMethod | null;
  shape: Shape | null;
  environment: Environment | null;
}

const TerrariumCreate: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<TerrariumFormData>({
    terrariumName: '',
    description: '',
    price: 0,
    stock: 0,
    status: 1,
    bodyHTML: '',
    tankMethodType: '',
    shape: '',
    environment: ''
  });

  const [apiSelections, setApiSelections] = useState<ApiSelections>({
    tankMethod: null,
    shape: null,
    environment: null
  });

  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const handleApiSelection = (type: keyof ApiSelections, value: TankMethod | Shape | Environment): void => {
    setApiSelections(prev => ({
      ...prev,
      [type]: value
    }));

    if (type === 'tankMethod') {
      setFormData(prev => ({
        ...prev,
        tankMethodType: (value as TankMethod).tankMethodType
      }));
    } else if (type === 'shape') {
      setFormData(prev => ({
        ...prev,
        shape: (value as Shape).shapeName
      }));
    } else if (type === 'environment') {
      setFormData(prev => ({
        ...prev,
        environment: (value as Environment).environmentName
      }));
    }
  };

  const validateForm = (): boolean => {
    if (!formData.terrariumName.trim()) {
      setSubmitMessage({ type: 'error', text: 'Vui lòng nhập tên terrarium' });
      return false;
    }
    if (!formData.description.trim()) {
      setSubmitMessage({ type: 'error', text: 'Vui lòng nhập mô tả' });
      return false;
    }
    if (!formData.tankMethodType) {
      setSubmitMessage({ type: 'error', text: 'Vui lòng chọn phương pháp tank' });
      return false;
    }
    if (!formData.shape) {
      setSubmitMessage({ type: 'error', text: 'Vui lòng chọn hình dạng' });
      return false;
    }
    if (!formData.environment) {
      setSubmitMessage({ type: 'error', text: 'Vui lòng chọn môi trường' });
      return false;
    }
    if (formData.price <= 0) {
      setSubmitMessage({ type: 'error', text: 'Vui lòng nhập giá hợp lệ' });
      return false;
    }
    if (formData.stock < 0) {
      setSubmitMessage({ type: 'error', text: 'Số lượng tồn kho không thể âm' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setSubmitMessage(null);
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const apiData = {
        tankMethodType: formData.tankMethodType,
        shape: formData.shape,
        environment: formData.environment,
        terrariumName: formData.terrariumName,
        description: formData.description,
        price: formData.price,
        stock: formData.stock,
        status: formData.status,
        bodyHTML: formData.bodyHTML || formData.description
      };

      console.log('Submitting terrarium data:', apiData);

      const response = await fetch('https://terarium.shop/api/Terrarium/add-terrarium', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('API Response:', result);

      if (result.status === 200 || result.message === "Save data success") {
        setSubmitMessage({ type: 'success', text: 'Terrarium đã được tạo thành công!' });
        
        setTimeout(() => {
          setFormData({
            terrariumName: '',
            description: '',
            price: 0,
            stock: 0,
            status: 1,
            bodyHTML: '',
            tankMethodType: '',
            shape: '',
            environment: ''
          });
          setApiSelections({
            tankMethod: null,
            shape: null,
            environment: null
          });
          setSubmitMessage(null);
        }, 2000);
      } else {
        throw new Error(result.message || 'Có lỗi xảy ra khi tạo terrarium');
      }
    } catch (error) {
      console.error('Error creating terrarium:', error);
      setSubmitMessage({ 
        type: 'error', 
        text: 'Có lỗi xảy ra khi tạo terrarium: ' + (error instanceof Error ? error.message : 'Unknown error')
      });
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    console.log('Navigate back');
  };

  // Custom renderer for Shape dropdown
  const renderShapeOption = (shape: Shape) => (
    <div>
      <div className="font-medium">{shape.shapeName}</div>
      <div className="text-sm text-gray-500 mt-1 space-y-1">
        <div>Kích thước: {shape.shapeSize}</div>
        <div>Kích thước: {shape.shapeHeight} x {shape.shapeWidth} x {shape.shapeLength}</div>
        <div>Thể tích: {shape.shapeVolume}</div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={goBack}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Thêm Terrarium Mới</h1>
              <p className="text-gray-600">Tạo một terrarium mới trong hệ thống</p>
            </div>
          </div>

          {submitMessage && (
            <div className={`p-4 rounded-lg ${
              submitMessage.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
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

          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Cấu hình Terrarium</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phương pháp Tank *
                      </label>
                      <ApiDropdown<TankMethod>
                        apiUrl="https://terarium.shop/api/TankMethod"
                        placeholder="Chọn phương pháp tank"
                        valueKey="tankMethodId"
                        labelKey="tankMethodType"
                        onSelect={(value) => handleApiSelection('tankMethod', value)}
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
                        onSelect={(value) => handleApiSelection('shape', value)}
                        className="w-full"
                        customRenderer={renderShapeOption}
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
                        onSelect={(value) => handleApiSelection('environment', value)}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

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
                        Nội dung HTML (Tùy chọn)
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                          Tồn kho *
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

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Trạng thái *
                        </label>
                        <select
                          name="status"
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={formData.status}
                          onChange={handleInputChange}
                        >
                          <option value={1}>Hoạt động</option>
                          <option value={2}>Không hoạt động</option>
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
                      <div className="text-sm text-gray-600">
                        {apiSelections.tankMethod?.tankMethodType || 'Chưa chọn'}
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium text-gray-700 text-sm">Shape</div>
                      <div className="text-sm text-gray-600">
                        {apiSelections.shape?.shapeName || 'Chưa chọn'}
                      </div>
                      {apiSelections.shape && (
                        <div className="text-xs text-gray-500 mt-1 space-y-1">
                          <div>Kích thước: {apiSelections.shape.shapeSize}</div>
                          <div>Kích thước: {apiSelections.shape.shapeHeight} x {apiSelections.shape.shapeWidth} x {apiSelections.shape.shapeLength}</div>
                          <div>Thể tích: {apiSelections.shape.shapeVolume}</div>
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium text-gray-700 text-sm">Environment</div>
                      <div className="text-sm text-gray-600">
                        {apiSelections.environment?.environmentName || 'Chưa chọn'}
                      </div>
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

                    <button
                      type="button"
                      onClick={goBack}
                      className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
                    >
                      Hủy
                    </button>
                  </div>
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