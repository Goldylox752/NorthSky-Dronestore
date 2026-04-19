(function () {

  /* ===============================
     GUARD (PREVENT DOUBLE LOAD)
  =============================== */
  if (window.NorthSkyOS?.__loaded) return;

  /* ===============================
     CONFIG
  =============================== */

  const CONFIG = {
    sessionKey: "ns_session_id",
    userKey: "ns_user_id",
    scoreKey: "ns_score",

    hotThreshold: 15,

    funnelURL: "https://goldylox752.github.io/RoofFlow-AI/",
    crmEndpoint: null,

    source: "northsky_os"
  };

  /* ===============================
     IDENTITY LAYER
  =============================== */

  const uuid = () => crypto.randomUUID();

  const getOrCreate = (key) => {
    let v = localStorage.getItem(key);
    if (!v) {
      v = uuid();
      localStorage.setItem(key, v);
    }
    return v;
  };

  const session_id = getOrCreate(CONFIG.sessionKey);
  const user_id = getOrCreate(CONFIG.userKey);

  /* ===============================
     SCORE ENGINE (SINGLE SOURCE)
  =============================== */

  const SCORE_MAP = {
    page_view: 1,
    click: 2,
    scroll: 1,
    funnel_click: 8,
    stripe_click: 15,
    lead: 20
  };

  function getScore() {
    return Number(localStorage.getItem(CONFIG.scoreKey) || 0);
  }

  function setScore(v) {
    localStorage.setItem(CONFIG.scoreKey, String(v));
    return v;
  }

  function addScore(event) {
    const next = getScore() + (SCORE_MAP[event] || 0);
    return setScore(next);
  }

  function getStage(score) {
    if (score >= CONFIG.hotThreshold) return "HOT";
    if (score >= 6) return "WARM";
    return "COLD";
  }

  /* ===============================
     CRM PIPELINE
  =============================== */

  async function send(event, data = {}) {

    const score = getScore();

    const payload = {
      event,
      data,

      session_id,
      user_id,

      score,
      stage: getStage(score),

      source: CONFIG.source,
      url: location.href,
      referrer: document.referrer,
      time: new Date().toISOString()
    };

    console.log("[NS EVENT]", payload);

    if (CONFIG.crmEndpoint) {
      try {
        await fetch(CONFIG.crmEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } catch (e) {}
    }

    return payload;
  }

  /* ===============================
     CORE TRACK FUNCTION
  =============================== */

  function track(event, data = {}) {

    const score = addScore(event);

    const payload = {
      event,
      data,
      session_id,
      user_id,
      score,
      stage: getStage(score),
      url: location.href
    };

    console.log("[TRACK]", payload);

    send(event, data);

    // AUTO FUNNEL LOGIC
    if (score >= CONFIG.hotThreshold) {
      route("hot_lead");
    }

    return payload;
  }

  /* ===============================
     FUNNEL ROUTER (SINGLE EXIT POINT)
  =============================== */

  function route(reason = "manual") {

    const score = getScore();

    send("route", { reason, score });

    if (score >= CONFIG.hotThreshold) {
      window.location.href = CONFIG.funnelURL;
    }
  }

  function go(url, label = "funnel") {
    track("funnel_click", { url, label });
    window.open(url, "_blank");
  }

  /* ===============================
     AUTO TRACKING INIT
  =============================== */

  function init() {

    track("page_view");

    document.addEventListener("click", (e) => {
      const el = e.target.closest("a, button");
      if (!el) return;

      track("click", {
        text: el.innerText?.trim() || null,
        href: el.href || null
      });
    });

    let start = Date.now();

    window.addEventListener("beforeunload", () => {
      send("time_on_page", {
        seconds: Math.round((Date.now() - start) / 1000)
      });
    });
  }

  document.addEventListener("DOMContentLoaded", init);

  /* ===============================
     GLOBAL EXPORT
  =============================== */

  window.NorthSkyOS = {
    __loaded: true,

    track,
    send,
    go,
    route,

    session: () => session_id,
    user: () => user_id,

    score: getScore,
    stage: () => getStage(getScore())
  };

})();