import React, { useState, useEffect } from 'react';
import { Select, Input } from 'antd';
import { useVietnamAddress } from '@/hooks/useVietnamAddress';
import { Province, District, Ward } from '@/types';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

const { Option } = Select;

const containerStyle = {
  width: '100%',
  height: '300px',
};

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const AddressPicker = () => {
  const {
    provinces,
    selectedProvince,
    selectedDistrict,
    selectedWard,
    setSelectedProvince,
    setSelectedDistrict,
    setSelectedWard,
  } = useVietnamAddress();

  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [specificAddress, setSpecificAddress] = useState('');
  const [mapPosition, setMapPosition] = useState<{ lat: number; lng: number }>({
    lat: 10.7769,
    lng: 106.7009,
  });

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_API_KEY,
  });

  useEffect(() => {
    const province = provinces.find(p => p.level1_id === selectedProvince);
    setDistricts(province ? province.level2s : []);
    setSelectedDistrict('');
    setSelectedWard('');
  }, [selectedProvince, provinces, setSelectedDistrict, setSelectedWard]);

  useEffect(() => {
    const district = districts.find(d => d.level2_id === selectedDistrict);
    setWards(district ? district.level3s : []);
    setSelectedWard('');
  }, [selectedDistrict, districts, setSelectedWard]);

  useEffect(() => {
    const province = provinces.find(p => p.level1_id === selectedProvince);
    const district = districts.find(d => d.level2_id === selectedDistrict);
    const ward = wards.find(w => w.level3_id === selectedWard);
    
    const full = `${specificAddress}, ${ward?.name || ''}, ${district?.name || ''}, ${province?.name || ''}`;
    
    if (!full.trim() || !window.google || !window.google.maps) return;

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: full }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        setMapPosition({
          lat: results[0].geometry.location.lat(),
          lng: results[0].geometry.location.lng(),
        });
      }
    });
  }, [specificAddress, selectedProvince, selectedDistrict, selectedWard, provinces, districts, wards]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block font-medium mb-1">Tỉnh / Thành phố</label>
        <Select
          showSearch
          style={{ width: '100%' }}
          placeholder="Chọn tỉnh/thành"
          value={selectedProvince !== '' ? selectedProvince : undefined}
          onChange={value => setSelectedProvince(value)}
          optionFilterProp="children"
        >
          {provinces.map(p => (
            <Option key={p.level1_id} value={p.level1_id}>{p.name}</Option>
          ))}
        </Select>

        <Select
          showSearch
          style={{ width: '100%' }}
          placeholder="Chọn quận/huyện"
          value={selectedDistrict !== '' ? selectedDistrict : undefined}
          onChange={value => setSelectedDistrict(value)}
          optionFilterProp="children"
        >
          {districts.map(d => (
            <Option key={d.level2_id} value={d.level2_id}>{d.name}</Option>
          ))}
        </Select>

        <Select
          showSearch
          style={{ width: '100%' }}
          placeholder="Chọn phường/xã"
          value={selectedWard !== '' ? selectedWard : undefined}
          onChange={value => setSelectedWard(value)}
          optionFilterProp="children"
        >
          {wards.map(w => (
            <Option key={w.level3_id} value={w.level3_id}>{w.name}</Option>
          ))}
        </Select>
      </div>

      <div>
        <label className="block font-medium mb-1">Địa chỉ cụ thể</label>
        <Input
          value={specificAddress}
          onChange={e => setSpecificAddress(e.target.value)}
          placeholder="Số nhà, tên đường..."
        />
      </div>

      {isLoaded && (
        <div className="mt-4">
          <label className="block font-medium mb-1">Xác nhận vị trí trên bản đồ</label>
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={mapPosition}
            zoom={16}
          >
            <Marker
              position={mapPosition}
              draggable
              onDragEnd={(e) =>
                setMapPosition({
                  lat: e.latLng?.lat() || 0,
                  lng: e.latLng?.lng() || 0,
                })
              }
            />
          </GoogleMap>
        </div>
      )}
    </div>
  );
};

export default AddressPicker;