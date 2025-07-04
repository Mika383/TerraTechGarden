import React from 'react';
import { Form, Input, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../../api';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  const onFinish = async (values: { email: string }) => {
    setLoading(true);
    try {
      const response = await api.post('/api/Users/forgot-password', { email: values.email });
      if (response.data.message === 'Email gửi thành công') {
        toast.success('Email khôi phục đã được gửi! Vui lòng kiểm tra hộp thư của bạn.', {
          position: 'top-right',
          autoClose: 3000,
        });
        navigate('/login');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gửi email khôi phục thất bại. Vui lòng thử lại.', {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <ToastContainer />
      <div className="flex-1 container mx-auto py-12">
        <h1 className="text-3xl font-bold text-center mb-8">Quên Mật Khẩu</h1>
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow">
          <p className="text-center mb-4">Nhập email của bạn để nhận liên kết đặt lại mật khẩu.</p>
          <Form form={form} onFinish={onFinish} layout="vertical">
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: 'Vui lòng nhập email!' },
                { type: 'email', message: 'Email không hợp lệ!' },
              ]}
            >
              <Input placeholder="Nhập email của bạn" />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="w-full bg-blue-500"
                disabled={loading}
              >
                {loading ? 'Đang gửi...' : 'Gửi Liên Kết Khôi Phục'}
              </Button>
            </Form.Item>
          </Form>
          <div className="text-center mt-4">
            <p className="text-gray-600">
              Quay lại{' '}
              <span
                className="text-blue-500 cursor-pointer hover:underline"
                onClick={() => navigate('/login')}
              >
                Đăng nhập
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;