export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TEXT_EXTENSIONS = new Set(['.txt', '.log', '.md', '.csv', '']);
const GENERIC_MIME_TYPES = new Set(['', 'application/octet-stream']);

export function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot <= 0) {
    return '';
  }
  return fileName.slice(lastDot).toLowerCase();
}

export function isAllowedPlainTextFile(file: File): boolean {
  const mime = (file.type || '').toLowerCase();
  if (mime.startsWith('text/')) {
    return true;
  }
  const ext = getFileExtension(file.name);
  return GENERIC_MIME_TYPES.has(mime) && ALLOWED_TEXT_EXTENSIONS.has(ext);
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
