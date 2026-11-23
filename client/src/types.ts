export type VehicleCatalog = Record<string, Record<string, string[]>>;

export interface VehicleSelection {
  make: string;
  model: string;
  badge: string;
}

export type VehiclePreset = VehicleSelection;

export interface VehicleCatalogResponse {
  catalog: VehicleCatalog;
  commonVehicles: VehiclePreset[];
}

export interface SubmissionResultData {
  make: string;
  model: string;
  badge: string;
  logbook: {
    fileName: string;
    mimeType?: string;
    size: number;
    content: string;
  };
}

export interface ErrorPayload {
  error?: string;
}
