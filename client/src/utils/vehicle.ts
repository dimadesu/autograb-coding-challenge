import type { VehicleCatalog, VehiclePreset } from '../types.ts';

export const COMMON_VEHICLES: readonly VehiclePreset[] = [
  { make: 'ford', model: 'Ranger', badge: 'Raptor' },
  { make: 'tesla', model: 'Model 3', badge: 'Performance' },
  { make: 'bmw', model: '130d', badge: 'xDrive 26d' },
];

const MAKE_LABEL_OVERRIDES: Record<string, string> = {
  bmw: 'BMW',
};

export function formatMake(make: string): string {
  const label = Object.hasOwn(MAKE_LABEL_OVERRIDES, make)
    ? MAKE_LABEL_OVERRIDES[make]
    : undefined;
  if (label !== undefined) {
    return label;
  }
  return make.charAt(0).toUpperCase() + make.slice(1);
}

export function getAvailablePresets(vehicles: VehicleCatalog): VehiclePreset[] {
  return COMMON_VEHICLES.filter((preset) =>
    vehicles[preset.make]?.[preset.model]?.includes(preset.badge),
  );
}
