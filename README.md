# Expense Watch

A read-only expense tracking dashboard that visualizes transactions stored in a Google Sheet — no backend, no database, no login required. Open the app, and it pulls the latest rows from a public Google Sheet and turns them into summary cards, charts, and a searchable transaction table.

## Features

- **Google Sheets as the data source** — transactions are read live from a Google Sheet (`Sheet1!A2:F`: Date & Time, Credit, Debit, Category, Amount, Purpose/Notes). Update the sheet and the dashboard refreshes instantly.
- **Summary cards** — total credit, total debit, and net balance computed from the sheet rows.
- **Spending charts** — category breakdown and trend visualizations built with Recharts.
- **Transaction table** — full history with date, type (credit/debit), category, amount, and notes.
- **Filters** — toggle between all / credit / debit transactions; amounts parse ₹-formatted values.
- **Dark/light mode** — theme toggle powered by next-themes.
- **Responsive UI** — shadcn/ui components with Tailwind CSS, works on mobile and desktop.

## Tech Stack

- React 18 + TypeScript
- Vite 5 (build tooling)
- Tailwind CSS + shadcn/ui (Radix primitives)
- React Router (client-side routing)
- TanStack React Query
- Recharts (charts), date-fns, lucide-react icons
- Google Sheets API v4 (read-only data source)

## Quick Start

```sh
# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open http://localhost:8080 (the dev server runs on port 8080).

## Configuration — Point It at Your Own Sheet

The dashboard reads from a hardcoded Google Sheet in `src/pages/Index.tsx`:

```ts
const SPREADSHEET_ID = "1Armz9c9Tr1mXeGWymyhgUOhhw0cA_QvyTAcc2Q6uA9w";
const RANGE = "Sheet1!A2:F"; // Date & Time, Credit, Debit, Category, Amount, Purpose/Notes
```

To use your own data:

1. Create a Google Sheet with columns: Date & Time | Credit | Debit | Category | Amount | Purpose/Notes.
2. Share it as "Anyone with the link can view".
3. Create a Google Cloud API key with the Sheets API enabled.
4. Replace `SPREADSHEET_ID`, `RANGE`, and `API_KEY` in `src/pages/Index.tsx`.

> **Security note:** the API key is bundled into the client-side JavaScript. Restrict it in the Google Cloud console to your sheet's API + HTTP referrer allowlist.

## Project Structure

```
expense-watch/
├── index.html            # HTML entry (title, meta tags)
├── vite.config.ts        # Vite config (@ alias -> src, port 8080)
├── src/
│   ├── main.tsx          # React entry point
│   ├── App.tsx           # Router + providers (theme, query client, toasts)
│   ├── index.css         # Tailwind + theme tokens
│   ├── pages/
│   │   ├── Index.tsx     # Expense dashboard (fetches Google Sheet)
│   │   └── NotFound.tsx  # 404 page
│   ├── components/
│   │   ├── NavLink.tsx
│   │   └── ui/           # shadcn/ui primitives (button, card, table, dialog, …)
│   ├── hooks/            # shared React hooks
│   └── lib/              # utils (cn, etc.)
├── public/               # static assets
└── package.json
```

## Build & Deploy

```sh
npm run build   # outputs static files to dist/
npm run preview # preview the production build locally
```

The output of `dist/` is fully static and can be hosted on GitHub Pages, Netlify, or Cloudflare Pages. This repo is deployed via GitHub Pages from the `main` branch.

## Scripts

| Script        | Description                          |
|---------------|--------------------------------------|
| `npm run dev` | Start the Vite dev server (port 8080)|
| `npm run build` | Production build to `dist/`        |
| `npm run build:dev` | Development-mode build          |
| `npm run preview` | Preview the production build     |
| `npm run lint` | Run ESLint                         |

---

Built by **Girish Lade** — https://ladestack.in
