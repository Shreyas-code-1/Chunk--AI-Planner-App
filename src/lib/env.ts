/**
 * Environment access.
 *
 * Everything here is bundled into the app binary, so it is public by
 * definition — treat an EXPO_PUBLIC_ value as printed on the App Store page.
 * Anything that must stay secret (the service role key, the Anthropic key)
 * lives in a Supabase Edge Function and never reaches this file.
 *
 * Values are read by name and never logged. A missing variable fails loudly
 * with the variable's name and nothing else.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env and fill it in, then restart the bundler.`,
    );
  }
  return value;
}

export const env = {
  supabaseUrl: () => required('EXPO_PUBLIC_SUPABASE_URL', process.env.EXPO_PUBLIC_SUPABASE_URL),
  /**
   * The publishable key (sb_publishable_...), not the legacy anon JWT. It is a
   * short string rather than a JWT, but it is passed to createClient exactly
   * the same way and still resolves to the anon or authenticated Postgres role,
   * so row-level security behaves identically.
   */
  supabaseKey: () =>
    required(
      'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
      process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    ),
};
