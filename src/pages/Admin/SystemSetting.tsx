import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Card,
  Form,
  InputNumber,
  Button,
  Typography,
  Space,
  Divider,
  message,
  Descriptions,
  Tag,
  Alert,
} from 'antd';

const { Title, Text, Paragraph } = Typography;

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const authHeader = () => {
  const token = localStorage.getItem('authToken');
  return { headers: { Authorization: `Bearer ${token}` } };
};

type PaymentConfig = {
  depositPercent: number;
  fullPaymentDiscountPercent: number;
  freeshipAmount: number;
  orderAmount: number;
  description: string;
  updatedAt?: string;
};

type UpdatePaymentConfigPayload = {
  depositPercent: number;
  fullPaymentDiscountPercent: number;
  freeshipAmount: number;
  orderAmount: number;
  description: string;
};

const SystemSettings: React.FC = () => {
  const [form] = Form.useForm<PaymentConfig>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<PaymentConfig | null>(null);

  // --- Watch các trường để description thay đổi theo real-time ---
  const deposit = Form.useWatch('depositPercent', form) ?? 0;
  const fullDisc = Form.useWatch('fullPaymentDiscountPercent', form) ?? 0;
  const fsAmount = Form.useWatch('freeshipAmount', form) ?? 0;
  const orderAmount = Form.useWatch('orderAmount', form) ?? 0;

  const autoDescription = useMemo(() => {
    const parts: string[] = [];
    parts.push(`Hệ thống đang yêu cầu cọc ${Number(deposit)}% với mọi đơn hàng`);
    if (Number(fullDisc) > 0) {
      parts.push(`, khi thanh toán toàn bộ sẽ được giảm ${Number(fullDisc)}%`);
    } else {
      parts.push(`, không có ưu đãi khi thanh toán toàn bộ`);
    }
    if (Number(orderAmount) > 0) {
      parts.push(
        `. Nếu đơn hàng từ ${Number(orderAmount).toLocaleString('vi-VN')}đ trở lên thì miễn phí ship`
      );
    } else {
      parts.push(`. Không áp dụng miễn phí ship theo ngưỡng đơn hàng`);
    }
    parts.push(` (phí ship mặc định: ${Number(fsAmount).toLocaleString('vi-VN')}đ).`);
    parts.push(` Miễn phí ship áp dụng trong nội thành TP.HCM (cũ).`);
    return parts.join(' ');
  }, [deposit, fullDisc, fsAmount, orderAmount]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await axios.get<{ status?: number; message?: string; data?: PaymentConfig }>(
        `${BASE_URL}/PaymentConfig/1`,
        authHeader()
      );
      const data: PaymentConfig = (res.data?.data as PaymentConfig) ?? (res.data as unknown as PaymentConfig);
      setConfig(data);
      form.setFieldsValue(data);
    } catch (e) {
      console.error(e);
      message.error('Không tải được cấu hình thanh toán');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onFinish = async (values: PaymentConfig) => {
    try {
      setSaving(true);

      if (values.depositPercent < 0 || values.depositPercent > 100) {
        message.warning('Deposit percent phải nằm trong khoảng 0–100');
        setSaving(false);
        return;
      }
      if (values.fullPaymentDiscountPercent < 0 || values.fullPaymentDiscountPercent > 100) {
        message.warning('Full payment discount phải nằm trong khoảng 0–100');
        setSaving(false);
        return;
      }
      if (values.freeshipAmount < 0 || values.orderAmount < 0) {
        message.warning('Giá trị không được âm');
        setSaving(false);
        return;
      }

      const payload: UpdatePaymentConfigPayload = {
        depositPercent: Math.round(values.depositPercent),
        fullPaymentDiscountPercent: Math.round(values.fullPaymentDiscountPercent),
        freeshipAmount: Math.round(values.freeshipAmount),
        orderAmount: Math.round(values.orderAmount),
        // ✅ Description luôn là phiên bản mới nhất từ watch
        description: autoDescription,
      };

      const res = await axios.put<{ message: string }>(
        `${BASE_URL}/PaymentConfig/1`,
        payload,
        {
          ...authHeader(),
          headers: {
            ...authHeader().headers,
            'Content-Type': 'application/json',
          },
        }
      );

      message.success(res.data?.message || 'Cập nhật thành công');
      await fetchConfig();
    } catch (e) {
      console.error(e);
      message.error('Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <Title level={3}>Quản lý hệ thống — Cấu hình thanh toán</Title>
      <Paragraph type="secondary">
        Chỉnh các tham số dưới đây. <Text strong>Description</Text> được tạo tự động theo các con số bạn nhập.
      </Paragraph>

      <Space direction="vertical" size="large" className="w-full">
        {config?.updatedAt && (
          <Alert
            type="info"
            showIcon
            message={
              <span>
                Lần cập nhật gần nhất: <Text code>{new Date(config.updatedAt).toLocaleString('vi-VN')}</Text>
              </span>
            }
          />
        )}

        <Card loading={loading} title="Thông số áp dụng">
          <Form form={form} layout="vertical" onFinish={onFinish} initialValues={config ?? undefined}>
            <Form.Item
              label="Deposit percent (%) — Tỷ lệ cọc"
              name="depositPercent"
              rules={[{ required: true, message: 'Vui lòng nhập phần trăm cọc' }]}
              tooltip="Phần trăm người dùng phải cọc khi đặt hàng"
            >
              <InputNumber min={0} max={100} step={1} className="w-full" />
            </Form.Item>

            <Form.Item
              label="Full payment discount (%) — Giảm khi thanh toán toàn bộ"
              name="fullPaymentDiscountPercent"
              rules={[{ required: true, message: 'Vui lòng nhập phần trăm giảm' }]}
              tooltip="Phần trăm giảm giá khi khách thanh toán toàn bộ"
            >
              <InputNumber min={0} max={100} step={1} className="w-full" />
            </Form.Item>

            <Form.Item
              label="Phí ship mặc định (đ)"
              name="freeshipAmount"
              rules={[{ required: true, message: 'Vui lòng nhập phí ship' }]}
              tooltip="Mặc định phí ship áp dụng nếu đơn hàng không đạt ngưỡng miễn phí"
            >
              <InputNumber min={0} step={1000} className="w-full" />
            </Form.Item>

            <Form.Item
              label="Ngưỡng miễn phí ship (đ)"
              name="orderAmount"
              rules={[{ required: true, message: 'Vui lòng nhập ngưỡng miễn phí ship' }]}
              tooltip="Đơn hàng từ giá trị này trở lên sẽ được miễn phí ship"
            >
              <InputNumber min={0} step={50000} className="w-full" />
            </Form.Item>

            <Divider />

            <Card type="inner" title="Preview mô tả (tự động)">
              <Paragraph>{autoDescription}</Paragraph>
              <Tag color="blue">Description này sẽ được gửi khi bấm “Cập nhật cấu hình”.</Tag>
            </Card>

            <Divider />

            <Space>
              <Button type="primary" htmlType="submit" loading={saving}>
                Cập nhật cấu hình
              </Button>
              <Button onClick={fetchConfig} disabled={saving}>
                Tải lại
              </Button>
            </Space>
          </Form>
        </Card>

        {config && (
          <Card title="Bản ghi hiện tại từ server">
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Deposit percent">{config.depositPercent}%</Descriptions.Item>
              <Descriptions.Item label="Full payment discount">{config.fullPaymentDiscountPercent}%</Descriptions.Item>
              <Descriptions.Item label="Phí ship mặc định">
                {config.freeshipAmount.toLocaleString('vi-VN')}đ
              </Descriptions.Item>
              <Descriptions.Item label="Ngưỡng miễn phí ship">
                {config.orderAmount.toLocaleString('vi-VN')}đ
              </Descriptions.Item>
              <Descriptions.Item label="Description">{config.description}</Descriptions.Item>
              {config.updatedAt && (
                <Descriptions.Item label="Cập nhật lúc">
                  {new Date(config.updatedAt).toLocaleString('vi-VN')}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        )}
      </Space>
    </div>
  );
};

export default SystemSettings;
