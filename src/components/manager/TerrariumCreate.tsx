import React, { useState } from 'react';
import { ArrowLeft, Save, ChevronDown, Loader2, AlertCircle, X, Check } from 'lucide-react';
import { Editor } from '@tinymce/tinymce-react';
import axios from 'axios';


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
  shapeMaterial: string;
}

interface Environment {
  environmentId: number;
  environmentName: string;
  environmentDescription: string;
  terrariumEnvironments: any[];
}

interface Accessory {
  accessoryId: number;
  name: string;
  size: string;
  description: string;
  price: number;
  stock: number;
  categoryId: number;
  createdAt: string;
  updatedAt: string;
  status: string;
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
const CLOUDINARY_UPLOAD_URL = 'https://api.cloudinary.com/v1_1/dsp6pjeey/upload';
const CLOUDINARY_UPLOAD_PRESET = 'TerraTech';
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

interface AccessoryMultiSelectProps {
  apiUrl: string;
  placeholder: string;
  selectedAccessories: Accessory[];
  onSelectionChange: (accessories: Accessory[]) => void;
  className?: string;
  disabled?: boolean;
}

const AccessoryMultiSelect: React.FC<AccessoryMultiSelectProps> = ({
  apiUrl,
  placeholder,
  selectedAccessories,
  onSelectionChange,
  className = '',
  disabled = false
}) => {
  const [data, setData] = useState<Accessory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);

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
      
      const result: ApiResponse<Accessory> = await response.json();
      
