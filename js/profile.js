/**
 * profile.js
 * P5 — Profile (profile.html)
 */

function renderProfileInfo() {
  const user = getCurrentUser();
  if (!user) return;

  /* fillAvatar expects { image, name } — reshape the user record to
     that shape rather than changing fillAvatar itself, since it's
     shared with the client cards/detail modal/dashboard too. */
  fillAvatar(document.getElementById("profile-avatar"), { image: user.image, name: user.fullName });
  document.getElementById("profile-name").textContent = user.fullName;
  document.getElementById("profile-email").textContent = user.email;
  document.getElementById("profile-company").textContent = user.company || "—";
  document.getElementById("profile-since").textContent = `Member since ${formatDate(
    user.createdAt
  )}`;

  const form = document.getElementById("edit-profile-form");
  if (form) {
    form.fullName.value = user.fullName;
    form.company.value = user.company || "";
    form.avatarUrl.value = user.image || "";
  }
}

function initEditProfileForm() {
  const form = document.getElementById("edit-profile-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    clearFieldErrors(form);

    const fullName = form.fullName.value.trim();
    const company = form.company.value.trim();
    const avatarUrl = form.avatarUrl.value.trim();

    let hasError = false;

    if (fullName.length < 3) {
      setFieldError(form, "fullName", "Full name must be at least 3 characters");
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

    const session = getSession();
    const users = getUsers();
    const user = users.find((u) => u.id === session.userId);
    if (!user) return;

    user.fullName = fullName;
    user.company = company;
    user.image = avatarUrl;
    saveUsers(users);

    showToast("Profile updated ✓", "success");
    renderProfileInfo();
  });
}

function initChangePasswordForm() {
  const form = document.getElementById("change-password-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    clearFieldErrors(form);

    const currentPassword = form.currentPassword.value;
    const newPassword = form.newPassword.value;
    const confirmNewPassword = form.confirmNewPassword.value;

    const session = getSession();
    const users = getUsers();
    const user = users.find((u) => u.id === session.userId);
    if (!user) return;

    let hasError = false;

    if (currentPassword !== user.password) {
      setFieldError(form, "currentPassword", "Current password is incorrect");
      hasError = true;
    }
    if (!isValidPassword(newPassword)) {
      setFieldError(
        form,
        "newPassword",
        "Password must be at least 8 characters and contain a letter and a number"
      );
      hasError = true;
    } else if (newPassword === currentPassword) {
      setFieldError(form, "newPassword", "New password must be different from the current one");
      hasError = true;
    }
    if (confirmNewPassword !== newPassword) {
      setFieldError(form, "confirmNewPassword", "Passwords do not match");
      hasError = true;
    }

    if (hasError) return;

    user.password = newPassword;
    saveUsers(users);
    form.reset();
    showToast("Password changed ✓", "success");
  });
}

function initResetDataButton() {
  const btn = document.getElementById("reset-data-btn");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    const confirmed = confirm(
      "Reset CRM data? This will replace all clients with a fresh set from the API."
    );
    if (!confirmed) return;

    localStorage.removeItem(STORAGE_KEYS.CLIENTS);
    const { error } = await loadClients();
    if (error) {
      showToast("Could not load clients. Check your connection and try again.", "error");
      return;
    }
    showToast("CRM data reset ✓", "success");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (!document.getElementById("profile-name")) return;
  renderProfileInfo();
  initEditProfileForm();
  initChangePasswordForm();
  initResetDataButton();
});
