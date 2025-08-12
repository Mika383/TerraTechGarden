// src/pages/admin/VoucherManagement.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Button, Modal, Form, Input, InputNumber, DatePicker, Switch, Select, Table, Tag, Popconfirm, Space, message } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { createVoucher, deleteVoucher, getVouchers, updateVoucher } from '@/api/voucher';
import type { Voucher, CreateVoucherRequest, UpdateVoucherRequest } from '@/types/voucher';

const { RangePicker } = DatePicker;

type FormShape = {
  code: string;
  description: string;
  discountAmount?: number | null;
  discountPercent?: number | null;
  dateRange: [Dayjs, Dayjs];
  status: 'active' | 'inactive' | 'Active' | 'Inactive';
  isPersonal: boolean;
  targetUserId?: string | null;
  totalUsage?: number | null;
  perUserUsageLimit?: number | null;
};

const toISO = (d: Dayjs) => d.toDate().toISOString();

const VoucherManagement: React.FC = () => {
  const [data, setData] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Voucher | null>(null);
  const [form] = Form.useForm<FormShape>();

  const fetchAll = async () => {
    try {
      setLoading(true);
      const list = await getVouchers();
      setData(list);
    } catch {
      message.error('Không tải được danh sách voucher.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setOpen(true);
    form.resetFields();
    form.setFieldsValue({
      status: 'active',
      isPersonal: false,
      dateRange: [dayjs().startOf('day'), dayjs().add(1, 'year').endOf('day')],
      discountAmount: 0,
      discountPercent: 0,
      totalUsage: 0,
      perUserUsageLimit: 0,
    });
  };

  const openEdit = (v: Voucher) => {
    setEditing(v);
    setOpen(true);
    form.setFieldsValue({
      code: v.code,
      description: v.description,
      discountAmount: v.discountAmount ?? 0,
      discountPercent: v.discountPercent ?? 0,
      dateRange: [dayjs(v.validFrom), dayjs(v.validTo)],
      status: (v.status?.toString().toLowerCase() === 'inactive' ? 'inactive' : 'active') as any,
      isPersonal: v.isPersonal,
      targetUserId: v.targetUserId ?? undefined,
      totalUsage: v.totalUsage ?? 0,
      perUserUsageLimit: v.perUserUsageLimit ?? 0,
    });
  };

  const onSubmit = async () => {
    try {
      const values = await form.validateFields();

      // ít nhất 1 trong 2 phải > 0
      if ((values.discountAmount ?? 0) <= 0 && (values.discountPercent ?? 0) <= 0) {
        message.warning('Vui lòng nhập Discount Amount hoặc Discount Percent (> 0).');
        return;
      }

      const payloadBase = {
        code: values.code.trim(),
        description: values.description?.trim() ?? '',
        discountAmount: values.discountAmount ?? 0,
        discountPercent: values.discountPercent ?? 0,
        validFrom: toISO(values.dateRange[0]),
        validTo: toISO(values.dateRange[1]),
        status: values.status,
        isPersonal: !!values.isPersonal,
        targetUserId: values.isPersonal ? (values.targetUserId?.trim() || null) : null,
        totalUsage: values.totalUsage ?? 0,
        perUserUsageLimit: values.perUserUsageLimit ?? 0,
      };

      if (editing) {
        const payload: UpdateVoucherRequest = payloadBase;
        await updateVoucher(editing.voucherId, payload);
        message.success('Cập nhật voucher thành công.');
      } else {
        const payload: CreateVoucherRequest = payloadBase;
        await createVoucher(payload);
        message.success('Tạo voucher thành công.');
      }

      setOpen(false);
      setEditing(null);
      form.resetFields();
      fetchAll();
    } catch (err: any) {
      if (err?.errorFields) return; // lỗi validate form
      message.error('Thao tác thất bại, vui lòng thử lại.');
    }
  };

  const onDelete = async (id: number) => {
    try {
      await deleteVoucher(id);
      message.success('Đã xoá voucher.');
      fetchAll();
    } catch {
      message.error('Không xoá được voucher.');
    }
  };

  const columns = useMemo(
    () => [
      { title: 'Mã', dataIndex: 'code', key: 'code' },
      { title: 'Mô tả', dataIndex: 'description', key: 'description', ellipsis: true },
      {
        title: 'Giảm tiền',
        dataIndex: 'discountAmount',
        key: 'discountAmount',
        render: (v: number | null) => (v ? `${v.toLocaleString('vi-VN')} VND` : '-'),
      },
      {
        title: 'Giảm %',
        dataIndex: 'discountPercent',
        key: 'discountPercent',
        render: (v: number | null) => (v ? `${v}%` : '-'),
      },
      {
        title: 'Hiệu lực',
        key: 'valid',
        render: (_: any, r: Voucher) =>
          `${dayjs(r.validFrom).format('DD/MM/YYYY')} → ${dayjs(r.validTo).format('DD/MM/YYYY')}`,
      },
      {
        title: 'Trạng thái',
        dataIndex: 'status',
        key: 'status',
        render: (s: string) =>
          s?.toString().toLowerCase() === 'active' ? <Tag color="green">Active</Tag> : <Tag color="default">Inactive</Tag>,
      },
      {
        title: 'Cá nhân',
        dataIndex: 'isPersonal',
        key: 'isPersonal',
        render: (v: boolean) => (v ? <Tag color="blue">Personal</Tag> : <Tag>Public</Tag>),
      },
      {
        title: 'Giới hạn / Còn lại',
        key: 'usage',
        render: (_: any, r: Voucher) => `${r.totalUsage ?? 0} / ${r.remainingUsage ?? 0}`,
      },
      {
        title: 'Hành động',
        key: 'actions',
        fixed: 'right' as const,
        render: (_: any, r: Voucher) => (
          <Space>
            <Button size="small" onClick={() => openEdit(r)}>Sửa</Button>
            <Popconfirm title="Xóa voucher này?" onConfirm={() => onDelete(r.voucherId)}>
              <Button size="small" danger>Xoá</Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    []
  );

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Quản lý Voucher</h1>
        <div className="flex gap-2">
          <Button onClick={fetchAll}>Tải lại</Button>
          <Button type="primary" onClick={openCreate}>Tạo voucher</Button>
        </div>
      </div>

      <Table<Voucher>
        rowKey="voucherId"
        columns={columns as any}
        dataSource={data}
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1000 }}
      />

      {/* Modal Tạo/Sửa */}
      <Modal
        open={open}
        title={editing ? `Sửa voucher #${editing.voucherId}` : 'Tạo voucher'}
        onOk={onSubmit}
        onCancel={() => { setOpen(false); setEditing(null); }}
        okText={editing ? 'Lưu thay đổi' : 'Tạo mới'}
        destroyOnClose
        width={720}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="code" label="Mã" rules={[{ required: true, message: 'Nhập mã voucher' }]}>
            <Input placeholder="VD: 50K, 200OFF..." />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} placeholder="Mô tả ngắn" />
          </Form.Item>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Form.Item name="discountAmount" label="Giảm tiền (VND)">
              <InputNumber min={0} className="w-full" placeholder="0" />
            </Form.Item>
            <Form.Item name="discountPercent" label="Giảm %">
              <InputNumber min={0} max={100} className="w-full" placeholder="0" />
            </Form.Item>
            <Form.Item name="status" label="Trạng thái" rules={[{ required: true }]}>
              <Select
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
              />
            </Form.Item>
          </div>

          <Form.Item
            name="dateRange"
            label="Thời gian hiệu lực"
            rules={[{ required: true, message: 'Chọn khoảng thời gian' }]}
          >
            <RangePicker className="w-full" allowClear={false} />
          </Form.Item>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Form.Item name="totalUsage" label="Giới hạn tổng lượt dùng">
              <InputNumber min={0} className="w-full" placeholder="0 = không giới hạn" />
            </Form.Item>
            <Form.Item name="perUserUsageLimit" label="Giới hạn theo người dùng">
              <InputNumber min={0} className="w-full" placeholder="0 = không giới hạn" />
            </Form.Item>
            <Form.Item name="isPersonal" label="Voucher cá nhân" valuePropName="checked" initialValue={false}>
              <Switch />
            </Form.Item>
          </div>

          <Form.Item noStyle shouldUpdate={(p, n) => p.isPersonal !== n.isPersonal}>
            {({ getFieldValue }) =>
              getFieldValue('isPersonal') ? (
                <Form.Item
                  name="targetUserId"
                  label="User ID áp dụng"
                  rules={[{ required: true, message: 'Nhập User ID cho voucher cá nhân' }]}
                >
                  <Input placeholder="UserId đích" />
                </Form.Item>
              ) : null
            }
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default VoucherManagement;
