/**
 * Primitives gallery — development only.
 *
 * Every primitive in every state it currently has, on the board's page
 * background, so it can be held against design/board.html side by side.
 *
 * This route is scaffolding. Delete it before the first real screen ships; it
 * is not part of the product and nothing should import from it.
 */

import { Image } from 'expo-image';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../components/ui/Button';
import { useSession } from '../features/auth/SessionProvider';
import { Card } from '../components/ui/Card';
import { Chip } from '../components/ui/Chip';
import { SpeechBubble } from '../components/ui/SpeechBubble';
import { colors, fonts, radii, shadows } from '../theme/tokens';

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {note ? <Text style={styles.sectionNote}>{note}</Text> : null}
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

export default function Gallery() {
  const { configError } = useSession();

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
            The disabled state is a placeholder opacity — the board draws none.
          </Text>
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
            Last one is the neutral fallback — the board&rsquo;s own &ldquo;Che&rdquo;.
            &ldquo;AP Biology 2&rdquo; and &ldquo;Bio&rdquo; resolve to the same chip.
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

        <Section title="SpeechBubble" note="Nunito 700 at 14.5px, line-height 1.45">
          <SpeechBubble
            mascot={
              <Image
                source={require('../../design/mascot/mascot-head.png')}
                style={styles.mascot}
                contentFit="contain"
              />
            }
          >
            Your week is ready. Thursday isn&rsquo;t as bad as it looked.
          </SpeechBubble>
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

        <Section title="Not built" note="flagged rather than approximated">
          <Text style={styles.flag}>
            Stroked text (splash logo, highlight chips) — no RN equivalent. See
            docs/stroked-elements.md.
          </Text>
          <Text style={styles.flag}>
            Input, Slider, Toggle, PathNode, StatsStrip, BottomDock, ProgressRing, and the
            66 icons.
          </Text>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
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
