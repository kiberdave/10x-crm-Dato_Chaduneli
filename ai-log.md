# AI usage log

How AI was used while building 10X CRM, as required by the "AI usage"
module. Tool everywhere: Claude (Sonnet / Opus) in VS Code. Every
session is also journaled in a private worklog; review findings are
tracked in a private checklist with commit hashes.

## Summary

| # | Phase       | What AI was asked to do                                   | Outcome                          |
|---|-------------|-----------------------------------------------------------|----------------------------------|
| 1 | Scaffolding | File layout, CSS tokens, one JS file per concern          | Used as-is                       |
| 2 | Build       | Sign-up validation with the PRD's exact error strings     | Used with minor edits            |
| 3 | Build       | Explain DummyJSON 404 on DELETE for locally-added clients | Used to write the try/catch      |
| 4 | Design      | Dark theme palette                                        | **Rejected**, asked for a redo   |
| 5 | Review, Jul 19 | Full code review (report only, no changes)             | 5 fixes applied after my approval |
| 6 | Review, Jul 23 | Pre-exam review + live browser verification            | Real guard bug found; 5 commits  |
| 7 | Exam prep   | Line-by-line walkthrough of `loadClients()`               | Reworded into my own explanation |

## Highlights

**1. A vague prompt gets vague code.** My first attempt was "Add form
validation" — it produced generic "required field" messages. The
refined prompt pasted the exact P1.2 table from the PRD, and only then
did the literal error strings the exam checks for appear.
*Lesson: the quality of the prompt decides the quality of the output.*

**2. AI output can be wrong-by-design — the palette I rejected.** The
first dark-mode palette used pure-black surfaces, which made the
green/red status badges nearly unreadable. I rejected it and asked for
a softer near-black scale, closer to real product UIs (GitHub, Linear).
*Lesson: AI code needs a visual sanity check, not just a functional one.*

**3. Review workflow: "report only, change nothing" first.** Before the
exam I asked for a full review of the codebase with an explicit rule:
no edits, findings only. Then I approved fixes batch by batch, each
landing as its own commit. Two real bugs came out of these reviews:
`escapeHtml` doesn't escape quotes, so an avatar URL containing `"`
could break out of the `src` attribute (self-XSS) — all rendering was
switched to DOM nodes (`textContent`/`img.src`), and `escapeHtml` was
eventually deleted because nothing needed it anymore; and DummyJSON's
`POST /users/add` always answers with the same `id: 209`, so two added
clients shared an id and deleting one removed both — the server id is
now used only when it's actually free.
*Lesson: keeping "find" and "fix" as separate steps keeps me in
control of what changes and why.*

**4. The bug that reading code didn't catch.** The auth guard looked
correct in every code-level review. It failed only when AI actually ran
the site in a browser: `npx serve` redirects `/profile.html` to
`/profile` ("clean URLs"), the page name stopped matching the protected
list, and logged-out visitors walked straight into protected pages. The
fix normalizes the page name back to `*.html` so the guard works on any
server.
*Lesson: run the app, don't just read it — some bugs only exist at
runtime.*

**5. Preparing to defend the code, not just write it.** I asked for a
line-by-line explanation of the async `loadClients()` flow, then
rewrote it in my own words for the oral exam. The part I practised
most was explaining *why* `try/catch` wraps the `fetch` — not just
that it does.
*Lesson: if I can't explain a line without AI, it isn't mine yet.*
