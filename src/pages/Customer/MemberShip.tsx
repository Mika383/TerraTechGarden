import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Empty, Badge, Row, Col, Typography, Divider, message, Modal, Space, Radio } from 'antd';
import {
  CheckCircleOutlined,
  StarOutlined,
  GiftOutlined,
  CalendarOutlined,
  CrownOutlined,
  RocketOutlined,
  WalletOutlined,
  HeartOutlined,
  SmileOutlined
} from '@ant-design/icons';
import type { MembershipPackage } from '@/types/membership';
import {
  getMembershipPackages,
  getUserMembership,
  createMembershipMomoDirect,
  type CreateMomoDirectResponse
} from '@/api/membership';
import { getWalletBalance } from '@/api/wallet'; // Import từ wallet API
import axios from 'axios';

const { Title, Paragraph, Text } = Typography;
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

/* Lấy userId từ JWT trong localStorage */
const getUserIdFromToken = (): number | null => {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) return null;
    const payload = JSON.parse(atob((token.split('.')[1] || '').replace(/-/g, '+').replace(/_/g, '/')));
    const raw = payload?.nameid ?? payload?.userId ?? payload?.UserId ?? payload?.id ?? payload?.sub;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
};

/* API call for wallet membership purchase */
const purchaseMembershipWithWallet = async (userId: number, packageId: number): Promise<any> => {
  const response = await axios.post(`${BASE_URL}/Membership/purchase`, {
    userId,
    packageId,
    startDate: new Date().toISOString(),
    paymentMethod: "Wallet"
  }, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      'Content-Type': 'application/json'
    }
  });
  return response.data;
};

/* Format currency */
const currency = (v: number) => (v || 0).toLocaleString('vi-VN') + ' VND';

/* Scroll animation hook */
const useScrollAnimation = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const ob = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    }, { threshold: 0.1 });
    if (ref.current) ob.observe(ref.current);
    return () => ob.disconnect();
  }, []);
  return [ref, isVisible] as const;
};

const FloatingElement: React.FC<{ children: React.ReactNode; delay?: number; className?: string; }> = ({ children, delay = 0, className = "" }) => (
  <div
    className={`animate-float ${className}`}
    style={{ animationDelay: `${delay}s`, animationDuration: '6s', animationIterationCount: 'infinite', animationTimingFunction: 'ease-in-out' }}
  >
    {children}
  </div>
);

