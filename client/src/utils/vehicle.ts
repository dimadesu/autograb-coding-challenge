const MAKE_LABEL_OVERRIDES: Record<string, string> = {
  bmw: 'BMW',
};

export function formatMake(make: string): string {
  const label = Object.hasOwn(MAKE_LABEL_OVERRIDES, make)
    ? MAKE_LABEL_OVERRIDES[make]
    : undefined;
  if (label !== undefined) {
    return label;
  }
  return make.charAt(0).toUpperCase() + make.slice(1);
}
