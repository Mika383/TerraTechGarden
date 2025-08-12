// AddressSelector.tsx
import React, { useEffect, useState } from 'react';
import { getAddressesByUserId, setDefaultAddress, unsetDefaultAddress } from '@/api/profile';
import { Address } from '@/types/profile';
import { StarOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';
import Modal from 'antd/es/modal';
import NewAddressForm from './NewAddressForm';

interface Props {
  userId: number;
  onSelect: (address: Address) => void;
}

const AddressSelector: React.FC<Props> = ({ userId, onSelect }) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showList, setShowList] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Address | undefined>(undefined);

  const load = async () => {
    const res = await getAddressesByUserId(userId);
    setAddresses(res);
    const def = res.find(a => a.isDefault) || res[0];
    if (def) {
      setSelectedId(def.id);
      onSelect(def);
    } else if (res[0]) {
      // không có default nào -> chọn tạm cái đầu để hiển thị
      setSelectedId(res[0].id);
      onSelect(res[0]);
    }
  };

  useEffect(() => { if (userId) load(); /* eslint-disable-next-line */ }, [userId]);

  const handleSelect = (addr: Address) => {
    setSelectedId(addr.id);
    onSelect(addr);
    setShowList(false);
  };

  /** ✅ CHỈ gọi 1 API set default cho đúng địa chỉ – KHÔNG unset các địa chỉ khác trên FE */
  const handleSetDefault = async (addr: Address) => {
    try {
      await setDefaultAddress(addr.id, { ...addr, isDefault: true } as any);
      toast.success('Đã đặt làm địa chỉ mặc định');
      await load(); // BE đã đảm bảo duy nhất -> reload để đồng bộ
    } catch {
      toast.error('Cập nhật thất bại!');
    }
  };

  /** tuỳ BE: nếu cho phép bỏ mặc định thì giữ; nếu yêu cầu luôn có 1 mặc định -> ẩn nút này */
  const handleUnsetDefault = async (addr: Address) => {
    try {
      await unsetDefaultAddress(addr.id, { ...addr, isDefault: false } as any);
      toast.success('Đã bỏ mặc định');
      await load();
    } catch {
      toast.error('Thao tác thất bại!');
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Địa chỉ giao hàng</h2>
        <button
          className="text-sm text-blue-600 hover:underline"
          onClick={() => { setEditing(undefined); setShowModal(true); }}
        >
          + Thêm địa chỉ mới
        </button>
      </div>

      {selectedId && (
        <div
          className="border rounded p-3 cursor-pointer hover:border-blue-500"
          onClick={() => setShowList(!showList)}
        >
          <div className="relative">
            {addresses.find(a => a.id === selectedId)?.isDefault && (
              <span className="absolute top-0 right-0 bg-green-500 text-white text-xs px-2 py-1 rounded">
                Địa chỉ mặc định
              </span>
            )}
            <p className="font-semibold">{addresses.find(a => a.id === selectedId)?.tagName}</p>
            <p>
              {addresses.find(a => a.id === selectedId)?.receiverName} -{' '}
              {addresses.find(a => a.id === selectedId)?.receiverPhone}
            </p>
            <p>{addresses.find(a => a.id === selectedId)?.receiverAddress}</p>
          </div>
        </div>
      )}

      {showList && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">Danh sách địa chỉ đã lưu:</p>
          {addresses.map(addr => (
            <div
              key={addr.id}
              className={`relative border p-3 rounded cursor-pointer ${
                addr.id === selectedId ? 'border-green-500' : 'hover:border-gray-400'
              }`}
              onClick={() => handleSelect(addr)}
            >
              {addr.isDefault && (
                <span className="absolute top-2 right-3 bg-green-500 text-white text-xs px-2 py-1 rounded shadow">
                  Địa chỉ mặc định
                </span>
              )}
              <p className="font-semibold">{addr.tagName}</p>
              <p>{addr.receiverName} - {addr.receiverPhone}</p>
              <p className="mb-2">{addr.receiverAddress}</p>

              <div className="flex gap-3">
                {!addr.isDefault ? (
                  <button
                    className="text-yellow-600 text-sm"
                    onClick={e => { e.stopPropagation(); handleSetDefault(addr); }}
                  >
                    <StarOutlined /> Đặt làm mặc định
                  </button>
                ) : (
                  <button
                    className="text-gray-600 text-sm"
                    onClick={e => { e.stopPropagation(); handleUnsetDefault(addr); }}
                  >
                    Bỏ mặc định
                  </button>
                )}
                <button
                  className="text-blue-600 text-sm"
                  onClick={e => { e.stopPropagation(); setEditing(addr); setShowModal(true); }}
                >
                  Sửa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={showModal}
        onCancel={() => setShowModal(false)}
        footer={null}
        title={editing ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ mới'}
        width={720}
        destroyOnClose
      >
        <NewAddressForm
          userId={userId}
          editingData={editing}
          onSuccess={() => { setShowModal(false); load(); }}
        />
      </Modal>
    </div>
  );
};

export default AddressSelector;
