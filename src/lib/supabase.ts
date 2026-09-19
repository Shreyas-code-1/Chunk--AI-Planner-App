/**
 * The Supabase client.
 *
 * Created lazily, on first use. That matters: creating it at module scope
 * meant a missing environment variable threw while the module was being
 * evaluated, which made the whole route tree fail to import and surfaced as
 * `Cannot read property 'ErrorBoundary' of undefined` — a message that says
 * nothing about the actual cause. Nothing that renders should depend on
 * configuration it doesn't use.
 *
 * Sessions are persisted in the Keychain via expo-secure-store, never
 * AsyncStorage (brief §11a). SecureStore has a practical ~2KB limit per value
 * and a session JWT can exceed it, so values are split across numbered chunks
 * transparently.
 *
 * Nothing outside src/api should import this — screens talk to the typed API
 * layer, which talks to this.
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

let client: SupabaseClient | null = null;

/**
 * The client, created on first call. Throws a message naming the missing
 * variable if the app has not been configured — never the variable's value.
 */
export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(env.supabaseUrl(), env.supabaseKey(), {
      auth: {
        storage: secureStorage,
        autoRefreshToken: true,
        persistSession: true,
        // There is no browser redirect to parse in a native app.
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}

/** True when both variables are present, without reading or logging either. */
export function isSupabaseConfigured(): boolean {
  return env.isConfigured();
}
