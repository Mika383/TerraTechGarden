// src/pages/Customer/TerrariumChatbox.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image } from 'antd';
import {
  Check,
  ChevronRight,
  Loader2,
  Sparkles,
  Heart,
  Leaf,
  ArrowLeft,
  AlertTriangle,
  User as UserIcon,
} from 'lucide-react';

import MembershipGate from '@/components/common/MembershipGate';
import {
  getAllEnvironments,
  getAllShapes,
  getAllTankMethods,
  autoGenerateTerrarium as apiAutoGenerate,
  addTerrariumByAI,
  createTerrariumLayout,
  isAuthError,
} from '@/api/terrarium';

import type {
  Environment,
  Shape,
  TankMethod,
  GeneratedTerrarium,
} from '@/types/terrarium';

/* ---------------- Helpers ---------------- */
function parseJwt(token: string | null): any | null {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function getNameFromTokenOrStorage(): string {
  const token = localStorage.getItem('authToken');
  const p = parseJwt(token);
  return (
    p?.fullName ||
    p?.unique_name ||
    p?.userName ||
    p?.username ||
    localStorage.getItem('fullName') ||
    localStorage.getItem('userName') ||
    'Người dùng'
  );
}

function getUserIdFromTokenOrStorage(): number {
  const token = localStorage.getItem('authToken');
  const p = parseJwt(token);
  const raw = p?.sub || p?.userId || localStorage.getItem('userId') || '0';
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

/* ---------- ProgressBar: tách riêng, chỉ rerender phần progress ---------- */
const ProgressBar: React.FC<{ value: number }> = ({ value }) => (
  <div>
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm font-medium text-gray-700">Tiến trình</span>
      <span className="text-sm font-bold text-emerald-600">{Math.round(value)}%</span>
    </div>
    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-500 rounded-full transition-transform duration-200 ease-out origin-left"
        style={{ transform: `scaleX(${Math.max(0, Math.min(100, value)) / 100})` }}
      />
    </div>
  </div>
);

/* -------------------------------- Main Component -------------------------------- */
const TerrariumChatbox: React.FC = () => {
  const navigate = useNavigate();

  type Step = 'idle' | 'env' | 'shape' | 'tank' | 'generate' | 'pickImage' | 'created' | 'saved';
  const [step, setStep] = useState<Step>('idle');

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

  // user
  const [userName, setUserName] = useState<string>('Người dùng');
  const [userId, setUserId] = useState<number>(0);

  // personalization state
  const [hasPersonalization, setHasPersonalization] = useState<boolean>(false);
  const [isCheckingPersonalization, setIsCheckingPersonalization] = useState<boolean>(false);

  // progress
  const [genProgress, setGenProgress] = useState<number>(0);
  const progressTimerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    setUserName(getNameFromTokenOrStorage());
    const uid = getUserIdFromTokenOrStorage();
    setUserId(uid);
    if (uid) localStorage.setItem('userId', String(uid));
    
    // Check personalization when component mounts
    checkPersonalization(uid);
  }, []);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Quá trình tạo terrarium đang diễn ra. Bạn có chắc muốn rời khỏi trang?';
    };
    if (step === 'generate' && loading) window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [step, loading]);

  const handleAuthOrThrow = (e: unknown) => {
    if (isAuthError(e)) {
      setErr('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      navigate('/login');
      return true;
    }
    return false;
  };

  // ====== NEW: Check personalization ======
  const checkPersonalization = async (uid?: number) => {
    if (!uid) uid = getUserIdFromTokenOrStorage();
    if (!uid) return;

    setIsCheckingPersonalization(true);
    try {
      const token = localStorage.getItem('authToken') || '';
      const res = await fetch(`https://terarium.shop/api/Personalize/get-by-userId/${uid}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        setHasPersonalization(false);
        return;
      }

      const json = await res.json();
      const list = json?.data?.data as Array<{
        environmentId: number; 
        shapeId: number; 
        tankMethodId: number;
      }> | undefined;

      // Check if isPersonalize is true and has valid preference data
      const isPersonalized = json?.data?.isPersonalize === true;
      const hasValidPreferences = list?.some(pref => 
        pref.environmentId > 0 && 
        pref.shapeId > 0 && 
        pref.tankMethodId > 0
      ) || false;

      setHasPersonalization(isPersonalized && hasValidPreferences);
    } catch (error) {
      console.warn('Could not check personalization:', error);
      setHasPersonalization(false);
    } finally {
      setIsCheckingPersonalization(false);
    }
  };

  // ====== Generate by preference ======
  const generateByMyPreference = async () => {
    setErr(null);
    try {
      const uid = getUserIdFromTokenOrStorage();
      if (!uid) {
        setErr('Không xác định được người dùng. Vui lòng đăng nhập lại.');
        return;
      }
      setLoading(true);
      
      const token = localStorage.getItem('authToken') || '';
      const res = await fetch(`https://terarium.shop/api/Personalize/get-by-userId/${uid}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Không lấy được thông tin cá nhân hoá');
      }
      const json = await res.json();
      const list = json?.data?.data as Array<{
        environmentId: number; shapeId: number; tankMethodId: number;
      }> | undefined;

      if (!json?.data?.isPersonalize || !list?.length) {
        setErr('Bạn chưa thiết lập sở thích cá nhân. Hãy chọn thủ công nhé!');
        await fetchEnvironments();
        return;
      }

      // Find the first valid preference
      const validPref = list.find(pref => 
        pref.environmentId > 0 && 
        pref.shapeId > 0 && 
        pref.tankMethodId > 0
      );

      if (!validPref) {
        setErr('Thông tin sở thích chưa đầy đủ. Hãy chọn thủ công nhé!');
        await fetchEnvironments();
        return;
      }

      setEnvironmentId(validPref.environmentId);
      setShapeId(validPref.shapeId);
      setTankMethodId(validPref.tankMethodId);

      // Jump straight to generate
      await autoGenerateWith(validPref.environmentId, validPref.shapeId, validPref.tankMethodId);
    } catch (e) {
      if (handleAuthOrThrow(e)) return;
      setErr('Không thể tạo theo sở thích. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Fetchers
  const fetchEnvironments = async () => {
    setErr(null);
    try {
      setLoading(true);
      const data = await getAllEnvironments();
      setEnvironments(data || []);
      setStep('env');
    } catch (e) {
      if (handleAuthOrThrow(e)) return;
      setErr('Không tải được danh sách môi trường.');
    } finally {
      setLoading(false);
    }
  };

  const fetchShapes = async () => {
    setErr(null);
    try {
      setLoading(true);
      const data = await getAllShapes();
      setShapes(data || []);
      setStep('shape');
    } catch (e) {
      if (handleAuthOrThrow(e)) return;
      setErr('Không tải được danh sách hình dạng bể.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTankMethods = async () => {
    setErr(null);
    try {
      setLoading(true);
      const data = await getAllTankMethods();
      setTankMethods(data || []);
      setStep('tank');
    } catch (e) {
      if (handleAuthOrThrow(e)) return;
      setErr('Không tải được danh sách loại bể.');
    } finally {
      setLoading(false);
    }
  };

  // Progress animation
  const startProgressAnimation = () => {
    setGenProgress(0);
    startTimeRef.current = Date.now();
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    progressTimerRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const target = Math.min(88, Math.floor(88 * (1 - Math.exp(-elapsed / 4))));
      setGenProgress((prev) => (prev >= target ? prev : target));
    }, 150) as unknown as number;
  };

  const finishProgress = () => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    setGenProgress(100);
  };

  // có 2 biến thể: (1) dùng selections hiện có, (2) dùng params (phục vụ "sở thích của tôi")
  const autoGenerate = async () => {
    if (!environmentId || !shapeId || !tankMethodId) return;
    return autoGenerateWith(environmentId, shapeId, tankMethodId);
  };

  const autoGenerateWith = async (envId: number, shpId: number, tankId: number) => {
    setErr(null);
    try {
      setLoading(true);
      setStep('generate');
      startProgressAnimation();

      const data = await apiAutoGenerate({
        environmentId: envId,
        shapeId: shpId,
        tankMethodId: tankId,
        accessoryId: 0,
      });

      finishProgress();
      setTimeout(() => {
        setGen(data);
        setStep('pickImage');
      }, 450);
    } catch (e) {
      finishProgress();
      if (handleAuthOrThrow(e)) return;
      setErr('Tạo mẫu thất bại, vui lòng thử lại.');
      setStep('tank');
    } finally {
      setTimeout(() => setLoading(false), 400);
    }
  };

  const regenerateSimilar = async () => {
    if (!environmentId || !shapeId || !tankMethodId) return;
    await autoGenerate();
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
        terrariumName: `${gen.terrariumName} của ${userName}`,
        terrariumImages: [imageUrl],
        stock: 0,
        minPrice: 0,
        maxPrice: 0,
        description: gen.description,
        status: 'Active',
        bodyHTML: gen.bodyHTML,
      };
      const created = await addTerrariumByAI(payload);
      setCreatedTerrariumId(created.terrariumId);
      setStep('created');
    } catch (e) {
      if (handleAuthOrThrow(e)) return;
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
      const data = await createTerrariumLayout({
        userId: Number(localStorage.getItem('userId') || userId || 0),
        layoutName: `${gen.terrariumName} của ${userName}`,
        terrariumId: createdTerrariumId,
      });
      if (data?.layoutId) setStep('saved');
      else setErr('Lưu layout thất bại.');
    } catch (e) {
      if (handleAuthOrThrow(e)) return;
      setErr('Lưu layout thất bại.');
    } finally {
      setLoading(false);
    }
  };

  // Flow
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
    setGenProgress(0);
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  };

  useEffect(
    () => () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    },
    []
  );

  // UI helpers
  const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200 ${className}`}>
      {children}
    </div>
  );

  const Stepper = () => {
    const steps: Step[] = ['env', 'shape', 'tank', 'generate', 'pickImage', 'created'];
    const currentIndex = steps.indexOf(step);
    const statusOf = (i: number) => (i < currentIndex ? 'completed' : i === currentIndex ? 'active' : 'pending');
    const labels = ['Môi trường', 'Hình dạng', 'Loại bể', 'Tạo mẫu', 'Chọn ảnh', 'Hoàn thành'];

    return (
      <div className="flex items-start justify-center overflow-x-auto pb-4">
        <div className="flex items-start min-w-max">
          {labels.map((label, i) => {
            const status = statusOf(i);
            const isLast = i === steps.length - 1;
            return (
              <div key={label} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                      status === 'completed'
                        ? 'bg-green-500 text-white shadow-lg'
                        : status === 'active'
                        ? 'bg-blue-500 text-white shadow-lg ring-4 ring-blue-100'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {status === 'completed' ? <Check className="w-5 h-5" /> : label[0]}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium text-center max-w-[80px] ${
                      status === 'active' ? 'text-blue-600' : status === 'completed' ? 'text-green-600' : 'text-gray-500'
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {!isLast && (
                  <div
                    className={`w-16 h-0.5 ml-4 mr-4 mt-[-20px] transition-colors duration-300 ${
                      status === 'completed' ? 'bg-green-300' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <MembershipGate message="Bạn cần là thành viên để sử dụng trình tạo Layout bằng AI.">
      <div className="h-16" />
      <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {err && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{err}</span>
            </div>
          )}

          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
              Tạo Layout Terrarium với AI
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Chọn các thành phần yêu thích, hoặc để chúng tôi tạo theo sở thích của bạn.
            </p>
          </div>

          {/* Idle */}
          {step === 'idle' && (
            <div className="max-w-2xl mx-auto">
              <Card className="text-center">
                <div className="py-12 space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center mx-auto">
                    <Leaf className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Bắt đầu hành trình sáng tạo</h2>
                  <p className="text-gray-600 leading-relaxed">
                    Tạo layout terrarium của riêng bạn chỉ trong vài bước{hasPersonalization ? ', hoặc dùng cấu hình theo sở thích đã lưu' : ''}.
                  </p>
                  <div className="flex flex-wrap justify-center gap-3 pt-2">
                    <button
                      onClick={startFlow}
                      disabled={loading || isCheckingPersonalization}
                      className="inline-flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                      Tự chọn từng bước
                    </button>
                    
                    {/* Show personalization button only when conditions are met */}
                    {hasPersonalization && (
                      <button
                        onClick={generateByMyPreference}
                        disabled={loading || isCheckingPersonalization}
                        className="inline-flex items-center gap-3 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all disabled:opacity-50"
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserIcon className="w-5 h-5" />}
                        Tạo theo sở thích của tôi
                      </button>
                    )}
                  </div>
                  
                  {/* Loading state for checking personalization */}
                  {isCheckingPersonalization && (
                    <div className="text-sm text-gray-500 mt-2">
                      <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                      Đang kiểm tra sở thích của bạn...
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* Stepper */}
          {step !== 'idle' && (
            <Card className="mb-8">
              <div className="flex flex-col gap-6">
                <Stepper />
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm">
                    <Heart className="w-4 h-4" />
                    <span>
                      Xin chào, <strong>{userName}</strong>!
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Environment */}
          {step === 'env' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {environments.map((e) => (
                <Card key={e.environmentId} className="hover:border-green-200 cursor-pointer group">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
                        <Leaf className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 group-hover:text-green-700 transition-colors">{e.environmentName}</h3>
                        <p className="text-sm text-gray-500">Môi trường</p>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">{e.environmentDescription}</p>
                    <button
                      onClick={() => onPickEnvironment(e.environmentId)}
                      className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      Chọn môi trường này
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Shape */}
          {step === 'shape' && (
            <div className="space-y-6">
              <div>
                <button
                  onClick={() => setStep('env')}
                  className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Quay lại chọn môi trường
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {shapes.map((s) => (
                  <Card key={s.shapeId} className="hover:border-blue-200 cursor-pointer group">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                          <div className="w-6 h-6 border-2 border-blue-600 rounded" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800 group-hover:text-blue-700 transition-colors">{s.shapeName}</h3>
                          <p className="text-sm text-gray-500">Hình dạng bể</p>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">{s.shapeDescription}</p>
                      {s.shapeMaterial && (
                        <div className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                          Chất liệu: {s.shapeMaterial}
                        </div>
                      )}
                      <button
                        onClick={() => onPickShape(s.shapeId)}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        Chọn hình dạng này
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Tank */}
          {step === 'tank' && (
            <div className="space-y-6">
              <div>
                <button
                  onClick={() => setStep('shape')}
                  className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Quay lại chọn hình dạng
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tankMethods.map((tank) => (
                  <Card key={tank.tankMethodId} className="hover:border-purple-200 cursor-pointer group">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                          <div className="w-6 h-4 border-2 border-purple-600 rounded-sm" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800 group-hover:text-purple-700 transition-colors">
                            {tank.tankMethodType || tank.tankMethodName}
                          </h3>
                          <p className="text-sm text-gray-500">Loại bể</p>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">{tank.tankMethodDescription}</p>
                      <button
                        onClick={() => onPickTank(tank.tankMethodId)}
                        className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        Chọn loại bể này
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Generate (không có cây) */}
          {step === 'generate' && (
            <div className="max-w-2xl mx-auto">
              <Card>
                <div className="relative h-60 flex flex-col justify-between">
                  <div className="flex items-start gap-3 p-4 mb-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800">
                      <p className="font-medium mb-1">Đang tạo terrarium cho bạn</p>
                      <p>Vui lòng <strong>không rời khỏi trang</strong> cho đến khi quá trình hoàn tất để tránh mất dữ liệu.</p>
                    </div>
                  </div>

                  <div className="text-center my-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">AI đang tạo terrarium độc đáo cho bạn</h3>
                    <p className="text-gray-600 text-sm">Quá trình này có thể mất vài phút...</p>
                  </div>

                  <div className="mt-4">
                    <ProgressBar value={genProgress} />
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Pick Image */}
          {step === 'pickImage' && gen && (
            <div className="space-y-8">
              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
                    <Check className="w-4 h-4" />
                    Tạo thành công!
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">{gen.terrariumName}</h3>
                  <p className="text-gray-600 leading-relaxed max-w-2xl mx-auto">{gen.description}</p>
                </div>
              </Card>

              <Card>
                <div className="text-center mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">Chọn mẫu terrarium yêu thích</h4>
                  <p className="text-gray-600">AI đã tạo ra {gen.terrariumImages.length} mẫu khác nhau cho bạn</p>
                </div>

                <Image.PreviewGroup>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {gen.terrariumImages.map((url, idx) => (
                      <div key={idx} className="group cursor-pointer">
                        <div className="relative overflow-hidden rounded-xl border-2 border-gray-200 hover:border-emerald-300 transition-all duration-200 hover:shadow-lg">
                          <Image
                            src={url}
                            alt={`Terrarium mẫu ${idx + 1}`}
                            height={200}
                            preview={{ mask: 'Xem chi tiết' }}
                            className="w-full object-cover group-hover:scale-105 transition-transform duration-200"
                            style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                          />
                        </div>
                        <button
                          onClick={() => onPickImage(url)}
                          className="w-full mt-3 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-emerald-600 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                        >
                          <Heart className="w-4 h-4" />
                          Chọn mẫu này
                        </button>
                      </div>
                    ))}
                  </div>
                </Image.PreviewGroup>

                <div className="flex flex-wrap justify-center gap-4 mt-8 pt-6 border-t border-gray-100">
                  <button
                    onClick={regenerateSimilar}
                    disabled={loading}
                    className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Tạo mẫu khác tương tự
                  </button>
                  <button
                    onClick={restart}
                    className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Tạo lại từ đầu
                  </button>
                </div>
              </Card>
            </div>
          )}

          {/* Created */}
          {step === 'created' && (
            <div className="max-w-2xl mx-auto">
              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">Terrarium đã được tạo thành công!</h3>
                  <p className="text-gray-600 mb-6">Bạn có muốn lưu layout này vào bộ sưu tập cá nhân không?</p>

                  {selectedImage && (
                    <div className="mb-6">
                      <img
                        src={selectedImage}
                        alt="Selected terrarium"
                        className="w-full max-w-sm mx-auto h-48 object-cover rounded-xl shadow-md border-2 border-white"
                      />
                    </div>
                  )}

                  <div className="flex flex-wrap justify-center gap-4">
                    <button
                      onClick={saveLayout}
                      disabled={loading}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Heart className="w-5 h-5" />}
                      Lưu vào bộ sưu tập
                    </button>
                    <button
                      onClick={restart}
                      className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200"
                    >
                      <Sparkles className="w-5 h-5" />
                      Tạo layout mới
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Saved */}
          {step === 'saved' && (
            <div className="max-w-2xl mx-auto">
              <Card className="bg-gradient-to-r from-pink-50 to-rose-50 border-pink-200">
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Heart className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-800 mb-4">Hoàn thành xuất sắc!</h3>
                  <p className="text-gray-600 text-lg mb-8 leading-relaxed">Layout terrarium của bạn đã được lưu thành công.</p>

                  <div className="flex flex-wrap justify-center gap-4">
                    <button
                      onClick={() => navigate('/customer-dashboard/my-layouts')}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Heart className="w-5 h-5" />
                      Xem bộ sưu tập của tôi
                    </button>
                    <button
                      onClick={restart}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Sparkles className="w-5 h-5" />
                      Tạo layout mới
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Global Loading */}
          {loading && step !== 'generate' && (
            <div className="fixed bottom-6 right-6 bg-white shadow-2xl border border-gray-200 text-gray-800 px-6 py-4 rounded-xl flex items-center gap-3 z-50">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              <span className="font-medium">Đang xử lý...</span>
            </div>
          )}
        </div>
      </div>
    </MembershipGate>
  );
};

export default TerrariumChatbox;