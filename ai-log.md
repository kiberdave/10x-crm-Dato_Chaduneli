# AI usage log

This file documents how AI tools were used while building 10X CRM, as
required by the "AI usage" module.

---

### 1. Scaffolding the project structure

**Goal:** Decide the file layout before writing any code.

**Prompt (verbatim):** "Design a vanilla JS CRM matching this PRD, adapt
the earlier dashboard mockup into a working site — file structure, CSS
tokens, and one JS file per concern (data/guard/auth/dashboard/clients/
profile)."

**Tool:** Claude (Sonnet)

**Result:** Used as-is — the suggested split (`data.js` for storage,
`guard.js` for auth control, one file per page) matched the PRD's
"shared logic in one place" requirement, so I kept it.

**What I learned:** Separating storage helpers from page logic made the
later CRUD work in `clients.js` much easier to follow.

---

### 2. Validation error messages

**Goal:** Match the PRD's exact error text for every form field.

**Prompt (first attempt, too vague):** "Add form validation."

**Prompt (refined):** "Add these six exact validation rules and error
strings to the sign-up form: [pasted P1.2 table from the PRD]."

**Tool:** Claude (Sonnet)

**Result:** Used with minor edits — I renamed a couple of variables to
match my own naming convention elsewhere in the file.

**What I learned:** Being vague the first time produced generic
"required field" messages; pasting the exact table from the PRD was what
actually got the literal error strings the exam checks for.

---

### 3. DummyJSON delete behaviour

**Goal:** Understand why DELETE requests for locally-added clients could
return 404.

**Prompt:** "Why would DELETE https://dummyjson.com/users/{id} return
404 for a client I added through POST /users/add?"

**Tool:** Claude (Sonnet)

**Result:** Used the explanation to write the try/catch around the
delete call — DummyJSON doesn't persist writes, so it can't find an id
it never actually stored.

**What I learned:** This is expected mock-API behaviour, not a bug in my
code — the state removal has to happen locally regardless of the
response.

---

### 4. Critical review of generated CSS

**Goal:** Sanity-check AI-suggested theme tokens before adopting them.

**Note:** The first dark-mode palette suggested pure black
(`#000000`) surfaces, which made the status badges (green/red) nearly
unreadable against the accent color. I rejected that palette and asked
for a softer near-black scale instead, closer to what real product UIs
(GitHub, Linear) use.

**What I learned:** AI output needs a visual sanity check, not just a
functional one — contrast and readability aren't guaranteed even when
the code "works".

---

### 5. Explaining async/await before the exam

**Goal:** Prepare to explain the `loadClients()` function during the
oral exam.

**Prompt:** "Explain line by line what this async function does and why
each part is necessary." *(pasted `loadClients` from `data.js`)*

**Tool:** Claude (Sonnet)

**Result:** Used the explanation to prepare my own spoken walkthrough
— not copied verbatim, since I need to say it in my own words on exam
day.

**What I learned:** Being able to explain *why* `try/catch` wraps the
`fetch` call (and not just that it does) was the part I needed to
practise most.
