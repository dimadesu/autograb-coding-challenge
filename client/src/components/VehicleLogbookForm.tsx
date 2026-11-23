import { useRef, useState, type FormEvent } from 'react';
import { submitLogbook } from '../api.ts';
import type {
  SubmissionResultData,
  VehicleCatalog,
  VehiclePreset,
} from '../types.ts';
import { ErrorAlert } from './ErrorAlert.tsx';
import { LogbookUpload } from './LogbookUpload.tsx';
import { QuickSelect } from './QuickSelect.tsx';
import { VehicleSelector } from './VehicleSelector.tsx';
import './VehicleLogbookForm.css';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const GENERIC_MIME_TYPES = new Set(['', 'application/octet-stream']);

function validateLogbookFile(file: File): string | null {
  const mime = (file.type || '').toLowerCase();
  if (!mime.startsWith('text/') && !GENERIC_MIME_TYPES.has(mime)) {
    return 'Please attach a plain text logbook file.';
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'Logbook file must be 5 MB or smaller.';
  }
  return null;
}

interface VehicleLogbookFormProps {
  vehicles: VehicleCatalog;
  commonVehicles: readonly VehiclePreset[];
  onResultChange: (result: SubmissionResultData | null) => void;
}

export function VehicleLogbookForm({
  vehicles,
  commonVehicles,
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

    setSubmitting(true);
    try {
      const data = await submitLogbook({ make, model, badge }, logbookFile);
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
          presets={commonVehicles}
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
          disabled={submitting}
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
