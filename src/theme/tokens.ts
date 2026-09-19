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

  /** Primary. Two near-identical oranges both appear on the board. */
  orange: '#F59332',
  orangeChip: '#F5931F',
  orangeDeep: '#C96A12',
  orangeGradient: ['#F9A94E', '#F59332', '#DE7A17'] as const,

  /** The hard bottom edge under a pressable. Not a blur — see shadows. */
  edgeBrown: '#6E4A28',

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

  /** Secondary text, in three steps. */
  muted: '#8A7A6E',
  mutedWarm: '#7A6A5E',
  mutedLight: '#B4A498',
  mutedLine: '#C3B4A8',

  success: '#2FB37A',
  successDeep: '#1E8659',
  successSoft: '#E6F7EE',

  /** Pro / paywall gold. */
  gold: '#FFC93C',
  goldEdge: '#C99508',

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
