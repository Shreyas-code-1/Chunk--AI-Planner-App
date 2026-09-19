/**
 * Root error boundary.
 *
 * Deliberately unstyled: the board draws no error state, and inventing one
 * would be inventing design (brief §3.3). This is the last-resort net that
 * keeps a render crash from showing a blank white screen, and it gets replaced
 * with the real design once one exists.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // No crash reporter yet. When one is added it goes here, and it must not
    // carry the student's schoolwork with it.
    console.error('Unhandled render error', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Something went wrong.</Text>
        <Text style={styles.detail}>{error.message}</Text>
        <Pressable onPress={() => this.setState({ error: null })} style={styles.retry}>
          <Text style={styles.retryLabel}>Try again</Text>
        </Pressable>
      </View>
    );
  }
}

// TODO(design): replace with the real error state once it is on the board.
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 18, fontWeight: '700' },
  detail: { textAlign: 'center', opacity: 0.7 },
  retry: { paddingHorizontal: 20, paddingVertical: 10 },
  retryLabel: { fontWeight: '700' },
});
