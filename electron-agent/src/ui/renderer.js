// Elements
const tokenSection   = document.getElementById("token-section");
const controlSection = document.getElementById("control-section");

const tokenForm         = document.getElementById("tokenForm");
const companySlugInput  = document.getElementById("companySlugInput");
const tokenInput        = document.getElementById("tokenInput");
const tokenError        = document.getElementById("tokenError");

const gearBtn       = document.getElementById("gear");
const toggleSwitch  = document.getElementById("toggleSwitch");
const sessionStatus = document.getElementById("sessionStatus");

function showTokenScreen(prefill = { slug: "", token: "" }) {
  companySlugInput.value = prefill.slug || "";
  tokenInput.value = prefill.token || "";
  tokenError.classList.add("hidden");
  tokenSection.classList.remove("hidden");
  controlSection.classList.add("hidden");
  companySlugInput.focus();
}

function showControlScreen(running) {
  tokenSection.classList.add("hidden");
  controlSection.classList.remove("hidden");
  toggleSwitch.checked = !!running;
  sessionStatus.textContent = running
    ? "Your session is getting recorded"
    : "Your session is not getting recorded";
  sessionStatus.classList.toggle("on", !!running);
  sessionStatus.classList.toggle("off", !running);
}

async function refresh() {
  try {
    const s = await window.api.getStatus();
    console.log('[UI] status:', s);
    if (s.authenticated) showControlScreen(s.running);
    else showTokenScreen();
  } catch (e) {
    console.error('[UI] getStatus failed:', e);
    showTokenScreen();
  }
}

// Init
window.addEventListener("DOMContentLoaded", refresh);

// Submit slug+token
tokenForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const companySlug = (companySlugInput.value || "").trim().toLowerCase();
  const token = (tokenInput.value || "").trim();

  if (!companySlug || !token) {
    tokenError.textContent = "Please enter company slug and token";
    tokenError.classList.remove("hidden");
    return;
  }
  tokenError.classList.add("hidden");

  console.log('[UI] submitToken', { companySlug, tokenMasked: token.slice(0, 4) + '…' });

  const res = await window.api.submitToken({ token, companySlug });
  if (!res.ok) {
    console.error('[UI] submitToken error:', res.error);
    tokenError.textContent = res.error || "Registration failed";
    tokenError.classList.remove("hidden");
    return;
  }
  await refresh();
});

// Toggle on/off
toggleSwitch.addEventListener("change", async () => {
  const on = toggleSwitch.checked;
  console.log('[UI] toggle', on);
  const res = await window.api.toggle(on);
  if (!res.ok) {
    toggleSwitch.checked = !on;
    alert(res.error || "Failed to toggle");
    return;
  }
  sessionStatus.textContent = res.running
    ? "Your session is getting recorded"
    : "Your session is not getting recorded";
  sessionStatus.classList.toggle("on", !!res.running);
  sessionStatus.classList.toggle("off", !res.running);
});

// Gear → reset to token screen
gearBtn.addEventListener("click", async () => {
  console.log('[UI] clearToken');
  await window.api.clearToken();
  showTokenScreen();
});
