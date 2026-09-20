/**
 * 2.13 IMPORT WORK.
 *
 * Three ways in, and a way past. The board gives the camera card the orange
 * fill and a deeper edge — it is the recommended route, not a selected state,
 * so it does not toggle.
 *
 * TODO(batch 5/7): all three destinations are later screens — the camera goes
 * to 4.1 SCAN TO CHUNK, typing to 3.6 ADD ASSIGNMENT, and voice capture has no
 * frame of its own yet. They are inert rather than wired somewhere wrong.
 * SKIP FOR NOW works, which is the path that has somewhere to go.
 */

import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';

import { Button } from '../../components/ui';
import { Camera, ListLines, Mic } from '../../components/icons';
import { OnboardingHeader } from '../../features/onboarding/OnboardingHeader';
import { colors, displayLine, fonts, radii, shadows } from '../../theme/tokens';

type Route = {
  title: string;
  detail: string;
  icon: ReactNode;
  primary?: boolean;
  wellColor: string;
};

export default function ImportWork() {
  const router = useRouter();

  const ROUTES: Route[] = [
    {
      title: 'Take a picture',
      detail: 'A syllabus, a worksheet, the board.',
      icon: <Camera size={25} color={colors.white} strokeWidth={2.3} />,
      primary: true,
      wellColor: 'rgba(255,255,255,0.22)',
    },
    {
      title: 'Say it out loud',
      detail: '"Bio quiz Friday, chapters 4 and 5."',
      icon: <Mic size={25} color={colors.orangeDeep} strokeWidth={2.3} />,
      wellColor: colors.amber,
    },
    {
      title: 'Type it in',
      detail: 'A sentence is enough to start.',
      icon: <ListLines size={25} color={colors.tealDeep} strokeWidth={2.3} />,
      wellColor: colors.teal,
    },
  ];

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={styles.body}>
        <OnboardingHeader step={11} />

        <Text style={styles.headline}>{'How do you want\nto add work?'}</Text>
        <Text style={styles.sub}>
          Show it, say it, or type it. Chunk turns any of them into a plan.
        </Text>

        <ScrollView contentContainerStyle={styles.routes} showsVerticalScrollIndicator={false}>
          {ROUTES.map((route) => (
            <Pressable
              key={route.title}
              accessibilityRole="button"
              accessibilityLabel={`${route.title}. ${route.detail}`}
              style={[
                styles.route,
                route.primary ? styles.routePrimary : styles.routePlain,
                shadows.hardEdge(route.primary ? 7 : 6),
              ]}
            >
              <View style={[styles.well, { backgroundColor: route.wellColor }]}>{route.icon}</View>
              <View style={styles.routeText}>
                <Text style={[styles.routeTitle, route.primary && styles.onWhite]}>
                  {route.title}
                </Text>
                <Text style={[styles.routeDetail, route.primary && styles.onWhiteSoft]}>
                  {route.detail}
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.footnote}>You can mix and match later.</Text>
        <Button
          label="SKIP FOR NOW"
          variant="secondary"
          onPress={() => router.push('/building-plan')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  body: { flex: 1, paddingTop: 12, paddingHorizontal: 24, paddingBottom: 32 },
  headline: {
    marginTop: 22,
    fontFamily: fonts.display.extraBold,
    fontSize: 34,
    lineHeight: displayLine(34, 1.15),
    color: colors.ink,
  },
  sub: {
    marginTop: 10,
    maxWidth: 300,
    fontFamily: fonts.body.bold,
    fontSize: 14.5,
    lineHeight: 14.5 * 1.5,
    color: colors.muted,
  },
  routes: { paddingTop: 22, paddingBottom: 22, gap: 13 },
  route: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    borderRadius: radii.chip,
  },
  routePrimary: { backgroundColor: colors.orange, padding: 20 },
  routePlain: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cream,
    padding: 19,
  },
  well: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeText: { flex: 1 },
  routeTitle: {
    fontFamily: fonts.display.bold,
    fontSize: 23,
    lineHeight: displayLine(23, 1.15),
    color: colors.ink,
  },
  routeDetail: {
    marginTop: 3,
    fontFamily: fonts.body.semiBold,
    fontSize: 13.5,
    lineHeight: 13.5 * 1.45,
    color: colors.muted,
  },
  onWhite: { color: colors.white },
  onWhiteSoft: { color: 'rgba(255,255,255,0.92)' },
  footnote: {
    marginBottom: 14,
    textAlign: 'center',
    fontFamily: fonts.body.bold,
    fontSize: 12.5,
    color: colors.muted,
  },
});
