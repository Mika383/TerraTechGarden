import React, { useEffect, useState } from 'react';
import { addAddress, updateAddress } from '@/api/profile';
import { useVietnamAddress } from '@/hook/useVietnamAddress';
import { Input, Select, message } from 'antd';
import { Address } from '@/types/profile';

const { Option } = Select;

interface Props {
  userId: number;
  onSuccess: () => void;
  editingData?: Address;
}

const NewAddressForm: React.FC<Props> = ({ userId, onSuccess, editingData }) => {
  const {
    provinces,
    districts,
    wards,
    selectedProvince,
    selectedDistrict,
    selectedWard,
    setSelectedProvince,
    setSelectedDistrict,
    setSelectedWard,
  } = useVietnamAddress();

  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [tagName, setTagName] = useState('');
  const [specificAddress, setSpecificAddress] = useState('');
  const [fullAddress, setFullAddress] = useState('');

  // Khi sửa, fill dữ liệu vào form
  useEffect(() => {
  if (editingData) {
    setTagName(editingData.tagName || '');
    setReceiverName(editingData.receiverName || '');
    setReceiverPhone(editingData.receiverPhone || '');
    // Cắt địa chỉ cụ thể cho input (tuỳ bạn lưu dữ liệu thế nào)
    setSpecificAddress(editingData.receiverAddress?.split(',')[0] || '');

    // GIẢ SỬ Address có provinceCode, districtCode, wardCode
    setSelectedProvince(editingData.provinceCode || '');
    setSelectedDistrict(editingData.districtCode || '');
    setSelectedWard(editingData.wardCode || '');

  } else {
    setTagName('');
    setReceiverName('');
    setReceiverPhone('');
    setSpecificAddress('');
    setSelectedProvince('');
    setSelectedDistrict('');
    setSelectedWard('');
  }
  // eslint-disable-next-line
}, [editingData]);


  // Tạo full address động khi nhập/xoá
  useEffect(() => {
    const province = provinces.find(p => p.level1_id === selectedProvince)?.name || '';
    const district = districts.find(d => d.level2_id === selectedDistrict)?.name || '';
    const ward = wards.find(w => w.level3_id === selectedWard)?.name || '';
    const full = [specificAddress, ward, district, province].filter(Boolean).join(', ');
    setFullAddress(full);
  }, [specificAddress, selectedProvince, selectedDistrict, selectedWard, provinces, districts, wards]);

  const handleSubmit = async () => {
    if (!receiverName || !receiverPhone || !specificAddress || !tagName || !selectedProvince || !selectedDistrict || !selectedWard) {
      message.error('Vui lòng điền đầy đủ thông tin!');
      return;
    }

   const payload: Omit<Address, 'id'> = {
  userId,
  receiverName,
  receiverPhone,
  tagName,
  receiverAddress: fullAddress,
  isDefault: editingData ? editingData.isDefault : false,
  lat: 0,
  lng: 0,
  provinceCode: selectedProvince,
  districtCode: selectedDistrict,
  wardCode: selectedWard,
};


    try {
      if (editingData) {
       await updateAddress(editingData.id, {
                tagName,
                userId,
                receiverName,
                receiverPhone,
                receiverAddress: fullAddress,
                isDefault: editingData.isDefault,
                // KHÔNG cần truyền id ở đây, api sẽ tự thêm id vào body
                });

      } else {
        await addAddress(payload);
        message.success('Đã thêm địa chỉ mới!');
      }
      onSuccess();
    } catch {
      message.error(editingData ? 'Cập nhật thất bại!' : 'Thêm địa chỉ thất bại!');
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium">Tên địa chỉ</label>
      <Input
        placeholder="Tên địa chỉ (VD: Nhà, Công ty...)"
        value={tagName}
        onChange={e => setTagName(e.target.value)}
      />

      <label className="block text-sm font-medium mt-2">Người nhận</label>
      <Input
        placeholder="Người nhận"
        value={receiverName}
        onChange={e => setReceiverName(e.target.value)}
      />

      <label className="block text-sm font-medium mt-2">Số điện thoại</label>
      <Input
        placeholder="Số điện thoại"
        value={receiverPhone}
        onChange={e => setReceiverPhone(e.target.value)}
      />

      <label className="block text-sm font-medium mt-2">Tỉnh / Quận / Phường</label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Select
          placeholder="Tỉnh/Thành phố"
          value={selectedProvince || undefined}
          onChange={v => setSelectedProvince(v)}
          showSearch
          optionFilterProp="children"
        >
          {provinces.map(p => (
            <Option key={p.level1_id} value={p.level1_id}>
              {p.name}
            </Option>
          ))}
        </Select>

        <Select
          placeholder="Quận/Huyện"
          value={selectedDistrict || undefined}
          onChange={v => setSelectedDistrict(v)}
          showSearch
          optionFilterProp="children"
          disabled={!selectedProvince}
        >
          {districts.map(d => (
            <Option key={d.level2_id} value={d.level2_id}>
              {d.name}
            </Option>
          ))}
        </Select>

        <Select
          placeholder="Phường/Xã"
          value={selectedWard || undefined}
          onChange={v => setSelectedWard(v)}
          showSearch
          optionFilterProp="children"
          disabled={!selectedDistrict}
        >
          {wards.map(w => (
            <Option key={w.level3_id} value={w.level3_id}>
              {w.name}
            </Option>
          ))}
        </Select>
      </div>

      <label className="block text-sm font-medium mt-2">Địa chỉ cụ thể</label>
      <Input
        placeholder="Địa chỉ cụ thể"
        value={specificAddress}
        onChange={e => setSpecificAddress(e.target.value)}
      />

      <button
        onClick={handleSubmit}
        className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        {editingData ? 'Cập nhật địa chỉ' : 'Lưu địa chỉ'}
      </button>
    </div>
  );
};

export default NewAddressForm;
