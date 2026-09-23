/**
 * 5.5 OFFLINE. Pushed by anything that needs the network when there is none.
 * TRY AGAIN rechecks and goes back once the connection returns.
 */

import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/ui';
import { isOnline } from '../../lib/network';
import { colors, displayLine, fonts } from '../../theme/tokens';

export default function Offline() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={styles.body}>
        <Text style={styles.title}>{"You're offline"}</Text>
        <Text style={styles.line}>Please, check your connection and try again.</Text>
        <Button
          label="TRY AGAIN"
          disabled={checking}
          style={styles.button}
          onPress={async () => {
            setChecking(true);
            const online = await isOnline();
            setChecking(false);
            if (online) router.back();
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingBottom: 60,
  },
  title: {
    fontFamily: fonts.display.extraBold,
    fontSize: 36,
    lineHeight: displayLine(36, 1.1),
    color: colors.ink,
    textAlign: 'center',
  },
  line: {
    marginTop: 12,
    maxWidth: 280,
    fontFamily: fonts.body.bold,
    fontSize: 15,
    lineHeight: 15 * 1.5,
    color: colors.muted,
    textAlign: 'center',
  },
  // The board's button hugs its label (padding 17/40) rather than filling the row.
  button: { marginTop: 28, minWidth: 180 },
});
