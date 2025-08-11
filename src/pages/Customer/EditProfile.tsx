// src/pages/Customer/EditProfile.tsx
import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Upload, message, DatePicker, Radio, Spin, Tooltip } from 'antd';
import { useNavigate } from 'react-router-dom';
import { UploadOutlined, InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getProfileMe, updateProfileMe, uploadAvatar, uploadBackground } from '@/api/profile';
import type { ProfileMe, UpdateProfileRequest } from '@/types/profile';

const EditProfile: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [fetching, setFetching] = useState(true);

  // Load profile
  useEffect(() => {
    (async () => {
      try {
        setFetching(true);
        const res = await getProfileMe();
        const me: ProfileMe = res.data;
        form.setFieldsValue({
          fullName: me.fullName || '',
          phoneNumber: me.phoneNumber || '',
          email: me.email || '',
          gender: me.gender || 'other',
          dateOfBirth: me.dateOfBirth ? dayjs(me.dateOfBirth) : null,
        });
      } catch (err: any) {
        message.error(err?.message || 'Không thể tải dữ liệu hồ sơ');
      } finally {
        setFetching(false);
      }
    })();
  }, [form]);

  // Submit
  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      const payload: UpdateProfileRequest = {
        fullName: values.fullName,
        gender: values.gender,
        phoneNumber: values.phoneNumber,
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM-DD') : '',
        // Email không cho chỉnh sửa nhưng vẫn gửi lên đúng theo BE yêu cầu
        email: values.email,
      };

      await updateProfileMe(payload);

      if (avatarFile) await uploadAvatar(avatarFile);
      if (bgFile) await uploadBackground(bgFile);

      message.success('Cập nhật hồ sơ thành công!');
      navigate('/customer-dashboard');
    } catch (err: any) {
      message.error(err?.message || 'Cập nhật thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 container mx-auto py-12">
        <h1 className="text-3xl font-bold text-center mb-8">Chỉnh Sửa Hồ Sơ</h1>
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
          <Form form={form} name="edit_profile_form" onFinish={onFinish} layout="vertical">
            <Form.Item
              label="* Họ và Tên"
              name="fullName"
              rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="* Số Điện Thoại"
              name="phoneNumber"
              rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label={
                <span>
                  * Email{' '}
                  <Tooltip title="Email cố định và không thể thay đổi">
                    <InfoCircleOutlined />
                  </Tooltip>
                </span>
              }
              name="email"
              rules={[
                { required: true, message: 'Vui lòng nhập email!' },
                { type: 'email', message: 'Email không hợp lệ!' },
              ]}
              extra="Email được cố định bởi hệ thống và không thể thay đổi."
            >
              {/* disabled để xám và không cho sửa; vẫn giữ giá trị trong form để submit */}
              <Input disabled />
            </Form.Item>

            <Form.Item
              label="* Giới Tính"
              name="gender"
              rules={[{ required: true, message: 'Vui lòng chọn giới tính!' }]}
            >
              <Radio.Group>
                <Radio value="male">Nam</Radio>
                <Radio value="female">Nữ</Radio>
                <Radio value="other">Khác</Radio>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              label="* Ngày Sinh"
              name="dateOfBirth"
              rules={[{ required: true, message: 'Vui lòng chọn ngày sinh!' }]}
            >
              <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="Avatar">
              <Upload
                beforeUpload={(file) => {
                  setAvatarFile(file);
                  return false;
                }}
                maxCount={1}
              >
                <Button icon={<UploadOutlined />}>Tải lên Avatar</Button>
              </Upload>
            </Form.Item>

            <Form.Item label="Ảnh Nền">
              <Upload
                beforeUpload={(file) => {
                  setBgFile(file);
                  return false;
                }}
                maxCount={1}
              >
                <Button icon={<UploadOutlined />}>Tải lên Ảnh Nền</Button>
              </Upload>
            </Form.Item>

            <div className="flex space-x-4">
              <Button type="primary" htmlType="submit" className="flex-1" loading={loading}>
                Lưu
              </Button>
              <Button className="flex-1" onClick={() => navigate('/customer-dashboard')}>
                Hủy
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
