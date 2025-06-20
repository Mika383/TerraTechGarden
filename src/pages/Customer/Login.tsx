// src/pages/Customer/Login.tsx
import React, { useEffect, useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hook/useAuth';
import { LoginRequest } from '../../api/types/auth';
import { GoogleOutlined } from '@ant-design/icons';

// Khai báo tạm thời để sửa TS2339
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { handleLogin, handleGoogleLogin, loading, error } = useAuth();
  const [form] = Form.useForm();
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);

  useEffect(() => {
    console.log('Google Client ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID);
    const checkGoogleScript = () => {
      if (window.google?.accounts) {
        console.log('Google Sign-In script đã tải xong.');
        setGoogleScriptLoaded(true);
      } else {
        console.warn('Google Sign-In script chưa tải xong. Đang thử lại...');
        setTimeout(checkGoogleScript, 500);
      }
    };
    checkGoogleScript();
  }, []);

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

  const handleGoogleSignIn = async () => {
    if (!googleScriptLoaded || !window.google?.accounts) {
      message.error('Không thể kết nối với Google. Vui lòng thử lại sau.');
      console.error('Google Sign-In script chưa sẵn sàng.');
      return;
    }
    try {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: async (response: any) => {
          const accessToken = response.credential;
          console.log('Google ID Token:', accessToken);
          const success = await handleGoogleLogin(accessToken);
          if (success) {
            navigate('/');
          }
        },
      });
      window.google.accounts.id.prompt();
    } catch (err) {
      console.error('Đăng nhập Google thất bại:', err);
      message.error('Đăng nhập Google thất bại. Vui lòng thử lại.');
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
              onClick={handleGoogleSignIn}
              className="w-full mt-2"
              loading={loading}
              disabled={loading || !googleScriptLoaded}
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