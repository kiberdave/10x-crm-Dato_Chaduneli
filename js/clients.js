/**
 * clients.js
 * P4 — Clients (clients.html), the core of the app.
 */

let clientsState = [];
let activeStatusFilter = "All";
let activeSort = "newest";
let activeDetailClientId = null;
/* null = Add Client modal is in "create" mode; a client id = "edit" mode
   (bonus: Edit reuses the same modal/form, submits PUT instead of POST). */
let editingClientId = null;

/* ---------------- rendering ---------------- */

function badgeClassFor(status) {
  return (
    {
      Lead: "badge badge-lead",
      Contacted: "badge badge-contacted",
      Won: "badge badge-won",
      Lost: "badge badge-lost",
    }[status] || "badge"
  );
}

function getVisibleClients() {
  const searchInput = document.getElementById("search-input");
  const query = searchInput ? searchInput.value.trim().toLowerCase() : "";

  let visible = [...clientsState];

  if (activeStatusFilter !== "All") {
    visible = visible.filter((c) => c.status === activeStatusFilter);
  }

  if (query) {
    visible = visible.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        (c.company || "").toLowerCase().includes(query)
    );
  }

  if (activeSort === "newest") {
    visible.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (activeSort === "name") {
    visible.sort((a, b) => a.name.localeCompare(b.name));
  } else if (activeSort === "value") {
    visible.sort((a, b) => b.dealValue - a.dealValue);
  }

  return visible;
}

/**
 * DOM-building version of the empty state: no HTML string is parsed,
 * so there is nothing to escape.
 */
function createEmptyState(message) {
  const div = document.createElement("div");
  div.className = "empty-state";
  div.textContent = message;
  return div;
}

/**
 * Builds one client card as real DOM nodes instead of an HTML string.
 * textContent/src/dataset never get parsed as markup, so this is safe
 * by construction — no escapeHtml() calls needed anywhere in here.
 */
function createClientCard(c) {
  const card = document.createElement("div");
  card.className = "client-card";
  card.dataset.id = c.id;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  if (c.image) {
    const img = document.createElement("img");
    img.src = c.image;
    img.alt = "";
    avatar.appendChild(img);
  } else {
    avatar.textContent = initials(c.name);
  }

  const info = document.createElement("div");
  info.className = "info";

  const nameEl = document.createElement("p");
  nameEl.className = "cname";
  nameEl.textContent = c.name;

  const metaEl = document.createElement("p");
  metaEl.className = "cmeta";
  metaEl.textContent = `${c.company || "—"} · ${c.email}`;

  const valueEl = document.createElement("p");
  valueEl.className = "cvalue";
  valueEl.textContent = formatCurrency(c.dealValue);

  info.append(nameEl, metaEl, valueEl);

  const actions = document.createElement("div");
  actions.className = "row-actions";

  const statusSelect = document.createElement("select");
  statusSelect.className = `status-select status-select-${c.status.toLowerCase()}`;
  statusSelect.dataset.id = c.id;
  ["Lead", "Contacted", "Won", "Lost"].forEach((s) => {
    const option = document.createElement("option");
    option.value = s;
    option.textContent = s;
    option.selected = s === c.status;
    statusSelect.appendChild(option);
  });

  const editBtn = document.createElement("button");
  editBtn.className = "btn-sm edit-btn";
  editBtn.dataset.id = c.id;
  editBtn.textContent = "Edit";

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "btn-danger btn-sm delete-btn";
  deleteBtn.dataset.id = c.id;
  deleteBtn.textContent = "Delete";

  actions.append(statusSelect, editBtn, deleteBtn);
  card.append(avatar, info, actions);
  return card;
}

function renderClients() {
  const container = document.getElementById("client-list");
  if (!container) return;

  const visible = getVisibleClients();

  if (visible.length === 0) {
    container.replaceChildren(createEmptyState("No clients found."));
    updateStatsIfPresent();
    return;
  }

  container.replaceChildren(...visible.map(createClientCard));
  updateStatsIfPresent();
}

/* keep the (optional) dashboard-style summary in sync if present on this page */
function updateStatsIfPresent() {
  const totalEl = document.getElementById("clients-count");
  if (totalEl) totalEl.textContent = clientsState.length;
}

/* ---------------- initial load ---------------- */

