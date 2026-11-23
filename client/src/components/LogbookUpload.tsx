import type { ChangeEvent, RefObject } from 'react';
import { Button } from './Button.tsx';
import './LogbookUpload.css';

interface LogbookUploadProps {
  fileInputRef: RefObject<HTMLInputElement | null>;
  canSubmit: boolean;
  submitting: boolean;
  onFileChange: (file: File | null) => void;
}

export function LogbookUpload({
  fileInputRef,
  canSubmit,
  submitting,
  onFileChange,
}: LogbookUploadProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onFileChange(event.target.files?.[0] ?? null);
  }

  return (
    <div className="upload-section">
      <label className="upload-field">
        <span>Service Logbook (plain text)</span>
        <input
          ref={fileInputRef}
          type="file"
          disabled={submitting}
          onChange={handleChange}
          required
        />
      </label>

      <Button type="submit" disabled={submitting || !canSubmit}>
        {submitting ? 'Uploading...' : 'Submit'}
      </Button>
    </div>
  );
}
