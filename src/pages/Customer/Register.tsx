import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, Select, DatePicker } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hook/useAuth';
import { RegisterRequest } from '../../api/types/auth';
import OTPModal from '../../components/customer/Layout/OTPModal';
import moment from 'moment';

const { Option } = Select;

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { handleRegister, loading, error } = useAuth();
  const [form] = Form.useForm();
  const [showOTP, setShowOTP] = useState(false); // Manage OTP modal state locally
  const [email, setEmail] = useState(''); // Store the email from the form

  const onFinish = async (values: any) => {
    const registerData: RegisterRequest = {
      username: values.username,
      passwordHash: values.password,
      email: values.email,
      phoneNumber: values.phone,
      dateOfBirth: moment(values.birthYear).toISOString(),
      gender: values.gender || 'other',
      fullName: values.name,
    };
    setEmail(values.email); // Save the email for OTP verification
    try {
      await handleRegister(registerData);
      setShowOTP(true); // Show OTP modal after successful registration
    } catch (err) {
      // Error is handled in useAuth
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 container mx-auto py-12">
        <h1 className="text-3xl font-bold text-center mb-8">Đăng Ký</h1>
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow">
          <Form
            name="register_form"
            onFinish={onFinish}
            layout="vertical"
            form={form}
          >
            <Form.Item
              label="Tên tài khoản"
              name="username"
              rules={[{ required: true, message: 'Vui lòng nhập tên tài khoản!' }]}
            >
              <Input placeholder="Nhập tên tài khoản" />
            </Form.Item>

            <Form.Item
              label="Họ và Tên"
              name="name"
              rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
            >
              <Input placeholder="Nhập họ và tên" />
            </Form.Item>

            <Form.Item
              label="Số điện thoại"
              name="phone"
              rules={[
                { required: true, message: 'Vui lòng nhập số điện thoại!' },
                { pattern: /^[0-9]{10}$/, message: 'Số điện thoại không hợp lệ!' },
              ]}
            >
              <Input placeholder="Nhập số điện thoại" />
            </Form.Item>

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

            <Form.Item
              label="Mật khẩu"
              name="password"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu!' },
                { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
              ]}
            >
              <Input.Password placeholder="Nhập mật khẩu" />
            </Form.Item>

            <Form.Item
              label="Xác nhận mật khẩu"
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                  },
                }),
              ]}
            >
              <Input.Password placeholder="Xác nhận mật khẩu" />
            </Form.Item>

            <Form.Item
              label="Giới tính"
              name="gender"
              initialValue="other"
            >
              <Select placeholder="Chọn giới tính">
                <Option value="male">Nam</Option>
                <Option value="female">Nữ</Option>
                <Option value="other">Khác</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Năm sinh"
              name="birthYear"
              rules={[{ required: true, message: 'Vui lòng chọn năm sinh!' }]}
            >
              <DatePicker
                picker="year"
                placeholder="Chọn năm sinh"
                disabledDate={(current) => current && current > moment().endOf('year')}
              />
            </Form.Item>

            <Form.Item
              name="acceptTerms"
              valuePropName="checked"
              rules={[
                {
                  validator: (_, value) =>
                    value ? Promise.resolve() : Promise.reject(new Error('Bạn phải đồng ý với các chính sách!')),
                },
              ]}
            >
              <Checkbox>
                Tôi đồng ý với các <a href="/terms">chính sách</a> của website
              </Checkbox>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" className="w-full bg-blue-500" disabled={loading}>
                {loading ? 'Đang đăng ký...' : 'Đăng Ký'}
              </Button>
              {error && <p className="text-red-500 text-center mt-2">{error}</p>}
            </Form.Item>
          </Form>

          <div className="text-center mt-4">
            <p className="text-gray-600">
              Bạn đã có tài khoản?{' '}
              <span
                className="text-blue-500 cursor-pointer hover:underline"
                onClick={() => navigate('/login')}
              >
                Đăng nhập ngay
              </span>
            </p>
          </div>
        </div>

        <OTPModal visible={showOTP} onCancel={() => setShowOTP(false)} email={email} />
      </div>
    </div>
  );
};

export default Register;