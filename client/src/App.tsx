import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';

type VehicleCatalog = Record<string, Record<string, string[]>>;

interface SubmissionResult {
  make: string;
  model: string;
  badge: string;
  logbook: {
    fileName: string;
    mimeType?: string;
    size: number;
    content: string;
  };
}

interface ErrorPayload {
  error?: string;
}

interface VehiclePreset {
  make: string;
  model: string;
  badge: string;
}

const COMMON_VEHICLES: readonly VehiclePreset[] = [
  { make: 'ford', model: 'Ranger', badge: 'Raptor' },
  { make: 'tesla', model: 'Model 3', badge: 'Performance' },
  { make: 'bmw', model: '130d', badge: 'xDrive 26d' },
];

const MAKE_LABELS: Record<string, string> = {
  ford: 'Ford',
  bmw: 'BMW',
  tesla: 'Tesla',
};

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TEXT_EXTENSIONS = new Set(['.txt', '.log', '.md', '.csv', '']);
const GENERIC_MIME_TYPES = new Set(['', 'application/octet-stream']);

function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot <= 0) {
    return '';
  }
  return fileName.slice(lastDot).toLowerCase();
}

function isAllowedPlainTextFile(file: File): boolean {
  const mime = (file.type || '').toLowerCase();
  if (mime.startsWith('text/')) {
    return true;
  }
  const ext = getFileExtension(file.name);
  return GENERIC_MIME_TYPES.has(mime) && ALLOWED_TEXT_EXTENSIONS.has(ext);
}

function formatMake(make: string): string {
  const label = Object.hasOwn(MAKE_LABELS, make)
    ? MAKE_LABELS[make]
    : undefined;
  if (label !== undefined) {
    return label;
  }
  return make.charAt(0).toUpperCase() + make.slice(1);
}

