import type {
  ErrorPayload,
  SubmissionResultData,
  VehicleCatalogResponse,
  VehicleSelection,
} from './types.ts';

export async function fetchVehicleCatalog(
  signal?: AbortSignal,
): Promise<VehicleCatalogResponse> {
  const response = await fetch('/api/vehicles', { signal });
  if (!response.ok) {
    throw new Error(`Failed to load vehicles (${response.status})`);
  }
  return (await response.json()) as VehicleCatalogResponse;
}

export async function submitLogbook(
  vehicle: VehicleSelection,
  logbookFile: File,
): Promise<SubmissionResultData> {
  const formData = new FormData();
  formData.append('make', vehicle.make);
  formData.append('model', vehicle.model);
  formData.append('badge', vehicle.badge);
  formData.append('logbook', logbookFile);

  const response = await fetch('/api/submissions', {
    method: 'POST',
    body: formData,
  });

  let data: (SubmissionResultData & ErrorPayload) | null = null;
  try {
    data = (await response.json()) as SubmissionResultData & ErrorPayload;
  } catch {
    // Non-JSON error or response body; handled below.
  }

  if (!response.ok) {
    throw new Error(data?.error || `Submission failed (${response.status}).`);
  }
  if (!data) {
    throw new Error('Unexpected response from server.');
  }

  return data;
}