/* Thank You Modal Component */
const ThankYouModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  membershipType: string;
  amount: number;
}> = ({ visible, onClose, membershipType, amount }) => {
  const [confettiAnimation, setConfettiAnimation] = useState(false);

  useEffect(() => {
    if (visible) {
      setConfettiAnimation(true);
      const timer = setTimeout(() => setConfettiAnimation(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      centered
      width={500}
      closable={false}
      className="thank-you-modal"
    >
      <div className="text-center py-8">
        {/* Confetti Animation */}
        {confettiAnimation && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="absolute animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: ['#10b981', '#059669', '#34d399', '#6ee7b7', '#a7f3d0'][Math.floor(Math.random() * 5)]
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Success Icon */}
        <div className="mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <CheckCircleOutlined className="text-4xl text-green-600 animate-bounce" />
          </div>
          <div className="flex justify-center space-x-2 mb-4">
            <HeartOutlined className="text-2xl text-red-500 animate-pulse" />
            <SmileOutlined className="text-2xl text-yellow-500 animate-bounce" />
            <HeartOutlined className="text-2xl text-red-500 animate-pulse" style={{ animationDelay: '0.5s' }} />
          </div>
        </div>

        {/* Thank You Message */}
        <Title level={2} className="mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
          🎉 Cảm Ơn Bạn Đã Ủng Hộ! 🎉
        </Title>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 mb-6">
          <Title level={4} className="text-green-700 mb-2">
            Thanh toán thành công!
          </Title>
          <div className="space-y-2 text-left">
            <div className="flex justify-between items-center">
              <Text className="text-gray-600">Gói membership:</Text>
              <Text strong className="text-green-700">{membershipType}</Text>
            </div>
            <div className="flex justify-between items-center">
              <Text className="text-gray-600">Số tiền:</Text>
              <Text strong className="text-green-700">{currency(amount)}</Text>
            </div>
            <Divider className="my-3" />
            <div className="text-center">
              <Text className="text-green-600">
                <WalletOutlined className="mr-2" />
                Đã thanh toán bằng ví điện tử
              </Text>
            </div>
          </div>
        </div>

        {/* Benefits Reminder */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 mb-6">
          <Title level={5} className="text-blue-700 mb-2">
            <GiftOutlined className="mr-2" />
            Bạn đã mở khóa:
          </Title>
          <div className="space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <CheckCircleOutlined className="text-green-500" />
              <Text className="text-sm text-gray-600">Trải nghiệm Premium</Text>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <CheckCircleOutlined className="text-green-500" />
              <Text className="text-sm text-gray-600">Hỗ trợ ưu tiên 24/7</Text>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <CheckCircleOutlined className="text-green-500" />
              <Text className="text-sm text-gray-600">Quyền lợi độc quyền</Text>
            </div>
          </div>
        </div>

        {/* Thank You Note */}
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 mb-6">
          <Text className="text-gray-700 text-base leading-relaxed">
            💚 Sự ủng hộ của bạn giúp chúng tôi tiếp tục phát triển và mang đến những trải nghiệm terrarium tuyệt vời hơn!
          </Text>
        </div>

        {/* Action Buttons */}
        <Space direction="vertical" className="w-full" size="middle">
          <Button
            type="primary"
            size="large"
            className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 border-0 font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300"
            onClick={onClose}
          >
            <RocketOutlined className="mr-2" />
            Bắt Đầu Trải Nghiệm Premium
          </Button>
          
          <Button
            size="large"
            className="w-full h-10 border-green-300 text-green-600 hover:border-green-500 hover:text-green-700 rounded-lg transition-all duration-300"
            onClick={onClose}
          >
            Đóng
          </Button>
        </Space>
      </div>

      <style>{`
        .thank-you-modal .ant-modal-content {
          border-radius: 16px;
          overflow: hidden;
          background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
        }
        .thank-you-modal .ant-modal-body {
          padding: 0;
        }
      `}</style>
    </Modal>
  );
};

const getPlanStyling = (durationDays: number) => {
  if (durationDays >= 365) {
    return {
      gradient: 'from-emerald-700 to-teal-600',
      bgGradient: 'from-emerald-50 to-teal-50',
      borderColor: 'border-emerald-200',
      buttonColor: 'bg-gradient-to-r from-emerald-700 to-teal-600 hover:from-emerald-800 hover:to-teal-700',
      icon: <CrownOutlined className="text-2xl text-emerald-700" />,
      badge: 'Phổ biến nhất',
      glowColor: 'shadow-emerald-200'
    };
  } else if (durationDays >= 90) {
    return {
      gradient: 'from-green-600 to-lime-500',
      bgGradient: 'from-green-50 to-lime-50',
      borderColor: 'border-green-200',
      buttonColor: 'bg-gradient-to-r from-green-600 to-lime-500 hover:from-green-700 hover:to-lime-600',
      icon: <RocketOutlined className="text-2xl text-green-600" />,
      badge: 'Tốt nhất',
      glowColor: 'shadow-green-200'
    };
  } else {
    return {
      gradient: 'from-lime-500 to-yellow-400',
      bgGradient: 'from-lime-50 to-yellow-50',
      borderColor: 'border-lime-200',
      buttonColor: 'bg-gradient-to-r from-lime-500 to-yellow-400 hover:from-lime-600 hover:to-yellow-500',
      icon: <StarOutlined className="text-2xl text-lime-600" />,
      badge: 'Khởi đầu',
      glowColor: 'shadow-lime-200'
    };
  }
};

const formatPrice = (price: number): string => price.toLocaleString('vi-VN');

type PlanCardProps = {
  plan: MembershipPackage;
  canPurchase: boolean;
  onPurchase: (paymentMethod: 'wallet' | 'momo') => void;
  isPopular?: boolean;
  index: number;
  purchasing?: boolean;
  requireLogin?: boolean;
  onLogin?: () => void;
  walletBalance: number;
  walletLoading: boolean;
};

const PlanCard: React.FC<PlanCardProps> = ({
  plan, canPurchase, onPurchase, isPopular = false, index, purchasing, requireLogin, onLogin, walletBalance, walletLoading
}) => {
  const styling = getPlanStyling(plan.durationDays);
  const [cardRef, isVisible] = useScrollAnimation();
  const [isHovered, setIsHovered] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'wallet' | 'momo'>('momo');

  const canAffordWithWallet = walletBalance >= plan.price;

  const btnText = requireLogin
    ? 'Đăng nhập để đăng ký'
    : purchasing
      ? 'Đang kiểm tra...'
      : canPurchase
        ? 'Đăng Ký Ngay'
        : 'Cảm ơn bạn đã ủng hộ';

  const handleCardPurchase = () => {
    if (requireLogin) {
      onLogin?.();
    } else if (canPurchase && !purchasing) {
      setPaymentModalOpen(true);
    }
  };

  const handleConfirmPayment = () => {
    onPurchase(selectedPaymentMethod);
    setPaymentModalOpen(false);
  };

  return (
    <>
      <div
        ref={cardRef}
        className={`relative transform transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
        style={{ transitionDelay: `${index * 200}ms` }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {isPopular && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10 animate-bounce">
            <Badge.Ribbon text={styling.badge} color="volcano">
              <div />
            </Badge.Ribbon>
          </div>
        )}

        {isPopular && (
          <>
            <div className="absolute -top-2 -left-2 w-4 h-4 bg-emerald-400 rounded-full animate-ping opacity-75"></div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-teal-400 rounded-full animate-pulse"></div>
            <div className="absolute -bottom-2 left-4 w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
          </>
        )}

        <Card
          className={`h-full transition-all duration-500 ease-out border-2 ${styling.borderColor} rounded-2xl overflow-hidden ${isPopular ? `shadow-2xl scale-105 ${styling.glowColor}` : 'shadow-md hover:shadow-xl'} ${isHovered ? 'transform hover:-translate-y-3 hover:rotate-1' : ''} backdrop-blur-sm bg-white/90`}
          bodyStyle={{ padding: 0 }}
        >
          <div className={`bg-gradient-to-br ${styling.bgGradient} p-6 text-center relative overflow-hidden`}>
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16 animate-pulse"></div>
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 translate-y-12 animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>
            <FloatingElement delay={index * 0.5}>
              <div className={`mb-4 transform transition-transform duration-300 ${isHovered ? 'scale-125 rotate-12' : ''}`}>
                {styling.icon}
              </div>
            </FloatingElement>
            <Title level={3} className="mb-2 text-gray-800 relative z-10">
              <span className={`transition-all duration-300 ${isHovered ? 'text-transparent bg-clip-text bg-gradient-to-r ' + styling.gradient : ''}`}>
                {plan.type}
              </span>
            </Title>
            <div className="flex items-center justify-center space-x-2 text-gray-600 mb-4 relative z-10">
              <CalendarOutlined className={`transition-all duration-300 ${isHovered ? 'animate-spin' : ''}`} />
              <Text className="text-sm font-medium">{plan.durationDays} ngày</Text>
            </div>
            <div className="mb-4 relative z-10">
              <div className={`transition-all duration-500 ${isHovered ? 'animate-pulse' : ''}`}>
                <Text className="text-4xl font-bold text-gray-800">{formatPrice(plan.price)}</Text>
                <Text className="text-lg text-gray-600 ml-2">₫</Text>
              </div>
            </div>
            <Text className="text-sm text-gray-500 relative z-10">
              {Math.round(plan.price / Math.max(1, plan.durationDays)).toLocaleString('vi-VN')} ₫/ngày
            </Text>
          </div>

          <div className="p-6">
            {plan.description && (
              <>
                <div className="mb-6">
                  <Title level={5} className="mb-3 text-gray-700">
                    <GiftOutlined className={`mr-2 transition-all duration-300 ${isHovered ? 'animate-bounce' : ''}`} />
                    Quyền lợi bao gồm:
                  </Title>
                  <div className="space-y-2">
                    {plan.description.split(',').map((benefit, i) => (
                      <div key={i} className="flex items-start space-x-2">
                        <CheckCircleOutlined className={`text-green-500 mt-1 flex-shrink-0 transition-all duration-300 ${isHovered ? 'animate-pulse' : ''}`} />
                        <Text className="text-gray-600 text-sm leading-relaxed">{benefit.trim()}</Text>
                      </div>
                    ))}
                  </div>
                </div>
                <Divider className="my-4" />
              </>
            )}

            <Button
              type="primary"
              size="large"
              block
              className={`${styling.buttonColor} border-0 font-semibold text-white h-12 text-base rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-xl relative overflow-hidden
                ${!requireLogin && !canPurchase ? 'opacity-70 !cursor-not-allowed' : ''}`}
              disabled={purchasing || (!requireLogin && !canPurchase)}
              loading={purchasing && !requireLogin}
              onClick={handleCardPurchase}
            >
              <span className="relative z-10">{btnText}</span>
              <div className={`absolute inset-0 bg-white opacity-20 transform scale-0 rounded-full transition-transform duration-500 ${isHovered ? 'scale-100' : ''}`}></div>
            </Button>
          </div>
        </Card>
      </div>

      {/* Payment Method Selection Modal */}
      <Modal
        title="Chọn phương thức thanh toán"
        open={paymentModalOpen}
        onCancel={() => setPaymentModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setPaymentModalOpen(false)}>
            Hủy
          </Button>,
          <Button
            key="confirm"
            type="primary"
            onClick={handleConfirmPayment}
            disabled={selectedPaymentMethod === 'wallet' && !canAffordWithWallet}
          >
            {selectedPaymentMethod === 'wallet' ? 'Thanh toán bằng ví' : 'Thanh toán với MoMo'}
          </Button>
        ]}
        centered
      >
        <div className="space-y-4">
          <div className="mb-4">
            <Text strong>Gói: {plan.type}</Text>
            <br />
            <Text>Giá: {currency(plan.price)}</Text>
          </div>

          <Radio.Group
            value={selectedPaymentMethod}
            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
            className="w-full"
          >
            <div className="space-y-3">
              <div
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedPaymentMethod === 'momo' ? 'border-pink-500 bg-pink-50' : 'border-gray-300 bg-white'
                } hover:border-pink-500`}
              >
                <Radio value="momo" className="mb-2">
                  <span className="font-semibold text-pink-700">MoMo</span>
                </Radio>
                <div className="text-sm text-gray-600 ml-6">
                  Thanh toán qua ví điện tử MoMo
                </div>
              </div>

              <div
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedPaymentMethod === 'wallet' 
                    ? canAffordWithWallet 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-red-500 bg-red-50'
                    : 'border-gray-300 bg-white'
                } hover:border-purple-500 ${!canAffordWithWallet ? 'opacity-60' : ''}`}
                onClick={() => canAffordWithWallet && setSelectedPaymentMethod('wallet')}
              >
                <Radio 
                  value="wallet" 
                  disabled={!canAffordWithWallet}
                  className="mb-2"
                >
                  <span className="font-semibold text-purple-700">
                    <WalletOutlined className="mr-2" />
                    Ví điện tử
                  </span>
                </Radio>
                <div className="text-sm ml-6">
                  <div className={canAffordWithWallet ? 'text-gray-700' : 'text-red-600'}>
                    Số dư: {walletLoading ? 'Đang tải...' : currency(walletBalance)}
                  </div>
                  {!canAffordWithWallet && (
                    <div className="text-red-600">
                      Không đủ số dư (cần {currency(plan.price)})
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Radio.Group>
        </div>
      </Modal>
    </>
  );
};

const LoadingSkeleton: React.FC = () => (
  <Row gutter={[24, 24]}>
    {Array.from({ length: 3 }).map((_, index) => (
      <Col xs={24} md={8} key={index}>
        <Card className="h-full animate-pulse">
          <div className="space-y-4 p-4">
            <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-shimmer"></div>
            <div className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-shimmer"></div>
            <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-shimmer"></div>
            <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-shimmer"></div>
          </div>
        </Card>
      </Col>
    ))}
  </Row>
);

const Membership: React.FC = () => {
  const [plans, setPlans] = useState<MembershipPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletLoading, setWalletLoading] = useState(false);

  // hasMembership:
  // undefined = chưa biết (đang kiểm tra)
  // false = CHƯA có membership
  // true  = ĐÃ có membership
  const [hasMembership, setHasMembership] = useState<boolean | undefined>(undefined);
  const [checkingMembership, setCheckingMembership] = useState(false);
  const [purchasingId, setPurchasingId] = useState<number | null>(null);

  // Modal thanh toán MoMo
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<CreateMomoDirectResponse | null>(null);

  // Thank You Modal state
  const [thankYouModalVisible, setThankYouModalVisible] = useState(false);
  const [purchasedPlan, setPurchasedPlan] = useState<{ type: string; price: number } | null>(null);

  const navigate = useNavigate();
  const [heroRef, isHeroVisible] = useScrollAnimation();

  const userId = getUserIdFromToken();
  const isLoggedIn = !!userId;

  // Function to refresh auth token
  const refreshAuthToken = async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        console.warn('No refresh token found');
        return false;
      }

      const response = await axios.post(`${BASE_URL}/Users/refresh-token`, {
        refreshToken: refreshToken
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.token) {
        // Lưu token mới
        localStorage.setItem('authToken', response.data.token);
        
        // Nếu có refresh token mới thì cũng lưu
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        
        console.log('Token refreshed successfully');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return false;
    }
  };

  // Load wallet balance
  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        setWalletLoading(true);
        const balance = await getWalletBalance(userId);
        setWalletBalance(balance);
      } catch {
        setWalletBalance(0);
      } finally {
        setWalletLoading(false);
      }
    })();
  }, [userId]);

  // Load danh sách gói
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        let response: any = await getMembershipPackages().catch(async (error: any) => {
          if (error?.response?.status === 401) {
            const fallback = await axios.get(`${BASE_URL}/MembershipPackage`);
            return fallback?.data?.data ?? fallback?.data ?? [];
          }
          throw error;
        });
        if (!Array.isArray(response)) response = response?.data ?? [];
        const activePackages = (response || [])
          .filter((pkg: any) => pkg?.isActive)
          .sort((a: any, b: any) => a.durationDays - b.durationDays);
        setPlans(activePackages);
      } catch (err) {
        console.error('Failed to load membership packages:', err);
        setPlans([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Kiểm tra membership của user
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!userId) {
        setHasMembership(false);
        return;
      }

      try {
        setCheckingMembership(true);
        const memberships = await getUserMembership(userId);
        if (!alive) return;

        setHasMembership(memberships.length > 0);
      } catch (e: any) {
        console.error('Error checking membership:', e);
        if (alive) setHasMembership(false);
      } finally {
        if (alive) setCheckingMembership(false);
      }
    })();
    return () => { alive = false; };
  }, [userId]);

  // Re-check membership sau khi thanh toán
  const recheckMembership = async () => {
    if (!userId) return;
    try {
      const memberships = await getUserMembership(userId);
      if (memberships.length > 0) {
        setHasMembership(true);
        setPayModalOpen(false);
        setPaymentInfo(null);
        
        // Refresh token after successful MoMo payment
        await refreshAuthToken();
        
        message.success('Xác nhận thanh toán thành công!');
        // Refresh wallet balance
        try {
          const balance = await getWalletBalance(userId);
          setWalletBalance(balance);
        } catch {}
      } else {
        message.info('Chưa ghi nhận thanh toán. Vui lòng thử lại sau ít phút.');
      }
    } catch (e) {
      message.error('Không kiểm tra được trạng thái membership.');
    }
  };

  // Mua gói với phương thức được chọn
  const handlePurchase = async (planId: number, paymentMethod: 'wallet' | 'momo') => {
    if (!isLoggedIn) return navigate('/login');
    if (hasMembership !== false) return; // chỉ cho mua khi CHẮC CHẮN chưa có

    // Find the plan to get its details for thank you modal
    const selectedPlan = plans.find(p => p.id === planId);

    try {
      setPurchasingId(planId);

      if (paymentMethod === 'wallet') {
        // Thanh toán bằng ví
        const response = await purchaseMembershipWithWallet(userId as number, planId);
        
        if (response.status === 201) {
          // Update wallet balance first
          if (response.data?.walletPaymentInfo?.newBalance !== undefined) {
            setWalletBalance(response.data.walletPaymentInfo.newBalance);
          } else {
            // Fetch updated balance
            try {
              const newBalance = await getWalletBalance(userId as number);
              setWalletBalance(newBalance);
            } catch {}
          }
          
          // Update membership status
          setHasMembership(true);

          // Set plan details for thank you modal
          if (selectedPlan) {
            setPurchasedPlan({
              type: selectedPlan.type,
              price: selectedPlan.price
            });
          }
            await refreshAuthToken();
          // Show thank you modal
          setThankYouModalVisible(true);
        } else {
          message.error('Thanh toán thất bại, vui lòng thử lại.');
        }
      } else {
        // Thanh toán MoMo (logic cũ)
        const nowIso = new Date().toISOString();
        const resp = await createMembershipMomoDirect({
          userId: userId as number,
          packageId: planId,
          startDate: nowIso,
        });

        if (!resp?.payUrl) {
          message.error('Không nhận được đường dẫn thanh toán.');
          return;
        }

        setPaymentInfo(resp);
        setPayModalOpen(true);

        // Mở tab/thẻ mới đến MoMo
        window.open(resp.payUrl, '_blank', 'noopener,noreferrer');

        message.success('Đã tạo phiên thanh toán. Vui lòng hoàn tất trong ứng dụng MoMo hoặc quét QR.');
      }
    } catch (e: any) {
      console.error('Purchase error:', e);
      if (e?.response?.status === 401) {
        message.error('Vui lòng đăng nhập lại.');
        navigate('/login');
      } else if (e?.response?.data?.message) {
        message.error(e.response.data.message);
      } else {
        message.error('Thanh toán thất bại, vui lòng thử lại.');
      }
    } finally {
      setPurchasingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        @keyframes shimmer { 0% { background-position: -200px 0; } 100% { background-position: calc(200px + 100%) 0; } }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-shimmer { background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200px 100%; animation: shimmer 2s infinite; }
      `}</style>

      {/* Hero */}
      <div ref={heroRef} className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <FloatingElement delay={0} className="absolute top-10 left-10 opacity-20"><div className="w-32 h-32 bg-white rounded-full"></div></FloatingElement>
          <FloatingElement delay={2} className="absolute top-20 right-20 opacity-15"><div className="w-24 h-24 bg-white rounded-full"></div></FloatingElement>
          <FloatingElement delay={4} className="absolute bottom-20 left-1/4 opacity-10"><div className="w-40 h-40 bg-white rounded-full"></div></FloatingElement>
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <Title level={1} className="!text-white mb-4 animate-pulse">🌿 Tham Gia Thành Viên Terrarium</Title>
          <Paragraph className="text-xl !text-emerald-100 mb-8 max-w-2xl mx-auto leading-relaxed">
            Mở khóa các quyền lợi độc quyền để chăm sóc và thiết kế Terrarium chuyên nghiệp hơn.
          </Paragraph>
        </div>
      </div>

      {/* Plans */}
      <div className="container mx-auto py-16 px-4">
        <div className="text-center mb-12">
          <Title level={2} className="mb-4 animate-pulse">Chọn Gói Thành Viên Phù Hợp</Title>
          <Paragraph className="text-lg text-gray-600 max-w-2xl mx-auto">Lựa chọn gói membership tốt nhất cho hành trình terrarium của bạn</Paragraph>
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : plans.length > 0 ? (
          <Row gutter={[24, 24]} justify="center">
            {plans.map((plan, index) => (
              <Col xs={24} md={8} lg={6} key={plan.id}>
                <PlanCard
                  plan={plan}
                  index={index}
                  isPopular={index === 1 && plans.length === 3}
                  canPurchase={hasMembership === false}
                  purchasing={checkingMembership || purchasingId === plan.id}
                  requireLogin={!isLoggedIn}
                  onLogin={() => navigate('/login')}
                  walletBalance={walletBalance}
                  walletLoading={walletLoading}
                  onPurchase={(paymentMethod) => {
                    if (!isLoggedIn) return navigate('/login');
                    if (hasMembership !== false) return;
                    handlePurchase(plan.id, paymentMethod);
                  }}
                />
              </Col>
            ))}
          </Row>
        ) : (
          <div className="text-center py-16">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <Title level={4} className="text-gray-500 mb-2">Hiện chưa có gói membership khả dụng</Title>
                  <Paragraph className="text-gray-400">Vui lòng quay lại sau hoặc liên hệ hỗ trợ.</Paragraph>
                </div>
              }
            />
          </div>
        )}
      </div>

      {/* Thank You Modal */}
      {purchasedPlan && (
        <ThankYouModal
          visible={thankYouModalVisible}
          onClose={() => {
            setThankYouModalVisible(false);
            setPurchasedPlan(null);
          }}
          membershipType={purchasedPlan.type}
          amount={purchasedPlan.price}
        />
      )}

      {/* Modal thanh toán MoMo */}
      <Modal
        title="Thanh toán MemberShip qua MoMo"
        open={payModalOpen}
        onCancel={() => setPayModalOpen(false)}
        footer={null}
        centered
      >
        {paymentInfo?.qrImageBase64 ? (
          <div className="text-center">
            <img
              src={`data:image/png;base64,${paymentInfo.qrImageBase64}`}
              alt="MoMo QR"
              style={{ maxWidth: '280px', width: '100%', margin: '0 auto', display: 'block' }}
            />
            <Paragraph className="mt-3 mb-1" style={{ textAlign: 'center' }}>
              Quét QR trên ứng dụng MoMo để thanh toán
            </Paragraph>
          </div>
        ) : (
          <Paragraph>Không có mã QR, vui lòng dùng nút "Mở MoMo" để thanh toán.</Paragraph>
        )}

        <Space style={{ marginTop: 16 }} wrap>
          <Button
            type="primary"
            onClick={() => {
              if (paymentInfo?.payUrl) {
                window.open(paymentInfo.payUrl, '_blank', 'noopener,noreferrer');
              }
            }}
          >
            Mở MoMo
          </Button>

          <Button onClick={recheckMembership}>
            Đã thanh toán — Kiểm tra trạng thái
          </Button>

          <Button onClick={() => setPayModalOpen(false)}>
            Để sau
          </Button>
        </Space>
      </Modal>

      {/* Features */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Title level={2} className="mb-4">Tại Sao Chọn Membership Premium?</Title>
          </div>
          <Row gutter={[32, 32]}>
            <Col xs={24} md={8}>
              <div className="text-center transform transition-all duration-700">
                <FloatingElement delay={0}><div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><RocketOutlined className="text-2xl text-green-600" /></div></FloatingElement>
                <Title level={4}>Trải Nghiệm Premium</Title>
                <Paragraph className="text-gray-600">Truy cập các tính năng nâng cao và công cụ chuyên nghiệp</Paragraph>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div className="text-center transform transition-all duration-700 delay-200">
                <FloatingElement delay={1}><div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircleOutlined className="text-2xl text-emerald-600" /></div></FloatingElement>
                <Title level={4}>Hỗ Trợ Ưu Tiên</Title>
                <Paragraph className="text-gray-600">Nhận hỗ trợ 24/7 từ đội ngũ chuyên gia terrarium</Paragraph>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div className="text-center transform transition-all duration-700 delay-400">
                <FloatingElement delay={2}><div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4"><GiftOutlined className="text-2xl text-teal-600" /></div></FloatingElement>
                <Title level={4}>Quyền Lợi Độc Quyền</Title>
                <Paragraph className="text-gray-600">Truy cập nội dung premium và cộng đồng thành viên VIP</Paragraph>
              </div>
            </Col>
          </Row>
        </div>
      </div>
    </div>
  );
};

export default Membership;