/**
 * 5.6 SOMETHING WENT WRONG — the AI breakdown didn't come back. The
 * assignment is already saved, so CHUNK IT MYSELF goes to 3.6 and TRY AGAIN
 * returns to the screen that asked.
 */

import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/ui';
import { colors, displayLine, fonts, radii, shadows } from '../../theme/tokens';

const FIXES = [
  ['Try again', 'Most of the time it works on the second go.'],
  ['Shorten the description', 'A few lines about the task is plenty.'],
  ['Chunk it yourself', 'Add steps by hand and keep the deadline.'],
] as const;

export default function ChunkFailed() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code?: string }>();

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={styles.body}>
        <View style={styles.pill}>
          <View style={styles.pillDot} />
          <Text style={styles.pillLabel}>SOMETHING WENT WRONG</Text>
        </View>

        <View style={styles.middle}>
          <View>
            <Text style={styles.title}>{"That didn't chunk"}</Text>
            <Text style={styles.line}>
              {"Your assignment is saved. The breakdown just didn't come back this time."}
            </Text>
          </View>

          <View style={[styles.card, shadows.hardEdge(6)]}>
            <Text style={styles.cardLabel}>WHAT USUALLY FIXES IT</Text>
            <View style={styles.fixes}>
              {FIXES.map(([head, body]) => (
                <View key={head}>
                  <Text style={styles.fixHead}>{head}</Text>
                  <Text style={styles.fixBody}>{body}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.buttons}>
            <Button label="TRY AGAIN" onPress={() => router.back()} />
            <Button
              label="CHUNK IT MYSELF"
              variant="secondary"
              onPress={() => router.replace('/add')}
            />
            <Text style={styles.stuck}>
              {code ? `Still stuck? Tell us — error ${code}` : 'Still stuck? Tell us.'}
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  body: { flex: 1, paddingTop: 10, paddingHorizontal: 22 },
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: colors.urgentSoft,
    borderWidth: 2,
    borderColor: colors.urgentBorder,
    borderRadius: radii.pill,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  pillDot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: colors.urgent },
  pillLabel: {
    fontFamily: fonts.body.black,
    fontSize: 11.5,
    letterSpacing: 11.5 * 0.12,
    color: colors.urgentDeep,
  },
  middle: { flex: 1, justifyContent: 'center', gap: 22, paddingBottom: 70 },
  title: {
    fontFamily: fonts.display.extraBold,
    fontSize: 36,
    lineHeight: displayLine(36, 1.1),
    color: colors.ink,
  },
  line: {
    marginTop: 12,
    maxWidth: 300,
    fontFamily: fonts.body.bold,
    fontSize: 15,
    lineHeight: 15 * 1.5,
    color: colors.muted,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cream,
    borderRadius: 24,
    padding: 18,
  },
  cardLabel: {
    fontFamily: fonts.body.black,
    fontSize: 11.5,
    letterSpacing: 11.5 * 0.12,
    color: colors.mutedLight,
  },
  fixes: { marginTop: 12, gap: 12 },
  fixHead: { fontFamily: fonts.body.extraBold, fontSize: 14.5, color: colors.ink },
  fixBody: {
    marginTop: 2,
    fontFamily: fonts.body.bold,
    fontSize: 13,
    lineHeight: 13 * 1.4,
    color: colors.muted,
  },
  buttons: { gap: 12 },
  stuck: {
    textAlign: 'center',
    fontFamily: fonts.body.bold,
    fontSize: 12.5,
    color: colors.mutedLight,
  },
});
