import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';

interface Environment {
  environmentId: number;
  environmentName: string;
  environmentDescription: string;
}

interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

interface Step3Props {
  selectedEnvironment: Environment | null;
  onSelect: (environment: Environment) => void;
  onNext: () => void;
  onPrev: () => void;
}

const Step3Environment: React.FC<Step3Props> = ({ 
  selectedEnvironment, 
  onSelect, 
  onNext, 
  onPrev 
}) => {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEnvironments();
  }, []);

  const fetchEnvironments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('https://terarium.shop/api/Environment/get-all');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result: ApiResponse<Environment[]> = await response.json();
      if (result.status !== 200) throw new Error(result.message || 'Failed to fetch data');
      setEnvironments(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (environment: Environment) => {
    onSelect(environment);
  };

  const canProceed = selectedEnvironment !== null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Bước 3: Chọn Môi Trường</h2>
        <p className="text-gray-600">Chọn loại môi trường sống phù hợp cho terrarium</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-3 text-gray-600">Đang tải dữ liệu...</span>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchEnvironments}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Thử lại
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {environments.map((environment) => (
            <div
              key={environment.environmentId}
              onClick={() => handleSelect(environment)}
              className={`p-6 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                selectedEnvironment?.environmentId === environment.environmentId
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">{environment.environmentName}</h3>
                {selectedEnvironment?.environmentId === environment.environmentId && (
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600">{environment.environmentDescription}</p>
            </div>
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onPrev}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Quay lại
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Tiếp theo
          <ChevronRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default Step3Environment;