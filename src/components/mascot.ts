/**
 * Mascot art, by screen.
 *
 * The board pairs a different pose with each screen — the mascot is not one
 * image — so screens ask for their screen, not for "the mascot". The files
 * live in design/mascot/ and are required straight from there rather than
 * copied into src/: a second copy of a final asset is the exact failure mode
 * that produced the wrong mascot art once already (docs/decision-log.md).
 *
 * Poses are added as their screens are built; the mapping for all 21 is in
 * design/mascot/README.md.
 */

export const mascot = {
  /** 2.1 SPLASH — the full-body pose under the logo. */
  splash: require('../../design/mascot/02-mascot.png'),
  /** 2.2 WELCOME — the waving pose, and the mascot proper. */
  waving: require('../../design/mascot/00-mascot-waving.png'),
  /** 2.3 GOALS — the small bust beside the speech bubble. */
  goals: require('../../design/mascot/03-mascot.png'),
  /** 2.4 NAME + GRADE. */
  name: require('../../design/mascot/04-mascot.png'),
} as const;

export type MascotPose = keyof typeof mascot;
