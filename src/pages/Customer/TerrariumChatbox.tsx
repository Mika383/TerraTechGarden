import React, { useMemo, useState } from 'react';
import { Check, ChevronRight, Loader2, Sparkles, ImageIcon, Heart, Leaf } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Image } from 'antd';

// ✅ Thêm MembershipGate
import MembershipGate from '@/components/common/MembershipGate';

// ===== Types =====
type Environment = {
  environmentId: number;
  environmentName: string;
  environmentDescription: string;
};
type Shape = {
  shapeId: number;
  shapeName: string;
  shapeDescription: string;
  shapeMaterial: string;
};
type TankMethod = {
  tankMethodId: number;
  tankMethodType: string;
  tankMethodDescription: string;
};
type GeneratedTerrarium = {
  environmentId: number;
  shapeId: number;
  tankMethodId: number;
  accessoryNames: string[];
  terrariumName: string;
  terrariumImages: string[];
  stock: number;
  minPrice: number;
  maxPrice: number;
  description: string;
  status: string;
  bodyHTML: string;
};

// ===== Helpers =====
const getCurrentUser = () => {
  const id = Number(localStorage.getItem('userId') || '15');
  const name =
    localStorage.getItem('fullName') ||
    localStorage.getItem('userName') ||
    'Người dùng';
  return { id, name };
};
const currency = (v: number) => (v || 0).toLocaleString('vi-VN') + ' ₫';

