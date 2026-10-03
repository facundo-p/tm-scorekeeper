// Half-even ("banker's") rounding, the same rule Python's round() applies to
// floats, so every number the mockup derives matches the backend (D-06).
export function roundHalfEven(x) {
  const floor = Math.floor(x);
  const diff = x - floor;
  if (diff > 0.5) return floor + 1;
  if (diff < 0.5) return floor;
  return floor % 2 === 0 ? floor : floor + 1;
}

// One-decimal variant: round_half_even(x * 10) / 10, as the backend does.
export const roundHalfEven1 = (x) => roundHalfEven(x * 10) / 10;
