/**
 * auth.js
 * P1 — Sign Up (signup.html) and P2 — Login (index.html) logic.
 * Each page only has the matching form in the DOM, so both handlers can
 * safely live in one file. Shared helpers (clearFieldErrors, setFieldError,
 * wireLiveClear) live in data.js so profile.js and clients.js can use them
 * too.
 */

/* ---------------- P1 — Sign Up ---------------- */

function initSignupForm() {
  const form = document.getElementById("signup-form");
  if (!form) return;

  wireLiveClear(form, "fullName", (v) => v.trim().length >= 3);
  wireLiveClear(form, "email", (v) => isValidEmail(v.trim().toLowerCase()));
  wireLiveClear(form, "password", (v) => isValidPassword(v));
  wireLiveClear(form, "confirmPassword", (v) => v === form.password.value);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    clearFieldErrors(form);

    const fullName = form.fullName.value.trim();
    const email = form.email.value.trim().toLowerCase();
    const company = form.company.value.trim();
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;

    let hasError = false;
    const users = getUsers();

    if (fullName.length < 3) {
      setFieldError(form, "fullName", "Full name must be at least 3 characters");
      hasError = true;
    }
    if (!isValidEmail(email)) {
      setFieldError(form, "email", "Please enter a valid email address");
      hasError = true;
    } else if (users.some((u) => u.email === email)) {
      setFieldError(form, "email", "An account with this email already exists");
      hasError = true;
    }
    if (!isValidPassword(password)) {
      setFieldError(
        form,
        "password",
        "Password must be at least 8 characters and contain a letter and a number"
      );
      hasError = true;
    }
    if (confirmPassword !== password) {
      setFieldError(form, "confirmPassword", "Passwords do not match");
      hasError = true;
    }

    if (hasError) return;

    const newUser = {
      id: Date.now(),
      fullName,
      email,
      password,
      company,
      image: "",
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    saveUsers(users);

    showToast("Account created successfully! Please log in.", "success");
    form.querySelector("button[type=submit]").disabled = true;
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1500);
  });
}

/* ---------------- P2 — Login ---------------- */

function initLoginForm() {
  const form = document.getElementById("login-form");
  if (!form) return;

  /* same live-clear behaviour as the signup form: the error under a
     field disappears as soon as the field stops being empty */
  wireLiveClear(form, "email", (v) => v.trim().length > 0);
  wireLiveClear(form, "password", (v) => v.length > 0);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    clearFieldErrors(form);

    const email = form.email.value.trim();
    const password = form.password.value;

    let hasError = false;
    if (!email) {
      setFieldError(form, "email", "Email is required");
      hasError = true;
    }
    if (!password) {
      setFieldError(form, "password", "Password is required");
      hasError = true;
    }
    if (hasError) return;

    const users = getUsers();
    const match = users.find(
      (u) => u.email === email.toLowerCase() && u.password === password
    );

    if (!match) {
      setFieldError(form, "password", "Invalid email or password");
      return;
    }

    saveSession({
      userId: match.id,
      email: match.email,
      loginAt: new Date().toISOString(),
    });

    window.location.href = "dashboard.html";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initSignupForm();
  initLoginForm();
});
