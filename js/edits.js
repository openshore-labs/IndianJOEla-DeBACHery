/* =========================================================
   IndianJOEla — in-site copy editing (host-gated, temporary)
   - Always applies saved copy overrides from Supabase (so edits stick
     for everyone, even after editing is locked).
   - When EDIT_MODE is true, shows an "Edit copy" button. Enter the host
     code, then tap any outlined block to edit; changes save on blur.
   Requires a Supabase table:
     create table if not exists copy (key text primary key, value text,
       updated_at timestamptz default now());
     alter table copy enable row level security;
     create policy "copy read"   on copy for select using (true);
     create policy "copy write"  on copy for insert with check (true);
     create policy "copy update" on copy for update using (true);
   ========================================================= */
(function () {
  "use strict";

  const cfg = window.INDIANJOELA_CONFIG || {};
  const EDIT_MODE = !!cfg.EDIT_MODE;
  const hasSB = cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase;
  const sb = hasSB ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;

  const blocks = () => [...document.querySelectorAll("[data-edit]")];
  const toast = (m) => window.IJ_toast && window.IJ_toast(m);

  /* apply saved copy for everyone */
  async function applyOverrides() {
    if (!sb) return;
    try {
      const { data, error } = await sb.from("copy").select("key,value");
      if (error) throw error;
      const map = {};
      (data || []).forEach((r) => { map[r.key] = r.value; });
      blocks().forEach((el) => {
        const k = el.getAttribute("data-edit");
        if (k && map[k] != null) el.innerHTML = map[k];
      });
    } catch (e) {
      console.warn("copy overrides not loaded:", e);
    }
  }

  async function save(el) {
    const k = el && el.getAttribute("data-edit");
    if (!k || !sb) return;
    try {
      const { error } = await sb
        .from("copy")
        .upsert({ key: k, value: el.innerHTML, updated_at: new Date().toISOString() }, { onConflict: "key" });
      if (error) throw error;
      toast("Saved ✓");
    } catch (e) {
      console.error(e);
      toast("Couldn't save that edit — check Supabase setup");
    }
  }

  let editing = false;
  let fab;

  function onBlur(e) {
    const el = e.target.closest("[data-edit]");
    if (el) save(el);
  }

  function setEditing(on) {
    editing = on;
    blocks().forEach((el) => {
      el.contentEditable = on ? "true" : "false";
      el.spellcheck = false;
      el.classList.toggle("is-editing", on);
      if (on) el.addEventListener("blur", onBlur);
      else el.removeEventListener("blur", onBlur);
    });
    if (fab) {
      fab.textContent = on ? "✓ Done" : "✏️ Edit copy";
      fab.classList.toggle("is-on", on);
    }
  }

  function initUI() {
    if (!EDIT_MODE) return;
    fab = document.createElement("button");
    fab.className = "edit-fab";
    fab.type = "button";
    fab.textContent = "✏️ Edit copy";
    document.body.appendChild(fab);

    fab.addEventListener("click", () => {
      if (editing) { setEditing(false); toast("Edits locked in 👍"); return; }
      if (!sb) { toast("Supabase not connected — can't save edits"); return; }
      const code = window.prompt("Enter the host code to edit copy:");
      if (code === null) return;
      const want = (cfg.HOST_CODE || "").trim();
      if (want && code.trim() !== want) { toast("Wrong code"); return; }
      setEditing(true);
      toast("Edit mode on — tap any outlined block to change the text");
    });
  }

  document.addEventListener("DOMContentLoaded", () => { applyOverrides(); initUI(); });
})();
