import { readFile } from 'node:fs/promises';
import { z } from 'zod';

const vehicleCatalogSchema = z.record(
  z.string(),
  z.record(z.string(), z.array(z.string()).readonly()),
);

export type VehicleCatalog = z.infer<typeof vehicleCatalogSchema>;

export interface VehicleRepository {
  getCatalog(): Promise<VehicleCatalog>;
  isValidSelection(
    make: string,
    model: string,
    badge: string,
  ): Promise<boolean>;
}

const VEHICLES_DATA_URL = new URL('../../data/vehicles.json', import.meta.url);

async function loadCatalog(): Promise<VehicleCatalog> {
  const raw = await readFile(VEHICLES_DATA_URL, 'utf-8');
  return vehicleCatalogSchema.parse(JSON.parse(raw));
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
