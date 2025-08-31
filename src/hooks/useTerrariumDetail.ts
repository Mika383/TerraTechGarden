// src/hooks/useTerrariumDetail.ts
import { useEffect, useState } from 'react';
import { Terrarium, TerrariumVariant } from '@/types/terrarium';
import { getTerrariumEnrichedById, getVariantsByTerrariumId } from '@/api/terrarium';

export function useTerrariumDetail(id: number | string) {
  const [terrarium, setTerrarium] = useState<Terrarium | null>(null);
  const [variants, setVariants] = useState<TerrariumVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        const t = await getTerrariumEnrichedById(Number(id));
        if (!mounted) return;
        setTerrarium(t);
        if (t?.terrariumId) {
          const v = await getVariantsByTerrariumId(t.terrariumId);
          if (!mounted) return;
          setVariants(v ?? []);
        }
        setError(null);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? 'Load terrarium failed');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  return { terrarium, variants, loading, error };
}
