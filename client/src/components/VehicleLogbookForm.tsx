import { useRef, useState, type FormEvent } from 'react';
import type {
  ErrorPayload,
  SubmissionResultData,
  VehicleCatalog,
  VehiclePreset,
} from '../types.ts';
import { validateLogbookFile } from '../utils/fileValidation.ts';
import { getAvailablePresets } from '../utils/vehicle.ts';
import { ErrorAlert } from './ErrorAlert.tsx';
import { LogbookUpload } from './LogbookUpload.tsx';
import { QuickSelect } from './QuickSelect.tsx';
import { VehicleSelector } from './VehicleSelector.tsx';
import './VehicleLogbookForm.css';

interface VehicleLogbookFormProps {
  vehicles: VehicleCatalog;
  onResultChange: (result: SubmissionResultData | null) => void;
}

export function VehicleLogbookForm({
  vehicles,
  onResultChange,
}: VehicleLogbookFormProps) {
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [badge, setBadge] = useState('');
  const [logbookFile, setLogbookFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const makes = Object.keys(vehicles);
  const models = make && vehicles[make] ? Object.keys(vehicles[make]) : [];
  const badges =
    make && model && vehicles[make]?.[model] ? vehicles[make][model] : [];
  const availablePresets = getAvailablePresets(vehicles);

  function clearFileSelection() {
    setLogbookFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function handleQuickSelect(preset: VehiclePreset) {
    const isSameVehicle =
      make === preset.make && model === preset.model && badge === preset.badge;
    if (!isSameVehicle) {
      clearFileSelection();
    }
    setMake(preset.make);
    setModel(preset.model);
    setBadge(preset.badge);
    setSubmitError(null);
    onResultChange(null);
  }

  function handleMakeChange(nextMake: string) {
    setMake(nextMake);
    setModel('');
    setBadge('');
    clearFileSelection();
    setSubmitError(null);
    onResultChange(null);
  }

  function handleModelChange(nextModel: string) {
    setModel(nextModel);
    setBadge('');
    clearFileSelection();
    setSubmitError(null);
    onResultChange(null);
  }

  function handleBadgeChange(nextBadge: string) {
    setBadge(nextBadge);
    if (!nextBadge) {
      clearFileSelection();
    }
    setSubmitError(null);
    onResultChange(null);
  }

  function handleFileChange(selected: File | null) {
    setSubmitError(null);
    onResultChange(null);

    if (selected) {
      const validationError = validateLogbookFile(selected);
      if (validationError) {
        clearFileSelection();
        setSubmitError(validationError);
        return;
      }
    }

    setLogbookFile(selected);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    onResultChange(null);

    if (!make || !model || !badge) {
      setSubmitError('Please select a make, model, and badge.');
      return;
    }

    if (!logbookFile) {
      setSubmitError('Please attach your service logbook (plain text file).');
      return;
    }

    const formData = new FormData();
    formData.append('make', make);
    formData.append('model', model);
    formData.append('badge', badge);
    formData.append('logbook', logbookFile);

    setSubmitting(true);
    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        body: formData,
      });
      const data = (await response.json()) as SubmissionResultData &
        ErrorPayload;
      if (!response.ok) {
        throw new Error(data.error || 'Submission failed.');
      }
      onResultChange(data);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <form className="form" onSubmit={handleSubmit}>
        <QuickSelect
          presets={availablePresets}
          selected={{ make, model, badge }}
          disabled={submitting}
          onSelect={handleQuickSelect}
        />

        <VehicleSelector
          makes={makes}
          models={models}
          badges={badges}
          make={make}
          model={model}
          badge={badge}
          onMakeChange={handleMakeChange}
          onModelChange={handleModelChange}
          onBadgeChange={handleBadgeChange}
        />

        {badge && (
          <LogbookUpload
            fileInputRef={fileInputRef}
            canSubmit={Boolean(logbookFile)}
            submitting={submitting}
            onFileChange={handleFileChange}
          />
        )}
      </form>

      {submitError && <ErrorAlert message={submitError} />}
    </>
  );
}
