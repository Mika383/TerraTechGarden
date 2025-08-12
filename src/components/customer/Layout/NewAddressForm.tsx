import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Input, Select, message, Tabs } from 'antd';
import { addAddress, updateAddress } from '@/api/profile';
import { Address } from '@/types/profile';
import { useVietnamAddress } from '@/hooks/useVietnamAddress';

const { Option } = Select;
const { TabPane } = Tabs;

interface Props {
  userId: number;
  onSuccess: () => void;      // gọi sau khi lưu/cập nhật thành công
  editingData?: Address;      // có => chế độ sửa
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

  // field nhập liệu
  const [tagName, setTagName] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [specificAddress, setSpecificAddress] = useState('');

  // build full address từ các phần
  const fullAddress = useMemo(() => {
    const pName = provinces.find(p => p.level1_id === selectedProvince)?.name || '';
    const dName = districts.find(d => d.level2_id === selectedDistrict)?.name || '';
    const wName = wards.find(w => w.level3_id === selectedWard)?.name || '';
    return [specificAddress, wName, dName, pName].filter(Boolean).join(', ');
  }, [specificAddress, selectedProvince, selectedDistrict, selectedWard, provinces, districts, wards]);

  /** ===== Prefill theo chuỗi: Province -> District -> Ward ===== */
  const prefillCodesRef = useRef<{ prov?: string; dist?: string; ward?: string }>({});
  const [prefillDone, setPrefillDone] = useState(false);

  // Nhận editingData lần đầu: điền text + set tỉnh trước
  useEffect(() => {
    if (!editingData) {
      // reset khi tạo mới
      setTagName('');
      setReceiverName('');
      setReceiverPhone('');
      setSpecificAddress('');
      setSelectedProvince('');
      setSelectedDistrict('');
      setSelectedWard('');
      prefillCodesRef.current = {};
      setPrefillDone(false);
      return;
    }

    setTagName(editingData.tagName || '');
    setReceiverName(editingData.receiverName || '');
    setReceiverPhone(editingData.receiverPhone || '');

    // tách phần đầu làm "địa chỉ cụ thể"
    setSpecificAddress((editingData.receiverAddress || '').split(',')[0]?.trim() || '');

    // lưu code để prefill theo bậc (đảm bảo là string)
    prefillCodesRef.current = {
      prov: String(editingData.provinceCode || ''),
      dist: String(editingData.districtCode || ''),
      ward: String(editingData.wardCode || ''),
    };

    // bước 1: set tỉnh – sẽ kích hoạt hook load quận
    setSelectedProvince(prefillCodesRef.current.prov || '');
    setSelectedDistrict('');
    setSelectedWard('');
    setPrefillDone(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingData]);

  // Khi danh sách quận đã có theo tỉnh -> set quận
  useEffect(() => {
    if (prefillDone) return;
    const { prov, dist } = prefillCodesRef.current;
    if (!prov || !dist) return;

    if (selectedProvince === prov && districts.length > 0 && !selectedDistrict) {
      setSelectedDistrict(dist);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProvince, districts]);

  // Khi danh sách phường đã có theo quận -> set phường -> DONE
  useEffect(() => {
    if (prefillDone) return;
    const { dist, ward } = prefillCodesRef.current;
    if (!dist || !ward) return;

    if (selectedDistrict === dist && wards.length > 0 && !selectedWard) {
      setSelectedWard(ward);
      setPrefillDone(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDistrict, wards]);

  /** ================== Submit ================== */
  const handleSubmit = async () => {
    // validate
    if (!tagName || !receiverName || !receiverPhone || !specificAddress ||
        !selectedProvince || !selectedDistrict || !selectedWard) {
      message.error('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    const payload = {
      tagName,
      receiverName,
      receiverPhone,
      receiverAddress: fullAddress,
      provinceCode: selectedProvince,
      districtCode: selectedDistrict,
      wardCode: selectedWard,
      isDefault: editingData ? editingData.isDefault : false,
      // BE hiện không dùng lat/long -> bỏ qua/để rỗng cũng được
      latitude: '',
      longitude: '',
      // userId không cần nếu BE lấy từ token; nếu cần, thêm userId vào payload
      userId,
    };

    try {
      if (editingData) {
        await updateAddress(editingData.id, payload as any);
        message.success('Đã cập nhật địa chỉ!');
      } else {
        await addAddress(payload as any);
        message.success('Đã thêm địa chỉ mới!');
      }
      onSuccess();
    } catch (e) {
      message.error(editingData ? 'Cập nhật thất bại!' : 'Thêm địa chỉ thất bại!');
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultActiveKey="form" type="card">
        <TabPane tab="Thông tin địa chỉ" key="form">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Tên địa chỉ</label>
              <Input
                placeholder="VD: Nhà, Công ty…"
                value={tagName}
                onChange={e => setTagName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Người nhận</label>
                <Input
                  placeholder="Họ và tên"
                  value={receiverName}
                  onChange={e => setReceiverName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Số điện thoại</label>
                <Input
                  placeholder="SĐT"
                  value={receiverPhone}
                  onChange={e => setReceiverPhone(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tỉnh / Quận / Phường</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Select
                  placeholder="Tỉnh/Thành phố"
                  value={selectedProvince || undefined}
                  onChange={v => { setSelectedProvince(v); setSelectedDistrict(''); setSelectedWard(''); }}
                  showSearch
                  optionFilterProp="children"
                >
                  {provinces.map(p => (
                    <Option key={p.level1_id} value={p.level1_id}>{p.name}</Option>
                  ))}
                </Select>

                <Select
                  placeholder="Quận/Huyện"
                  value={selectedDistrict || undefined}
                  onChange={v => { setSelectedDistrict(v); setSelectedWard(''); }}
                  showSearch
                  optionFilterProp="children"
                  disabled={!selectedProvince}
                >
                  {districts.map(d => (
                    <Option key={d.level2_id} value={d.level2_id}>{d.name}</Option>
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
                    <Option key={w.level3_id} value={w.level3_id}>{w.name}</Option>
                  ))}
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Địa chỉ cụ thể</label>
              <Input
                placeholder="Số nhà, tên đường…"
                value={specificAddress}
                onChange={e => setSpecificAddress(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Địa chỉ đầy đủ</label>
              <Input.TextArea value={fullAddress} readOnly rows={2} className="bg-gray-50" />
            </div>
          </div>
        </TabPane>
      </Tabs>

      <div className="flex gap-3 pt-4 border-t">
        <button
          onClick={handleSubmit}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          {editingData ? 'Cập nhật địa chỉ' : 'Lưu địa chỉ'}
        </button>
        <button
          onClick={() => onSuccess()}
          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
        >
          Hủy
        </button>
      </div>
    </div>
  );
};

export default NewAddressForm;
