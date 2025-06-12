import React from 'react';
import { Modal, Button, Input } from 'antd';
import { useAuth } from '../../../hook/useAuth';
import api from '../../../api/axios';

interface OTPModalProps {
  visible: boolean;
  onCancel: () => void;
}

const OTPModal: React.FC<OTPModalProps> = ({ visible, onCancel }) => {
  console.log('OTPModal rendering, visible:', visible);
  const { loading, error, otp, setOtp, verifyOTP, registeredEmail, setError, setLoading } = useAuth();

  const handleOTPSubmit = async () => {
    if (!otp || otp.length !== 6) {
      return;
    }
    const success = await verifyOTP(otp);
    if (success) {
      setOtp('');
      onCancel();
    }
  };

  const handleResendOTP = async () => {
    if (!registeredEmail) {
      setError('No registered email. Please try registering again.');
      return;
    }
    setLoading(true);
    try {
      // Gọi API để gửi lại OTP (cần xác nhận endpoint với backend)
      const response = await api.post('/api/Users/resend-otp', { email: registeredEmail });
      console.log('Resend OTP response:', response.data);
      setError(response.data.message || 'OTP has been resent.');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Xác nhận OTP"
      visible={visible}
      onOk={handleOTPSubmit}
      onCancel={() => {
        setOtp('');
        onCancel();
      }}
      footer={[
        <Button
          key="resend"
          onClick={handleResendOTP}
          disabled={loading}
        >
          Gửi lại OTP
        </Button>,
        <Button
          key="back"
          onClick={() => {
            setOtp('');
            onCancel();
          }}
        >
          Hủy
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleOTPSubmit} disabled={otp.length !== 6}>
          Xác nhận
        </Button>,
      ]}
    >
      <p>Vui lòng nhập mã OTP 6 chữ số được gửi đến email/số điện thoại của bạn:</p>
      <Input
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
        maxLength={6}
        style={{ width: '100%', marginTop: '10px' }}
        placeholder="Nhập OTP"
        type="text"
      />
      {error && <p className="text-red-500 text-center mt-2">{error}</p>}
    </Modal>
  );
};

export default OTPModal;