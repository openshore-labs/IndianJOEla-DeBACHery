# IndianJOEla 🏔️📸

Joe's Bachelor Party site — Indianola, WA. A mobile-first, Sunday-funnies / *FoxTrot*-style
comic page with a photo slideshow everyone can add to, the schedule, what-to-bring,
and how to get there.

## Run it locally

It's a plain static site — no build step.

```bash
# from the repo root
python3 -m http.server 8000
# then open http://localhost:8000 on your phone or browser
```

## Turn on SHARED photos (so everyone sees each other's uploads)

Out of the box, photos are saved **on each person's own device**. To make uploads
shared across everyone, add a free Supabase backend (~5 minutes):

1. Create a free project at **https://supabase.com**.
2. **Storage → New bucket** → name it `photos` → toggle **Public** → Save.
3. **Storage → Policies** on the `photos` bucket → add policies allowing
   `SELECT` (read) and `INSERT` (upload) for the **anon** role.
4. **Project Settings → API** → copy the **Project URL** and **anon public** key.
5. Paste them into [`js/config.js`](js/config.js).

Done — uploads now flow into everyone's slideshow.

## Deploy (GitHub Pages)

1. Push to GitHub (already set up).
2. Repo **Settings → Pages** → Source: deploy from branch → pick the branch + `/root`.
3. Share the resulting URL (make a QR code for it so guests can scan + open on their phones).

## Editing the content

All copy lives in [`index.html`](index.html). Spots that need real details are marked
`[like this]` and `[edit me]`:

- **Schedule** → the `#schedule` timeline
- **Need-to-Know / What to Bring** → the `#info` cards
- **Getting There** → the `#map` section (ferry routes, address, map link)

## Project layout

```
index.html        all sections + content
css/styles.css    the comic styling
js/config.js      ← paste Supabase keys here
js/slideshow.js   slideshow + upload (Supabase, with on-device fallback)
js/main.js        bottom-nav scroll-spy + toasts
fonts/            self-hosted comic fonts
```
