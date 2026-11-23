import { useEffect, useRef, useState } from 'react';

const MAKE_LABELS = {
  ford: 'Ford',
  bmw: 'BMW',
  tesla: 'Tesla',
};

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TEXT_EXTENSIONS = new Set(['.txt', '.log', '.md', '.csv', '']);
const GENERIC_MIME_TYPES = new Set(['', 'application/octet-stream']);

function getFileExtension(fileName) {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot <= 0) {
    return '';
  }
  return fileName.slice(lastDot).toLowerCase();
}

function isAllowedPlainTextFile(file) {
  const mime = (file.type || '').toLowerCase();
  if (mime.startsWith('text/')) {
    return true;
  }
  const ext = getFileExtension(file.name);
  return GENERIC_MIME_TYPES.has(mime) && ALLOWED_TEXT_EXTENSIONS.has(ext);
}

function formatMake(make) {
  if (Object.hasOwn(MAKE_LABELS, make)) {
    return MAKE_LABELS[make];
  }
  return make.charAt(0).toUpperCase() + make.slice(1);
}

export default function App() {
  const [vehicles, setVehicles] = useState(null);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [reloadTick, setReloadTick] = useState(0);

  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [badge, setBadge] = useState('');
  const [logbookFile, setLogbookFile] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [result, setResult] = useState(null);

  const fileInputRef = useRef(null);

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
        const data = await response.json();
        setVehicles(data);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setLoadError(err.message || 'Unable to load vehicle options.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingVehicles(false);
        }
      }
    }

    fetchVehicles();
    return () => controller.abort();
  }, [reloadTick]);

  const makes = vehicles ? Object.keys(vehicles) : [];
  const models = make && vehicles?.[make] ? Object.keys(vehicles[make]) : [];
  const badges =
    make && model && vehicles?.[make]?.[model] ? vehicles[make][model] : [];

  function clearFileSelection() {
    setLogbookFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function handleMakeChange(event) {
    setMake(event.target.value);
    setModel('');
    setBadge('');
    clearFileSelection();
    setSubmitError(null);
    setResult(null);
  }

  function handleModelChange(event) {
    setModel(event.target.value);
    setBadge('');
    clearFileSelection();
    setSubmitError(null);
    setResult(null);
  }

  function handleBadgeChange(event) {
    const nextBadge = event.target.value;
    setBadge(nextBadge);
    if (!nextBadge) {
      clearFileSelection();
    }
    setSubmitError(null);
    setResult(null);
  }

  function handleFileChange(event) {
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

  async function handleSubmit(event) {
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
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Submission failed.');
      }
      setResult(data);
    } catch (err) {
      setSubmitError(err.message);
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
