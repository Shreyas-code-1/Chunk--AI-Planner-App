# RevenueCat on 2.16 — review before building

Response to the integration brief of 2026-09-20. Nothing has been built or
installed. This records what I agree with, what is missing, and what needs a
decision from you.

**Screen number.** The brief says 2.10 PAYWALL; on the 19 Sep board that screen
is **2.16**. Same screen, and everything below uses the board's number, per the
mapping in `decision-log.md`.

## The shape is right

Three calls in the brief are the right ones and I would not change them.

`react-native-purchases` alone, no `react-native-purchases-ui`. Their hosted
paywall cannot render the board's frame — the gold chip, the hard edges, the
stroked trial text — and fighting a remote template to approximate it would
cost more than reading the offering ourselves. The SDK gives data, the screen
stays ours.

Splitting at the build is right too. Nothing in step 2 can be verified without
a dev client on the phone, and doing both at once means writing purchase code
against a runtime that cannot execute it.

Building against mock offerings is right, with one guard described under
"Mock offerings" below.

## What the board does not draw

You asked which of the four failure cases has no design. The answer is broader
than the four: **§13c requires three things on this screen that the board's
2.16 frame does not contain at all.** The footer, as drawn, is exactly three
elements — "Cancel anytime in the App Store", the gold CTA, and NO THANKS.

| §13c requirement | On the board? |
|---|---|
| Restore Purchases visible on the paywall | **No.** Its absence is the rejection §13c names first. |
| Terms of Use + Privacy Policy links, on this screen | **No.** |
| Auto-renewal terms disclosed on the paywall | **No.** "Cancel anytime in the App Store" is not a disclosure of auto-renewal. |
| Price, period, trial shown before purchase | Yes — drawn, but hardcoded today. See below. |

That is three new elements in a footer that is already full. I can place them,
but placement here is design, not implementation: it decides what the last
thing before the CTA says. Worth a frame.

### The four failure cases

- **Purchase cancelled — no design needed.** Apple's sheet dismisses itself and
  we stay on the paywall with the selection intact and no message. RevenueCat
  reports this as `userCancelled`, which is explicitly not an error. Anything we
  draw here would be scolding someone for changing their mind.
- **Network failure — needs a frame.** 5.5 OFFLINE and 5.6 SOMETHING WENT WRONG
  exist on the board but are screen takeovers, and taking the screen over
  mid-purchase loses the selection and the context. This wants a small inline
  message above the CTA with a retry, and `batch-plan.md` already records that
  no inline error state exists anywhere on the board.
- **No offerings available — needs a frame and a product decision.** This is the
  state we will actually be in for the whole of step 2, since App Store Connect
  has no products. A paywall with no prices cannot be shown. My recommendation
  is that onboarding **skips 2.16 entirely** and continues to 2.17 rather than
  showing a broken or empty screen, which also means a student is never blocked
  by our billing configuration. That is a product call, not mine.
- **Already subscribed — needs a frame.** Two separate cases: arriving at 2.16
  already Pro (the screen should not appear), and restore succeeding on this
  screen (needs a confirmation before moving on).
- **A fifth case the brief does not list: restore finds nothing.** Apple's
  reviewers test this. Tapping Restore with no purchase must say so clearly
  rather than appearing to do nothing.

## The trial length collides with the stroked artwork

This is the one I would resolve before step 2 rather than during it.

§13c requires trial length read from the offering at runtime. The board renders
it as the gold chip reading `7 days free` — which is **element 5 in
`docs/stroked-elements.md`**, one of the six pieces of artwork waiting on you,
and the plan of record is that it arrives as a static asset.

A static asset cannot render a runtime value. This is exactly the problem
already open for elements 4 and 6 (`21 chunks`, `5 chunks`), and the same four
options apply — runtime SVG stroking, dropping the stroke on this one, moving
the number outside the chip, or a set of assets covering the plausible values.
Unlike 4 and 6, the trial length has very few possible values (Apple offers 3
days, 1 week, 2 weeks, 1 month, 2 months, 3 months, 6 months, 1 year), so a
small asset set is more practical here than it is for the chunk counts.

Second, smaller collision: the CTA reads **START MY FREE WEEK**. That hardcodes
seven days in words. If the intro offer is ever not a week, the button lies.
Either the label becomes trial-agnostic ("START MY FREE TRIAL") or we accept
that the offer is contractually seven days and say so.

## Two things the integration has to get right

**The purchase happens before the user has an account.** 2.16 comes before 2.17
LOG IN, so a student buys while anonymous and identifies afterwards. That means
calling `Purchases.logIn(<supabase user id>)` at the moment the session appears
— in `SessionProvider`, not in the paywall — so the anonymous purchase
transfers onto the real identity, and `logOut` when they sign out. Get this
wrong and the entitlement silently fails to follow them to a second device,
which is the kind of bug that surfaces as a refund request.

