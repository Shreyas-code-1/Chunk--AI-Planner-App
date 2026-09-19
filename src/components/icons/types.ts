/**
 * Shared shape for every icon.
 *
 * `strokeWidth` is a prop with a per-icon default rather than a constant,
 * because the board genuinely varies it — the check mark alone appears at
 * 3.2, 3.4 and 3.6 depending on the size it is drawn at. Normalising those
 * would be a visual change, so callers pass the board's value when it differs
 * from the default.
 */

export type IconProps = {
  /** Rendered square size in points. The board uses 16, 18, 20, 22 and 24. */
  size?: number;
  /** Stroke colour. Icons are monochrome and inherit from their context. */
  color?: string;
  strokeWidth?: number;
};
