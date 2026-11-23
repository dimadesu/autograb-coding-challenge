import { useCallback, useEffect, useState } from 'react';
import type {
  VehicleCatalog,
  VehicleCatalogResponse,
  VehiclePreset,
} from '../types.ts';

interface UseVehicleCatalogResult {
  vehicles: VehicleCatalog | null;
  commonVehicles: readonly VehiclePreset[];
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export function useVehicleCatalog(): UseVehicleCatalogResult {
  const [data, setData] = useState<VehicleCatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchVehicles() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/vehicles', {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Failed to load vehicles (${response.status})`);
        }
        const payload = (await response.json()) as VehicleCatalogResponse;
        setData(payload);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        setError(
          err instanceof Error && err.message
            ? err.message
            : 'Unable to load vehicle options.',
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void fetchVehicles();
    return () => controller.abort();
  }, [reloadTick]);

  const retry = useCallback(() => {
    setReloadTick((n) => n + 1);
  }, []);

  return {
    vehicles: data?.catalog ?? null,
    commonVehicles: data?.commonVehicles ?? [],
    loading,
    error,
    retry,
  };
}