      if (result.status === 200 && result.data) {
        setData(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch data');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching accessories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAccessory = (accessory: Accessory): void => {
    const isSelected = selectedAccessories.some(a => a.accessoryId === accessory.accessoryId);
    
    if (isSelected) {
      const newSelection = selectedAccessories.filter(a => a.accessoryId !== accessory.accessoryId);
      onSelectionChange(newSelection);
    } else {
      const newSelection = [...selectedAccessories, accessory];
      onSelectionChange(newSelection);
    }
  };

  const removeAccessory = (accessoryId: number): void => {
    const newSelection = selectedAccessories.filter(a => a.accessoryId !== accessoryId);
    onSelectionChange(newSelection);
  };

  const toggleDropdown = (): void => {
    if (!disabled && !loading) {
      setIsOpen(!isOpen);
    }
  };

  const isAccessorySelected = (accessory: Accessory): boolean => {
    return selectedAccessories.some(a => a.accessoryId === accessory.accessoryId);
  };

  return (
    <div className={`relative ${className}`}>
      <div
        onClick={toggleDropdown}
        className={`
          w-full px-4 py-3 bg-white border border-gray-300 rounded-lg
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          hover:bg-gray-50 transition-colors duration-200 cursor-pointer
          ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
          ${error ? 'border-red-300' : ''}
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {selectedAccessories.length === 0 ? (
              <span className="text-gray-500">{placeholder}</span>
            ) : (
              <div className="flex flex-wrap gap-1">
                {selectedAccessories.map((accessory) => (
                  <div
                    key={accessory.accessoryId}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    <span className="truncate max-w-20">{accessory.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeAccessory(accessory.accessoryId);
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
              Không có phụ kiện
            </div>
          ) : (
            data.map((accessory) => (
              <div
                key={accessory.accessoryId}
                onClick={() => handleToggleAccessory(accessory)}
                className={`
                  px-4 py-3 hover:bg-blue-50 transition-colors duration-150 cursor-pointer
                  ${isAccessorySelected(accessory) ? 'bg-blue-100' : ''}
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900">{accessory.name}</div>
                    <div className="text-sm text-gray-500 mt-1 space-y-1">
                      <div>Mô tả: {accessory.description}</div>
                      <div>Kích thước: {accessory.size}</div>
                      <div>Giá: {accessory.price.toLocaleString()} VNĐ</div>
                      <div>Tồn kho: {accessory.stock}</div>
                    </div>
                  </div>
                  <div className="ml-3">
                    {isAccessorySelected(accessory) && (
                      <Check className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </div>
              </div>
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
  status: string;
  bodyHTML: string;
  tankMethodType: string;
  shape: string;
  environment: string;
  accessoryNames: string[];
}

interface ApiSelections {
  tankMethod: TankMethod | null;
  shape: Shape | null;
  environment: Environment | null;
  accessories: Accessory[];
}

const TerrariumCreate: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<TerrariumFormData>({
    terrariumName: '',
    description: '',
    price: 0,
    stock: 0,
    status: 'active',
    bodyHTML: '',
    tankMethodType: '',
    shape: '',
    environment: '',
    accessoryNames: []
  });

  const [apiSelections, setApiSelections] = useState<ApiSelections>({
    tankMethod: null,
    shape: null,
    environment: null,
    accessories: []
  });

  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'stock' ? Number(value) : value
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

  const handleAccessorySelection = (accessories: Accessory[]): void => {
    setApiSelections(prev => ({
      ...prev,
      accessories
    }));

    setFormData(prev => ({
      ...prev,
      accessoryNames: accessories.map(accessory => accessory.name)
    }));
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
        accessoryNames: formData.accessoryNames,
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
            status: 'active',
            bodyHTML: '',
            tankMethodType: '',
            shape: '',
            environment: '',
            accessoryNames: []
          });
          setApiSelections({
            tankMethod: null,
            shape: null,
            environment: null,
            accessories: []
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

  const renderShapeOption = (shape: Shape) => (
    <div>
      <div className="font-medium">{shape.shapeName}</div>
      <div className="text-sm text-gray-500 mt-1 space-y-1">
        <div>Mô tả: {shape.shapeDescription}</div>
        <div>Chất liệu: {shape.shapeMaterial}</div>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phụ kiện (Tùy chọn)
                      </label>
                      <AccessoryMultiSelect
                        apiUrl="https://terarium.shop/api/Accessory/get-all"
                        placeholder="Chọn phụ kiện"
                        selectedAccessories={apiSelections.accessories}
                        onSelectionChange={handleAccessorySelection}
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
                            init={{
                              height: 500,
                              resize: true,
                              plugins: [
                                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'print', 'preview', 'anchor',
                                'searchreplace', 'visualblocks', 'code', 'fullscreen',
                                'insertdatetime', 'media', 'table', 'paste', 'help', 'wordcount'
                              ],
                              toolbar:
                                'undo redo | formatselect | bold italic backcolor | ' +
                                'alignleft aligncenter alignright alignjustify | ' +
                                'bullist numlist outdent indent | removeformat | image | help',
                              images_upload_handler: async (blobInfo: any, success: (url: string) => void, failure: (err: string) => void) => {
                                const formDataUpload = new FormData();
                                formDataUpload.append('file', blobInfo.blob());
                                formDataUpload.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

                                try {
                                  const res = await axios.post(CLOUDINARY_UPLOAD_URL, formDataUpload);
                                  if (res.data.secure_url) {
                                    success(res.data.secure_url);
                                  } else {
                                    failure('Không lấy được URL từ Cloudinary');
                                  }
                                } catch {
                                  failure('Upload ảnh thất bại');
                                }
                              },
                              content_style: 'img { max-width: 400px; height: auto; }'
                            }}
                            onEditorChange={handleEditorChange}
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
                          <div>Mô tả: {apiSelections.shape.shapeDescription}</div>
                          <div>Chất liệu: {apiSelections.shape.shapeMaterial}</div>
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium text-gray-700 text-sm">Environment</div>
                      <div className="text-sm text-gray-600">
                        {apiSelections.environment?.environmentName || 'Chưa chọn'}
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium text-gray-700 text-sm">Phụ kiện</div>
                      <div className="text-sm text-gray-600">
                        {apiSelections.accessories.length === 0 ? 'Chưa chọn' : 
                         `${apiSelections.accessories.length} phụ kiện đã chọn`}
                      </div>
                      {apiSelections.accessories.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1 space-y-1">
                          {apiSelections.accessories.map(accessory => (
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