/**
 * "+25 logs" on 3.4, counting up from zero. Not on the board; borrows the
 * screen's own stat type in orange.
 */

import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, displayLine, fonts } from '../../theme/tokens';
import { LogIcon } from './LogIcon';

const COUNT_UP_MS = 900;

export function LogsEarned({ logs }: { logs: number }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (logs <= 0) return;
    const started = Date.now();
    const timer = setInterval(() => {
      const t = Math.min(1, (Date.now() - started) / COUNT_UP_MS);
      setShown(Math.round(logs * t));
      if (t === 1) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, [logs]);

  return (
    <View style={styles.row} accessibilityLabel={`${logs} logs earned`}>
      <LogIcon size={32} />
      <Text style={styles.value}>{`+${shown} ${logs === 1 ? 'log' : 'logs'}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  value: {
    fontFamily: fonts.display.extraBold,
    fontSize: 28,
    lineHeight: displayLine(28, 1),
    color: colors.orange,
    includeFontPadding: false,
  },
});
