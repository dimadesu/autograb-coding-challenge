import { useCallback, useEffect, useState } from 'react';
import { fetchVehicleCatalog } from './api.ts';
import { ErrorAlert } from './components/ErrorAlert.tsx';
import { SubmissionResult } from './components/SubmissionResult.tsx';
import { VehicleLogbookForm } from './components/VehicleLogbookForm.tsx';
import type { SubmissionResultData, VehicleCatalogResponse } from './types.ts';

export default function App() {
  const [catalogData, setCatalogData] = useState<VehicleCatalogResponse | null>(
    null,
  );
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  const [result, setResult] = useState<SubmissionResultData | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadVehicles() {
      setLoadingVehicles(true);
      setLoadError(null);
      try {
        const payload = await fetchVehicleCatalog(controller.signal);
        setCatalogData(payload);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        setLoadError(
          err instanceof Error && err.message
            ? err.message
            : 'Unable to load vehicle options.',
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoadingVehicles(false);
        }
      }
    }

    void loadVehicles();
    return () => controller.abort();
  }, [reloadTick]);

  const retry = useCallback(() => {
    setReloadTick((n) => n + 1);
  }, []);

  return (
    <main className="container">
      <h1>Vehicle Service Logbook</h1>
      <p className="subtitle">
        Select your vehicle&apos;s make, model, and badge, then upload your
        service logbook.
      </p>

      {loadingVehicles && <p className="status">Loading vehicle options...</p>}

      {loadError && <ErrorAlert message={loadError} onRetry={retry} />}

      {!loadingVehicles && !loadError && catalogData && (
        <VehicleLogbookForm
          vehicles={catalogData.catalog}
          commonVehicles={catalogData.commonVehicles}
          onResultChange={setResult}
        />
      )}

      {result && <SubmissionResult result={result} />}
    </main>
  );
}