**The entitlement must be live, not fetched once.** `usePro()` should subscribe
via `addCustomerInfoUpdateListener` rather than reading `CustomerInfo` at mount,
so an expiry, a restore or a purchase on another device updates every screen.
It hangs off the existing query client and `SessionProvider` cleanly.

## Mock offerings — do not mock RevenueCat's types

`PurchasesOffering` is a large type and mocking it faithfully is busywork that
buys nothing. Instead the adapter in `src/features/billing/` should define a
narrow view model of what 2.16 actually renders — for each plan: an id, a
localized price string, a period, a derived per-month string, and the intro
offer — and map a real `PurchasesPackage` onto it. The screen imports that,
never `react-native-purchases`.

This is what makes "real offerings swap in with no code change" true rather
than aspirational, and it keeps 2.16 renderable in Expo Go.

Three specifics that fall out of it:

- **`PRICING` in `paywall.tsx` gets deleted.** That block is currently the
  source of every number on the screen and is precisely what §13c forbids.
- **The yearly card needs both products.** `$7.99 / MO` is derived (yearly ÷ 12),
  the struck-through `$10.99` is the *monthly* product's price shown on the
  yearly card, and `save 27%` is computed from the pair. None of the three is a
  product price read straight off one package.
- **Always `priceString`, never `'$' + number`.** The currency and its
  formatting come from the store, and a student in another market must not see
  a dollar sign.

The mock itself must be `__DEV__`-only and throw in a release build. A mock that
silently ships is hardcoded pricing with extra steps.

## Step 1 is not blocked by any of the above — but it is blocked by these

Everything above lands in step 2. Step 1 needs four things the brief does not
mention:

1. **`ios.bundleIdentifier` is not set in `app.json`.** EAS will stop and ask.
   Pick one now — it is permanent once the App Store record exists.
2. **No `eas.json` exists yet.** I will write it.
3. **An Apple Developer Program membership** ($99/yr) and this phone registered
   with `eas device:create`, for an internal-distribution build. If there is no
   paid account yet, step 1 stalls at credentials and nothing else in the plan
   can proceed.
4. **Android has no key.** Only `EXPO_PUBLIC_REVENUECAT_IOS_KEY` is named, while
   `app.json` still configures Android icons. Either
   `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` goes into `.env.example` now, or we
   record that Chunk is iOS-first and Android is out of scope.

`EXPO_PUBLIC_` is the correct prefix here, for the record: RevenueCat SDK keys
are publishable by design and are safe in the bundle. The App Store Connect
shared secret is the one that must never appear in this repo.

## What step 2 will not be able to prove

Worth saying plainly so "done" means something. Against mock offerings, the
purchase handlers can be written but not exercised — cancelled, failed, and
already-subscribed all come back from StoreKit, which will not be in play.
Mocks give us layout and state transitions, not a verified purchase.

Exercising the real flow needs, in order: the paid Apple account, the Paid
Applications agreement signed, the two products created and in "Ready to
Submit", a sandbox tester account, and the App Store Connect in-app-purchase key
uploaded to RevenueCat. A StoreKit configuration file can fake purchases
without App Store Connect, but only when running from Xcode, not from an EAS
internal-distribution build.

## One sequencing consequence

`batch-plan.md` puts 2.16 last, in batch 8, on an explicit principle: **stay in
Expo Go as long as possible**, because only the paywall needs a native module.
Doing RevenueCat now inverts that with 18 screens still unbuilt.

That is a reasonable thing to choose, but it should be chosen rather than
absorbed. Installing the SDK ends Expo Go for the **whole app**, not just this
screen: any import of a native module crashes the Expo Go client. From then on
every device needs the custom dev client and every native dependency change
costs another build.

My recommendation is to keep the existing seam. `usePro.ts` was built as one
deliberately, in the same shape as `src/native/appBlocking.ts`, and a lazy
require behind `isBillingAvailable` costs about ten lines and keeps sections 3,
4 and 5 developable in Expo Go while the paywall works properly in the dev
client. Everything in the brief still happens; it just does not take the rest
of the app with it.

## What I need from you

- The **bundle identifier**, and confirmation the Apple account exists.
- **iOS-only, or Android too**, for the second key.
- The **trial-length decision** — runtime value versus stroked asset, and
  whether the CTA stops saying WEEK.
- **Frames** for: the footer carrying Restore, Terms, Privacy and the
  auto-renewal line; the inline error; and the already-Pro / no-offerings cases.
- Whether **no offerings means skipping 2.16**, as I recommend.
- Whether the seam stays, keeping Expo Go alive for the unbuilt screens.

None of these block step 1 except the first.
