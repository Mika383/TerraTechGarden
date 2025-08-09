import { useState, useEffect } from 'react';
import rawAddress from '@/data/vn-address-data.json';

interface Ward {
  level3_id: string;
  name: string;
  type: string;
}

interface District {
  level2_id: string;
  name: string;
  type: string;
  level3s: Ward[];
}

interface Province {
  level1_id: string;
  name: string;
  type: string;
  level2s: District[];
}

export const useVietnamAddress = () => {
  const addressData: Province[] = rawAddress.data;

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedWard, setSelectedWard] = useState<string>('');

  useEffect(() => {
    setProvinces(addressData);
  }, []);

  useEffect(() => {
    if (selectedProvince) {
      const found = addressData.find(p => p.level1_id === selectedProvince);
      setDistricts(found?.level2s || []);
      setSelectedDistrict('');
      setWards([]);
    }
  }, [selectedProvince]);

  useEffect(() => {
    if (selectedDistrict && selectedProvince) {
      const foundProvince = addressData.find(p => p.level1_id === selectedProvince);
      const foundDistrict = foundProvince?.level2s.find(d => d.level2_id === selectedDistrict);
      setWards(foundDistrict?.level3s || []);
      setSelectedWard('');
    }
  }, [selectedDistrict, selectedProvince]);

  return {
    provinces,
    districts,
    wards,
    selectedProvince,
    selectedDistrict,
    selectedWard,
    setSelectedProvince,
    setSelectedDistrict,
    setSelectedWard,
  };
};
