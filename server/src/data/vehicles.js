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
};

export function isValidVehicleSelection(make, model, badge) {
  if (!make || !model || !badge) {
    return false;
  }
  const models = Object.hasOwn(VEHICLES, make) ? VEHICLES[make] : null;
  if (!models || !Object.hasOwn(models, model)) {
    return false;
  }
  return models[model].includes(badge);
}
