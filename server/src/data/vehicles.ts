export type VehicleCatalog = Record<string, Record<string, readonly string[]>>;

export const VEHICLES = {
  ford: {
    Ranger: ['Raptor', 'Raptor X', 'Wildtrak'],
    Falcon: ['XR6', 'XR6 Turbo', 'XR8'],
    'Falcon Ute': ['XR6', 'XR6 Turbo'],
  },
  bmw: {
    '130d': ['xDrive 26d', 'xDrive 30d'],
    '240i': ['xDrive 30d', 'xDrive 50d'],
    '320e': ['xDrive 75d', 'xDrive 80d', 'xDrive 85d'],
  },
  tesla: {
    'Model 3': ['Performance', 'Long Range', 'Dual Motor'],
  },
} as const satisfies VehicleCatalog;

export function isValidVehicleSelection(
  make: string,
  model: string,
  badge: string,
): boolean {
  if (!make || !model || !badge) {
    return false;
  }
  const catalog: VehicleCatalog = VEHICLES;
  const models = Object.hasOwn(catalog, make) ? catalog[make] : undefined;
  if (!models || !Object.hasOwn(models, model)) {
    return false;
  }
  const badges = models[model];
  return badges ? badges.includes(badge) : false;
}
