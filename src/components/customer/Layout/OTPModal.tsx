import React, { useRef } from 'react';
import { Modal, Button, Input } from 'antd';
import { useAuth } from '../../../hook/useAuth';
import { useNavigate } from 'react-router-dom';
import { ArrowRightOutlined, SyncOutlined } from '@ant-design/icons';
import api from '../../../api/axios';
import type { InputRef } from 'antd';
import { toast } from 'react-toastify';

interface OTPModalProps {
  visible: boolean;
  onCancel: () => void;
  email: string;
}

const OTPModal: React.FC<OTPModalProps> = ({ visible, onCancel, email }) => {
  const { loading, error, otp, setOtp, verifyOTP, setError, setLoading } = useAuth();
  const navigate = useNavigate();
  const inputRefs = useRef<InputRef[]>([]);

  const handleOTPSubmit = async () => {
    if (!otp || otp.length !== 6) {
      setError('Vui lòng nhập mã OTP 6 chữ số.');
      return;
    }
    setLoading(true);
    try {
      const success = await verifyOTP(otp, email);
      if (success) {
        setOtp('');
        onCancel();
        navigate('/login');
        toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
        setError('');
      } else {
        setError('Xác thực OTP thất bại. Vui lòng kiểm tra lại mã OTP.');
      }
    } catch (err) {
      setError('Lỗi khi xác thực OTP. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    try {
      const response = await api.post('/api/Users/resend-otp', { email });
      setError(response.data.message || 'Mã OTP đã được gửi lại.');
      toast.info('Mã OTP đã được gửi lại thành công.');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Gửi lại OTP thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (index: number, value: string) => {
    const newOtp = otp.split('');
    newOtp[index] = value.replace(/[^0-9]/g, '');
    setOtp(newOtp.join(''));
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    } else if (!value && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    } else if (index === 5 && value && inputRefs.current[index]) {
      inputRefs.current[index].blur();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, index: number) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (pastedText.length > 0) {
      const newOtp = pastedText.padEnd(6, '').split('');
      setOtp(newOtp.join(''));
      const lastFilledIndex = Math.min(pastedText.length - 1, 5);
      if (inputRefs.current[lastFilledIndex]) {
        inputRefs.current[lastFilledIndex].focus();
      }
    }
  };

  return (
    <Modal
      title={
        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '24px' }}>
          Yêu Cầu Xác Minh Thêm
        </div>
      }
      visible={visible}
      onCancel={() => {
        setOtp('');
        setError('');
        onCancel();
      }}
      footer={null}
      centered
      closable={false}
      width={400}
    >
      <div className="text-center">
        <p>
          Vì lý do bảo mật, vui lòng nhập mã chúng tôi đã gửi đến {email}.
        </p>
        <div className="flex justify-center gap-2 my-4">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <Input
              key={index}
              ref={(el) => {
                if (el) inputRefs.current[index] = el;
              }}
              value={otp[index] || ''}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onPaste={(e) => handlePaste(e, index)}
              onKeyDown={(e) => {
                if (e.key === 'Backspace' && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
                  e.preventDefault();
                  inputRefs.current[index - 1].focus();
                }
              }}
              maxLength={1}
              style={{ width: '50px', height: '70px', textAlign: 'center', fontSize: '28px', fontWeight: 'bold' }}
            />
          ))}
        </div>
        {error && <p className="text-red-500 text-center mt-2">{error}</p>}
        {loading }
        <Button
          type="primary"
          icon={<ArrowRightOutlined />}
          onClick={handleOTPSubmit}
          disabled={otp.length !== 6 || loading}
          style={{ background: '#1890ff', borderColor: '#1890ff', fontSize: '20px', width: '60px', height: '60px', marginTop: '20px', borderRadius: '8px' }}
        />
        <div className="mt-4">
          <Button
            type="link"
            icon={<SyncOutlined />}
            onClick={handleResendOTP}
            disabled={loading}
            style={{ padding: '0', fontSize: '16px', color: loading ? '#ccc' : '#000' }}
          >
            GỬI LẠI MÃ
          </Button>
        </div>
        <div className="mt-2">
          <Button type="link" onClick={onCancel} style={{ padding: '0', fontSize: '16px', color: '#000' }}>
            KHÔNG THỂ ĐĂNG NHẬP?
          </Button>
        </div>
        {/* <div className="mt-4 text-sm text-gray-500">© mobmet.com</div>
        <div className="mt-2 text-sm text-gray-500">2003</div> */}
      </div>
    </Modal>
  );
};

export default OTPModal;