import { useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { handleAndroidBack } from './safeBack';
export function useAndroidBack(pathname: string) {
  const router = useRouter();
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const listener = BackHandler.addEventListener('hardwareBackPress', () => handleAndroidBack(router, pathname));
    return () => listener.remove();
  }, [router, pathname]);
}
