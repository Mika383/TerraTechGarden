// src/components/customer/Layout/AddressSelector.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  getAddressesByUserId,
  setDefaultAddress,
  unsetDefaultAddress,
  deleteAddress,
} from '@/api/profile';
import type { Address } from '@/types/profile';
import { Modal, Popconfirm, message, Select, Button } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  StarOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import NewAddressForm from './NewAddressForm';

type Props = {
  userId: number;
  onSelect?: (addr: Address | null) => void;
  initialAddressId?: number;
  hideNote?: boolean;
};

const AddressSelector: React.FC<Props> = ({
  userId,
  onSelect,
  initialAddressId,
  hideNote,
}) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedId, setSelectedId] = useState<number | undefined>(undefined);

  // Modal
  const [managerOpen, setManagerOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Address | undefined>(undefined);

  const selectedAddress = useMemo(
    () => addresses.find((a) => a.id === selectedId) || null,
    [addresses, selectedId]
  );

  const load = async () => {
    if (!userId) return;
    try {
      const list = await getAddressesByUserId(userId);
      setAddresses(Array.isArray(list) ? list : []);
    } catch {
      setAddresses([]);
    }
  };

  useEffect(() => { load(); }, [userId]);

  // Chọn ban đầu: initial → default → phần tử đầu (không khoá — user vẫn đổi)
  useEffect(() => {
    if (!addresses.length) {
      setSelectedId(undefined);
      onSelect?.(null);
      return;
    }
    const init =
      (initialAddressId && addresses.find(a => a.id === initialAddressId)?.id) ??
      addresses.find(a => a.isDefault)?.id ??
      addresses[0].id;

    // tránh tham chiếu biến ngoài callback
    setSelectedId((curr) => {
      const next = curr ?? init;
      onSelect?.(addresses.find(a => a.id === next) || null);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addresses, initialAddressId]);

  const handleChange = (value?: number) => {
    setSelectedId(value);
    const found = addresses.find(a => a.id === value) || null;
    onSelect?.(found);
  };

  // ===== CRUD & Default =====
  const openCreate = () => { setEditing(undefined); setFormOpen(true); };
  const openEdit = (addr: Address) => { setEditing(addr); setFormOpen(true); };

  const handleDelete = async (id: number) => {
    try {
      await deleteAddress(id);
      message.success('Đã xoá địa chỉ!');
      await load();
      if (id === selectedId) {
        setSelectedId(undefined);
        onSelect?.(null);
      }
    } catch {
      message.error('Xoá địa chỉ thất bại!');
    }
  };

  const handleSetDefault = async (target: Address) => {
    try {
      const jobs = addresses.map(a =>
        setDefaultAddress(a.id, { ...a, isDefault: a.id === target.id })
      );
      await Promise.all(jobs);
      message.success('Đã cập nhật địa chỉ mặc định!');
      await load();
    } catch {
      message.error('Cập nhật mặc định thất bại!');
    }
  };

  const handleUnsetDefault = async (addr: Address) => {
    try {
      await unsetDefaultAddress(addr.id, { ...addr, isDefault: false });
      message.success('Đã bỏ địa chỉ mặc định!');
      await load();
    } catch {
      message.error('Bỏ mặc định thất bại!');
    }
  };

  // ===== Options cho Select =====
  const selectOptions = useMemo(() => {
    return addresses.map((a) => {
      const short = `${a.tagName || 'Địa chỉ'} • ${a.receiverName} • ${a.receiverPhone}` +
        (a.isDefault ? ' • mặc định' : '');
      return {
        value: a.id,
        short, // hiển thị trong ô select (1 dòng)
        // Label rich hiển thị trong dropdown
        label: (
          <div className="flex flex-col leading-tight">
            <span className="font-medium">
              {a.tagName || 'Địa chỉ'}{' '}
              {a.isDefault && <span className="text-green-600">(mặc định)</span>}
            </span>
            <span className="text-xs text-gray-600">
              {a.receiverName} - {a.receiverPhone}
            </span>
            <span className="text-xs text-gray-500 truncate">
              {a.receiverAddress}
            </span>
          </div>
        ),
        // Cho phép search theo text
        searchText: `${a.tagName || ''} ${a.receiverName} ${a.receiverPhone} ${a.receiverAddress}`,
      };
    });
  }, [addresses]);

  // Search dùng searchText
  const filterOption = (input: string, option?: any) =>
    (option?.searchText ?? '').toLowerCase().includes(input.toLowerCase());

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-5 relative">
      

      <div className="flex items-center justify-between gap-2 mb-3 pr-28">
        <h2 className="text-base sm:text-lg md:text-xl font-semibold">Địa chỉ giao hàng</h2>
        <div className="flex gap-2">
          <Button icon={<PlusOutlined />} onClick={openCreate}>
            Thêm địa chỉ
          </Button>
          <Button icon={<SettingOutlined />} onClick={() => setManagerOpen(true)}>
            Quản lý
          </Button>
        </div>
      </div>

      {/* Dropdown chọn địa chỉ — chỉ 1 dòng trong ô */}
      <Select
        size="large"
        className="w-full"
        value={selectedId}
        onChange={handleChange}
        options={selectOptions as any}
        optionLabelProp="short"
        showSearch
        filterOption={filterOption}
        allowClear
        placeholder="Chọn địa chỉ giao hàng"
        dropdownMatchSelectWidth={true}
        listHeight={320}
      />

      {selectedAddress && (
        <div className="mt-3 text-sm text-gray-700">
          <b>Đang dùng:</b>{' '}
          {`${selectedAddress.tagName || 'Địa chỉ'} • ${selectedAddress.receiverName} • ${selectedAddress.receiverPhone}`}
        </div>
      )}

      {/* Modal tạo/sửa */}
      <Modal
        open={formOpen}
        onCancel={() => setFormOpen(false)}
        footer={null}
        title={editing ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ mới'}
        width={800}
        destroyOnClose
      >
        <NewAddressForm
          userId={userId}
          editingData={editing}
          onSuccess={async () => {
            setFormOpen(false);
            await load();
          }}
        />
      </Modal>

      {/* Modal quản lý địa chỉ */}
      <Modal
        open={managerOpen}
        onCancel={() => setManagerOpen(false)}
        footer={null}
        title="Quản lý địa chỉ"
        width={900}
        destroyOnClose
      >
        <div className="flex justify-end mb-3">
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Thêm địa chỉ
          </Button>
        </div>

        {addresses.length === 0 ? (
          <div className="text-sm text-gray-600">Chưa có địa chỉ nào.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`relative border p-4 rounded ${
                  addr.isDefault ? 'border-green-500 bg-green-50' : 'hover:border-blue-400'
                }`}
              >
                {addr.isDefault && (
                  <span className="absolute top-2 right-3 bg-green-500 text-white text-xs px-2 py-1 rounded shadow">
                    Địa chỉ mặc định
                  </span>
                )}
                <div className="font-bold">{addr.tagName || 'Địa chỉ'}</div>
                <div>{addr.receiverName} - {addr.receiverPhone}</div>
                <div className="text-gray-600 text-sm">{addr.receiverAddress}</div>

                <div className="flex flex-wrap gap-3 mt-3">
                  {!addr.isDefault ? (
                    <button
                      type="button"
                      className="text-yellow-600 flex items-center text-xs"
                      onClick={() => handleSetDefault(addr)}
                    >
                      <StarOutlined /> <span className="ml-1">Đặt làm mặc định</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="text-gray-500 flex items-center text-xs"
                      onClick={() => handleUnsetDefault(addr)}
                    >
                      <StarOutlined /> <span className="ml-1">Bỏ mặc định</span>
                    </button>
                  )}

                  <button
                    type="button"
                    className="text-blue-600 flex items-center text-xs"
                    onClick={() => openEdit(addr)}
                  >
                    <EditOutlined /> <span className="ml-1">Sửa</span>
                  </button>

                  <Popconfirm
                    title="Xác nhận xoá địa chỉ này?"
                    okText="Xoá"
                    cancelText="Huỷ"
                    onConfirm={() => handleDelete(addr.id)}
                  >
                    <button type="button" className="text-red-500 flex items-center text-xs">
                      <DeleteOutlined /> <span className="ml-1">Xoá</span>
                    </button>
                  </Popconfirm>

                  <button
                    type="button"
                    className="text-gray-700 border px-2 py-0.5 rounded text-xs"
                    onClick={() => { setSelectedId(addr.id); onSelect?.(addr); }}
                  >
                    Dùng địa chỉ này
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AddressSelector;
