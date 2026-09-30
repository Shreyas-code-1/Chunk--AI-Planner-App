-- AI consent records every choice, not only acceptances. A student can decline
-- at onboarding and switch AI on or off later from Profile; the newest row is
-- the current state. `decided_at` is when they tapped, not when the row was
-- written (they may choose before signing in).
--
-- Not applied automatically: run by hand from the Supabase dashboard, after
-- 0002.

alter table ai_consents add column granted boolean not null default true;
alter table ai_consents rename column accepted_at to decided_at;
