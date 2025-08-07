import React, { useEffect, useState } from 'react';
import { getAddressesByUserId, setDefaultAddress } from '@/api/profile';
import { Address } from '@/types/profile';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { StarOutlined, PlusOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';
import NewAddressForm from './NewAddressForm'; // component nhập địa chỉ mới
import Modal from 'antd/es/modal';

interface Props {
  userId: number;
  onSelect: (address: Address) => void;
}

const AddressSelector: React.FC<Props> = ({ userId, onSelect }) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showList, setShowList] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Load addresses
  const load = async () => {
    const res = await getAddressesByUserId(userId);
    setAddresses(res);
    const defaultAddr = res.find(a => a.isDefault) || res[0];
    if (defaultAddr) {
      setSelectedId(defaultAddr.id);
      onSelect(defaultAddr);
    }
  };

  useEffect(() => {
    if (userId) load();
    // eslint-disable-next-line
  }, [userId]);

  const handleSelect = (addr: Address) => {
    setSelectedId(addr.id);
    onSelect(addr);
    setShowList(false);
  };

  // Đảm bảo chỉ 1 địa chỉ là mặc định, các địa chỉ khác set về false (do backend chưa xử lý)
  const handleSetDefault = async (selected: Address) => {
    const promises = addresses.map(addr =>
      setDefaultAddress(addr.id, {
        ...addr,
        isDefault: addr.id === selected.id, // chỉ một địa chỉ được true
      })
    );
    try {
      await Promise.all(promises);
      toast.success('Đã cập nhật địa chỉ mặc định');
      await load();
    } catch {
      toast.error('Cập nhật thất bại!');
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Địa chỉ giao hàng</h2>
        <button
          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
          onClick={() => setShowModal(true)}
        >
          <PlusOutlined /> Thêm địa chỉ mới
        </button>
      </div>

      {/* Địa chỉ đang chọn */}
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

      {/* Danh sách mở rộng */}
      {showList && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">Danh sách địa chỉ đã lưu:</p>
          {addresses.map(addr => (
            <div
              key={addr.id}
              className={`relative border p-3 rounded cursor-pointer ${addr.id === selectedId ? 'border-green-500' : 'hover:border-gray-400'}`}
              onClick={() => handleSelect(addr)}
            >
              {/* Badge mặc định */}
              {addr.isDefault && (
                <span className="absolute top-2 right-3 bg-green-500 text-white text-xs px-2 py-1 rounded shadow">
                  Địa chỉ mặc định
                </span>
              )}
              <p className="font-semibold">{addr.tagName}</p>
              <p>{addr.receiverName} - {addr.receiverPhone}</p>
              <p>{addr.receiverAddress}</p>

              {!addr.isDefault && (
                <button
                  className="text-yellow-500 mt-1 text-sm"
                  onClick={e => {
                    e.stopPropagation();
                    handleSetDefault(addr);
                  }}
                >
                  <StarOutlined /> Đặt làm mặc định
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal thêm mới */}
      <Modal
        open={showModal}
        onCancel={() => setShowModal(false)}
        footer={null}
        title="Thêm địa chỉ mới"
        width={800}
        destroyOnClose
      >
        <NewAddressForm
          userId={userId}
          onSuccess={() => {
            setShowModal(false);
            load();
          }}
        />
      </Modal>
    </div>
  );
};

export default AddressSelector;
