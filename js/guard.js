/**
 * guard.js
 * P0 — global rules that apply on every page:
 *  - Auth Guard: protects dashboard/clients/profile, redirects logged-in
 *    users away from login/signup.
 *  - Wires up nav active state, theme toggle and logout on protected pages.
 * Must run before any page-specific script, and before first paint logic
 * that depends on the session.
 */

const PROTECTED_PAGES = ["dashboard.html", "clients.html", "profile.html"];
const PUBLIC_PAGES = ["index.html", "signup.html"];

function currentPageName() {
  let page = window.location.pathname.split("/").pop() || "index.html";
  /* some static servers ("clean URLs" mode, e.g. `npx serve`) redirect
     /profile.html to /profile — normalize back so the page-name lists
     above match no matter how the site is served */
  if (!page.includes(".")) page += ".html";
  return page;
}

function runAuthGuard() {
  const page = currentPageName();
  const session = getSession();

  if (PROTECTED_PAGES.includes(page) && !session) {
    window.location.href = "index.html";
    return false;
  }

  if (PUBLIC_PAGES.includes(page) && session) {
    window.location.href = "dashboard.html";
    return false;
  }

  return true;
}

/* Run the guard immediately (before DOMContentLoaded) to avoid a flash
   of protected content or a flash of the login form. */
const guardPassed = runAuthGuard();

function highlightActiveNav() {
  const page = currentPageName();
  document.querySelectorAll(".nav-link").forEach((link) => {
    const href = link.getAttribute("href");
    if (href === page) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

function wireLogout() {
  const btn = document.getElementById("logout-btn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    clearSession();
    window.location.href = "index.html";
  });
}

function wireThemeToggle() {
  const toggle = document.getElementById("theme-toggle");
  if (!toggle) return;
  toggle.addEventListener("click", toggleTheme);
}

document.addEventListener("DOMContentLoaded", () => {
  if (!guardPassed) return;
  highlightActiveNav();
  wireLogout();
  wireThemeToggle();
});
