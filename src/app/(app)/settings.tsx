import { safeBack } from '../../features/navigation/safeBack';
/**
 * 5.2a SETTINGS — reached from the gear on 5.2 PROFILE (design/v3/settings.png).
 *
 * Working: AI features, Restore purchases, Sign out. Restore goes through the
 * billing seam, which says plainly in Expo Go that it needs the App Store
 * build. Preferences, Notifications, Classes, Chunk Pro, Privacy policy and
 * Terms of use have nothing behind them yet and render without a chevron
 * until they do — see docs/v2-and-remaining-screens-questions.md.
 * The design has no Delete account row, so none is drawn.
 */

import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChevronLeft } from '../../components/icons';
import { Toggle } from '../../components/ui';
import { useAiConsent, useAiEnabled } from '../../features/ai/consent';
import { useSession } from '../../features/auth/SessionProvider';
import { restorePurchases } from '../../features/billing/usePro';
import { useDraft } from '../../features/onboarding/draft';
import { SettingsCard, SettingsRow } from '../../features/settings/SettingsCard';
import { haptic } from '../../lib/haptics';
import { colors, displayLine, fonts, radii, shadows } from '../../theme/tokens';

export default function Settings() {
  const router = useRouter();
  const { signOut } = useSession();
  const aiEnabled = useAiEnabled();
  const chooseAi = useAiConsent((s) => s.choose);
  const classCount = useDraft((s) => s.classes.length);

  const restore = async () => {
    try {
      await restorePurchases();
      Alert.alert('Purchases restored');
    } catch (error) {
      Alert.alert("Couldn't restore purchases", error instanceof Error ? error.message : undefined);
    }
  };

  const doSignOut = async () => {
    try {
      await signOut();
      router.replace('/welcome');
    } catch {
      Alert.alert("Couldn't sign out", 'Check your connection and try again.');
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPressIn={() => haptic('select')}
            onPress={() => safeBack(router, '/you')}
            style={styles.back}
          >
            <ChevronLeft size={22} color={colors.ink} strokeWidth={2.8} />
          </Pressable>
          <Text style={styles.title}>Settings</Text>
        </View>

        <Text style={[styles.section, styles.firstSection]}>ACCOUNT</Text>
        <SettingsCard>
          <SettingsRow title="Preferences" subtitle="Bedtime, study window, chunk length, busy days" />
          {/* TODO(design): no reminder is scheduled anywhere yet, so no time is shown. */}
          <SettingsRow title="Notifications" />
          <SettingsRow title="Classes" subtitle={`${classCount} ${classCount === 1 ? 'class' : 'classes'}`} />
          <SettingsRow
            title="AI features"
            subtitle="Chunking, explain and quiz"
            right={<Toggle value={aiEnabled} onChange={chooseAi} accessibilityLabel="AI features" />}
          />
        </SettingsCard>

        <Text style={styles.section}>SUBSCRIPTION</Text>
        {/* TODO(design): the plan and renewal line need RevenueCat (native build). */}
        <SettingsCard>
          <SettingsRow title="Chunk Pro" />
        </SettingsCard>

        <Pressable
          accessibilityRole="button"
          onPressIn={() => haptic('press')}
          onPress={restore}
          style={[styles.restore, shadows.hardEdge(6, colors.cream)]}
        >
          <Text style={styles.action}>RESTORE PURCHASES</Text>
        </Pressable>

        <Text style={styles.section}>LEGAL</Text>
        <SettingsCard>
          <SettingsRow title="Privacy policy" />
          <SettingsRow title="Terms of use" />
        </SettingsCard>

        <Pressable
          accessibilityRole="button"
          onPressIn={() => haptic('press')}
          onPress={doSignOut}
          style={styles.signOut}
        >
          <Text style={styles.action}>SIGN OUT</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  body: { paddingHorizontal: 21, paddingTop: 2, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  back: {
    width: 44,
    height: 44,
    borderRadius: radii.mdAlt,
    borderWidth: 1,
    borderColor: colors.cream,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.display.extraBold,
    fontSize: 27,
    lineHeight: displayLine(27, 1.1),
    color: colors.ink,
    includeFontPadding: false,
  },
  section: {
    marginTop: 24,
    marginBottom: 13,
    fontFamily: fonts.body.black,
    fontSize: 11.5,
    letterSpacing: 11.5 * 0.12,
    color: colors.mutedLight,
  },
  firstSection: { marginTop: 23 },
  restore: {
    marginTop: 15,
    height: 50,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.cream,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  action: {
    fontFamily: fonts.body.black,
    fontSize: 14,
    letterSpacing: 14 * 0.08,
    color: colors.orangeDeep,
  },
  signOut: { marginTop: 36, paddingVertical: 8, alignItems: 'center' },
});
