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

/** Present and non-empty. Never returns or logs the value itself. */
function isSet(value: string | undefined): boolean {
  return typeof value === 'string' && value.length > 0;
}

export const env = {
  /** Public SDK key for the selected RevenueCat store (currently Test Store). */
  revenueCatPublicSdkKey: () =>
    required(
      'EXPO_PUBLIC_REVENUECAT_SDK_KEY',
      process.env.EXPO_PUBLIC_REVENUECAT_SDK_KEY,
    ),

  /**
   * Whether the app has been configured at all. Callers use this to show a
   * readable message rather than letting a throw take down the route tree.
   */
  isConfigured: () =>
    isSet(process.env.EXPO_PUBLIC_SUPABASE_URL) &&
    isSet(process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY),

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
