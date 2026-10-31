# Hebrew Journey Frontend

Arabic RTL frontend for the Hebrew Journey learning platform. It is built with React, TypeScript, Vite, and TanStack Router. Most account, course, scheduling, subscription, and reporting data comes from the platform API; this repository contains the frontend only.

## Run locally

Requirements: Node.js and npm.

```sh
npm install
npm run dev
```

Vite prints the local address. The frontend needs a reachable API for real accounts and saved data. Configure the API and storage addresses with `VITE_API_URL`, `VITE_STORAGE_SERVER_URL`, and `VITE_VPS_SERVER_URL` as needed. See `src/lib/api.ts` for how those values are used. Never put private credentials in a `VITE_` variable; Vite exposes these values to the browser.

Available scripts:

- `npm run dev` — start the development server.
- `npm run build` — build the production frontend.
- `npm run preview` — serve a production build locally.
- `npm run lint` — run ESLint.

There is currently no test script in `package.json`.

For the local student demo, run the frontend in development mode and use `demo@example.test` / `demo12345` on `/login`. This is fake local demo data, not a real account. The `?dev-preview=1` query can also activate the demo student preview in development.

## Main source folders

- `src/routes/` — URL routes. Files such as `admin.tsx` and `teacher.tsx` connect URLs to screen components.
- `src/components/` — shared layout, form controls, and role screens. `screens.tsx` currently contains many screens and is a candidate for gradual modularization.
- `src/hooks/` — authentication and shared platform data/API operations.
- `src/lib/` — HTTP/auth helpers and shared business rules.
- `src/data/` — local demo data.
- `public/` — static assets.

The route table, role flows, package rules, and known gaps are documented in [docs/website-guide.md](docs/website-guide.md).

## Role overview

- **Student:** placement, subscriptions, courses, homework, exams, progress, certificates, chats, and Calls sessions.
- **Teacher:** assigned students, profile, materials, exams, homework, schedule, attendance, reports, chat, and analytics.
- **Admin:** users, educational content, packages, payments, placement, schedules, calls, groups, free lectures, analytics, and the platform guide.
- **Sales:** leads, call logs, subscriptions, and sales reporting.
- **Support:** students, tickets, chats, schedules, calls, groups, free lectures, attendance, and follow-up.

## Important product boundaries

- Regular groups are only for students with an active Basic-category subscription and no active Calls-category subscription. Calls students are managed through the Calls system. `packageType` (time-based subscription vs session bundle) is separate from package `category`.
- The free-lecture API currently targets `groupId`; it does not expose individual student targeting in this frontend contract. The frontend therefore does not create hidden groups for Calls students and keeps individual lecture creation disabled until the API supports it.
- The teacher bio UI sends `bio` through the existing profile API. Permanent bio storage and public display require the API to accept and return that field.
- Learning plan, scenarios, mistakes, and the conversation screen are not fully connected features yet. The UI labels these areas as previews or in progress.
- Frontend route checks improve navigation but do not replace API-side authorization or validation.
