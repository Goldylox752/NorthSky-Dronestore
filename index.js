<script>
/* ================= CONFIG ================= */
const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
const SUPABASE_KEY = "YOUR_PUBLIC_ANON_KEY";

/* ================= INIT ================= */
let supabase = null;

function initSupabase(){
  try {
    if (window.supabase && SUPABASE_URL && SUPABASE_KEY) {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
  } catch (e) {}
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
    utm_source: p.get("utm_source") || null,
    utm_campaign: p.get("utm_campaign") || null,
    utm_content: p.get("utm_content") || null
  };
}

function getCost(){
  const p = new URLSearchParams(window.location.search);
  return parseFloat(p.get("cpc")) || 0;
}

/* ================= TRACKING CORE ================= */
async function track(event, meta = {}) {

  const payload = {
    event,
    meta: {
      ...meta,
      ...getUTMs(),
      cost: getCost(),
      url: window.location.href,
      session_id: SESSION_ID,
      referrer: document.referrer || "direct",
      user_agent: navigator.userAgent
    },
    time: new Date().toISOString()
  };

  if (!supabase) return;

  try {
    await supabase.from("events").insert([payload]);
  } catch (e) {}
}

/* ================= TRAFFIC SOURCE (SIMPLIFIED) ================= */
function getTrafficSource(){
  const ref = document.referrer;
  if (!ref) return "direct";
  if (ref.includes("facebook")) return "facebook";
  if (ref.includes("google")) return "google";
  if (ref.includes("tiktok")) return "tiktok";
  if (ref.includes("RoofFlow")) return "roofflow";
  return "other";
}

/* ================= CHECKOUT (ONLY ONE VERSION) ================= */
function goToCheckout(){

  const utms = getUTMs();

  const url = new URL("https://buy.stripe.com/9B6eV64qDcT20xpeDC2ZO0i");

  url.searchParams.append("client_reference_id", SESSION_ID);
  url.searchParams.append("utm_source", utms.utm_source || "");
  url.searchParams.append("utm_campaign", utms.utm_campaign || "");
  url.searchParams.append("utm_content", utms.utm_content || "");
  url.searchParams.append("cpc", getCost());

  track("checkout_click", { source: getTrafficSource() });

  window.location.href = url.toString();
}

/* ================= CTA TRACKING ================= */
function bindCTAs(){
  document.querySelectorAll("a").forEach(a=>{
    a.addEventListener("click", ()=>{
      const href = a.getAttribute("href") || "";

      if (href.includes("stripe")){
        track("cta_purchase_click", { source: getTrafficSource() });
      }

      if (href.includes("RoofFlow")){
        track("view_roofflow", { source: getTrafficSource() });
      }

      if (href.includes("northsky")){
        track("view_drone", { source: getTrafficSource() });
      }
    });
  });
}

/* ================= SCROLL ================= */
function trackScroll(){
  let fired = false;

  window.addEventListener("scroll", ()=>{
    const p = window.scrollY / (document.body.scrollHeight - window.innerHeight);

    if (p > 0.6 && !fired){
      fired = true;
      track("scroll_60");
    }
  });
}

/* ================= POPUP ================= */
function showPopup(){
  if (localStorage.getItem("emailCaptured")) return;

  setTimeout(()=>{
    const popup = document.getElementById("popup");
    if (popup){
      popup.style.display = "block";
      track("popup_shown");
    }
  }, 3000);
}

/* ================= EMAIL ================= */
async function submitEmail(){
  const email = document.getElementById("emailInput")?.value?.trim();

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
      source: getTrafficSource(),
      created_at: new Date().toISOString()
    }]);
  }

  alert("Discount unlocked!");
  document.getElementById("popup").style.display = "none";
}

/* ================= INIT ================= */
window.addEventListener("load", ()=>{
  track("page_view", { source: getTrafficSource() });
  bindCTAs();
  trackScroll();
  showPopup();
});
</script>