# Restaurant Management System

A complete restaurant POS and management dashboard — connects to an external .NET REST API (`Restaurant.API v1`).

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the internal API server (port 5000, health check only)
- `pnpm --filter @workspace/restaurant-app run dev` — run the frontend (started automatically via workflow)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 18 + Vite + Tailwind CSS v4 + shadcn/ui
- Routing: wouter
- API Client: Orval-generated React Query hooks (`@workspace/api-client-react`)
- API Spec: OpenAPI 3.1 in `lib/api-spec/openapi.yaml`
- Build: Vite (frontend)

## Where things live

- `lib/api-spec/openapi.yaml` — Source of truth for the Restaurant.API contract
- `lib/api-client-react/src/generated/` — Generated React Query hooks + types (do not edit manually)
- `artifacts/restaurant-app/src/` — React frontend
  - `src/main.tsx` — Entry point; sets API base URL and auth token getter
  - `src/App.tsx` — Router + auth guards
  - `src/pages/` — One file per page/route
  - `src/index.css` — Theme (dark + amber palette)

## Connecting to Your Backend

The frontend calls your .NET API (`Restaurant.API`) directly from the browser. By default it targets `https://localhost:7040`.

To change the target, set the `VITE_API_BASE_URL` environment variable before running:

```
VITE_API_BASE_URL=https://your-api-host.com pnpm --filter @workspace/restaurant-app run dev
```

Your .NET backend must allow CORS from the Replit preview domain (or from `http://localhost:*` when running locally).

## Architecture decisions

- **Contract-first OpenAPI**: The spec in `lib/api-spec/openapi.yaml` mirrors the external `.NET` API exactly. All frontend hooks are generated from it — no hand-written fetch calls.
- **Token auth via custom-fetch**: JWT token stored in `localStorage` under `restaurant_token`. `setAuthTokenGetter` wires it into every generated API call automatically via `Authorization: Bearer` header.
- **External API proxy**: The frontend calls the .NET backend directly from the browser (not through the Replit Express server), making local testing straightforward.
- **No local DB**: This project has no local database — all data lives in the .NET backend.

## Product

Full restaurant management dashboard with:
- **Auth**: Login / Register with JWT token
- **Dashboard**: Revenue summary, order/product/category counts, recent orders
- **Orders**: List, create (with dynamic line items), detail view, status updates
- **Products**: CRUD with images, category, barcode, pricing
- **Categories**: CRUD
- **Payment Methods**: CRUD with tax-free flag
- **Print Stations**: CRUD
- **Printers**: CRUD with type (Receipt / Kitchen) and station assignment
- **Category-Station Settings**: Link/unlink categories to print stations

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always re-run `pnpm --filter @workspace/api-spec run codegen` after editing `lib/api-spec/openapi.yaml`.
- Do not change `info.title` in the OpenAPI spec — it controls generated filenames.
- CORS must be enabled on the .NET backend to accept requests from the Replit preview origin.
- The `VITE_API_BASE_URL` env var must be set (or default `https://localhost:7040` is used).

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
