import { readFile } from 'node:fs/promises';
import { z } from 'zod';

const vehicleCatalogSchema = z.record(
  z.string(),
  z.record(z.string(), z.array(z.string()).readonly()),
);

const vehiclePresetSchema = z.object({
  make: z.string(),
  model: z.string(),
  badge: z.string(),
});

const commonVehiclesSchema = z.array(vehiclePresetSchema).readonly();

export type VehicleCatalog = z.infer<typeof vehicleCatalogSchema>;
export type VehiclePreset = z.infer<typeof vehiclePresetSchema>;

export interface VehicleRepository {
  getCatalog(): Promise<VehicleCatalog>;
  getCommonVehicles(): Promise<readonly VehiclePreset[]>;
  isValidSelection(
    make: string,
    model: string,
    badge: string,
  ): Promise<boolean>;
}

interface LoadedVehicleData {
  catalog: VehicleCatalog;
  commonVehicles: readonly VehiclePreset[];
  index: Map<string, Map<string, Set<string>>>;
}

const VEHICLES_DATA_URL = new URL('../../data/vehicles.json', import.meta.url);
const COMMON_VEHICLES_DATA_URL = new URL(
  '../../data/common-vehicles.json',
  import.meta.url,
);

let vehicleDataPromise: Promise<LoadedVehicleData> | undefined;

function buildIndex(
  catalog: VehicleCatalog,
): Map<string, Map<string, Set<string>>> {
  return new Map(
    Object.entries(catalog).map(([make, models]) => [
      make,
      new Map(
        Object.entries(models).map(([model, badges]) => [
          model,
          new Set(badges),
        ]),
      ),
    ]),
  );
}

function validateCommonVehicles(
  commonVehicles: readonly VehiclePreset[],
  index: Map<string, Map<string, Set<string>>>,
): void {
  for (const { make, model, badge } of commonVehicles) {
    if (!index.get(make)?.get(model)?.has(badge)) {
      throw new Error(
        `Invalid common vehicle preset: ${make} ${model} ${badge} does not exist in vehicles catalog.`,
      );
    }
  }
}

function loadVehicleData(): Promise<LoadedVehicleData> {
  if (!vehicleDataPromise) {
    vehicleDataPromise = Promise.all([
      readFile(VEHICLES_DATA_URL, 'utf-8'),
      readFile(COMMON_VEHICLES_DATA_URL, 'utf-8'),
    ])
      .then(([rawCatalog, rawCommonVehicles]) => {
        const catalog = vehicleCatalogSchema.parse(JSON.parse(rawCatalog));
        const commonVehicles = commonVehiclesSchema.parse(
          JSON.parse(rawCommonVehicles),
        );
        const index = buildIndex(catalog);
        validateCommonVehicles(commonVehicles, index);
        return { catalog, commonVehicles, index };
      })
      .catch((err: unknown) => {
        vehicleDataPromise = undefined;
        throw err;
      });
  }
  return vehicleDataPromise;
}

/**
 * JSON-backed implementation of VehicleRepository.
 * Lazily reads, validates, and caches server/data/vehicles.json and
 * server/data/common-vehicles.json with a Map/Set lookup index, keeping routes
 * decoupled from the underlying data source.
 */
export const vehicleRepository: VehicleRepository = {
  async getCatalog(): Promise<VehicleCatalog> {
    const { catalog } = await loadVehicleData();
    return catalog;
  },

  async getCommonVehicles(): Promise<readonly VehiclePreset[]> {
    const { commonVehicles } = await loadVehicleData();
    return commonVehicles;
  },

  async isValidSelection(
    make: string,
    model: string,
    badge: string,
  ): Promise<boolean> {
    const { index } = await loadVehicleData();
    return index.get(make)?.get(model)?.has(badge) ?? false;
  },
};
