const INVALID_CHARS_REGEX = /[^a-zA-Z0-9._-]/g;

export function sanitizeFileName(name: string | null | undefined): string {
  if (!name) {
    return 'file';
  }

  const trimmed = name.trim();
  if (!trimmed) {
    return 'file';
  }

  const withoutInvalid = trimmed.replace(INVALID_CHARS_REGEX, '_');
  const collapsed = withoutInvalid.replace(/_{2,}/g, '_');
  const withoutLeadingDots = collapsed.replace(/^\.+/, '');
  const sanitized = withoutLeadingDots.slice(0, 100);
  return sanitized || 'file';
}
