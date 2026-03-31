# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
pnpm dev              # Start all dev servers (API on :3001, UI on :5173)
pnpm build            # Build all packages (runs lint + format check first)
pnpm lint             # ESLint across all workspaces
pnpm lint:fix         # Auto-fix lint issues
pnpm format           # Format all files with Prettier
pnpm format:check     # Check formatting without writing
pnpm db:generate      # Generate Drizzle ORM migrations
pnpm db:migrate       # Apply database migrations
```

Run a single workspace: `pnpm --filter <workspace> <script>` (e.g. `pnpm --filter @analytics/api dev`).

## Architecture

**Monorepo** using pnpm workspaces + Turborepo for task orchestration.

### Workspace Layout

- `apps/api` — Hono backend (port 3001). Better Auth for sessions, feature-based route modules mounted on `/api/*`.
- `apps/ui` — React 19 + Vite frontend (port 5173). Uses Hono RPC client, React Query, React Hook Form, shadcn/ui, Tailwind v4. Vite proxies `/api` to the backend.
- `domain/database` — Drizzle ORM schemas and migrations for PostgreSQL. See [Database Schemas](#database-schemas) below.
- `packages/validators` — Shared Zod schemas used by both API and UI.
- `packages/square` — Square SDK wrapper (client factory, locations, orders, webhooks, channel detection).
- `packages/data-sync` — Sync pipeline: JIT, nightly (cron at 2am), webhook, and manual sync modes plus daily aggregation.
- `packages/shared-libs` — `DomainError` class with error codes mapped to HTTP statuses by the API error handler middleware.
- `packages/ui-shared` — shadcn/ui component library.

### Multi-Tenant Model

Every entity belongs to a `customer`. The auth middleware extracts the user's `customerId` from the Better Auth session. **All database queries must filter by `customerId`** — this is the tenant isolation boundary. System admins can override the customer context via `X-Customer-Id` header.

### Role-Based Access Control

Four roles defined in `packages/validators/src/user.ts` (`UserRoleSchema`):

- **`owner`** — Account owner (created on sign-up). Full access within their customer. Can add users, promote to admin.
- **`admin`** — Account admin. Same data access as owner. Can add/manage users (not remove owner).
- **`member`** — Account user. Access gated by the `permissions` table (resource + action pairs).
- **`system_admin`** — System-wide admin. Belongs to a dedicated "system" customer. Bypasses `customerId` filtering, can impersonate any customer via `X-Customer-Id` header.

Role helpers in `packages/validators/src/role.ts`: `isAccountAdmin(role)`, `isSystemAdmin(role)`.

**API middleware** (`apps/api/src/middleware/`):

- `auth.ts` — Extracts user from session, sets `customerId` (system admins can override via header).
- `permission.ts` — `requirePermission(resource, action)` — owner/admin/system_admin bypass; members checked against permissions table.
- `require-role.ts` — `requireRole(...roles)` — guards routes to specific roles.

**UI auth flow** (`apps/ui/src/`):

- `lib/auth-context.tsx` — `AuthProvider`/`useAuth()` context exposing user, role, permissions, customer switcher state.
- `components/auth-guard.tsx` — Session check + fetches `/api/me` + wraps in `AuthProvider`.
- `components/guest-guard.tsx` — Redirects authenticated users away from login/signup.
- `components/onboarding-guard.tsx` — Redirects to `/connect` if no integrations (skipped for system_admin).
- `components/role-guard.tsx` — Per-route role + permission check.
- Sidebar nav items filtered by role; members only see items they have permissions for.

### Error Handling

Throw `DomainError` with a code (`BAD_REQUEST`, `UNAUTHORISED`, `NOT_FOUND`, `CONFLICT`, `INTERNAL_ERROR`), a server-side message, and an optional `clientSafeMessage`. The global error handler in `apps/api/src/middleware/error-handler.ts` converts these (and Zod validation errors) to appropriate HTTP responses.

### UI Data Hooks

React Query hooks live in `apps/ui/src/data/<domain>/hooks.ts`, **not** in `apps/ui/src/lib/`. Each domain gets its own folder (e.g. `data/auth/hooks.ts`, `data/integrations/hooks.ts`, `data/locations/hooks.ts`). The `lib/` directory is reserved for non-hook utilities (api-client, auth-client, query-client, context providers).

### UI Layout

The app uses a shadcn sidebar layout (`packages/ui-shared/src/components/ui/sidebar.tsx`):

- `DashboardLayout` → `SidebarProvider` + `AppSidebar` + `SidebarInset` + `Header`
- Sidebar is collapsible (`collapsible="icon"`), nav items role-filtered, user dropdown in footer.
- System admins see a customer-switcher dropdown in the header.
- Integration-aware sidebar: "Integrations" menu appears when apps are connected; "Connect" disappears when all app types are connected.

### UI Page Structure

Pages follow a **container/presentational** pattern with separation between data logic and rendering:

- **`index.tsx`** — Main page (container). Hosts all hooks, state, mutations, and handlers. Passes data and callbacks as props to content components.
- **`contents-{feature}.tsx`** — Presentational (dummy) components that only receive props (data, handlers, loading states). No hooks or data fetching inside these. A page can have multiple content files for distinct UI sections.
- **`types.ts`** — All prop types and shared type definitions for the page.
- **`schemas.ts`** — Zod validation schemas and constants used by the page.

This keeps UI components testable and reusable, with all data logic centralized in the main page.

### Key Conventions

- Primary keys use ULID (26-char, sortable).
- TypeScript strict mode, ES2022 target, ESNext modules.
- Zod v4 for all validation.
- Tailwind v4: use `w-[var(--my-var)]` for CSS variables in arbitrary values, **not** `w-[--my-var]` (v3 syntax generates invalid CSS in v4).
- Pre-commit hook runs lint-staged (ESLint + Prettier on .ts/.tsx files).

### Domain Module Patterns

Each domain module lives in `domain/database/src/modules/<module>/` with:

- `schema.ts` — Drizzle table definition plus `drizzle-zod` derived types:
  - `insertSchema` — `createInsertSchema(table).omit({ id, customerId, timestamps })` → `Payload` type for create
  - `updateSchema` — `createInsertSchema(table).partial().omit({ id, customerId, userId, timestamps })` → `UpdatePayload` type
  - `selectSchema` — `createSelectSchema(table).omit({ sensitive/internal fields })` → `Dto` type for responses
  - Types are always derived via `ReturnType<typeof schema.parse>`, never manually declared. Do NOT use `$inferSelect`, `$inferInsert`, or hand-written type literals for Payload/Dto types.
- `functions/` — One file per operation (`create.ts`, `list.ts`, `update.ts`, `delete.ts`).
  - All functions take `db: DbClient` as first param, `customerId: string` as second.
  - Use `Payload`/`UpdatePayload` types for input, `Dto` for return types.

**Validation file naming**: `[function].validate-[scope].ts` — e.g. `create.validate-permission.ts`, `update.validate-permission.ts`. Validation functions are extracted into separate files and called before the main operation. For create: check duplicates (throw `BAD_REQUEST`). For update/delete: check existence (throw `NOT_FOUND`).

**Where-clause convention**: Always separate the `customerId` clause from other conditions, then combine them. This keeps tenant isolation visually distinct:

```ts
const customerClause = eq(table.customerId, customerId)
const conditions = [eq(table.someField, value)]
const whereClause = and(customerClause, ...conditions)
```

### Database Schemas

All schemas live in `domain/database/src/modules/<module>/schema.ts`. Four Drizzle schema namespaces are used:

**`auth` schema** (`authSchema`):

- `customers` — Tenant entities. Columns: id, name, slug (unique), companyName, businessType, businessSize, phone, address, timestamps.
- `users` — App users. Columns: id, customerId (FK → customers), email (unique), name, role (default "member"), isActive, betterAuthUserId (unique), timestamps.
- `permissions` — RBAC rules. Columns: id, customerId, userId, resource, action, allowed, timestamps.
- `app_integrations` — OAuth credentials per tenant. Columns: id, customerId, appName, appKey, appSecret, environment, isActive, label, timestamps, lastUsedAt.
- `ba_user`, `ba_session`, `ba_account`, `ba_verification` — Better Auth internal tables (managed by Better Auth, defined in `auth-sessions/schema.ts`).

**`core_data` schema** (`coreSchema`):

- `locations` — Square locations cache. Columns: id, customerId, name, address (jsonb), status, timezone, syncedAt.
- `orders` — Synced Square orders. Columns: id, locationId, saleDate, state, totalMoney, totalTaxMoney, totalDiscountMoney, totalTipMoney, totalServiceChargeMoney, netAmounts (jsonb), returnAmounts (jsonb), sourceName, rawJson (jsonb), timestamps.
- `order_line_items` — Order line details. Columns: id, orderId, locationId, saleDate, name, variationName, catalogObjectId, quantity, channel, basePriceMoney, grossSalesMoney, totalDiscountMoney, totalTaxMoney, totalMoney.
- `daily_sales` — Aggregated daily metrics. Columns: id, locationId, saleDate (unique with locationId), grossSales, totalDiscounts, totalReturns, netSales, totalTax, totalTips, totalServiceCharges, totalCollected, storeGrossSales, uberGrossSales, uberBogoDiscountAmount, uberBogoRecoverable, orderCount, syncedAt, syncSource.

**`report_data` schema** (`reportSchema`):

- `saved_reports` — Report builder configurations. Columns: id, customerId, name, config (jsonb), timestamps.

**`audit` schema** (`auditSchema`):

- `webhook_log` — Incoming webhook events. Columns: id, eventId (unique), eventType, merchantId, locationId, orderId, signatureValid, processed, payload (jsonb), receivedAt.
- `sync_log` — Data sync audit trail. Columns: id, syncType, locationId, dateFrom, dateTo, squareCount, dbCount, discrepancy, ordersFetched, status, errorMessage, createdAt.

All monetary values are stored as `bigint` (cents). All primary keys use ULID.

### API Routes

Routes mounted in `apps/api/src/api-client.ts`:

- `GET /api/me` — Current user with role + permissions
- `GET /api/customers` — List all customers (system_admin only)
- `/api/app-integrations/list|get|toggle-status` — Integration CRUD
- `POST /api/square/connect/create` — Connect Square account
- `GET /api/square/connect/list` — List Square connections
- `/api/square/locations` — Square locations
- `POST /api/onboarding` — Post-signup onboarding

### Environment Variables

Required: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `SQUARE_ACCESS_TOKEN`, `SQUARE_WEBHOOK_SECRET`.
Optional: `PORT` (default 3001), `DATABASE_SSL`, `SQUARE_ENVIRONMENT` (sandbox/production).
