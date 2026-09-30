# Buttons that don't work

Audit of `main` on 2026-09-29. For each one, Shreyas decides: give it a job, or
remove it. Write the answer next to the item.

"Partner branch" = `origin/codex/revenuecat-auth-integration`, not merged yet.

## Do nothing at all
| # | Screen | Button | Now | Decision |
|---|---|---|---|---|
| 1 | 2.13 Import Work | "Take a picture" card | Nothing (4.1 Scan isn't built) |**Removed:** whole screen deleted (29 Sep) |
| 2 | 2.13 Import Work | "Say it out loud" card | Nothing (no voice screen exists) |**Removed:** whole screen deleted (29 Sep) |
| 3 | 2.13 Import Work | "Type it in" card | Nothing, though 3.6 Add Assignment exists |**Removed:** whole screen deleted (29 Sep) |
| 4 | 3.3 Focus | ⋮ menu (top right) | Nothing | |
| 5 | 3.3 Focus | Music card ("No track") | Nothing: no audio source decided |**Removed** (29 Sep), along with the Focus mascot |
| 6 | 5.2 Profile | Preferences | Nothing: no screen behind it | |
| 7 | 5.2 Profile | Reminders | Nothing: notifications not built | |

## Shown but disabled
| # | Screen | Button | Now | Decision |
|---|---|---|---|---|
| 8 | 5.2 Profile | Google Classroom switch | Greyed out: no integration | |
| 9 | 5.2 Profile | Canvas switch | Greyed out: no integration | |
| 10 | 5.3 Empty | SCAN A SYLLABUS | Greyed out (4.1 isn't built) | |

## Look like they work but are fake or placeholders
| # | Screen | Button | Now | Decision |
|---|---|---|---|---|
| 11 | 2.16 Paywall | Plan buttons | Move on without charging (real on partner branch) | |
| 12 | 2.17 Log In | Continue with Apple / Google | Show an error in Expo Go (real on partner branch) | |
| 13 | 2.17 Log In | "Terms and Privacy Policy" | Plain text, not a link: neither document exists | |
| 14 | 2.18 Email | CONTINUE | Sends no email (real on partner branch) |**Works now** (29 Sep, from the partner branch) |
| 15 | 2.19 Verify | VERIFY | Accepts any six digits (real on partner branch) |**Works now** (29 Sep, from the partner branch) |
| 16 | 2.19 Verify | Resend code | Only says "go back to the email screen" to get another code | |
| 17 | AI consent | Privacy policy | Opens a placeholder URL (example.com) | |

## Look tappable but are display only
| # | Screen | Element | Now | Decision |
|---|---|---|---|---|
| 18 | 3.1 Home | Class rows (name + progress bar) | Not tappable. SEE ALL does work. | |

Everything else checked works: the dock, Add, Focus start/finish/close, Chunk
Complete, Chunked, Chunk Failed, All Work filters and rows, Urgent Home, the
onboarding CONTINUE buttons, and the Profile AI switch.
