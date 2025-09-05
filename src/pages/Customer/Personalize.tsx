// src/pages/Customer/Personalize.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button, Card, Spin } from 'antd';
import { ArrowRightOutlined, HomeOutlined } from '@ant-design/icons';
import { ToastContainer, toast } from 'react-toastify';
import { gsap } from 'gsap';
import 'react-toastify/dist/ReactToastify.css';

/**
 * PERSONALIZE WIZARD
 * - Chỉ hiển thị khi: isPersonalize === false && role === "User"
 * - Nếu đã personalize hoặc role khác "User" -> redirect "/" (không toast, không render)
 * - 3 câu hỏi cuối dùng API: Environment, TankMethod, Shape.
 */

type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced' | null;
type Purpose = 'relax' | 'gift' | 'learn_care' | 'create_terrarium' | null;

interface UserPreferences {
  agreeToProvideInfo: boolean | null;
  experienceLevel: ExperienceLevel;
  purpose: Purpose;
  environmentId: number | null;
  tankMethodId: number | null;
  shapeId: number | null;
}

interface EnvDto {
  environmentId: number;
  environmentName: string;
  environmentDescription?: string;
}

interface ShapeDto {
  shapeId: number;
  shapeName: string;
  shapeDescription?: string;
  shapeMaterial?: string;
}

interface TankMethodDto {
  tankMethodId: number;
  tankMethodType: string;
  tankMethodDescription?: string;
}

const API_BASE = 'https://terarium.shop/api';

// Demo images (giữ cảm giác UI, bạn có thể thay bằng assets thực tế)
const IMG_BEGINNER = '/beginer.webp';     // lưu ý tên file: "beginer"
const IMG_INTERMEDIATE = '/average.webp';
const IMG_ADVANCED = '/hard.webp';

