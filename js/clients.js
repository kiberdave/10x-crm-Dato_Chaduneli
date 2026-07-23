/**
 * clients.js
 * P4 — Clients (clients.html), the core of the app.
 */

let clientsState = [];
let activeStatusFilter = "All";
let activeSort = "newest";
let activeDetailClientId = null;
/* null = Add Client modal is in "create" mode; a client id = "edit" mode (bonus: Edit reuses the same modal/form, submits PUT instead of POST). */
let editingClientId = null;
/* client id -> setTimeout id for a pending "Remind me in 1 min".
   Without this, clicking Remind twice for the same client stacks up two independent timers (two toasts fire), and deleting a client with a pending reminder still shows a follow-up toast for someone who's no longer in the list. */
let reminderTimers = {};

/* ---------------- rendering ---------------- */

function getVisibleClients() {
  const searchInput = document.getElementById("search-input");
  const query = searchInput ? searchInput.value.trim().toLowerCase() : "";

  // Start with a copy of the full clientsState array, then filter/sort it in place.
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
 * Builds one client card as real DOM nodes instead of an HTML string.
 * textContent/src/dataset never get parsed as markup, so this is safe by construction — no HTML escaping needed anywhere in here.
 */
function createClientCard(c) {
  const card = document.createElement("div");
  card.className = "client-card";
  card.dataset.id = c.id;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  fillAvatar(avatar, c);

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
    return;
  }

  container.replaceChildren(...visible.map(createClientCard));
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
        <p>Could not load clients. Check your connection and try again.</p>
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
    searchInput.addEventListener("input", debounce(renderClients, 300));
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

/** Returns true if the client was actually deleted, false if the user
    cancelled — callers that need to close a modal afterward (like the
    detail modal) check this instead of always closing regardless. */
async function handleDeleteClient(id) {
  const confirmed = confirm("Delete this client? This cannot be undone.");
  if (!confirmed) return false;

  if (reminderTimers[id]) {
    clearTimeout(reminderTimers[id]);
    delete reminderTimers[id];
  }

  try {
    await fetch(`https://dummyjson.com/users/${id}`, { method: "DELETE" });
  } catch (e) {
    /* DummyJSON may fail or 404 for client-generated ids — we still remove the client locally, since this is the expected mock-API behaviour. */
  }

  clientsState = clientsState.filter((c) => c.id !== id);
  saveClients(clientsState);
  renderClients();
  showToast("Client deleted", "success");
  return true;
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
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.classList.contains("hidden")) close();
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
    const avatarUrl = form.avatarUrl.value.trim();

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
    if (avatarUrl) {
      try {
        new URL(avatarUrl);
      } catch (err) {
        setFieldError(form, "avatarUrl", "Avatar URL doesn't look valid");
        hasError = true;
      }
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
        Object.assign(client, { name, email, phone, company, image: avatarUrl, dealValue, status });
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
      if (!res.ok) throw new Error("Network response was not ok");
      apiClient = await res.json();
    } catch (err) {
      /* Network failure: still add locally so the flow keeps working offline. */
    }

    /* DummyJSON doesn't persist writes, so /users/add answers every
       request with the same id (209). Reusing it verbatim would give two
       added clients identical ids — then delete-by-id removes both and
       Edit opens the wrong one. Only trust the server id if it's free. */
    const apiId = apiClient && apiClient.id;
    const newClient = {
      id: apiId && !clientsState.some((c) => c.id === apiId) ? apiId : Date.now(),
      name,
      email,
      phone,
      company,
      image: avatarUrl,
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
  form.avatarUrl.value = client.image || "";
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
  const editBtn = document.getElementById("detail-edit-btn");
  const deleteBtn = document.getElementById("detail-delete-btn");
  if (!overlay) return;

  const close = () => overlay.classList.add("hidden");
  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.classList.contains("hidden")) close();
  });

  /* Reuse the exact same functions the list's Edit/Delete buttons call
     — no separate logic for the modal. */
  editBtn.addEventListener("click", () => {
    const id = activeDetailClientId;
    close();
    openEditModal(id);
  });

  deleteBtn.addEventListener("click", async () => {
    const deleted = await handleDeleteClient(activeDetailClientId);
    if (deleted) close();
  });

  addNoteBtn.addEventListener("click", () => {
    const input = document.getElementById("note-input");
    const text = input.value.trim();
    if (!text) return;

    const client = clientsState.find((c) => c.id === activeDetailClientId);
    if (!client) return;

    client.notes.push({ text, date: new Date().toLocaleString("en-US") });
    saveClients(clientsState);
    input.value = "";
    renderNotesList(client);
  });

  /* Enter in the note field = click "Add note" — the input isn't inside
     a <form>, so the browser doesn't do this for free. */
  document.getElementById("note-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") addNoteBtn.click();
  });

  remindBtn.addEventListener("click", () => {
    const client = clientsState.find((c) => c.id === activeDetailClientId);
    if (!client) return;

    if (reminderTimers[client.id]) {
      clearTimeout(reminderTimers[client.id]);
    }

    showToast("Reminder set ✓", "success");
    reminderTimers[client.id] = setTimeout(() => {
      /* look the client up again at fire time — they may have been
         renamed during the minute the timer was pending */
      const current = clientsState.find((c) => c.id === client.id);
      if (current) showToast(`⏰ Follow up: ${current.name}`, "success");
      delete reminderTimers[client.id];
    }, 60000);
  });
}

/* DOM nodes instead of an HTML string, same as createClientCard —
   textContent never gets parsed as markup, so nothing needs escaping. */
function renderNotesList(client) {
  const list = document.getElementById("notes-list");
  list.replaceChildren();

  if (!client.notes || client.notes.length === 0) {
    const empty = document.createElement("div");
    empty.className = "note-empty";
    empty.textContent = "No notes yet.";
    list.appendChild(empty);
    return;
  }

  client.notes.forEach((n) => {
    const item = document.createElement("div");
    item.className = "note-item";
    item.textContent = n.text;

    const date = document.createElement("span");
    date.className = "note-date";
    date.textContent = n.date;

    item.appendChild(date);
    list.appendChild(item);
  });
}

function openDetailModal(id) {
  const client = clientsState.find((c) => c.id === id);
  if (!client) return;
  activeDetailClientId = id;

  fillAvatar(document.getElementById("detail-avatar"), client);
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