async function initClientsPage() {
  const container = document.getElementById("client-list");
  if (!container) return;

  container.innerHTML = `<div class="loading-state">Loading clients...</div>`;

  const { clients, error } = await loadClients();

  if (error) {
    container.innerHTML = `
      <div class="error-state">
        <p style="margin:0;">Could not load clients. Check your connection and try again.</p>
        <button id="retry-load-btn">Retry</button>
      </div>`;
    document.getElementById("retry-load-btn").addEventListener("click", initClientsPage);
    return;
  }

  clientsState = clients;
  renderClients();
  wireToolbar();
  wireListDelegation();
  wireAddModal();
  wireDetailModal();
}

/* ---------------- toolbar: search / filter chips / sort ---------------- */

function wireToolbar() {
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", renderClients);
  }

  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      activeStatusFilter = chip.dataset.status;
      renderClients();
    });
  });

  const sortSelect = document.getElementById("sort-select");
  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      activeSort = sortSelect.value;
      renderClients();
    });
  }
}

/* ---------------- list-level events: status change / delete / open detail ---------------- */

function wireListDelegation() {
  const container = document.getElementById("client-list");
  if (!container) return;

  container.addEventListener("change", (e) => {
    if (!e.target.classList.contains("status-select")) return;
    const id = Number(e.target.dataset.id);
    const client = clientsState.find((c) => c.id === id);
    if (!client) return;
    client.status = e.target.value;
    saveClients(clientsState);
    renderClients();
  });

  container.addEventListener("click", (e) => {
    if (e.target.classList.contains("delete-btn")) {
      handleDeleteClient(Number(e.target.dataset.id));
      return;
    }
    if (e.target.classList.contains("edit-btn")) {
      openEditModal(Number(e.target.dataset.id));
      return;
    }
    if (e.target.classList.contains("status-select")) return;
    const card = e.target.closest(".client-card");
    if (card) openDetailModal(Number(card.dataset.id));
  });
}

async function handleDeleteClient(id) {
  const confirmed = confirm("Delete this client? This cannot be undone.");
  if (!confirmed) return;

  try {
    await fetch(`https://dummyjson.com/users/${id}`, { method: "DELETE" });
  } catch (e) {
    /* DummyJSON may fail or 404 for client-generated ids — we still remove
       the client locally, since this is the expected mock-API behaviour. */
  }

  clientsState = clientsState.filter((c) => c.id !== id);
  saveClients(clientsState);
  renderClients();
  showToast("Client deleted", "success");
}

/* ---------------- add client modal ---------------- */

