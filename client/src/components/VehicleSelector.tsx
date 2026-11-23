import type { ChangeEvent } from 'react';
import { formatMake } from '../utils/vehicle.ts';
import './VehicleSelector.css';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label: string;
  value: string;
  placeholder: string;
  options: SelectOption[];
  disabled?: boolean;
  onChange: (value: string) => void;
}

function SelectField({
  label,
  value,
  placeholder,
  options,
  disabled = false,
  onChange,
}: SelectFieldProps) {
  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    onChange(event.target.value);
  }

  return (
    <label className="vehicle-field">
      <span>{label}</span>
      <select
        value={value}
        onChange={handleChange}
        disabled={disabled}
        required
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

interface VehicleSelectorProps {
  makes: string[];
  models: string[];
  badges: string[];
  make: string;
  model: string;
  badge: string;
  onMakeChange: (make: string) => void;
  onModelChange: (model: string) => void;
  onBadgeChange: (badge: string) => void;
}

export function VehicleSelector({
  makes,
  models,
  badges,
  make,
  model,
  badge,
  onMakeChange,
  onModelChange,
  onBadgeChange,
}: VehicleSelectorProps) {
  return (
    <div className="vehicle-selector">
      <SelectField
        label="Make"
        value={make}
        placeholder="Select make..."
        options={makes.map((makeKey) => ({
          value: makeKey,
          label: formatMake(makeKey),
        }))}
        onChange={onMakeChange}
      />

      <SelectField
        label="Model"
        value={model}
        placeholder={make ? 'Select model...' : 'Select a make first'}
        options={models.map((modelName) => ({
          value: modelName,
          label: modelName,
        }))}
        disabled={!make}
        onChange={onModelChange}
      />

      <SelectField
        label="Badge"
        value={badge}
        placeholder={model ? 'Select badge...' : 'Select a model first'}
        options={badges.map((badgeName) => ({
          value: badgeName,
          label: badgeName,
        }))}
        disabled={!model}
        onChange={onBadgeChange}
      />
    </div>
  );
}
