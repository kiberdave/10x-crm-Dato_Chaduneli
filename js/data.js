/**
 * data.js
 * Shared storage layer + helpers used by every page.
 * localStorage keys: crm_users, crm_session, crm_clients, crm_theme
 */

const STORAGE_KEYS = {
  USERS: "crm_users",
  SESSION: "crm_session",
  CLIENTS: "crm_clients",
  THEME: "crm_theme",
};

/* ---------------- users ---------------- */

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
  } catch (e) {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

/* ---------------- session ---------------- */

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSION));
  } catch (e) {
    return null;
  }
}

function saveSession(session) {
  localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
}

/** Returns the full user object for the currently logged-in session, or null. */
function getCurrentUser() {
  const session = getSession();
  if (!session) return null;
  const users = getUsers();
  return users.find((u) => u.id === session.userId) || null;
}

/* ---------------- clients ---------------- */

function getClients() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTS)) || [];
  } catch (e) {
    return [];
  }
}

function saveClients(clients) {
  localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
}

/** Maps a DummyJSON user record onto our Client model. */
function mapApiUserToClient(u) {
  return {
    id: u.id,
    name: `${u.firstName} ${u.lastName}`,
    email: u.email,
    phone: u.phone || "",
    company: (u.company && u.company.name) || "",
    image: u.image || "",
    status: "Lead",
    dealValue: Math.floor(Math.random() * (10000 - 500 + 1)) + 500,
    notes: [],
    createdAt: new Date().toISOString(),
  };
}

/**
 * Ensures crm_clients is populated: read from localStorage if present,
 * otherwise fetch the initial 30 clients from DummyJSON.
 * Returns { clients, error }.
 */
async function loadClients() {
  const existing = localStorage.getItem(STORAGE_KEYS.CLIENTS);
  if (existing) {
    try {
      return { clients: JSON.parse(existing), error: null };
    } catch (e) {
      /* fall through to API load if corrupted */
    }
  }

  try {
    const res = await fetch("https://dummyjson.com/users?limit=30");
    if (!res.ok) throw new Error("Network response was not ok");
    const data = await res.json();
    const clients = (data.users || []).map(mapApiUserToClient);
    saveClients(clients);
    return { clients, error: null };
  } catch (e) {
    return { clients: [], error: e };
  }
}

/* ---------------- theme ---------------- */

function getTheme() {
  return localStorage.getItem(STORAGE_KEYS.THEME) || "light";
}

function saveTheme(theme) {
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

function toggleTheme() {
  const next = getTheme() === "dark" ? "light" : "dark";
  saveTheme(next);
  applyTheme(next);
}

/* ---------------- toast notifications ---------------- */
/* Global success/error banners. Never use browser alert(). */

function ensureToastContainer() {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    /* screen readers announce new toasts without stealing focus */
    container.setAttribute("aria-live", "polite");
    document.body.appendChild(container);
  }
  return container;
}

function showToast(message, type) {
  const container = ensureToastContainer();
  const toast = document.createElement("div");
  toast.className = `toast toast-${type === "error" ? "error" : "success"}`;

  const text = document.createElement("span");
  text.textContent = message;

  const closeBtn = document.createElement("button");
  closeBtn.setAttribute("aria-label", "Dismiss");
  closeBtn.textContent = "×";

  toast.append(text, closeBtn);

  const remove = () => {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  };
  closeBtn.addEventListener("click", remove);
  container.appendChild(toast);
  setTimeout(remove, 3000);
}

/* ---------------- debounce ---------------- */

/**
 * Wraps fn so rapid, repeated calls collapse into one — only the last
 * call within `delay` ms actually runs. Used on the clients search
 * input: without this, renderClients() would re-filter/re-render the
 * whole list on every single keystroke; with it, that only happens
 * once typing actually pauses.
 */
function debounce(fn, delay) {
  let timeoutId;
  return () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(fn, delay);
  };
}

/* ---------------- formatting helpers ---------------- */

function formatCurrency(value) {
  return "$" + Number(value || 0).toLocaleString("en-US");
}

/* "en-US" (not the browser's default locale): the UI copy is English,
   so dates should render in English on any machine too. */
function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString("en-US");
}

function initials(fullName) {
  if (!fullName) return "";
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join("");
}

/** Shared "No clients found." / "No notes yet." style empty box,
    built as a DOM node so there is no HTML string to escape. */
function createEmptyState(message) {
  const div = document.createElement("div");
  div.className = "empty-state";
  div.textContent = message;
  return div;
}

/**
 * Fills an .avatar element with the client's photo or their initials.
 * Built with DOM nodes (not an HTML string) on purpose: img.src treats
 * the URL as plain data, so a quote inside it can never break out of
 * an attribute the way it could in an innerHTML string. Shared by the
 * clients list, the detail modal and the dashboard's recent list.
 */
function fillAvatar(el, client) {
  el.replaceChildren();
  if (client.image) {
    const img = document.createElement("img");
    img.src = client.image;
    img.alt = "";
    /* lists can hold 30-50+ clients — lazy-load so the browser only
       fetches avatars actually scrolled into view, not all at once */
    img.loading = "lazy";
    el.appendChild(img);
  } else {
    el.textContent = initials(client.name);
  }
}

/* ---------------- validation helpers ---------------- */

function isValidEmail(email) {
  const at = email.indexOf("@");
  if (at < 1) return false;
  const dotAfterAt = email.indexOf(".", at);
  return dotAfterAt > at + 1 && dotAfterAt < email.length - 1;
}

function isValidPassword(password) {
  return password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
}

/* ---------------- shared form-error helpers ---------------- */
/* Used by every form across the app: signup, login, add-client,
   edit-profile, change-password. Field errors render directly under the
   field per P0.4, and clear live once the field becomes valid. */

function clearFieldErrors(form) {
  form.querySelectorAll(".field-error").forEach((el) => (el.textContent = ""));
  form.querySelectorAll(".input-error").forEach((el) => el.classList.remove("input-error"));
}

function setFieldError(form, fieldName, message) {
  const input = form.querySelector(`[name="${fieldName}"]`);
  const errorEl = form.querySelector(`[data-error-for="${fieldName}"]`);
  if (input) input.classList.add("input-error");
  if (errorEl) errorEl.textContent = message;
}

function wireLiveClear(form, fieldName, validateFn) {
  const input = form.querySelector(`[name="${fieldName}"]`);
  if (!input) return;
  input.addEventListener("input", () => {
    if (validateFn(input.value)) {
      input.classList.remove("input-error");
      const errorEl = form.querySelector(`[data-error-for="${fieldName}"]`);
      if (errorEl) errorEl.textContent = "";
    }
  });
}
