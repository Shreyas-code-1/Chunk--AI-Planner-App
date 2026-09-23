/**
 * 5.3 EMPTY STATE — All work before anything has been added.
 */

import { Image, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button } from '../../components/ui';
import { mascot } from '../../components/mascot';
import { colors, displayLine, fonts } from '../../theme/tokens';

export function EmptyWork() {
  const router = useRouter();
  return (
    <View style={styles.wrap}>
      <Image source={mascot.waiting} style={styles.mascot} resizeMode="contain" />
      <View style={styles.text}>
        <Text style={styles.title}>Nothing due yet</Text>
        <Text style={styles.line}>
          {"Snap a syllabus or add something — I'll cut it into chunks."}
        </Text>
      </View>
      <View style={styles.buttons}>
        <Button label="ADD AN ASSIGNMENT" onPress={() => router.push('/add')} />
        {/* TODO(batch 7): 4.1 SCAN TO CHUNK isn't built yet. */}
        <Button label="SCAN A SYLLABUS" variant="secondary" disabled />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, paddingBottom: 50 },
  mascot: { height: 190, width: 190 },
  text: { alignItems: 'center' },
  title: {
    fontFamily: fonts.display.extraBold,
    fontSize: 32,
    lineHeight: displayLine(32, 1.15),
    color: colors.ink,
    textAlign: 'center',
  },
  line: {
    marginTop: 10,
    maxWidth: 270,
    fontFamily: fonts.body.bold,
    fontSize: 14.5,
    color: colors.muted,
    textAlign: 'center',
  },
  buttons: { alignSelf: 'stretch', gap: 12 },
});
