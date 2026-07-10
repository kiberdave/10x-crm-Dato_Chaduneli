# 10X CRM

## About

10X CRM is a lightweight client relationship management tool for sales
managers. It replaces a messy spreadsheet with one place to track leads,
deals in progress, notes, and follow-up reminders. Built with vanilla
JavaScript, HTML and CSS — no frameworks, no build step.

## Features

- Email/password sign up and login, with a full-page validation flow
- Auth-guarded dashboard, clients and profile pages
- Dashboard with a live clock, four key stats and a pipeline overview
- Client list loaded from the DummyJSON API, cached in `localStorage`
- Add, delete and change the status of clients (GET / POST / DELETE)
- Search, status filter chips and sorting, all combinable
- Per-client notes and a one-minute follow-up reminder
- Profile editing, password change, and a one-click data reset
- Dark / light theme toggle, persisted across sessions

## Tech stack

- Vanilla JavaScript (ES6+), no frameworks or libraries
- HTML5 + CSS3 (custom properties for theming)
- [DummyJSON](https://dummyjson.com) as a mock REST API
- Browser `localStorage` as the persistence layer
- Deployed on Vercel / Netlify (static site, no backend)

## How to run

1. Clone this repository.
2. Open `index.html` directly in a browser, or serve the folder with any
   static file server, for example:
   ```
   npx serve .
   ```
3. Sign up for a new account, then log in.

No build step, no dependencies to install.

## Live demo

https://10x-crm-dato-chaduneli.vercel.app/

## Test account

Register a new account from the Sign up page — no seed account is
pre-loaded, since all data lives in the browser's own `localStorage`.

## Credits

Built as an individual project. AI tools (Claude) were used during
development — see `ai-log.md` for the detailed usage log.
