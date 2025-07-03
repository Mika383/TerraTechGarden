import React, { useState, useEffect } from 'react';
import { ChevronDown, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

// Type definitions
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
}

// Component cho từng dropdown riêng biệt
const ApiDropdown = <T extends Record<string, any>>({ 
  apiUrl, 
  placeholder, 
  valueKey, 
  labelKey,
  onSelect,
  className = '',
  disabled = false
}: ApiDropdownProps<T>) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedValue, setSelectedValue] = useState<T | null>(null);

  useEffect(() => {
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
      
      // Xử lý dữ liệu từ API response
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
      {/* Dropdown Button */}
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

      {/* Error Message */}
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

      {/* Dropdown Menu */}
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
                <div className="font-medium">{getDisplayValue(item)}</div>
                {item[getDescriptionKey(labelKey)] && (
                  <div className="text-sm text-gray-500 mt-1">
                    {String(item[getDescriptionKey(labelKey)])}
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

// Type for selections
interface Selections {
  tankMethod: TankMethod | null;
  shape: Shape | null;
  environment: Environment | null;
}

// Component chính chứa tất cả các dropdown
const TerariumDropdowns: React.FC = () => {
  const [selections, setSelections] = useState<Selections>({
    tankMethod: null,
    shape: null,
    environment: null
  });

  const handleSelectionChange = (type: keyof Selections, value: TankMethod | Shape | Environment): void => {
    setSelections(prev => ({
      ...prev,
      [type]: value
    }));
    console.log(`${type} selected:`, value);
  };

  const resetSelections = (): void => {
    setSelections({
      tankMethod: null,
      shape: null,
      environment: null
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Terarium Configuration</h1>
          <button
            onClick={resetSelections}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tank Method Dropdown */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tank Method
            </label>
            <ApiDropdown<TankMethod>
              apiUrl="https://terarium.shop/api/TankMethod"
              placeholder="Chọn phương pháp tank"
              valueKey="tankMethodId"
              labelKey="tankMethodType"
              onSelect={(value) => handleSelectionChange('tankMethod', value)}
              className="w-full"
            />
          </div>

          {/* Shape Dropdown */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Shape
            </label>
            <ApiDropdown<Shape>
              apiUrl="https://terarium.shop/api/Shape/get-all"
              placeholder="Chọn hình dạng"
              valueKey="shapeId"
              labelKey="shapeName"
              onSelect={(value) => handleSelectionChange('shape', value)}
              className="w-full"
            />
          </div>

          {/* Environment Dropdown */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Environment
            </label>
            <ApiDropdown<Environment>
              apiUrl="https://terarium.shop/api/Environment"
              placeholder="Chọn môi trường"
              valueKey="environmentId"
              labelKey="environmentName"
              onSelect={(value) => handleSelectionChange('environment', value)}
              className="w-full"
            />
          </div>
        </div>

        {/* Selection Summary */}
        <div className="mt-8 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Selections</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-medium text-gray-700 mb-2">Tank Method</h4>
              <p className="text-sm text-gray-600">
                {selections.tankMethod 
                  ? `${selections.tankMethod.tankMethodType} (ID: ${selections.tankMethod.tankMethodId})`
                  : 'Chưa chọn'
                }
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-medium text-gray-700 mb-2">Shape</h4>
              <p className="text-sm text-gray-600">
                {selections.shape 
                  ? `${selections.shape.shapeName} (ID: ${selections.shape.shapeId})`
                  : 'Chưa chọn'
                }
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-medium text-gray-700 mb-2">Environment</h4>
              <p className="text-sm text-gray-600">
                {selections.environment 
                  ? `${selections.environment.environmentName} (ID: ${selections.environment.environmentId})`
                  : 'Chưa chọn'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-end space-x-4">
          <button
            onClick={() => console.log('Current selections:', selections)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            Confirm Selection
          </button>
        </div>
      </div>
    </div>
  );
};

export default TerariumDropdowns;