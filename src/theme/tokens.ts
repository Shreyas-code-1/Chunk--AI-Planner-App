/**
 * Design tokens, extracted from design/board.html.
 *
 * These are the board's exact values. Nothing here is rounded, harmonised or
 * "cleaned up" — the scale is uneven on purpose because the board is (12,
 * 11.5, 14.5, 13.5 and so on all appear). If a value looks wrong, the board is
 * the authority, not this file.
 *
 * Regenerate the readable board with `node scripts/extract-board.mjs`.
 */

export const colors = {
  /** Body copy, headings, and the stroke on every hard-edged element. */
  ink: '#3A2A20',
  /** The darker ink used at display sizes, e.g. the splash logo stroke. */
  inkDeep: '#211710',

  /**
   * Primary.
   *
   * The earlier board carried two near-identical oranges (`#F59332` for
   * surfaces, `#F5931F` for the highlight chip). This board has collapsed them
   * into one: the chip and the buttons are both `#FA7814`. `orangeChip` is
   * kept as a distinct name rather than deleted, because the chip is the one
   * place the two ever diverged and a future board may split them again — but
   * it is not a second colour today.
   */
  orange: '#FA7814',
  orangeChip: '#FA7814',
  orangeDeep: '#C65E06',
  orangeGradient: ['#FC9633', '#FA7814', '#E56C08'] as const,

  /** The hard bottom edge under a pressable. Not a blur — see shadows. */
  edgeBrown: '#6E4A28',
  /**
   * The pale edge under a focused field, on 2.18 and 2.19.
   *
   * TODO(design): **sampled from a screenshot, not extracted.** Those two
   * frames are not in the 19 Sep export, so this is the one colour here that
   * the board has not confirmed. Reconcile when 2.18/2.19 land in an export.
   */
  edgeOrangeSoft: '#FBDCBC',

  /** Surfaces. */
  page: '#FFFBF5',
  card: '#FFFFFF',
  cream: '#EFE1D2',
  creamDeep: '#E4D6C7',
  creamBorder: '#F0E4D6',
  /** Progress-bar and slider tracks. */
  track: '#F2E7DA',
  /** The pale border on the path-node and stats-strip containers. */
  creamPale: '#F5EADF',
  /** Fill of a locked path node. */
  locked: '#EFE4D8',
  /** The brown marker in the stats strip. Appears nowhere else. */
  statBrown: '#6B3F1E',
  /** Pale amber. The Bio chip's fill, reused for the all-time stat marker. */
  amber: '#FBE3C4',
  /** 2.13's "Type it in" well — the one teal on the board. */
  teal: '#E0EFEC',
  tealDeep: '#1E6F63',
  /** Unselected bar fill on 2.6 BEST TIME OF DAY and 2.7 YOUR WEEK. */
  barTrack: '#F7EEE4',
  /** The small tick inside a 2.7 day bar: light and normal. Busy uses white. */
  tickLight: '#E4D6C6',
  tickNormal: '#F0B877',

  /** Secondary text, in three steps. */
  muted: '#8A7A6E',
  mutedWarm: '#7A6A5E',
  mutedLight: '#B4A498',
  mutedLine: '#C3B4A8',

  /** 5.4 URGENT DEADLINE's red card, its edge, and the DO IT NOW label. */
  urgent: '#E2503C',
  urgentEdge: '#B33526',
  urgentDeep: '#C33B29',
  /** 5.6's SOMETHING WENT WRONG pill. */
  urgentSoft: '#FDE7E2',
  urgentBorder: '#F3C6BC',
  /** A locked badge on 5.2. */
  lockedSoft: '#F7F0E8',
  /** 5.1's dark TIME PER DAY card. */
  darkCard: '#3A2A20',

  success: '#2FB37A',
  successDeep: '#1E8659',
  successSoft: '#E6F7EE',

  /** 2.16 PAYWALL's own page background — the one cream that is not page. */
  paywallPage: '#FCF6DC',
  /** The softer edge under the paywall's unselected plan card. */
  edgeSand: '#EADBC8',
  /** Struck-through price on the paywall. */
  strike: '#B5A79A',
  /** Pro / paywall gold. */
  gold: '#FCCC36',
  goldEdge: '#CD9C05',

  /** Display type on the orange splash. */
  onOrange: '#FFF6E6',
  /** The edge under a dark button, and the splash logo's drop shadow. */
  edgeInk: '#1F1610',
  white: '#FFFFFF',
} as const;

