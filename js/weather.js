/* =========================================================
   IndianJOEla — weather (Open-Meteo, no API key needed)
   Powers the masthead widget (index) and the hourly page (forecast.html).
   ========================================================= */
(function () {
  "use strict";

  // Indianola, WA
  const LAT = 47.7515, LON = -122.527, TZ = "America/Los_Angeles";

  // *** EVENT THURSDAY — set this to the real date (YYYY-MM-DD). ***
  // The widget shows this Thu + the next 3 days (Fri/Sat/Sun).
  const EVENT_THURSDAY = "2026-07-16";

  // WMO weather code -> [emoji, label]
  const WMO = {
    0: ["☀️", "Clear"], 1: ["🌤️", "Mostly sunny"], 2: ["⛅", "Partly cloudy"], 3: ["☁️", "Overcast"],
    45: ["🌫️", "Fog"], 48: ["🌫️", "Icy fog"],
    51: ["🌦️", "Light drizzle"], 53: ["🌦️", "Drizzle"], 55: ["🌦️", "Heavy drizzle"],
    56: ["🌧️", "Freezing drizzle"], 57: ["🌧️", "Freezing drizzle"],
    61: ["🌦️", "Light rain"], 63: ["🌧️", "Rain"], 65: ["🌧️", "Heavy rain"],
    66: ["🌧️", "Freezing rain"], 67: ["🌧️", "Freezing rain"],
    71: ["🌨️", "Light snow"], 73: ["🌨️", "Snow"], 75: ["❄️", "Heavy snow"], 77: ["🌨️", "Snow grains"],
    80: ["🌦️", "Showers"], 81: ["🌧️", "Showers"], 82: ["⛈️", "Heavy showers"],
    85: ["🌨️", "Snow showers"], 86: ["🌨️", "Snow showers"],
    95: ["⛈️", "Thunderstorms"], 96: ["⛈️", "Thunderstorms"], 99: ["⛈️", "Thunderstorms"],
  };
  const wx = (c) => WMO[c] || ["🌡️", "—"];

  function pad(n) { return String(n).padStart(2, "0"); }

  // [Thu, Fri, Sat, Sun] derived from EVENT_THURSDAY
  function eventDays() {
    const [y, m, d] = EVENT_THURSDAY.split("-").map(Number);
    const base = new Date(y, m - 1, d);
    const names = ["Thu", "Fri", "Sat", "Sun"];
    const full = ["Thursday", "Friday", "Saturday", "Sunday"];
    const out = [];
    for (let i = 0; i < 4; i++) {
      const dt = new Date(base);
      dt.setDate(base.getDate() + i);
      out.push({
        name: names[i],
        full: full[i],
        iso: `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`,
        dateLabel: `${dt.getMonth() + 1}/${dt.getDate()}`,
      });
    }
    return out;
  }

  async function getForecast() {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
      `&timezone=${encodeURIComponent(TZ)}&temperature_unit=fahrenheit&forecast_days=16` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
      `&hourly=temperature_2m,weather_code,precipitation_probability`;
    const r = await fetch(url);
    if (!r.ok) throw new Error("weather fetch failed");
    return r.json();
  }

  /* ---------------- masthead widget ---------------- */
  async function initWidget() {
    const cells = [...document.querySelectorAll("#wx-widget .wx__day")];
    if (!cells.length) return;
    const days = eventDays();
    cells.forEach((c, i) => { c.querySelector(".wx__date").textContent = days[i].dateLabel; });

    const soon = (c) => {
      c.querySelector(".wx__icon").textContent = "🗓️";
      c.querySelector(".wx__temp").innerHTML = "<small>soon</small>";
    };

    let data;
    try { data = await getForecast(); }
    catch (e) { cells.forEach(soon); return; }

    const t = data.daily.time;
    cells.forEach((c, i) => {
      const idx = t.indexOf(days[i].iso);
      if (idx === -1) { soon(c); return; }
      const [emoji] = wx(data.daily.weather_code[idx]);
      const hi = Math.round(data.daily.temperature_2m_max[idx]);
      const lo = Math.round(data.daily.temperature_2m_min[idx]);
      c.querySelector(".wx__icon").textContent = emoji;
      c.querySelector(".wx__temp").innerHTML = `<b>${hi}°</b>/<i>${lo}°</i>`;
    });
  }

  /* ---------------- hourly page ---------------- */
  async function initHourly() {
    const wrap = document.getElementById("wx-hourly");
    if (!wrap) return;
    const days = eventDays();

    let data;
    try { data = await getForecast(); }
    catch (e) {
      wrap.innerHTML = `<div class="fc-msg">Couldn't load the forecast right now — try again in a bit. 🌦️</div>`;
      return;
    }

    const { time: ht, temperature_2m: htemp, weather_code: hcode, precipitation_probability: hp } = data.hourly;
    const dt = data.daily.time;
    let html = "";

    days.forEach((day) => {
      const di = dt.indexOf(day.iso);
      const hours = [];
      for (let i = 0; i < ht.length; i++) if (ht[i].startsWith(day.iso)) hours.push(i);

      if (!hours.length) {
        html +=
          `<section class="fc-day"><div class="fc-day__head"><b>${day.full}</b>` +
          `<span class="fc-day__soon">hourly unlocks ~2 weeks out — check back closer 🔮</span></div></section>`;
        return;
      }

      const [emoji, label] = di > -1 ? wx(data.daily.weather_code[di]) : wx(hcode[hours[0]]);
      const hi = di > -1 ? Math.round(data.daily.temperature_2m_max[di]) + "°" : "—";
      const lo = di > -1 ? Math.round(data.daily.temperature_2m_min[di]) + "°" : "—";

      let cellsHtml = "";
      hours.forEach((i) => {
        const hr = new Date(ht[i]).getHours();
        const lab = (hr % 12 === 0 ? 12 : hr % 12) + (hr < 12 ? "a" : "p");
        const [e2] = wx(hcode[i]);
        const pct = hp[i] == null ? 0 : hp[i];
        cellsHtml +=
          `<div class="fc-hour"><span class="fc-hour__t">${lab}</span>` +
          `<span class="fc-hour__i">${e2}</span><span class="fc-hour__d">${Math.round(htemp[i])}°</span>` +
          `<span class="fc-hour__p">${pct}%</span></div>`;
      });

      html +=
        `<section class="fc-day"><div class="fc-day__head"><b>${day.full}</b>` +
        `<span class="fc-day__hilo">H ${hi} · L ${lo}</span>` +
        `<span class="fc-day__sum">${emoji} ${label}</span></div>` +
        `<div class="fc-hours">${cellsHtml}</div></section>`;
    });

    wrap.innerHTML = html;
  }

  document.addEventListener("DOMContentLoaded", () => { initWidget(); initHourly(); });
})();
