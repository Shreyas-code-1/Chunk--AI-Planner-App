/**
 * Icons, traced from design/board.html.
 *
 * The board contains 65 SVG elements but only **20 distinct icons** — it
 * reuses them heavily. Each is its own component so a single icon can be
 * corrected without touching the others.
 *
 * No icon library. Stroke widths are the board's, per icon, and are passed
 * rather than normalised: the check mark appears at 3.2, 3.4 and 3.6 depending
 * on the size it is drawn at, and those are not interchangeable.
 */

export type { IconProps } from './types';

export { ArrowRight } from './ArrowRight';
export { Bell } from './Bell';
export { BellQuiet } from './BellQuiet';
export { Blocks } from './Blocks';
export { Clock } from './Clock';
export { Waves } from './Waves';
export { Calendar } from './Calendar';
export { Camera } from './Camera';
export { Check } from './Check';
export { ChevronLeft } from './ChevronLeft';
export { ChevronRight } from './ChevronRight';
export { Close } from './Close';
export { Home } from './Home';
export { Info } from './Info';
export { ListLines } from './ListLines';
export { Lock } from './Lock';
export { MoreVertical } from './MoreVertical';
export { MusicNote } from './MusicNote';
export { PathConnector } from './PathConnector';
export { Person } from './Person';
export { Play } from './Play';
export { Plus } from './Plus';
export { Sun } from './Sun';
export { Timer } from './Timer';
