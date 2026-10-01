/**
 * Shared UI primitives, built from design/board.html.
 *
 * Every value in here is the board's. Where the board has no equivalent for a
 * web construct, or draws no state, the component says so in a TODO(design)
 * rather than approximating — see docs/stroked-elements.md and
 * docs/0a-open-questions.md.
 */

export { Button } from './Button';
export { BottomDock, type DockTab } from './BottomDock';
export { Card } from './Card';
export { Chip } from './Chip';
export { Input } from './Input';
export { OrangeGradient } from './OrangeGradient';
export { PathNode, type PathNodeState } from './PathNode';
export { ProgressRing } from './ProgressRing';
export { Slider } from './Slider';
export { SpeechBubble } from './SpeechBubble';
export { StrokedText, HighlightChip } from './StrokedText';
export { StatsStrip, type Stat, type StatKind } from './StatsStrip';
export { Toggle } from './Toggle';
export { ScreenScroll } from './ScreenScroll';
