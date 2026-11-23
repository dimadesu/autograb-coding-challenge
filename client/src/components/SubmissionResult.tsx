import type { SubmissionResultData } from '../types.ts';
import { formatMake } from '../utils/formatMake.ts';
import './SubmissionResult.css';

interface SubmissionResultProps {
  result: SubmissionResultData;
}

export function SubmissionResult({ result }: SubmissionResultProps) {
  return (
    <section className="submission-result" aria-live="polite">
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
  );
}
