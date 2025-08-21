// Elements
const tokenSection   = document.getElementById("token-section");
const controlSection = document.getElementById("control-section");

const tokenForm   = document.getElementById("tokenForm");
const tokenInput  = document.getElementById("tokenInput");
const tokenError  = document.getElementById("tokenError");

const gearBtn       = document.getElementById("gear");
const toggleSwitch  = document.getElementById("toggleSwitch");
const sessionStatus = document.getElementById("sessionStatus");

window.addEventListener("DOMContentLoaded", () => {

  // Initial screen
  const savedToken = localStorage.getItem("token");
  if (savedToken) showControlScreen();
  else showTokenScreen("");



// Helpers: show/hide screens
function showTokenScreen(prefill = "") {
  tokenInput.value = prefill;
  tokenError.classList.add("hidden");
  tokenSection.classList.remove("hidden");
  controlSection.classList.add("hidden");
  tokenInput.focus();
}
function showControlScreen() {
  console.log("Showing control screen");
  tokenSection.classList.add("hidden");
  controlSection.classList.remove("hidden");
}


// Token form submit (Save button or Enter key)
tokenForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const value = tokenInput.value.trim();

  if (!value) {
    tokenError.textContent = "Please enter a token";
    tokenError.classList.remove("hidden");
    return;
  }
  tokenError.textContent = "";
  localStorage.setItem("token", value);
  showControlScreen();
});

// Toggle behavior
toggleSwitch.addEventListener("change", () => {
  if (toggleSwitch.checked) {
    sessionStatus.textContent = "Your session is getting recorded";
    sessionStatus.classList.remove("off");
    sessionStatus.classList.add("on");
    console.log("Sentinel: ON");
  } else {
    sessionStatus.textContent = "Your session is not getting recorded";
    sessionStatus.classList.remove("on");
    sessionStatus.classList.add("off");
    console.log("Sentinel: OFF");
  }
});

// Gear: go to token edit (prefill with current token)
gearBtn.addEventListener("click", () => {
  const current = localStorage.getItem("token") || "";
  showTokenScreen(current);
});



});