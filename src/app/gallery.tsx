/**
 * Primitives gallery — development only.
 *
 * Every primitive and every icon, in every state it currently has, on the
 * board's page background, so it can be held against design/board.html side
 * by side.
 *
 * This route is scaffolding. Delete it before the first real screen ships; it
 * is not part of the product and nothing should import from it.
 */

import { Image } from 'expo-image';
import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import * as Icons from '../components/icons';
import {
  BottomDock,
  Button,
  Card,
  Chip,
  Input,
  PathNode,
  ProgressRing,
  Slider,
  SpeechBubble,
  StatsStrip,
  Toggle,
  type DockTab,
} from '../components/ui';
import { useSession } from '../features/auth/SessionProvider';
import { colors, fonts, radii, shadows } from '../theme/tokens';

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {note ? <Text style={styles.sectionNote}>{note}</Text> : null}
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

/** Every icon except the path connector, which is not 24x24. */
const ICON_NAMES = (
  Object.keys(Icons) as (keyof typeof Icons)[]
).filter((name) => name !== 'PathConnector').sort();

export default function Gallery() {
  const { configError } = useSession();
  const [hour, setHour] = useState(16);
  const [remindersOn, setRemindersOn] = useState(true);
  const [soundOn, setSoundOn] = useState(false);
  const [tab, setTab] = useState<DockTab>('home');

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Primitives</Text>
        {configError ? <Text style={styles.configError}>{configError}</Text> : null}

        <Text style={styles.sub}>
          Board values, no approximations. Press anything — the face should sink onto its
          edge and the haptic should land at the same instant, not on release.
        </Text>

        <Section
          title="Button"
          note="primary 0 6px 0 #6E4A28 · dark 0 5px 0 #1F1610 · onOrange 0 6px 0 rgba(0,0,0,.14)"
        >
          <Button label="CONTINUE" onPress={() => {}} />
          <Button label="START" variant="dark" onPress={() => {}} />
          <View style={styles.onOrange}>
            <Button label="FINISH CHUNK" variant="onOrange" onPress={() => {}} />
          </View>
          <Button label="CONTINUE" disabled onPress={() => {}} />
          <Text style={styles.flag}>
            Disabled is a placeholder opacity — the board draws none.
          </Text>
        </Section>

        <Section title="Input" note="2px #F59332, radius 20 · large adds the hard edge">
          <Input label="YOUR NAME" size="large" defaultValue="Maya Chen" />
          <Input defaultValue="Maya Chen" />
          <Text style={styles.flag}>
            The drawn caret shows only while focused. No error or disabled state on the
            board — 2.4 needs one for an empty name.
          </Text>
        </Section>

        <Section title="Slider" note="12px track · 30px thumb, 3px border, edge 0 4px 0">
          <Slider value={hour} min={6} max={23} step={1} onChange={setHour} />
          <Text style={styles.body}>{formatHour(hour)}</Text>
          <Text style={styles.flag}>
            2.6 BEST TIME OF DAY is a two-thumb range slider. The board only draws the
            single-thumb version, so the range variant is flagged, not invented.
          </Text>
        </Section>

        <Section title="Toggle" note="52×30 · on #F59332 · off #EFE1D2">
          <View style={styles.row}>
            <Toggle value={remindersOn} onChange={setRemindersOn} accessibilityLabel="Reminders" />
            <Toggle value={soundOn} onChange={setSoundOn} accessibilityLabel="Sound" />
          </View>
        </Section>

        <Section title="PathNode" note="done 60 · now 66 with a 4px ring · locked 60">
          <View style={[styles.nodeRow, styles.nodeContainer]}>
            <PathNode state="done" onPress={() => {}} />
            <PathNode state="now" onPress={() => {}} />
            <PathNode state="locked" />
          </View>
          <Text style={styles.flag}>
            Locked is not tappable, as the board draws it. Whether a student may start out
            of order is still open.
          </Text>
        </Section>

        <Section title="StatsStrip" note="22px markers, Nunito 900 at 15px">
          <StatsStrip
            stats={[
              { kind: 'today', value: '12', label: 'Chunks today' },
              { kind: 'allTime', value: '148', label: 'All-time chunks' },
              { kind: 'minutes', value: '21', label: 'Minutes focused' },
              { kind: 'rate', value: '86%', label: 'Finish rate' },
            ]}
          />
        </Section>

        <Section title="BottomDock" note="dock edge 6px · add-button edge 4px — not the same">
          <BottomDock active={tab} onSelect={setTab} onAdd={() => {}} />
        </Section>

        <Section title="ProgressRing" note="substitution: conic-gradient → SVG arc, 22px thick">
          <View style={styles.ringStage}>
            <ProgressRing progress={0.78} size={180}>
              <Text style={styles.ringLabel}>TIME LEFT</Text>
              <Text style={styles.ringValue}>18:42</Text>
            </ProgressRing>
          </View>
        </Section>

        <Section title="Chip" note="42×42, radius 15, Nunito 900 at 12px">
          <View style={styles.row}>
            <Chip className="Biology" />
            <Chip className="Algebra II" />
            <Chip className="English" />
            <Chip className="US History" />
            <Chip className="Chemistry" />
          </View>
          <Text style={styles.flag}>
            Last is the neutral fallback — the board&rsquo;s own &ldquo;Che&rdquo;.
          </Text>
        </Section>

        <Section title="Card" note="outlined: 2px #EFE1D2 · raised: hard edge 0 5px 0">
          <Card>
            <Text style={styles.body}>Outlined — list rows and information.</Text>
          </Card>
          <Card variant="raised" radius={radii.xxl}>
            <Text style={styles.body}>Raised — pressable, or the focus of the screen.</Text>
          </Card>
        </Section>

        <Section
          title="SpeechBubble"
          note="Nunito 700 at 14.5px · the board pairs a different mascot pose per screen"
        >
          <SpeechBubble
            mascot={
              <Image
                source={require('../../design/mascot/00-mascot-waving.png')}
                style={styles.mascot}
                contentFit="contain"
              />
            }
          >
            Your week is ready. Thursday isn&rsquo;t as bad as it looked.
          </SpeechBubble>
        </Section>

        <Section
          title={`Icons (${ICON_NAMES.length})`}
          note="65 SVGs on the board, 20 distinct · stroke widths are per-icon, never normalised"
        >
          <View style={styles.iconGrid}>
            {ICON_NAMES.map((name) => {
              const Icon = Icons[name] as (props: Icons.IconProps) => ReactNode;
              return (
                <View key={name} style={styles.iconCell}>
                  <Icon size={24} color={colors.ink} />
                  <Text style={styles.iconName}>{name}</Text>
                </View>
              );
            })}
          </View>
          <Text style={styles.sectionNote}>PathConnector — 350×520, dashed 2 26</Text>
          <View style={styles.connectorStage}>
            <Icons.PathConnector width={220} height={150} />
          </View>
        </Section>

        <Section title="Shadows" note="these two must never be confused">
          <View style={styles.row}>
            <View style={[styles.swatch, shadows.hardEdge(6)]}>
              <Text style={styles.swatchLabel}>hard</Text>
            </View>
            <View style={[styles.swatch, shadows.elevation]}>
              <Text style={styles.swatchLabel}>soft</Text>
            </View>
          </View>
        </Section>

        <Section title="Type" note="Baloo 2 has no 900 — every 900 on the board is Nunito">
          <Text style={styles.displayXL}>chunk</Text>
          <Text style={styles.display}>2 hours became 5 chunks</Text>
          <Text style={styles.body}>Body copy, Nunito 700 at 14.5px.</Text>
          <Text style={styles.caption}>Caption, Nunito 900 at 12px.</Text>
        </Section>

        <Section title="Still not built" note="flagged rather than approximated">
          <Text style={styles.flag}>
            Stroked text — splash logo and the highlight chips. See
            docs/stroked-elements.md.
          </Text>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatHour(hour: number): string {
  const suffix = hour < 12 ? 'AM' : 'PM';
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display} ${suffix}`;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  content: { padding: 20, gap: 28, paddingBottom: 60 },
  heading: { fontFamily: fonts.display.extraBold, fontSize: 34, color: colors.ink },
  sub: { fontFamily: fonts.body.semiBold, fontSize: 13, color: colors.muted, lineHeight: 19 },

  section: { gap: 8 },
  sectionTitle: { fontFamily: fonts.display.bold, fontSize: 22, color: colors.ink },
  sectionNote: { fontFamily: fonts.body.semiBold, fontSize: 11.5, color: colors.mutedLight },
  sectionBody: { gap: 12, marginTop: 4 },

  row: { flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  onOrange: { backgroundColor: colors.orange, borderRadius: radii.xxl, padding: 16 },

  nodeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  nodeContainer: {
    backgroundColor: colors.page,
    borderWidth: 2,
    borderColor: colors.creamPale,
    borderRadius: radii.xxl,
    padding: 18,
  },

  ringStage: {
    backgroundColor: colors.orange,
    borderRadius: radii.chip,
    padding: 20,
    alignItems: 'center',
  },
  ringLabel: {
    fontFamily: fonts.body.black,
    fontSize: 11.5,
    letterSpacing: 11.5 * 0.14,
    color: 'rgba(255,255,255,0.85)',
  },
  ringValue: { fontFamily: fonts.display.extraBold, fontSize: 40, color: colors.white },

  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  iconCell: {
    width: 78,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.creamBorder,
  },
  iconName: { fontFamily: fonts.body.semiBold, fontSize: 9.5, color: colors.muted },
  connectorStage: { alignItems: 'center', paddingVertical: 8 },

  mascot: { width: 76, height: 76 },
  swatch: {
    width: 90,
    height: 64,
    borderRadius: radii.xl,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchLabel: { fontFamily: fonts.body.black, fontSize: 12, color: colors.muted },

  displayXL: { fontFamily: fonts.display.extraBold, fontSize: 40, color: colors.ink },
  display: { fontFamily: fonts.display.extraBold, fontSize: 24, color: colors.ink },
  body: { fontFamily: fonts.body.bold, fontSize: 14.5, color: colors.ink, lineHeight: 21 },
  caption: { fontFamily: fonts.body.black, fontSize: 12, color: colors.muted },
  flag: { fontFamily: fonts.body.semiBold, fontSize: 12, color: colors.orangeDeep, lineHeight: 17 },
  configError: {
    fontFamily: fonts.body.bold,
    fontSize: 12,
    color: colors.orangeDeep,
    lineHeight: 18,
    backgroundColor: colors.creamBorder,
    borderRadius: radii.md,
    padding: 12,
  },
});
