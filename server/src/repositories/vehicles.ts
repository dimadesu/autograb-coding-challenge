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

interface LoadedCatalog {
  catalog: VehicleCatalog;
  index: Map<string, Map<string, Set<string>>>;
}

const VEHICLES_DATA_URL = new URL('../../data/vehicles.json', import.meta.url);

let catalogPromise: Promise<LoadedCatalog> | undefined;

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

function loadCatalog(): Promise<LoadedCatalog> {
  if (!catalogPromise) {
    catalogPromise = readFile(VEHICLES_DATA_URL, 'utf-8')
      .then((raw) => {
        const catalog = vehicleCatalogSchema.parse(JSON.parse(raw));
        return { catalog, index: buildIndex(catalog) };
      })
      .catch((err: unknown) => {
        catalogPromise = undefined;
        throw err;
      });
  }
  return catalogPromise;
}

/**
 * JSON-backed implementation of VehicleRepository.
 * Lazily reads, parses, and caches server/data/vehicles.json with a Map/Set
 * lookup index, keeping routes decoupled from the underlying data source.
 */
export const vehicleRepository: VehicleRepository = {
  async getCatalog(): Promise<VehicleCatalog> {
    const { catalog } = await loadCatalog();
    return catalog;
  },

  async isValidSelection(
    make: string,
    model: string,
    badge: string,
  ): Promise<boolean> {
    const { index } = await loadCatalog();
    return index.get(make)?.get(model)?.has(badge) ?? false;
  },
};