export default function App() {
  const [vehicles, setVehicles] = useState<VehicleCatalog | null>(null);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [badge, setBadge] = useState('');
  const [logbookFile, setLogbookFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmissionResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchVehicles() {
      setLoadingVehicles(true);
      setLoadError(null);
      try {
        const response = await fetch('/api/vehicles', {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Failed to load vehicles (${response.status})`);
        }
        const data = (await response.json()) as VehicleCatalog;
        setVehicles(data);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        setLoadError(
          err instanceof Error && err.message
            ? err.message
            : 'Unable to load vehicle options.',
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoadingVehicles(false);
        }
      }
    }

    void fetchVehicles();
    return () => controller.abort();
  }, [reloadTick]);

  const makes = vehicles ? Object.keys(vehicles) : [];
  const models = make && vehicles?.[make] ? Object.keys(vehicles[make]) : [];
  const badges =
    make && model && vehicles?.[make]?.[model] ? vehicles[make][model] : [];
  const availablePresets = COMMON_VEHICLES.filter((preset) =>
    vehicles?.[preset.make]?.[preset.model]?.includes(preset.badge),
  );

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
    setResult(null);
  }

  function handleMakeChange(event: ChangeEvent<HTMLSelectElement>) {
    setMake(event.target.value);
    setModel('');
    setBadge('');
    clearFileSelection();
    setSubmitError(null);
    setResult(null);
  }

  function handleModelChange(event: ChangeEvent<HTMLSelectElement>) {
    setModel(event.target.value);
    setBadge('');
    clearFileSelection();
    setSubmitError(null);
    setResult(null);
  }

  function handleBadgeChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextBadge = event.target.value;
    setBadge(nextBadge);
    if (!nextBadge) {
      clearFileSelection();
    }
    setSubmitError(null);
    setResult(null);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    setSubmitError(null);
    setResult(null);

    if (selected) {
      if (!isAllowedPlainTextFile(selected)) {
        clearFileSelection();
        setSubmitError('Please attach a plain text logbook file.');
        return;
      }
      if (selected.size > MAX_FILE_SIZE_BYTES) {
        clearFileSelection();
        setSubmitError('Logbook file must be 5 MB or smaller.');
        return;
      }
    }

    setLogbookFile(selected);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setResult(null);

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
      const data = (await response.json()) as SubmissionResult & ErrorPayload;
      if (!response.ok) {
        throw new Error(data.error || 'Submission failed.');
      }
      setResult(data);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="container">
      <h1>Vehicle Service Logbook</h1>
      <p className="subtitle">
        Select your vehicle&apos;s make, model, and badge, then upload your
        service logbook.
      </p>

      {loadingVehicles && <p className="status">Loading vehicle options...</p>}

      {loadError && (
        <div className="alert error" role="alert">
          <p>{loadError}</p>
          <button
            type="button"
            className="secondary-btn"
            onClick={() => setReloadTick((n) => n + 1)}
          >
            Retry
          </button>
        </div>
      )}

      {!loadingVehicles && !loadError && vehicles && (
        <form className="form" onSubmit={handleSubmit}>
          {availablePresets.length > 0 && (
            <div
              className="quick-select"
              role="group"
              aria-label="Quick select common vehicles"
            >
              <span className="quick-select-label">Quick select</span>
              <div className="quick-select-buttons">
                {availablePresets.map((preset) => {
                  const isSelected =
                    make === preset.make &&
                    model === preset.model &&
                    badge === preset.badge;
                  const label = `${formatMake(preset.make)} ${preset.model} ${preset.badge}`;
                  return (
                    <button
                      key={`${preset.make}-${preset.model}-${preset.badge}`}
                      type="button"
                      className={`quick-select-btn${isSelected ? ' active' : ''}`}
                      aria-pressed={isSelected}
                      disabled={submitting}
                      onClick={() => handleQuickSelect(preset)}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <label className="field">
            <span>Make</span>
            <select value={make} onChange={handleMakeChange} required>
              <option value="">Select make...</option>
              {makes.map((makeKey) => (
                <option key={makeKey} value={makeKey}>
                  {formatMake(makeKey)}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Model</span>
            <select
              value={model}
              onChange={handleModelChange}
              disabled={!make}
              required
            >
              <option value="">
                {make ? 'Select model...' : 'Select a make first'}
              </option>
              {models.map((modelName) => (
                <option key={modelName} value={modelName}>
                  {modelName}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Badge</span>
            <select
              value={badge}
              onChange={handleBadgeChange}
              disabled={!model}
              required
            >
              <option value="">
                {model ? 'Select badge...' : 'Select a model first'}
              </option>
              {badges.map((badgeName) => (
                <option key={badgeName} value={badgeName}>
                  {badgeName}
                </option>
              ))}
            </select>
          </label>

          {badge && (
            <div className="upload-section">
              <label className="field">
                <span>Service Logbook (plain text)</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="text/plain,.txt,.log"
                  onChange={handleFileChange}
                  required
                />
              </label>

              <button type="submit" disabled={submitting || !logbookFile}>
                {submitting ? 'Uploading...' : 'Submit'}
              </button>
            </div>
          )}
        </form>
      )}

      {submitError && (
        <div className="alert error" role="alert">
          {submitError}
        </div>
      )}

      {result && (
        <section className="alert success" aria-live="polite">
          <h2>Submission Received</h2>
          <dl className="summary">
            <div>
              <dt>Make</dt>
              <dd>{formatMake(result.make)}</dd>
            </div>
            <div>
              <dt>Model</dt>
              <dd>{result.model}</dd>
            </div>
            <div>
              <dt>Badge</dt>
              <dd>{result.badge}</dd>
            </div>
            <div>
              <dt>Logbook File</dt>
              <dd>
                {result.logbook.fileName} ({result.logbook.size} bytes)
              </dd>
            </div>
          </dl>
          <h3>Logbook Contents</h3>
          <pre className="logbook-content">
            {result.logbook.content.length > 0
              ? result.logbook.content
              : '(Empty file)'}
          </pre>
        </section>
      )}
    </main>
  );
}
