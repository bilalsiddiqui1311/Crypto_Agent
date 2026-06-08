export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function average(values) {
  const valid = values.filter(Number.isFinite);
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : 0;
}
