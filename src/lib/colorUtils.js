/**
 * Utilities for normalizing, expanding, and validating hexadecimal color codes.
 */

/**
 * Normalizes a hex string:
 * - Trims whitespace
 * - Prepends '#' if missing
 * - Accepts 3-digit shorthand (#RGB) and expands to 6-digit (#RRGGBB)
 * - Validates format
 * - Returns normalized '#rrggbb' in lowercase or null if invalid
 */
export function normalizeHex(hex) {
  if (!hex || typeof hex !== 'string') return null;
  const trimmed = hex.trim();
  if (!trimmed) return null;

  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;

  // 6-digit hex: #RRGGBB
  if (/^#[0-9a-fA-F]{6}$/.test(withHash)) {
    return withHash.toLowerCase();
  }

  // 3-digit hex: #RGB -> expand to #RRGGBB
  if (/^#[0-9a-fA-F]{3}$/.test(withHash)) {
    const r = withHash[1];
    const g = withHash[2];
    const b = withHash[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }

  return null;
}

/**
 * Returns true if hex is a valid #RGB or #RRGGBB string.
 */
export function isValidHex(hex) {
  return normalizeHex(hex) !== null;
}

/**
 * Validates an array of color objects: [{ name, hex, image? }]
 * Expands any #RGB shorthand to #RRGGBB in place.
 * Throws an Error with a clear message if any color hex is invalid.
 */
export function validateProductColors(colors) {
  if (!Array.isArray(colors) || colors.length === 0) return;

  for (const c of colors) {
    if (!c) continue;
    const name = c.name || 'Unnamed';
    const norm = normalizeHex(c.hex);
    if (!norm) {
      throw new Error(`Color "${name}" has invalid hex code "${c.hex}". Please provide a valid #RGB or #RRGGBB color code.`);
    }
    c.hex = norm;
  }
}
