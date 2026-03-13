# Analytics Report Builder

Monorepo for building analytics reports with a web UI, API, database layer, and shared packages.

## Tech Stack

- `pnpm` workspaces
- `turbo` for task orchestration
- TypeScript across all packages
- ESLint + Prettier + Husky

## Workspace Layout

- `apps/ui` - Frontend application (React 19, Vite, Tailwind CSS v4)
- `apps/api` - Backend API (Hono, Better Auth)
- `domain/database` - Database models, migrations, and data-access layer (Drizzle ORM, PostgreSQL)
- `packages/validators` - Shared Zod schemas
- `packages/ui-shared` - Shared shadcn/ui components
- `packages/square` - Square API integration
- `packages/data-sync` - Data synchronization utilities

## Getting Started

```bash
pnpm install
cp .env.example .env   # then fill in the values
pnpm dev
```

## Environment Variables

Copy `.env.example` to `.env` at the project root and fill in the values.

### `apps/api`

| Variable             | Required | Description                                                 |
| -------------------- | -------- | ----------------------------------------------------------- |
| `DATABASE_URL`       | Yes      | PostgreSQL connection string                                |
| `PORT`               | No       | API server port (default: `3001`)                           |
| `BETTER_AUTH_SECRET` | Yes      | Secret key for Better Auth session signing                  |
| `BETTER_AUTH_URL`    | Yes      | Frontend URL for CORS origin (e.g. `http://localhost:5173`) |

### `apps/ui`

| Variable       | Required | Description                                                                              |
| -------------- | -------- | ---------------------------------------------------------------------------------------- |
| `VITE_API_URL` | No       | API base URL. Not needed in dev (Vite proxy handles `/api` requests to `localhost:3001`) |

### `domain/database`

| Variable       | Required | Description                                                       |
| -------------- | -------- | ----------------------------------------------------------------- |
| `DATABASE_URL` | Yes      | PostgreSQL connection string (used by Drizzle Kit for migrations) |

### `packages/square`

| Variable                          | Required | Description                                    |
| --------------------------------- | -------- | ---------------------------------------------- |
| `SQUARE_ACCESS_TOKEN`             | Yes      | Square API access token                        |
| `SQUARE_ENVIRONMENT`              | No       | `sandbox` or `production` (default: `sandbox`) |
| `SQUARE_WEBHOOK_SECRET`           | Yes      | Square webhook signature key                   |
| `SQUARE_WEBHOOK_NOTIFICATION_URL` | No       | Public URL for Square webhook delivery         |

## Database Migrations

This project uses [Drizzle ORM](https://orm.drizzle.team/) with Drizzle Kit for schema management and migrations.

### Step-by-step migration workflow

**1. Edit the schema**

Modify or create schema files in `domain/database/src/modules/<module>/schema.ts`. Each module defines its tables using Drizzle's TypeScript API.

**2. Generate the migration**

```bash
cd domain/database
DATABASE_URL="postgresql://user:password@localhost:5432/analytics_report_builder" npx drizzle-kit generate
```

This compares the current schema files against the previous snapshot and generates a new SQL migration file in `domain/database/drizzle/`.

**3. Review the generated SQL**

Check the new file in `domain/database/drizzle/` (e.g. `0002_flimsy_johnny_storm.sql`). Verify the `ALTER TABLE` / `CREATE TABLE` statements match your intent.

**4. Apply the migration**

```bash
cd domain/database
DATABASE_URL="postgresql://user:password@localhost:5432/analytics_report_builder" npx drizzle-kit migrate
```

Or from the project root:

```bash
pnpm db:migrate
```

**5. Verify**

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/analytics_report_builder" npx drizzle-kit studio
```

Opens Drizzle Studio in the browser to inspect tables and data.

### Tips

- Always generate migrations before applying — never hand-edit generated SQL files
- Each migration is sequential (e.g. `0000_...`, `0001_...`, `0002_...`)
- The `drizzle/meta/` folder tracks schema snapshots — commit it along with migration files
- If a migration looks wrong, delete the generated file and fix the schema before regenerating

## Common Commands

```bash
pnpm dev           # Start development tasks
pnpm build         # Build all workspace projects
pnpm lint          # Run lint checks
pnpm lint:fix      # Run lint fixes
pnpm format        # Format files with Prettier
pnpm format:check  # Check formatting
pnpm db:generate   # Generate DB migration from schema changes
pnpm db:migrate    # Apply pending DB migrations
```
