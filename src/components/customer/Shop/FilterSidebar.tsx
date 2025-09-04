import React, { useEffect, useState } from 'react';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

type Opt = { id: number; name: string };

interface Props {
  environmentId: number | null;
  setEnvironmentId: (v: number | null) => void;
  shapeId: number | null;
  setShapeId: (v: number | null) => void;
  tankMethodId: number | null;
  setTankMethodId: (v: number | null) => void;
  onClear: () => void;
}

const authHeaders = () => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const FilterSidebar: React.FC<Props> = ({
  environmentId, setEnvironmentId,
  shapeId, setShapeId,
  tankMethodId, setTankMethodId,
  onClear
}) => {
  const [envs, setEnvs] = useState<Opt[]>([]);
  const [shapes, setShapes] = useState<Opt[]>([]);
  const [methods, setMethods] = useState<Opt[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [e, s, m] = await Promise.all([
          axios.get(`${BASE_URL}/Environment/get-all`, { headers: authHeaders() }),
          axios.get(`${BASE_URL}/Shape/get-all`, { headers: authHeaders() }),
          axios.get(`${BASE_URL}/TankMethod/get-all`, { headers: authHeaders() }),
        ]);

        const mapList = (arr: any[], idKey: string, nameKey: string): Opt[] =>
          (Array.isArray(arr) ? arr : []).map(x => ({ id: x[idKey], name: x[nameKey] }));

        setEnvs(mapList(e?.data?.data ?? e?.data ?? [], 'environmentId', 'environmentName'));
        setShapes(mapList(s?.data?.data ?? s?.data ?? [], 'shapeId', 'shapeName'));
        setMethods(mapList(m?.data?.data ?? m?.data ?? [], 'tankMethodId', 'tankMethodType'));
      } catch (err) {
        console.error('Load filter options failed', err);
      }
    })();
  }, []);

  const Select = ({
    label, value, onChange, options
  }: { label: string; value: number | null; onChange: (n: number | null) => void; options: Opt[] }) => (
    <div className="mb-5">
      <h3 className="text-base md:text-lg font-semibold mb-2 text-gray-800">{label}</h3>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm md:text-base"
      >
        <option value="">Tất cả</option>
        {options.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>
    </div>
  );

  return (
    <aside className="w-full bg-white p-4 rounded-lg shadow-md font-roboto">
      <h2 className="text-lg md:text-xl font-semibold text-green-700 mb-4">Bộ lọc</h2>

      <Select label="Môi trường (Environment)" value={environmentId} onChange={setEnvironmentId} options={envs} />
      <Select label="Hình dạng bể (Shape)" value={shapeId} onChange={setShapeId} options={shapes} />
      <Select label="Phương pháp bể (Tank Method)" value={tankMethodId} onChange={setTankMethodId} options={methods} />

      <button
        onClick={onClear}
        className="mt-2 w-full py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-gray-800 text-sm md:text-base transition-colors"
      >
        Xóa bộ lọc
      </button>
    </aside>
  );
};

export default FilterSidebar;
