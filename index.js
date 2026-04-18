<script>
/* ================= CONFIG ================= */
const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
const SUPABASE_KEY = "YOUR_PUBLIC_ANON_KEY";

/* ================= INIT ================= */
let supabase = null;

function initSupabase(){
  if (window.supabase && SUPABASE_URL && SUPABASE_KEY) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }
}

initSupabase();

/* ================= SESSION ================= */
function getSessionId(){
  let id = localStorage.getItem("session_id");
  if (!id){
    id = crypto.randomUUID();
    localStorage.setItem("session_id", id);
  }
  return id;
}

const SESSION_ID = getSessionId();

/* ================= URL DATA ================= */
function getUTMs(){
  const p = new URLSearchParams(window.location.search);
  return {
    utm_source: p.get("utm_source") || "direct",
    utm_campaign: p.get("utm_campaign") || null,
    utm_content: p.get("utm_content") || null,
    cpc: parseFloat(p.get("cpc")) || 0
  };
}

/* ================= CORE TRACKING ================= */
async function track(event, meta = {}) {

  const data = {
    event,
    meta: {
      ...meta,
      ...getUTMs(),
      session_id: SESSION_ID,
      url: location.href,
      referrer: document.referrer || "direct",
      user_agent: navigator.userAgent
    },
    time: new Date().toISOString()
  };

  if (!supabase) return;

  try {
    await supabase.from("events").insert([data]);
  } catch (e) {
    console.log("track error:", e.message);
  }
}

/* ================= CHECKOUT ================= */
function goToCheckout(){

  const utm = getUTMs();

  const url = new URL("https://buy.stripe.com/9B6eV64qDcT20xpeDC2ZO0i");

  url.searchParams.set("client_reference_id", SESSION_ID);
  url.searchParams.set("utm_source", utm.utm_source);
  url.searchParams.set("utm_campaign", utm.utm_campaign || "");
  url.searchParams.set("utm_content", utm.utm_content || "");
  url.searchParams.set("cpc", utm.cpc);

  track("checkout_click", {
    source: utm.utm_source
  });

  window.location.href = url.toString();
}

/* ================= CTA TRACKING ================= */
function bindCTAs(){

  document.querySelectorAll("a").forEach(el => {

    el.addEventListener("click", () => {

      const href = el.href || "";

      if (href.includes("stripe")){
        track("cta_click", { type: "purchase" });
      }

      if (href.includes("RoofFlow")){
        track("view_roofflow", { source: getUTMs().utm_source });
      }

      if (href.includes("northsky")){
        track("view_drone");
      }
    });

  });
}

/* ================= SCROLL DEPTH ================= */
function trackScroll(){

  let done = false;

  window.addEventListener("scroll", () => {

    const percent =
      window.scrollY /
      (document.body.scrollHeight - window.innerHeight);

    if (percent > 0.6 && !done){
      done = true;
      track("scroll_60");
    }

  });

}

/* ================= POPUP ================= */
function showPopup(){

  if (localStorage.getItem("emailCaptured")) return;

  setTimeout(() => {
    const popup = document.getElementById("popup");
    if (popup){
      popup.style.display = "block";
      track("popup_shown");
    }
  }, 3000);

}

/* ================= EMAIL ================= */
async function submitEmail(){

  const input = document.getElementById("emailInput");
  const email = input?.value?.trim();

  if (!email || !email.includes("@")){
    alert("Enter valid email");
    return;
  }

  localStorage.setItem("emailCaptured", "true");

  await track("email_capture", { email });

  if (supabase){
    await supabase.from("leads").insert([{
      email,
      session_id: SESSION_ID,
      source: getUTMs().utm_source,
      created_at: new Date().toISOString()
    }]);
  }

  alert("Discount unlocked!");
  document.getElementById("popup").style.display = "none";
}

/* ================= INIT ================= */
window.addEventListener("load", () => {

  track("page_view", {
    source: getUTMs().utm_source
  });

  bindCTAs();
  trackScroll();
  showPopup();

});
</script>