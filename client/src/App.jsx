import { useState } from 'react';

const DROPDOWN_1_OPTIONS = ['Option 1A', 'Option 1B', 'Option 1C'];
const DROPDOWN_2_OPTIONS = ['Option 2A', 'Option 2B', 'Option 2C'];
const DROPDOWN_3_OPTIONS = ['Option 3A', 'Option 3B', 'Option 3C'];

export default function App() {
  const [dropdown1, setDropdown1] = useState('');
  const [dropdown2, setDropdown2] = useState('');
  const [dropdown3, setDropdown3] = useState('');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setResult(null);

    if (!dropdown1 || !dropdown2 || !dropdown3 || !file) {
      setError('Please select all three options and attach a file.');
      return;
    }

    const formData = new FormData();
    formData.append('dropdown1', dropdown1);
    formData.append('dropdown2', dropdown2);
    formData.append('dropdown3', dropdown3);
    formData.append('file', file);

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
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="container">
      <h1>Submit Form</h1>

      <form className="form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Dropdown 1</span>
          <select
            value={dropdown1}
            onChange={(e) => setDropdown1(e.target.value)}
            required
          >
            <option value="">Select an option...</option>
            {DROPDOWN_1_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Dropdown 2</span>
          <select
            value={dropdown2}
            onChange={(e) => setDropdown2(e.target.value)}
            required
          >
            <option value="">Select an option...</option>
            {DROPDOWN_2_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Dropdown 3</span>
          <select
            value={dropdown3}
            onChange={(e) => setDropdown3(e.target.value)}
            required
          >
            <option value="">Select an option...</option>
            {DROPDOWN_3_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Attachment</span>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            required
          />
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>

      {error && (
        <div className="alert error" role="alert">
          {error}
        </div>
      )}

      {result && (
        <section className="alert success">
          <h2>Response</h2>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </section>
      )}
    </main>
  );
}
