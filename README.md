# Analytics Report Builder

Monorepo for building analytics reports with a web UI, API, database layer, and shared packages.

## Tech Stack

- `pnpm` workspaces
- `turbo` for task orchestration
- TypeScript across all packages
- ESLint + Prettier + Husky

## Workspace Layout

- `apps/ui` - Frontend application
- `apps/api` - Backend API
- `domain/database` - Database models and data-access layer
- `packages/*` - Shared libraries (`validators`, `data-sync`, `ui-shared`, `square`)

## Getting Started

```bash
pnpm install
pnpm dev
```

## Common Commands

```bash
pnpm dev           # Start development tasks
pnpm build         # Build all workspace projects
pnpm lint          # Run lint checks
pnpm lint:fix      # Run lint fixes
pnpm format        # Format files with Prettier
pnpm format:check  # Check formatting
pnpm db:generate   # Generate DB artifacts
pnpm db:migrate    # Run DB migrations
```
