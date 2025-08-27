// Elements
const tokenSection   = document.getElementById("token-section");
const controlSection = document.getElementById("control-section");

const tokenForm         = document.getElementById("tokenForm");
const companySlugInput  = document.getElementById("companySlugInput");
const tokenInput        = document.getElementById("tokenInput");
const tokenError        = document.getElementById("tokenError");

const gearBtn       = document.getElementById("gear");
const backBtn       = document.getElementById("backBtn");
const toggleSwitch  = document.getElementById("toggleSwitch");
const sessionStatus = document.getElementById("sessionStatus");

// simple UI state: are we in "change" mode (arrived via gear)?
let changeMode = false;
// cache saved creds for comparison to avoid unnecessary registration calls
let lastSaved = { slug: "", token: "" };

function setStatus(running) {
  toggleSwitch.checked = !!running;
  sessionStatus.textContent = running
    ? "Your session is getting recorded"
    : "Your session is not getting recorded";
  sessionStatus.classList.toggle("on", !!running);
  sessionStatus.classList.toggle("off", !running);
}

function showTokenScreen(prefill = { slug: "", token: "" }, { showBack = false } = {}) {
  companySlugInput.value = prefill.slug || "";
  tokenInput.value = prefill.token || "";
  tokenError.classList.add("hidden");

  // Toggle sections
  tokenSection.classList.remove("hidden");
  controlSection.classList.add("hidden");

  // Back button visibility
  if (showBack) {
    backBtn.classList.remove("hidden");
  } else {
    backBtn.classList.add("hidden");
  }

  companySlugInput.focus();
}

function showControlScreen(running) {
  tokenSection.classList.add("hidden");
  controlSection.classList.remove("hidden");
  setStatus(running);
}

async function refresh() {
  try {
    const s = await window.api.getStatus();
    // also get saved auth for comparison usage
    const saved = await window.api.getSavedAuth();
    lastSaved.slug = saved?.companySlug || "";
    lastSaved.token = saved?.token || "";

    if (s.authenticated) {
      showControlScreen(s.running);
    } else {
      showTokenScreen({ slug: lastSaved.slug, token: lastSaved.token }, { showBack: false });
    }
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

  // If unchanged AND we have credentials saved, don't re-register
  if (companySlug === lastSaved.slug && token === lastSaved.token) {
    // Go back to control screen (whatever running state was)
    const s = await window.api.getStatus();
    showControlScreen(!!s.running);
    changeMode = false;
    return;
  }

  console.log('[UI] submitToken', { companySlug, tokenMasked: token.slice(0, 4) + '…' });

  const res = await window.api.submitToken({ token, companySlug });
  if (!res.ok) {
    console.error('[UI] submitToken error:', res.error);
    tokenError.textContent = res.error || "Registration failed";
    tokenError.classList.remove("hidden");
    return;
  }

  // Update local cache
  lastSaved.slug = companySlug;
  lastSaved.token = token;

  // If creds changed, main stops monitoring. User must toggle ON manually.
  showControlScreen(false);
  changeMode = false;
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
  setStatus(!!res.running);
});

// Gear → open change screen with saved values (NO immediate clear)
gearBtn.addEventListener("click", async () => {
  try {
    const saved = await window.api.getSavedAuth();
    lastSaved.slug  = saved?.companySlug || "";
    lastSaved.token = saved?.token || "";
    changeMode = true;
    showTokenScreen({ slug: lastSaved.slug, token: lastSaved.token }, { showBack: true });
  } catch {
    changeMode = true;
    showTokenScreen({ slug: "", token: "" }, { showBack: true });
  }
});

// Back → return to control screen without changes
backBtn.addEventListener("click", async () => {
  const s = await window.api.getStatus();
  showControlScreen(!!s.running);
  changeMode = false;
});


// Add near the top (after selecting elements)
const note = document.createElement('p');
note.className = 'error hidden';
note.style.marginTop = '8px';
document.getElementById('token-section').appendChild(note);

function showNote(msg) {
  note.textContent = msg || '';
  note.classList.toggle('hidden', !msg);
}

// Subscribe to fatal auth error (if preload exposed it)
if (window.api?.onAuthError) {
  window.api.onAuthError((payload) => {
    showTokenScreen({ slug: '', token: '' }, { showBack: false });
    showNote(payload?.message || 'Please reconnect.');
  });
}
