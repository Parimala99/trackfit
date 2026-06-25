# Gym Tracker

A friends-only PWA for logging lifts and tracking weekly progress. Installable
on iPhone and Android straight from the browser — no app stores, no fees.

Stack: **React + Vite** (PWA) · **Supabase** (Postgres, auth, API) · deploy free
on **Vercel / Netlify / Cloudflare Pages**.

---

## 1. Set up the database (Supabase)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the dashboard open **SQL Editor**, paste the whole of
   [`supabase/schema.sql`](supabase/schema.sql), and run it. This creates the
   tables (`profiles`, `exercises`, `workouts`, `sets`), the row-level-security
   policies, the sign-up trigger, and a starter list of common lifts.
3. Under **Project Settings → API**, copy the **Project URL** and the
   **anon public** key.

The security model: anyone signed in can *read* everyone's workouts (that's the
shared friends feed), but can only *write* their own. It's enforced in the
database, so it holds no matter what the client does.

## 2. Configure the app

```bash
cp .env.example .env
```

Then put your two values in `.env`:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

## 3. Run it

```bash
npm install
npm run dev
```

Open the printed localhost URL. Sign in with your email — Supabase emails you a
one-tap magic link (no passwords to manage).

> Email tip: the default Supabase email sender is rate-limited and fine for a few
> friends. For reliable delivery later, add an SMTP provider under
> **Authentication → Email**.

## 4. Deploy (free)

Push the repo to GitHub, then import it on **Vercel**, **Netlify**, or
**Cloudflare Pages**:

- Build command: `npm run build`
- Output directory: `dist`
- Add the same two `VITE_SUPABASE_*` env vars in the host's dashboard.

Finally, in Supabase under **Authentication → URL Configuration**, add your
deployed URL to **Site URL** / **Redirect URLs** so magic links land back on the
live site.

## 5. Install on a phone

Open the deployed URL in the phone browser and choose **Add to Home Screen**.
It launches full-screen with its own icon, like a native app.

---

## Project layout

```
gym-tracker/
├─ supabase/schema.sql        # run once in the Supabase SQL editor
├─ src/
│  ├─ App.jsx                 # session + tab navigation shell
│  ├─ lib/supabaseClient.js   # reads VITE_SUPABASE_* env vars
│  └─ components/
│     ├─ Auth.jsx             # magic-link sign in
│     ├─ LogWorkout.jsx       # build a session of sets and save
│     ├─ WeeklyView.jsx       # this week's top set per lift
│     └─ Feed.jsx             # recent sessions from everyone
└─ vite.config.js             # PWA manifest config
```

## Where to take it next

- **Progress charts** — query a single exercise across dates and plot it.
- **All-time PRs** — flag a set when it beats your previous best for that lift.
- **Units** — store a `unit` preference on the profile (kg/lb) instead of
  assuming kg.
- **Reactions** — a tiny `reactions` table so friends can 🔥 each other's PRs.
- **Editing/deleting** — the RLS policies already allow it; add the UI.

Built as a starting point — the schema and screens are deliberately small so you
can reshape them.
