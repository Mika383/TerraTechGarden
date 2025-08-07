import React, { useEffect, useState } from 'react';
import {
  getAddressesByUserId,
  setDefaultAddress,
  unsetDefaultAddress,
  deleteAddress,
  updateAddress,
} from '@/api/profile';
import { Address } from '@/types/profile';
import { getUserIdFromToken } from '@/utils/jwt';
import { PlusOutlined, EditOutlined, DeleteOutlined, StarOutlined } from '@ant-design/icons';
import { Modal, message, Popconfirm } from 'antd';
import NewAddressForm from '../Layout/NewAddressForm';

const AddressSection: React.FC = () => {
  const userId = getUserIdFromToken();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Load danh sách địa chỉ
  const loadAddresses = async () => {
    if (!userId) return;
    const res = await getAddressesByUserId(userId);
    setAddresses(res);
  };

  useEffect(() => {
    loadAddresses();
    // eslint-disable-next-line
  }, [userId]);

  // Thêm địa chỉ
  const handleAdd = () => {
    setEditingAddress(null);
    setShowModal(true);
  };

  // Sửa địa chỉ
  const handleEdit = (addr: Address) => {
    setEditingAddress(addr);
    setShowModal(true);
  };

  // Xoá địa chỉ
  const handleDelete = async (id: number) => {
    try {
      await deleteAddress(id);
      message.success('Đã xoá địa chỉ!');
      loadAddresses();
    } catch {
      message.error('Xoá thất bại!');
    }
  };

  // Đặt làm mặc định (chỉ 1)
  const handleSetDefault = async (selected: Address) => {
    const promises = addresses.map(addr =>
      setDefaultAddress(addr.id, { ...addr, isDefault: addr.id === selected.id })
    );
    try {
      await Promise.all(promises);
      message.success('Đã cập nhật địa chỉ mặc định');
      loadAddresses();
    } catch {
      message.error('Cập nhật thất bại!');
    }
  };

  // Bỏ mặc định
  const handleUnsetDefault = async (addr: Address) => {
    try {
      await unsetDefaultAddress(addr.id, { ...addr, isDefault: false });
      message.success('Đã bỏ địa chỉ mặc định');
      loadAddresses();
    } catch {
      message.error('Bỏ mặc định thất bại!');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mt-8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xl font-semibold">Địa chỉ giao hàng</h3>
        <button
          className="flex items-center gap-1 px-3 py-1 border rounded text-blue-600 border-blue-600 hover:bg-blue-50"
          onClick={handleAdd}
        >
          <PlusOutlined /> Thêm địa chỉ
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map(addr => (
          <div
            key={addr.id}
            className={`relative border p-4 rounded transition-all ${
              addr.isDefault
                ? 'border-green-500 bg-green-50'
                : 'hover:border-blue-400'
            }`}
          >
            {addr.isDefault && (
              <span className="absolute top-2 right-3 bg-green-500 text-white text-xs px-2 py-1 rounded shadow">
                Địa chỉ mặc định
              </span>
            )}
            <div className="font-bold">{addr.tagName}</div>
            <div>{addr.receiverName} - {addr.receiverPhone}</div>
            <div className="text-gray-600 text-sm">{addr.receiverAddress}</div>
            <div className="flex gap-2 mt-2">
              {!addr.isDefault && (
                <button
                  className="text-yellow-500 flex items-center text-xs"
                  onClick={() => handleSetDefault(addr)}
                >
                  <StarOutlined /> <span className="ml-1">Đặt làm mặc định</span>
                </button>
              )}
              {addr.isDefault && (
                <button
                  className="text-gray-500 flex items-center text-xs"
                  onClick={() => handleUnsetDefault(addr)}
                >
                  <StarOutlined /> <span className="ml-1">Bỏ mặc định</span>
                </button>
              )}
              <button
                className="text-blue-600 flex items-center text-xs"
                onClick={() => handleEdit(addr)}
              >
                <EditOutlined /> <span className="ml-1">Sửa</span>
              </button>
              <Popconfirm
                title="Xác nhận xoá địa chỉ này?"
                okText="Xoá"
                cancelText="Huỷ"
                onConfirm={() => handleDelete(addr.id)}
              >
                <button className="text-red-500 flex items-center text-xs">
                  <DeleteOutlined /> <span className="ml-1">Xoá</span>
                </button>
              </Popconfirm>
            </div>
          </div>
        ))}
      </div>

      {/* Modal thêm/sửa địa chỉ */}
      <Modal
        open={showModal}
        onCancel={() => setShowModal(false)}
        footer={null}
        title={editingAddress ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ mới'}
        width={800}
        destroyOnClose
      >
        <NewAddressForm
          userId={userId!}
          onSuccess={() => {
            setShowModal(false);
            loadAddresses();
          }}
          editingData={editingAddress || undefined}
        />
      </Modal>
    </div>
  );
};

export default AddressSection;
