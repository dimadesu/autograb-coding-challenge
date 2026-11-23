import { readFile } from 'node:fs/promises';

export type VehicleCatalog = Record<string, Record<string, readonly string[]>>;

export interface VehicleRepository {
  getCatalog(): Promise<VehicleCatalog>;
  isValidSelection(
    make: string,
    model: string,
    badge: string,
  ): Promise<boolean>;
}

const VEHICLES_DATA_URL = new URL('../../data/vehicles.json', import.meta.url);

function isVehicleCatalog(value: unknown): value is VehicleCatalog {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  return Object.values(value).every((models) => {
    if (
      typeof models !== 'object' ||
      models === null ||
      Array.isArray(models)
    ) {
      return false;
    }
    return Object.values(models).every(
      (badges) =>
        Array.isArray(badges) && badges.every((b) => typeof b === 'string'),
    );
  });
}

async function loadCatalog(): Promise<VehicleCatalog> {
  const raw = await readFile(VEHICLES_DATA_URL, 'utf-8');
  const parsed: unknown = JSON.parse(raw);
  if (!isVehicleCatalog(parsed)) {
    throw new Error('Invalid vehicle catalog JSON structure.');
  }
  return parsed;
}

/**
 * JSON-backed implementation of VehicleRepository.
 * Reads and parses server/data/vehicles.json on demand,
 * keeping routes decoupled from the underlying data source (e.g. a database).
 */
export const vehicleRepository: VehicleRepository = {
  getCatalog(): Promise<VehicleCatalog> {
    return loadCatalog();
  },

  async isValidSelection(
    make: string,
    model: string,
    badge: string,
  ): Promise<boolean> {
    if (!make || !model || !badge) {
      return false;
    }
    const catalog = await loadCatalog();
    const models = Object.hasOwn(catalog, make) ? catalog[make] : undefined;
    if (!models || !Object.hasOwn(models, model)) {
      return false;
    }
    const badges = models[model];
    return badges ? badges.includes(badge) : false;
  },
};
