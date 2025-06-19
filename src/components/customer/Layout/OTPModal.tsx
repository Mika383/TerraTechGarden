import React from 'react';
import { Modal, Button, Input } from 'antd';
import { useAuth } from '../../../hook/useAuth';
import { useNavigate } from 'react-router-dom'; // Sử dụng useNavigate
import api from '../../../api/axios';

interface OTPModalProps {
  visible: boolean;
  onCancel: () => void;
  email: string;
}

const OTPModal: React.FC<OTPModalProps> = ({ visible, onCancel, email }) => {
  console.log('OTPModal rendering, visible:', visible, 'email:', email);
  const { loading, error, otp, setOtp, verifyOTP, setError, setLoading } = useAuth();
  const navigate = useNavigate(); // Sử dụng useNavigate trong OTPModal

  const handleOTPSubmit = async () => {
    if (!otp || otp.length !== 6) {
      setError('Vui lòng nhập mã OTP 6 chữ số.');
      return;
    }
    const payload = { email, otp };
    console.log('Data sent to verify OTP:', payload);
    setLoading(true); // Bắt đầu loading
    try {
      const success = await verifyOTP(otp, email);
      if (success) {
        setOtp('');
        onCancel(); // Đóng modal
        console.log('OTP verified successfully, navigating to /login...');
        navigate('/login'); // Chuyển trang chỉ khi thành công
        setError(''); // Xóa lỗi sau khi thành công
      } else {
        setError('Xác thực OTP thất bại. Vui lòng kiểm tra lại mã OTP.');
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      setError('Lỗi khi xác thực OTP. Vui lòng thử lại.');
    } finally {
      setLoading(false); // Kết thúc loading
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    try {
      const response = await api.post('/api/Users/resend-otp', { email });
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
        setError(''); // Xóa lỗi khi hủy
        onCancel();
      }}
      footer={[
        <Button key="resend" onClick={handleResendOTP} disabled={loading}>
          Gửi lại OTP
        </Button>,
        <Button
          key="back"
          onClick={() => {
            setOtp('');
            setError(''); // Xóa lỗi khi hủy
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