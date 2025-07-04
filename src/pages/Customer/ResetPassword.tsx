import React from 'react';
import { Form, Input, Button } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../../api';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const token = searchParams.get('token');

  const onFinish = async (values: { password: string; confirmPassword: string }) => {
    if (!token) {
      toast.error('Token không hợp lệ. Vui lòng yêu cầu liên kết khôi phục mới.', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }

    if (values.password !== values.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp!', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/Users/reset-password', {
        token,
        newPassword: values.password,
      });
      if (response.data.message === 'Đặt lại mật khẩu thành công') {
        toast.success('Mật khẩu đã được đặt lại thành công! Vui lòng đăng nhập.', {
          position: 'top-right',
          autoClose: 3000,
        });
        navigate('/login');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.', {
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
        <h1 className="text-3xl font-bold text-center mb-8">Đặt Lại Mật Khẩu</h1>
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow">
          <Form form={form} onFinish={onFinish} layout="vertical">
            <Form.Item
              label="Mật khẩu mới"
              name="password"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
              ]}
            >
              <Input.Password placeholder="Nhập mật khẩu mới" />
            </Form.Item>
            <Form.Item
              label="Xác nhận mật khẩu"
              name="confirmPassword"
              rules={[
                { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
              ]}
            >
              <Input.Password placeholder="Xác nhận mật khẩu" />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="w-full bg-blue-500"
                disabled={loading || !token}
              >
                {loading ? 'Đang xử lý...' : 'Đặt Lại Mật Khẩu'}
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

export default ResetPassword;