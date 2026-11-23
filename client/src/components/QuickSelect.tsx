import type { VehiclePreset, VehicleSelection } from '../types.ts';
import { formatMake } from '../utils/vehicle.ts';
import './QuickSelect.css';

interface QuickSelectProps {
  presets: readonly VehiclePreset[];
  selected: VehicleSelection;
  disabled?: boolean;
  onSelect: (preset: VehiclePreset) => void;
}

export function QuickSelect({
  presets,
  selected,
  disabled = false,
  onSelect,
}: QuickSelectProps) {
  if (presets.length === 0) {
    return null;
  }

  return (
    <div
      className="quick-select"
      role="group"
      aria-label="Quick select common vehicles"
    >
      <span className="quick-select-label">Quick select</span>
      <div className="quick-select-buttons">
        {presets.map((preset) => {
          const isSelected =
            selected.make === preset.make &&
            selected.model === preset.model &&
            selected.badge === preset.badge;
          const label = `${formatMake(preset.make)} ${preset.model} ${preset.badge}`;
          return (
            <button
              key={`${preset.make}-${preset.model}-${preset.badge}`}
              type="button"
              className={`quick-select-btn${isSelected ? ' active' : ''}`}
              aria-pressed={isSelected}
              disabled={disabled}
              onClick={() => onSelect(preset)}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