// ✅ headers có kèm Authorization
const authHeaders = () => {
  const token = localStorage.getItem('authToken');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

// ===== Component =====
const TerrariumChatbox: React.FC = () => {
  const navigate = useNavigate();
  const user = useMemo(getCurrentUser, []);
  const [step, setStep] = useState<'idle' | 'env' | 'shape' | 'tank' | 'generate' | 'pickImage' | 'created' | 'saved'>('idle');

  // selections
  const [environmentId, setEnvironmentId] = useState<number | null>(null);
  const [shapeId, setShapeId] = useState<number | null>(null);
  const [tankMethodId, setTankMethodId] = useState<number | null>(null);

  // data
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [tankMethods, setTankMethods] = useState<TankMethod[]>([]);
  const [gen, setGen] = useState<GeneratedTerrarium | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // results
  const [createdTerrariumId, setCreatedTerrariumId] = useState<number | null>(null);

  // ui
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // ------- Fetchers -------
  const fetchEnvironments = async () => {
    setErr(null);
    try {
      setLoading(true);
      const res = await fetch('https://terarium.shop/api/Environment/get-all');
      const data = await res.json();
      setEnvironments(data?.data || []);
      setStep('env');
    } catch {
      setErr('Không tải được danh sách môi trường.');
    } finally {
      setLoading(false);
    }
  };

  const fetchShapes = async () => {
    setErr(null);
    try {
      setLoading(true);
      const res = await fetch('https://terarium.shop/api/Shape/get-all');
      const data = await res.json();
      setShapes(data?.data || []);
      setStep('shape');
    } catch {
      setErr('Không tải được danh sách hình dạng bể.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTankMethods = async () => {
    setErr(null);
    try {
      setLoading(true);
      const res = await fetch('https://terarium.shop/api/TankMethod/get-all');
      const data = await res.json();
      setTankMethods(data?.data || []);
      setStep('tank');
    } catch {
      setErr('Không tải được danh sách loại bể.');
    } finally {
      setLoading(false);
    }
  };

  const handle401 = () => {
    setErr('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    navigate('/login');
  };

  const autoGenerate = async () => {
    if (!environmentId || !shapeId || !tankMethodId) return;
    setErr(null);
    try {
      setLoading(true);
      setStep('generate');
      const res = await fetch('https://terarium.shop/api/AI/auto-generate', {
        method: 'POST',
        headers: authHeaders(), // ✅ thêm token (phòng BE yêu cầu)
        body: JSON.stringify({
          environmentId,
          shapeId,
          tankMethodId,
          accessoryId: 0,
        }),
      });

      if (res.status === 401) return handle401();

      const data = await res.json();
      setGen(data);
      setStep('pickImage');
    } catch {
      setErr('Tạo mẫu thất bại, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const createTerrarium = async (imageUrl: string) => {
    if (!gen) return;
    setErr(null);
    try {
      setLoading(true);
      const payload = {
        environmentId: gen.environmentId,
        shapeId: gen.shapeId,
        tankMethodId: gen.tankMethodId,
        accessoryNames: [],
        terrariumName: `${gen.terrariumName} của ${user.name}`,
        terrariumImages: [imageUrl],
        stock: 99,
        minPrice: gen.minPrice,
        maxPrice: gen.maxPrice,
        description: gen.description,
        status: 'Active',
        bodyHTML: gen.bodyHTML,
      };

      const res = await fetch('https://terarium.shop/api/Terrarium/add-terrariumbyai', {
        method: 'POST',
        headers: authHeaders(), // ✅ BẮT BUỘC
        body: JSON.stringify(payload),
      });

      if (res.status === 401) return handle401();

      const result = await res.json();
      if (result?.status === 201) {
        setCreatedTerrariumId(result?.data?.terrariumId);
        setStep('created');
      } else {
        setErr(result?.message || 'Tạo terrarium thất bại.');
      }
    } catch {
      setErr('Tạo terrarium thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const saveLayout = async () => {
    if (!createdTerrariumId || !gen) return;
    setErr(null);
    try {
      setLoading(true);
      const res = await fetch('https://terarium.shop/api/TerrariumLayout/create', {
        method: 'POST',
        headers: authHeaders(), // ✅ BẮT BUỘC
        body: JSON.stringify({
          userId: Number(localStorage.getItem('userId') || user.id),
          layoutName: `${gen.terrariumName} của ${user.name}`,
          terrariumId: createdTerrariumId,
        }),
      });

      if (res.status === 401) return handle401();

      const data = await res.json();
      if (data?.layoutId) {
        setStep('saved');
      } else {
        setErr(data?.message || 'Lưu layout thất bại.');
      }
    } catch {
      setErr('Lưu layout thất bại.');
    } finally {
      setLoading(false);
    }
  };

  // ------- Flow handlers -------
  const startFlow = async () => {
    setErr(null);
    setEnvironmentId(null);
    setShapeId(null);
    setTankMethodId(null);
    setSelectedImage(null);
    setGen(null);
    setCreatedTerrariumId(null);
    await fetchEnvironments();
  };

  const onPickEnvironment = async (id: number) => {
    setEnvironmentId(id);
    await fetchShapes();
  };

  const onPickShape = async (id: number) => {
    setShapeId(id);
    await fetchTankMethods();
  };

  const onPickTank = async (id: number) => {
    setTankMethodId(id);
    await autoGenerate();
  };

  const onPickImage = async (url: string) => {
    setSelectedImage(url);
    await createTerrarium(url);
  };

  const restart = () => {
    setStep('idle');
    setErr(null);
    setEnvironmentId(null);
    setShapeId(null);
    setTankMethodId(null);
    setSelectedImage(null);
    setGen(null);
    setCreatedTerrariumId(null);
  };

  // ------- UI blocks -------
  const Stepper = () => {
    const active = (s: typeof step) =>
      step === s ||
      (s === 'env' && ['shape', 'tank', 'generate', 'pickImage', 'created', 'saved'].includes(step)) ||
      (s === 'shape' && ['tank', 'generate', 'pickImage', 'created', 'saved'].includes(step)) ||
      (s === 'tank' && ['generate', 'pickImage', 'created', 'saved'].includes(step)) ||
      (s === 'generate' && ['pickImage', 'created', 'saved'].includes(step)) ||
      (s === 'pickImage' && ['created', 'saved'].includes(step)) ||
      (s === 'created' && ['saved'].includes(step));

    const Dot = ({ label, s }: { label: string; s: typeof step }) => (
      <div className="flex items-center">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
          ${active(s) ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}`}
        >
          {active(s) ? <Check className="w-4 h-4" /> : label[0]}
        </div>
        <span className={`ml-2 text-sm ${active(s) ? 'text-green-700' : 'text-gray-500'}`}>{label}</span>
      </div>
    );

    return (
      <div className="flex flex-wrap gap-4 items-center">
        <Dot label="Môi trường" s="env" />
        <ChevronRight className="text-gray-400" />
        <Dot label="Hình dạng" s="shape" />
        <ChevronRight className="text-gray-400" />
        <Dot label="Loại bể" s="tank" />
        <ChevronRight className="text-gray-400" />
        <Dot label="Tạo mẫu" s="generate" />
        <ChevronRight className="text-gray-400" />
        <Dot label="Chọn ảnh" s="pickImage" />
        <ChevronRight className="text-gray-400" />
        <Dot label="Tạo xong" s="created" />
      </div>
    );
  };

  const Card = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-white rounded-xl shadow p-5">{children}</div>
  );

  // ====== Toàn bộ UI chính bên trong MembershipGate + fix full-height ======
  return (
    <MembershipGate message="Bạn cần là thành viên để sử dụng trình tạo Layout bằng AI.">
      {/* Spacer tránh header fixed đè lên nội dung — đổi 64px nếu header cao khác */}
      <div className="h-[64px]" aria-hidden />

      {/* Luôn chiếm đủ viewport trừ chiều cao header */}
      <div className="min-h-[calc(100vh-64px)]">
        <div className="container mx-auto px-4 py-8 font-roboto">
          {/* Hiện lỗi nếu có */}
          {err && (
            <div className="mb-4 p-3 rounded bg-red-50 text-red-700 border border-red-200">{err}</div>
          )}

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-extrabold text-green-700 flex items-center gap-2">
              <Sparkles className="w-7 h-7" /> Tạo Layout Terrarium
            </h1>
            <p className="text-gray-600">
              Làm theo từng bước: chọn môi trường → hình dạng → loại bể → tạo mẫu → chọn ảnh → lưu layout.
            </p>
          </div>

          {/* CTA lúc nhàn rỗi */}
          {step === 'idle' && (
            <Card>
              <div className="text-center py-10">
                <Leaf className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <h2 className="text-xl font-bold mb-2">Bắt đầu với một layout mới</h2>
                <p className="text-gray-600 mb-6">Nhấn nút bên dưới để chọn từng thành phần theo ý thích của bạn.</p>
                <button
                  onClick={startFlow}
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold"
                >
                  <Sparkles className="w-5 h-5" /> Tôi muốn tạo layout mới
                </button>
              </div>
            </Card>
          )}

          {/* Thanh bước */}
          {step !== 'idle' && (
            <Card>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <Stepper />
                <div className="text-sm text-gray-500">Xin chào, <b>{user.name}</b>!</div>
              </div>
            </Card>
          )}

          {/* Bước: chọn môi trường */}
          {step === 'env' && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {environments.map((e) => (
                <Card key={e.environmentId}>
                  <div className="flex items-start gap-3">
                    <Leaf className="w-10 h-10 text-green-600" />
                    <div className="flex-1">
                      <h3 className="font-bold text-green-700">{e.environmentName}</h3>
                      <p className="text-gray-600 text-sm">{e.environmentDescription}</p>
                      <button
                        onClick={() => onPickEnvironment(e.environmentId)}
                        className="mt-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                      >
                        Chọn môi trường này
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Bước: chọn hình dạng */}
          {step === 'shape' && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {shapes.map((s) => (
                <Card key={s.shapeId}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded bg-blue-600/10 border border-blue-200" />
                    <div className="flex-1">
                      <h3 className="font-bold text-blue-700">{s.shapeName}</h3>
                      <p className="text-gray-600 text-sm">{s.shapeDescription}</p>
                      <p className="text-xs text-blue-500 mt-1">Chất liệu: {s.shapeMaterial}</p>
                      <button
                        onClick={() => onPickShape(s.shapeId)}
                        className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                      >
                        Chọn hình dạng này
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Bước: chọn loại bể */}
          {step === 'tank' && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {tankMethods.map((t) => (
                <Card key={t.tankMethodId}>
                  <div className="flex items-start gap-3">
                    <ImageIcon className="w-10 h-10 text-purple-600" />
                    <div className="flex-1">
                      <h3 className="font-bold text-purple-700">{t.tankMethodType}</h3>
                      <p className="text-gray-600 text-sm">{t.tankMethodDescription}</p>
                      <button
                        onClick={() => onPickTank(t.tankMethodId)}
                        className="mt-3 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
                      >
                        Chọn loại bể này
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Bước: tạo mẫu */}
          {step === 'generate' && (
            <div className="mt-6">
              <Card>
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-green-600" />
                  <div className="font-medium text-green-700">Đang tạo terrarium cho bạn...</div>
                </div>
              </Card>
            </div>
          )}

          {/* Bước: chọn 1 trong 4 ảnh */}
          {step === 'pickImage' && gen && (
            <div className="mt-6 grid grid-cols-1 gap-4">
              <Card>
                <h3 className="text-lg font-bold text-green-700">{gen.terrariumName}</h3>
                <p className="text-gray-700 mt-1">{gen.description}</p>
                <div className="flex flex-wrap gap-4 text-sm text-green-700 mt-2">
                  <span>Giá: <b>{currency(gen.minPrice)} - {currency(gen.maxPrice)}</b></span>
                  <span>Tồn: <b>{gen.stock}</b></span>
                </div>
              </Card>

              <Image.PreviewGroup>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {gen.terrariumImages.map((url, idx) => (
                    <div key={idx} className="rounded-lg overflow-hidden border">
                      <Image
                        src={url}
                        alt={`Terrarium ${idx + 1}`}
                        height={192}
                        preview={{ mask: 'Xem lớn' }}
                        className="w-full object-cover"
                        style={{ width: '100%', objectFit: 'cover' }}
                      />
                      <div className="p-2 border-t flex items-center justify-between">
                        <span className="text-xs text-gray-600">Mẫu #{idx + 1}</span>
                        <button
                          onClick={() => onPickImage(url)}
                          className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                        >
                          Chọn mẫu này
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Image.PreviewGroup>
            </div>
          )}

          {/* Bước: đã tạo terrarium thành công */}
          {step === 'created' && (
            <div className="mt-6">
              <Card>
                <div className="flex items-start gap-4">
                  <Check className="w-6 h-6 text-green-600 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-green-700">Terrarium đã được tạo thành công!</h3>
                    {selectedImage && (
                      <img
                        src={selectedImage}
                        alt="Selected terrarium"
                        className="mt-3 w-full max-w-md h-48 object-cover rounded-lg border"
                      />
                    )}
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={saveLayout}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-5 py-2 rounded inline-flex items-center gap-2"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4" />}
                        Lưu layout này
                      </button>
                      <button
                        onClick={restart}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-5 py-2 rounded"
                      >
                        Tạo mới
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Bước: đã lưu layout */}
          {step === 'saved' && (
            <div className="mt-6">
              <Card>
                <div className="text-center py-8">
                  <Heart className="w-10 h-10 text-pink-600 mx-auto mb-2" />
                  <h3 className="text-lg font-bold text-green-700">Đã lưu layout thành công!</h3>
                  <p className="text-gray-600 mt-1">Bạn có thể xem lại trong mục <b>“Layout của tôi”</b>.</p>
                  <div className="flex gap-3 justify-center mt-5">
                    <button
                      onClick={() => navigate('/customer-dashboard/my-layouts')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded"
                    >
                      Xem layout của tôi
                    </button>
                    <button
                      onClick={restart}
                      className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded"
                    >
                      Tạo layout mới
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Loading bar */}
          {loading && (
            <div className="fixed bottom-4 right-4 bg-black/80 text-white px-3 py-2 rounded-md text-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...
            </div>
          )}
        </div>
      </div>
    </MembershipGate>
  );
};

export default TerrariumChatbox;
