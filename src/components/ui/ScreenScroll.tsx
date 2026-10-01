/**
 * Makes a fixed-layout screen scroll when it doesn't fit (a small iPhone,
 * larger text) instead of cutting off. `flexGrow: 1` keeps the screen's own
 * flex layout — spacers, bottom-pinned buttons — exactly as it was whenever
 * the content does fit.
 */

import type { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

export function ScreenScroll({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { flexGrow: 1 },
});
