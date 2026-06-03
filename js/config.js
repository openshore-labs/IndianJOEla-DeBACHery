/* =========================================================
   IndianJOEla — configuration
   ---------------------------------------------------------
   TO TURN ON SHARED PHOTOS (so everyone sees each other's uploads):

   1. Go to https://supabase.com  →  create a free project.
   2. In the dashboard:  Storage → "New bucket" → name it  photos
        → toggle it PUBLIC → Save.
   3. Storage → Policies → on the "photos" bucket, "New policy" →
        use the templates to ALLOW  SELECT (read) and INSERT (upload)
        for the "anon" role  (so guests can view + add without logging in).
   4. Project Settings → API → copy the "Project URL" and the
        "anon public" key, and paste them below.

   Until you fill these in, the site still works perfectly — photos are
   just saved on each person's own device instead of shared.
   ========================================================= */

window.INDIANJOELA_CONFIG = {
  SUPABASE_URL: "https://bsxbuqwmdlwncbysyggm.supabase.co",
  // Supabase "publishable" key — safe to expose in front-end code.
  SUPABASE_ANON_KEY: "sb_publishable_MCwDeRQnvY4kk6KjvcqjGw_AMQQHLZJ",
  BUCKET: "photos",
  // Secret word required to delete a photo from the site. Change this to
  // whatever you like — only people who know it can remove photos.
  HOST_CODE: "rainier",
  // When true, an "Edit copy" button appears (host-code gated) so copy can be
  // edited right on the site. Flip to false to lock edits. Saved edits persist
  // either way (stored in Supabase).
  EDIT_MODE: false,
};
