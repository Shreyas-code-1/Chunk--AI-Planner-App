/**
 * The typed API layer.
 *
 * Screens and hooks import from here; nothing outside this directory imports
 * the Supabase client. That keeps queries in one place to audit against RLS,
 * and means a schema change has one blast radius instead of thirty.
 *
 * This is deliberately thin right now. Endpoints get added with the screen
 * that needs them, not ahead of it.
 */

import { getSupabase } from '../lib/supabase';
import type { PreferencesRow, ProfileRow } from './types';

export * from './types';

/** The signed-in user's id, or null. Every query below is scoped to it by RLS. */
async function userId(): Promise<string | null> {
  const { data } = await getSupabase().auth.getUser();
  return data.user?.id ?? null;
}

export async function getProfile(): Promise<ProfileRow | null> {
  const id = await userId();
  if (!id) return null;

  const { data, error } = await getSupabase().from('profiles').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as ProfileRow | null;
}

export async function getPreferences(): Promise<PreferencesRow | null> {
  const id = await userId();
  if (!id) return null;

  const { data, error } = await getSupabase()
    .from('preferences')
    .select('*')
    .eq('user_id', id)
    .maybeSingle();
  if (error) throw error;
  return data as PreferencesRow | null;
}
