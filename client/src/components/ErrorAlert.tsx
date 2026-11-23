import './ErrorAlert.css';

interface ErrorAlertProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorAlert({
  message,
  onRetry,
  retryLabel = 'Retry',
}: ErrorAlertProps) {
  return (
    <div className="error-alert" role="alert">
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="error-alert-retry" onClick={onRetry}>
          {retryLabel}
        </button>
      )}
    </div>
  );
}
