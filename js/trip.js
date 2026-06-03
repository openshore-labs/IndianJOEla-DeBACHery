/* =========================================================
   IndianJOEla — "choose your own adventure" trip planner
   Walks each guest from their starting point to the house,
   then offers to text the full itinerary with the house pinned.
   ========================================================= */
(function () {
  "use strict";

  const root = document.getElementById("trip");
  if (!root) return;

  const HOUSE = "8435 NE Seaview Ave, Indianola, WA 98342";
  const HOUSE_MAP = "https://maps.apple.com/?q=" + encodeURIComponent(HOUSE);

  // Decision tree. Questions branch; "final" nodes add their steps and finish.
  const NODES = {
    start: {
      q: "Where are you starting from?",
      sub: "Most folks fly into SeaTac or are coming from Seattle.",
      options: [
        { label: "✈️ SeaTac Airport", next: "seatac_mode" },
        { label: "🏙️ Seattle", next: "seattle_ferry" },
      ],
    },

    seatac_mode: {
      q: "How do you want to reach the ferry?",
      sub: "Either way you're headed to Colman Dock (Pier 52) in downtown Seattle to walk onto the Bainbridge ferry.",
      options: [
        {
          label: "🚆 Link Light Rail",
          steps: [
            "Take the Link light rail (1 Line) from SeaTac toward Seattle and get OFF AT PIONEER SQUARE STATION (~40 min). It's the closest stop to the ferry.",
            "From Pioneer Square Station, walk ~5–7 min downhill to Colman Dock / Pier 52 (the Seattle ferry terminal).",
          ],
          next: "walkon_bainbridge",
        },
        {
          label: "🚗 Uber",
          steps: ["Uber from SeaTac straight to Colman Dock / Pier 52 in downtown Seattle (~30 min)."],
          next: "walkon_bainbridge",
        },
      ],
    },

    seattle_ferry: {
      q: "Which ferry works for you?",
      sub: "From Seattle you can go via Bainbridge or Kingston.",
      options: [
        {
          label: "⛴️ Bainbridge (walk on)",
          steps: ["Head to Colman Dock / Pier 52 in downtown Seattle."],
          next: "walkon_bainbridge",
        },
        {
          label: "⛴️ Kingston",
          steps: ["Get up to Edmonds and take the Edmonds → Kingston ferry (~30 min)."],
          next: "kingston_final",
        },
      ],
    },

    walkon_bainbridge: {
      final: true,
      steps: [
        "Walk onto the Seattle → Bainbridge Island ferry (~35 min). Enjoy the ride! ⛴️",
        "Once on Bainbridge, call an Uber for the ~25 min drive to the house in Indianola.",
      ],
    },

    kingston_final: {
      final: true,
      steps: [
        "From Kingston, grab an Uber for the ~15 min drive south to Indianola.",
        'Heads up: Ubers in Kingston are hit-or-miss — if you can\'t snag one, text <a href="sms:+12063342944">Jack (206-334-2944)</a> and we\'ll sort you a ride.',
      ],
    },
  };

  let itinerary = [];
  const history = []; // node ids visited (for Back)

  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function go(nodeId, isBack) {
    const node = NODES[nodeId];
    if (!isBack) history.push(nodeId);
    if (node.final) {
      node.steps.forEach((s) => itinerary.push(s));
      renderSummary();
    } else {
      renderQuestion(node);
    }
  }

  function choose(opt) {
    if (opt.steps) opt.steps.forEach((s) => itinerary.push(s));
    go(opt.next);
  }

  function back() {
    // pop current node; if it was final, drop its steps too (rebuild simplest: reset & replay not needed — just pop)
    history.pop();
    const prev = history[history.length - 1];
    // rebuild itinerary from scratch up to prev is complex; simplest: restart
    itinerary = [];
    history.length = 0;
    if (prev) go(prev);
    else go("start");
  }

  function renderQuestion(node) {
    root.innerHTML = "";
    const card = el("div", "trip__card");
    card.appendChild(el("h3", "trip__q", node.q));
    if (node.sub) card.appendChild(el("p", "trip__sub", node.sub));
    const opts = el("div", "trip__opts");
    node.options.forEach((opt) => {
      const b = el("button", "trip-btn", opt.label);
      b.type = "button";
      b.addEventListener("click", () => choose(opt));
      opts.appendChild(b);
    });
    card.appendChild(opts);
    if (history.length > 1) {
      const b = el("button", "trip__back", "‹ Back");
      b.type = "button";
      b.addEventListener("click", back);
      card.appendChild(b);
    }
    root.appendChild(card);
  }

  function renderSummary() {
    root.innerHTML = "";
    const card = el("div", "trip__card");
    card.appendChild(el("h3", "trip__q", "🧭 Your route to the house"));

    const ol = el("ol", "trip__steps");
    itinerary.forEach((s) => ol.appendChild(el("li", null, s)));
    card.appendChild(ol);

    card.appendChild(
      el("p", "trip__house", `🏠 <b>The house:</b> ${HOUSE}`)
    );

    // SMS body (strip any HTML so links become plain text)
    const strip = (s) => { const d = el("div", null, s); return d.textContent; };
    const lines = itinerary.map((s, i) => `${i + 1}. ${strip(s)}`).join("\n");
    const body =
      `IndianJOEla — your route to the house 🏖️\n\n${lines}\n\n` +
      `🏠 House: ${HOUSE}\n📍 Pin: ${HOUSE_MAP}`;
    const smsHref = "sms:?&body=" + encodeURIComponent(body);

    const actions = el("div", "trip__actions");
    const sms = el("a", "map-btn", "📲 Text me these directions");
    sms.href = smsHref;
    actions.appendChild(sms);

    const map = el("a", "map-btn map-btn--alt", "📍 Open the house in Maps");
    map.href = HOUSE_MAP;
    map.target = "_blank";
    map.rel = "noopener";
    actions.appendChild(map);
    card.appendChild(actions);

    const restart = el("button", "trip__back", "↺ Start over");
    restart.type = "button";
    restart.addEventListener("click", () => { itinerary = []; history.length = 0; go("start"); });
    card.appendChild(restart);

    root.appendChild(card);
  }

  go("start");
})();
