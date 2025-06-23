// src/pages/Customer/Login.tsx
import React from 'react';
import { Form, Input, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hook/useAuth';
import { LoginRequest } from '../../api/types/auth';
import { GoogleOutlined } from '@ant-design/icons';
import { useGoogleLogin } from '@react-oauth/google';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { handleLogin, handleGoogleLogin, loading, error } = useAuth();
  const [form] = Form.useForm();

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        console.log('Access Token từ Google:', tokenResponse.access_token);
        const success = await handleGoogleLogin(tokenResponse.access_token);
        if (success) {
          message.success('Đăng nhập Google thành công');
          navigate('/');
        }
      } catch (err) {
        console.error('Đăng nhập Google thất bại:', err);
        message.error('Đăng nhập Google thất bại. Vui lòng thử lại.');
      }
    },
    onError: (error) => {
      console.error('Lỗi đăng nhập Google:', error);
      message.error('Không thể kết nối với Google. Vui lòng thử lại.');
    },
    scope: 'email profile',
  });

  const onFinish = async (values: { username: string; password: string }) => {
    const credentials: LoginRequest = {
      username: values.username,
      password: values.password,
    };
    try {
      const success = await handleLogin(credentials);
      if (success) {
        navigate('/');
      }
    } catch (err) {
      // Lỗi được xử lý trong useAuth
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 container mx-auto py-12">
        <h1 className="text-3xl font-bold text-center mb-8">Đăng Nhập</h1>
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow">
          <Form
            name="login_form"
            onFinish={onFinish}
            layout="vertical"
            form={form}
          >
            <Form.Item
              label="Tên đăng nhập"
              name="username"
              rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
            >
              <Input placeholder="Nhập tên đăng nhập của bạn" />
            </Form.Item>

            <Form.Item
              label="Mật khẩu"
              name="password"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
            >
              <Input.Password placeholder="Nhập mật khẩu" />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="w-full bg-blue-500"
                disabled={loading}
              >
                {loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
              </Button>
              {error && <p className="text-red-500 text-center mt-2">{error}</p>}
            </Form.Item>
          </Form>

          <div className="text-center mt-4">
            <p className="text-gray-600">Hoặc đăng nhập với:</p>
            <Button
              icon={<GoogleOutlined />}
              onClick={() => login()}
              className="w-full mt-2"
              loading={loading}
              disabled={loading}
            >
              Đăng nhập bằng Google
            </Button>
          </div>

          <div className="text-center mt-4">
            <p className="text-gray-600">
              Bạn chưa có tài khoản?{' '}
              <span
                className="text-blue-500 cursor-pointer hover:underline"
                onClick={() => navigate('/register')}
              >
                Đăng ký ngay
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;