/**
 * Subject chips.
 *
 * Four named subjects plus a neutral. The neutral is not invented — the board
 * draws it on the "Che" chip, which is what an unrecognised class gets.
 */
export const subjectChips = {
  bio: { background: colors.amber, text: colors.orangeDeep },
  alg: { background: '#E4EDFF', text: '#33509E' },
  eng: { background: '#E6F7EE', text: '#1E8659' },
  his: { background: '#FDE7E3', text: '#C33B29' },
  neutral: { background: '#F5EDE4', text: '#B4A498' },
} as const;

export type SubjectKey = keyof typeof subjectChips;

/**
 * Fonts.
 *
 * Baloo 2 for display and titles, Nunito for body and labels. Note the weight
 * ranges differ: the board uses Baloo 2 at 700 and 800 only, and Nunito up to
 * 900 — Baloo 2 has no 900, so a 900 in the board is always Nunito.
 */
export const fonts = {
  display: {
    bold: 'Baloo2_700Bold',
    extraBold: 'Baloo2_800ExtraBold',
    semiBold: 'Baloo2_600SemiBold',
    regular: 'Baloo2_400Regular',
  },
  body: {
    regular: 'Nunito_400Regular',
    semiBold: 'Nunito_600SemiBold',
    bold: 'Nunito_700Bold',
    extraBold: 'Nunito_800ExtraBold',
    black: 'Nunito_900Black',
  },
} as const;

/**
 * Corner radii, exactly the set the board uses.
 *
 * `device` is the 390x844 phone frame on the board, not an app surface — it
 * should never appear in a screen.
 */
export const radii = {
  xs: 5,
  sm: 7,
  md: 14,
  mdAlt: 15,
  lg: 16,
  xl: 20,
  xxl: 22,
  chip: 26,
  device: 46,
  pill: 999,
} as const;

/**
 * Shadows. Two kinds, and conflating them is the fastest way to make this app
 * look wrong.
 *
 * `hardEdge` is a solid offset with no blur — the chunky bottom edge under
 * buttons and chips. In iOS terms that is shadowRadius 0 and shadowOpacity 1.
 * `elevation` is an ordinary soft shadow used under cards and phone frames.
 */
/**
 * A chosen onboarding option: solid orange with the 3px ink border, as drawn
 * on 2.8 and 2.9. Every onboarding choice uses this (decision log, 22 Sep).
 */
export const selectedOption = {
  backgroundColor: colors.orange,
  borderWidth: 3,
  borderColor: colors.ink,
} as const;

export const shadows = {
  hardEdge: (offset: number, color: string = colors.edgeBrown) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: offset },
    shadowOpacity: 1,
    shadowRadius: 0,
  }),
  elevation: {
    shadowColor: '#784614',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.14,
    shadowRadius: 56,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
} as const;

/**
 * Press feedback (brief §7a): scale down and compress the hard bottom edge on
 * press-in, release on press-out. Fast — the haptic fires at the same instant.
 */
export const press = {
  scale: 0.97,
  inMs: 100,
  outMs: 150,
} as const;

/**
 * Line height for Baloo 2 display text.
 *
 * The board's headings carry line-heights of roughly 1.1 to 1.16. CSS lets a
 * glyph overflow its line box harmlessly, so those look right on the board.
 * React Native does not reflow around an overflowing glyph — it simply draws
 * over whatever is next to it. Baloo 2 needs about 1.5em of ascent plus
 * descent, so a 1.15em box leaks roughly a fifth of the glyph out of each end.
 * On 2.10 that put "1 hr 30" straight through the label above it, and pushed
 * the three-line heading into itself.
 *
 * The board's ratio is kept wherever it is already safe and floored where it
 * is not. This is a rendering correction, not a design change: the type size,
 * face and weight are untouched.
 */
/**
 * Baloo 2 needs roughly 1.35em of ascent plus descent. 1.4 clears that with a
 * little room, which is why the floor sits there rather than at the board's
 * ratios. One number — raise it if anything still collides on a device.
 */
export const DISPLAY_LINE_FLOOR = 1.4;

export function displayLine(fontSize: number, boardRatio: number): number {
  return fontSize * Math.max(boardRatio, DISPLAY_LINE_FLOOR);
}
