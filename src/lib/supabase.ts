/**
 * The Supabase client.
 *
 * Sessions are persisted in the Keychain via expo-secure-store, never
 * AsyncStorage (brief §11a). SecureStore has a 2048-byte practical limit per
 * value, and a Supabase session with a large JWT can exceed it, so values are
 * split across numbered chunks transparently.
 *
 * Nothing outside src/api should import this directly — screens talk to the
 * typed API layer, which talks to this.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

import { env } from './env';

const CHUNK_SIZE = 1800;

/** Keys are namespaced so a stray value can be recognised on sight. */
const partKey = (key: string, index: number) => `sb.${key}.${index}`;
const countKey = (key: string) => `sb.${key}.count`;

const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    const count = await SecureStore.getItemAsync(countKey(key));
    if (!count) return null;

    const parts: string[] = [];
    for (let i = 0; i < Number(count); i++) {
      const part = await SecureStore.getItemAsync(partKey(key, i));
      if (part == null) return null; // a torn write; treat as signed out
      parts.push(part);
    }
    return parts.join('');
  },

  async setItem(key: string, value: string): Promise<void> {
    await secureStorage.removeItem(key);

    const parts: string[] = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      parts.push(value.slice(i, i + CHUNK_SIZE));
    }
    for (const [index, part] of parts.entries()) {
      await SecureStore.setItemAsync(partKey(key, index), part);
    }
    await SecureStore.setItemAsync(countKey(key), String(parts.length));
  },

  async removeItem(key: string): Promise<void> {
    const count = await SecureStore.getItemAsync(countKey(key));
    if (!count) return;

    for (let i = 0; i < Number(count); i++) {
      await SecureStore.deleteItemAsync(partKey(key, i));
    }
    await SecureStore.deleteItemAsync(countKey(key));
  },
};

export const supabase: SupabaseClient = createClient(env.supabaseUrl(), env.supabaseKey(), {
  auth: {
    storage: secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    // There is no browser redirect to parse in a native app.
    detectSessionInUrl: false,
  },
});