function wireAddModal() {
  const openBtn = document.getElementById("add-client-btn");
  const overlay = document.getElementById("add-modal");
  const closeBtn = document.getElementById("add-modal-close");
  const form = document.getElementById("add-client-form");
  const title = document.getElementById("add-modal-title");
  const submitBtn = document.getElementById("add-submit-btn");
  if (!openBtn || !overlay || !form) return;

  const open = () => {
    editingClientId = null;
    form.reset();
    clearFieldErrors(form);
    title.textContent = "Add client";
    submitBtn.textContent = "Add client";
    overlay.classList.remove("hidden");
  };
  const close = () => {
    overlay.classList.add("hidden");
    editingClientId = null;
  };

  openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearFieldErrors(form);

    const name = form.clientName.value.trim();
    const email = form.email.value.trim();
    const phone = form.phone.value.trim();
    const company = form.company.value.trim();
    const dealValueRaw = form.dealValue.value.trim();
    const dealValue = Number(dealValueRaw);
    const status = form.status.value;

    let hasError = false;

    if (name.length < 3) {
      setFieldError(form, "clientName", "Name must be at least 3 characters");
      hasError = true;
    }
    if (!isValidEmail(email)) {
      setFieldError(form, "email", "Please enter a valid email address");
      hasError = true;
    } else if (
      clientsState.some(
        (c) => c.email.toLowerCase() === email.toLowerCase() && c.id !== editingClientId
      )
    ) {
      setFieldError(form, "email", "A client with this email already exists");
      hasError = true;
    }
    if (phone && phone.length < 6) {
      setFieldError(form, "phone", "Phone number looks too short");
      hasError = true;
    }
    if (dealValueRaw === "" || isNaN(dealValue) || dealValue <= 0) {
      setFieldError(form, "dealValue", "Deal value must be a positive number");
      hasError = true;
    }

    if (hasError) return;

    submitBtn.disabled = true;

    if (editingClientId !== null) {
      try {
        await fetch(`https://dummyjson.com/users/${editingClientId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: name.split(" ")[0],
            lastName: name.split(" ").slice(1).join(" ") || "",
          }),
        });
      } catch (err) {
        /* Same as delete: DummyJSON may 404 for client-generated ids since
           it never actually stored them — update locally regardless. */
      }

      const client = clientsState.find((c) => c.id === editingClientId);
      if (client) {
        Object.assign(client, { name, email, phone, company, dealValue, status });
      }
      saveClients(clientsState);
      renderClients();
      submitBtn.disabled = false;
      close();
      showToast("Client updated ✓", "success");
      return;
    }

    let apiClient = null;
    try {
      const res = await fetch("https://dummyjson.com/users/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: name.split(" ")[0], lastName: name.split(" ").slice(1).join(" ") || "" }),
      });
      apiClient = await res.json();
    } catch (err) {
      /* Network failure: still add locally so the flow keeps working offline. */
    }

    const newClient = {
      id: (apiClient && apiClient.id) || Date.now(),
      name,
      email,
      phone,
      company,
      image: "",
      status,
      dealValue,
      notes: [],
      createdAt: new Date().toISOString(),
    };

    clientsState.unshift(newClient);
    saveClients(clientsState);
    renderClients();
    submitBtn.disabled = false;
    close();
    showToast("Client added ✓", "success");
  });
}

/** Opens the same Add Client modal pre-filled for editing (bonus: PUT). */
function openEditModal(id) {
  const client = clientsState.find((c) => c.id === id);
  if (!client) return;

  const form = document.getElementById("add-client-form");
  const overlay = document.getElementById("add-modal");
  const title = document.getElementById("add-modal-title");
  const submitBtn = document.getElementById("add-submit-btn");

  editingClientId = id;
  clearFieldErrors(form);
  form.clientName.value = client.name;
  form.email.value = client.email;
  form.phone.value = client.phone || "";
  form.company.value = client.company || "";
  form.dealValue.value = client.dealValue;
  form.status.value = client.status;

  title.textContent = "Edit client";
  submitBtn.textContent = "Save changes";
  overlay.classList.remove("hidden");
}

/* ---------------- client detail modal: notes + reminder ---------------- */

function wireDetailModal() {
  const overlay = document.getElementById("detail-modal");
  const closeBtn = document.getElementById("detail-modal-close");
  const addNoteBtn = document.getElementById("add-note-btn");
  const remindBtn = document.getElementById("remind-btn");
  if (!overlay) return;

  const close = () => overlay.classList.add("hidden");
  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  addNoteBtn.addEventListener("click", () => {
    const input = document.getElementById("note-input");
    const text = input.value.trim();
    if (!text) return;

    const client = clientsState.find((c) => c.id === activeDetailClientId);
    if (!client) return;

    client.notes.push({ text, date: new Date().toLocaleString() });
    saveClients(clientsState);
    input.value = "";
    renderNotesList(client);
  });

  remindBtn.addEventListener("click", () => {
    const client = clientsState.find((c) => c.id === activeDetailClientId);
    if (!client) return;
    showToast("Reminder set ✓", "success");
    setTimeout(() => {
      showToast(`⏰ Follow up: ${client.name}`, "success");
    }, 60000);
  });
}

function renderNotesList(client) {
  const list = document.getElementById("notes-list");
  if (!client.notes || client.notes.length === 0) {
    list.innerHTML = `<div class="note-empty">No notes yet.</div>`;
    return;
  }
  list.innerHTML = client.notes
    .map(
      (n) => `<div class="note-item">${escapeHtml(n.text)}<span class="note-date">${escapeHtml(
        n.date
      )}</span></div>`
    )
    .join("");
}

function openDetailModal(id) {
  const client = clientsState.find((c) => c.id === id);
  if (!client) return;
  activeDetailClientId = id;

  document.getElementById("detail-avatar").innerHTML = client.image
    ? `<img src="${escapeHtml(client.image)}" alt="">`
    : escapeHtml(initials(client.name));
  document.getElementById("detail-name").textContent = client.name;
  document.getElementById("detail-meta").textContent = `${client.status} · ${formatCurrency(
    client.dealValue
  )} · Client since ${formatDate(client.createdAt)}`;
  document.getElementById("detail-email").textContent = client.email;
  document.getElementById("detail-phone").textContent = client.phone || "—";
  document.getElementById("detail-company").textContent = client.company || "—";

  renderNotesList(client);
  document.getElementById("note-input").value = "";
  document.getElementById("detail-modal").classList.remove("hidden");
}

document.addEventListener("DOMContentLoaded", initClientsPage);
