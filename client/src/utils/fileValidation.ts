export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const GENERIC_MIME_TYPES = new Set(['', 'application/octet-stream']);

export function isAllowedPlainTextFile(file: File): boolean {
  const mime = (file.type || '').toLowerCase();
  return mime.startsWith('text/') || GENERIC_MIME_TYPES.has(mime);
}

export function validateLogbookFile(file: File): string | null {
  if (!isAllowedPlainTextFile(file)) {
    return 'Please attach a plain text logbook file.';
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'Logbook file must be 5 MB or smaller.';
  }
  return null;
}
