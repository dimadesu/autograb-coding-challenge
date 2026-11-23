import { useState } from 'react';
import { ErrorAlert } from './components/ErrorAlert.tsx';
import { SubmissionResult } from './components/SubmissionResult.tsx';
import { VehicleLogbookForm } from './components/VehicleLogbookForm.tsx';
import { useVehicleCatalog } from './hooks/useVehicleCatalog.ts';
import type { SubmissionResultData } from './types.ts';

export default function App() {
  const {
    vehicles,
    loading: loadingVehicles,
    error: loadError,
    retry,
  } = useVehicleCatalog();
  const [result, setResult] = useState<SubmissionResultData | null>(null);

  return (
    <main className="container">
      <h1>Vehicle Service Logbook</h1>
      <p className="subtitle">
        Select your vehicle&apos;s make, model, and badge, then upload your
        service logbook.
      </p>

      {loadingVehicles && <p className="status">Loading vehicle options...</p>}

      {loadError && <ErrorAlert message={loadError} onRetry={retry} />}

      {!loadingVehicles && !loadError && vehicles && (
        <VehicleLogbookForm vehicles={vehicles} onResultChange={setResult} />
      )}

      {result && <SubmissionResult result={result} />}
    </main>
  );
}
