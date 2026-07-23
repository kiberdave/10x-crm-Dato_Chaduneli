/**
 * dashboard.js
 * P3 — Dashboard (dashboard.html)
 */

function renderGreeting() {
  const user = getCurrentUser();
  const el = document.getElementById("greeting");
  if (!el) return;
  const firstName = user && user.fullName ? user.fullName.split(" ")[0] : "there";
  el.textContent = `Welcome back, ${firstName}!`;
}

function startClock() {
  const el = document.getElementById("clock");
  if (!el) return;
  const tick = () => {
    const now = new Date();
    /* "en-US" (not the browser's default locale): the UI copy is
       English, so the clock should be English on any machine too */
    el.textContent = `${now.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })} · ${now.toLocaleTimeString("en-US")}`;
  };
  tick();
  setInterval(tick, 1000);
}

function renderStats(clients) {
  const total = clients.length;
  const activeDeals = clients.filter((c) => c.status !== "Won" && c.status !== "Lost").length;
  const wonRevenue = clients
    .filter((c) => c.status === "Won")
    .reduce((sum, c) => sum + Number(c.dealValue || 0), 0);
  const newThisWeek = clients.filter((c) => {
    const days = (Date.now() - new Date(c.createdAt).getTime()) / 86400000;
    return days <= 7;
  }).length;

  document.getElementById("stat-total").textContent = total;
  document.getElementById("stat-active").textContent = activeDeals;
  document.getElementById("stat-revenue").textContent = formatCurrency(wonRevenue);
  document.getElementById("stat-new").textContent = newThisWeek;
}

function renderPipeline(clients) {
  const counts = { Lead: 0, Contacted: 0, Won: 0, Lost: 0 };
  clients.forEach((c) => {
    if (counts[c.status] !== undefined) counts[c.status]++;
  });
  document.getElementById("pipe-lead").textContent = counts.Lead;
  document.getElementById("pipe-contacted").textContent = counts.Contacted;
  document.getElementById("pipe-won").textContent = counts.Won;
  document.getElementById("pipe-lost").textContent = counts.Lost;
}

function badgeClass(status) {
  return (
    {
      Lead: "badge badge-lead",
      Contacted: "badge badge-contacted",
      Won: "badge badge-won",
      Lost: "badge badge-lost",
    }[status] || "badge"
  );
}

/**
 * Builds one recent-clients row as real DOM nodes, same approach as
 * createClientCard in clients.js — textContent/src never get parsed as
 * markup, so nothing needs escaping.
 */
function createRecentRow(c) {
  const row = document.createElement("div");
  row.className = "recent-row";

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  fillAvatar(avatar, c);

  const info = document.createElement("div");
  const nameEl = document.createElement("p");
  nameEl.className = "name";
  nameEl.textContent = c.name;
  const companyEl = document.createElement("p");
  companyEl.className = "company";
  companyEl.textContent = c.company || "—";
  info.append(nameEl, companyEl);

  const badge = document.createElement("span");
  badge.className = badgeClass(c.status);
  badge.textContent = c.status;

  const dateEl = document.createElement("span");
  dateEl.className = "date";
  dateEl.textContent = formatDate(c.createdAt);

  row.append(avatar, info, badge, dateEl);
  return row;
}

function renderRecentClients(clients) {
  const container = document.getElementById("recent-list");
  if (!container) return;

  const recent = [...clients]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  if (recent.length === 0) {
    container.replaceChildren(createEmptyState("No clients found."));
    return;
  }

  container.replaceChildren(...recent.map(createRecentRow));
}

async function initDashboard() {
  if (!document.getElementById("greeting")) return;

  renderGreeting();
  startClock();

  const listArea = document.getElementById("recent-list");
  if (listArea) listArea.innerHTML = `<div class="loading-state">Loading clients...</div>`;

  const { clients, error } = await loadClients();

  if (error) {
    if (listArea) {
      listArea.innerHTML = `<div class="error-state">Could not load clients. Check your connection and try again.</div>`;
    }
    renderStats([]);
    renderPipeline([]);
    return;
  }

  renderStats(clients);
  renderPipeline(clients);
  renderRecentClients(clients);
}

document.addEventListener("DOMContentLoaded", initDashboard);
