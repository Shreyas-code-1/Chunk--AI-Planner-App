# Public-repo security check — 2026-10-01

Shreyas made the GitHub repo public and asked whether it is secure. Checked
every commit on every branch (values never printed):

- **No secrets found.** No `.env` was ever committed (only `.env.example`,
  which holds variable names). No Supabase secret/service-role keys,
  Anthropic/OpenAI keys, RevenueCat secret keys, AWS/Google/GitHub tokens,
  private keys or Supabase project URLs in any file or commit. One pattern hit
  inside `design/board.html` was random base64 image data, not a key.
- `.gitignore` covers `.env` and `.env*.local`.
- Public by design, not secret: the EAS project id, bundle id
  `com.caidenn2.chunk`, Expo owner name, and any `EXPO_PUBLIC_*` value (those
  ship inside the app anyway — CLAUDE.md).

Open:
- **License.** `LICENSE` is the Expo template's MIT license ("Copyright
  650 Industries, Inc. (aka Expo)"). Public + MIT means anyone may copy, reuse
  and sell the code and the design assets in it. Decide: keep MIT under the
  team's own name, or remove the license (all rights reserved; public repos are
  then viewable but not reusable).
- **Turn on in GitHub → Settings → Code security:** secret scanning and push
  protection (free for public repos), so a key pushed by mistake is blocked.
- **Protect `main`** (Settings → Branches) so it can't be force-pushed.
- Never commit `.env`; real keys live in `.env` locally and in EAS/Edge
  Function secrets.