// ===== Helpers =====
function decodeJwtPayload(token?: string | null): Record<string, any> | null {
  try {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function extractRole(payload: Record<string, any> | null): string | null {
  if (!payload) return null;
  // .NET thường để claim role theo namespace dưới:
  const dotnetRole = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
  const role =
    dotnetRole ??
    payload.role ??
    (Array.isArray(payload.roles) ? payload.roles[0] : payload.roles) ??
    payload.Role;
  if (!role) return null;
  if (Array.isArray(role)) return (role[0] ?? '').toString().trim();
  return role.toString().trim();
}

function authHeader() {
  const token = localStorage.getItem('authToken');
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}

const Personalize: React.FC = () => {
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);

  // ===== STATE =====
  const [redirecting, setRedirecting] = useState<boolean>(false); // chặn render khi không đủ điều kiện
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  // API lists
  const [envList, setEnvList] = useState<EnvDto[]>([]);
  const [shapeList, setShapeList] = useState<ShapeDto[]>([]);
  const [tankList, setTankList] = useState<TankMethodDto[]>([]);

  const [prefs, setPrefs] = useState<UserPreferences>({
    agreeToProvideInfo: null,
    experienceLevel: null,
    purpose: null,
    environmentId: null,
    tankMethodId: null,
    shapeId: null,
  });

  // ===== Gate by token claims (isPersonalize + role) =====
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const payload = decodeJwtPayload(token);

    const isPersonalize =
      payload?.isPersonalize ?? payload?.IsPersonalize ?? payload?.is_personalize;
    const isPersonalizeTrue = String(isPersonalize).toLowerCase() === 'true';

    const role = extractRole(payload);
    const isUser = (role ?? '').toLowerCase() === 'user';

    // Chỉ cho vào wizard nếu: chưa personalize và role là "User"
    if (isPersonalizeTrue || !isUser) {
      setRedirecting(true);
      navigate('/', { replace: true });
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== Fetch lists =====
  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [envRes, shapeRes, tankRes] = await Promise.all([
          axios.get<{ status: number; data: EnvDto[] }>(`${API_BASE}/Environment/get-all`),
          axios.get<{ status: number; data: ShapeDto[] }>(`${API_BASE}/Shape/get-all`),
          axios.get<{ status: number; data: TankMethodDto[] }>(`${API_BASE}/TankMethod/get-all`),
        ]);
        if (!mounted) return;
        setEnvList(envRes.data?.data ?? []);
        setShapeList(shapeRes.data?.data ?? []);
        setTankList(tankRes.data?.data ?? []);
      } catch (e) {
        console.error('Fetch lists failed', e);
        toast.error('Không thể tải danh sách cá nhân hóa. Vui lòng thử lại!');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (!redirecting) fetchAll();
    return () => {
      mounted = false;
    };
  }, [redirecting]);

  // ===== Handlers =====
  function handleSkip() {
    navigate('/');
  }

  function handleNext(stepsLocal: readonly any[]) {
    const step = stepsLocal[currentStep];
    const valid = step?.validate?.();
    if (valid !== true) {
      toast.error(typeof valid === 'string' ? valid : 'Vui lòng hoàn tất bước này');
      return;
    }
    if (currentStep < stepsLocal.length - 1) {
      setCurrentStep((s) => s + 1);
      if (cardRef.current) gsap.set(cardRef.current, { opacity: 1, y: 0 });
    }
  }

  async function handleSubmit() {
    try {
      if (!prefs.environmentId || !prefs.tankMethodId || !prefs.shapeId) {
        toast.error('Vui lòng chọn đủ Môi trường, Loại bể và Hình dạng.');
        return;
      }
      setLoading(true);
      const body = {
        environmentId: prefs.environmentId,
        tankMethodId: prefs.tankMethodId,
        shapeId: prefs.shapeId,
      };
      await axios.post(`${API_BASE}/Personalize/add-personalize`, body, authHeader());
      // Sau khi lưu xong -> về home luôn
      navigate('/', { replace: true });
    } catch (e: any) {
      console.error('Submit personalize failed', e);
      const msg = e?.response?.data?.message ?? 'Không thể lưu cá nhân hóa. Thử lại sau!';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  // ===== Step Configs =====
  const steps = useMemo(() => {
    const stepsLocal = [
      {
        key: 'agree',
        title: 'Chào mừng đến TerraTechGarden!',
        render: (
          <div className="text-center">
            <h2 className="text-4xl font-bold text-green-900 mb-6">Chào bạn!</h2>
            <p className="text-lg text-gray-800 mb-8">
              Để mang đến trải nghiệm tốt nhất, bạn vui lòng cho phép chúng tôi thu thập một vài lựa chọn cơ bản.
            </p>
            <label className="flex items-center justify-center space-x-2">
              <input
                type="checkbox"
                checked={prefs.agreeToProvideInfo === true}
                onChange={(e) => setPrefs((p) => ({ ...p, agreeToProvideInfo: e.target.checked }))}
                className="h-5 w-5 text-green-600 border-green-300 focus:ring-green-500"
              />
              <span className="text-base text-green-900">
                Tôi đồng ý cung cấp thông tin để nâng cao trải nghiệm
              </span>
            </label>
            <div className="mt-8 flex justify-center space-x-6">
              <Button
                type="primary"
                className="bg-green-600 hover:bg-green-700 text-lg px-6 py-3 transition duration-300 transform hover:scale-105"
                onClick={() => handleNext(stepsLocal)}
                disabled={prefs.agreeToProvideInfo !== true}
              >
                Bắt đầu <ArrowRightOutlined />
              </Button>
              <Button
                type="default"
                className="bg-gray-200 hover:bg-gray-300 text-lg px-6 py-3 transition duration-300 transform hover:scale-105"
                onClick={handleSkip}
              >
                Bỏ qua
              </Button>
            </div>
          </div>
        ),
        validate: () =>
          prefs.agreeToProvideInfo === true || 'Vui lòng đồng ý để tiếp tục',
      },
      {
          key: 'exp',
          title: 'Trải nghiệm của bạn với terrarium?',
          render: (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {([
                { key: 'beginner',     label: 'Người mới', img: IMG_BEGINNER },
                { key: 'intermediate', label: 'Đã sở hữu bể',  img: IMG_INTERMEDIATE },
                { key: 'advanced',     label: 'Nâng cao',    img: IMG_ADVANCED },
              ] as const).map((opt) => (
                <div
                  key={opt.key}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition duration-300 transform hover:scale-105 ${
                    prefs.experienceLevel === opt.key
                      ? 'border-green-700 bg-green-100'
                      : 'border-green-300 hover:border-green-700'
                  }`}
                  onClick={() => setPrefs((p) => ({ ...p, experienceLevel: opt.key }))}
                >
                  <img
                    src={opt.img}
                    alt={opt.label}
                    className="w-full h-40 object-cover rounded-md mb-4"
                    loading="lazy"
                  />
                  <h3 className="text-xl font-semibold text-center text-green-900">
                    {opt.label}
                  </h3>
                </div>
              ))}
            </div>
          ),
          validate: () => !!prefs.experienceLevel || 'Vui lòng chọn 1 tùy chọn',
        },

      {
        key: 'purpose',
        title: 'Mục đích chính của bạn?',
        render: (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { key: 'relax', label: 'Thư giãn/Trang trí' },
              { key: 'gift', label: 'Làm quà tặng' },
              { key: 'learn_care', label: 'Tìm hiểu chăm sóc' },
              { key: 'create_terrarium', label: 'Tạo một bể terrarium' },
            ].map((opt) => (
              <div
                key={opt.key}
                className={`p-4 border-2 rounded-lg cursor-pointer transition duration-300 transform hover:scale-105 ${
                  prefs.purpose === opt.key
                    ? 'border-green-700 bg-green-100'
                    : 'border-green-300 hover:border-green-700'
                }`}
                onClick={() =>
                  setPrefs((p) => ({ ...p, purpose: opt.key as Purpose }))
                }
              >
                <h3 className="text-xl font-semibold text-green-900">
                  {opt.label}
                </h3>
              </div>
            ))}
          </div>
        ),
        validate: () => !!prefs.purpose || 'Vui lòng chọn 1 tùy chọn',
      },
      {
        key: 'environment',
        title: 'Bạn thích môi trường nào?',
        render: (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {envList.map((env) => (
              <div
                key={env.environmentId}
                className={`p-4 border-2 rounded-lg cursor-pointer transition duration-300 transform hover:scale-105 ${
                  prefs.environmentId === env.environmentId
                    ? 'border-green-700 bg-green-100'
                    : 'border-green-300 hover:border-green-700'
                }`}
                onClick={() =>
                  setPrefs((p) => ({ ...p, environmentId: env.environmentId }))
                }
              >
                <h3 className="text-xl font-semibold text-green-900 text-center">
                  {env.environmentName}
                </h3>
                {env.environmentDescription && (
                  <p className="text-sm text-gray-700 mt-2 text-center">
                    {env.environmentDescription}
                  </p>
                )}
              </div>
            ))}
          </div>
        ),
        validate: () => !!prefs.environmentId || 'Vui lòng chọn môi trường',
      },
      {
        key: 'tankMethod',
        title: 'Bạn muốn loại bể nào?',
        render: (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tankList.map((t) => (
              <div
                key={t.tankMethodId}
                className={`p-4 border-2 rounded-lg cursor-pointer transition duration-300 transform hover:scale-105 ${
                  prefs.tankMethodId === t.tankMethodId
                    ? 'border-green-700 bg-green-100'
                    : 'border-green-300 hover:border-green-700'
                }`}
                onClick={() =>
                  setPrefs((p) => ({ ...p, tankMethodId: t.tankMethodId }))
                }
              >
                <h3 className="text-xl font-semibold text-green-900 text-center">
                  {t.tankMethodType}
                </h3>
                {t.tankMethodDescription && (
                  <p className="text-sm text-gray-700 mt-2 text-center">
                    {t.tankMethodDescription}
                  </p>
                )}
              </div>
            ))}
          </div>
        ),
        validate: () => !!prefs.tankMethodId || 'Vui lòng chọn loại bể',
      },
      {
        key: 'shape',
        title: 'Hình dạng bể bạn thích?',
        render: (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {shapeList.map((s) => (
              <div
                key={s.shapeId}
                className={`p-4 border-2 rounded-lg cursor-pointer transition duration-300 transform hover:scale-105 ${
                  prefs.shapeId === s.shapeId
                    ? 'border-green-700 bg-green-100'
                    : 'border-green-300 hover:border-green-700'
                }`}
                onClick={() =>
                  setPrefs((p) => ({ ...p, shapeId: s.shapeId }))
                }
              >
                <h3 className="text-xl font-semibold text-green-900 text-center">
                  {s.shapeName}
                </h3>
                {s.shapeDescription && (
                  <p className="text-sm text-gray-700 mt-2 text-center">
                    {s.shapeDescription}
                  </p>
                )}
              </div>
            ))}
          </div>
        ),
        validate: () => !!prefs.shapeId || 'Vui lòng chọn hình dạng',
      },
      {
        key: 'done',
        title: 'Cảm ơn bạn!',
        render: (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-green-900 mb-4">
              Cảm ơn bạn đã hoàn thành!
            </h2>
            <p className="text-lg text-gray-800 mb-6">
              Nhấn hoàn tất để lưu lựa chọn và quay về trang chủ.
            </p>
            <Button
              type="primary"
              className="bg-green-600 hover:bg-green-700"
              onClick={handleSubmit}
            >
              Hoàn tất <ArrowRightOutlined />
            </Button>
            <div className="mt-6">
              <Button
                type="default"
                className="bg-gray-200 hover:bg-gray-300"
                onClick={() => navigate('/')}
                icon={<HomeOutlined />}
              >
                Về trang chủ
              </Button>
            </div>
          </div>
        ),
        validate: () => true,
      },
    ] as const;

    return stepsLocal;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs, envList, shapeList, tankList, currentStep]);

  // ===== Simple appear effect =====
  useEffect(() => {
    if (cardRef.current) {
      gsap.set(cardRef.current, { opacity: 1, y: 0 });
    }
  }, [currentStep]);

  // ===== Redirect guard: không render gì khi chuyển trang =====
  if (redirecting) return null;

  // ===== Render =====
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4">
      <ToastContainer />
      <div ref={cardRef} className="w-full max-w-5xl">
        <Card className="shadow-xl rounded-2xl">
          <div className="mb-6 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-emerald-900">
              {steps[currentStep]?.title}
            </h1>
          </div>

          {loading && (
            <div className="w-full flex items-center justify-center py-10">
              <Spin tip="Đang tải dữ liệu..." />
            </div>
          )}

          {!loading && (
            <div className="space-y-8">
              <div>{steps[currentStep]?.render}</div>

              {/* Footer controls */}
              <div className="flex items-center justify-between">
                <Button
                  type="default"
                  className="bg-gray-100 hover:bg-gray-200"
                  onClick={() =>
                    currentStep > 0 ? setCurrentStep((s) => s - 1) : navigate('/')
                  }
                >
                  {currentStep > 0 ? 'Quay lại' : 'Thoát'}
                </Button>
                {currentStep < steps.length - 1 ? (
                  <Button
                    type="primary"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleNext(steps)}
                  >
                    Tiếp tục
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handleSubmit}
                    loading={loading}
                  >
                    Hoàn tất
                  </Button>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Personalize;
