# QuizDesk

Faculty-first quiz platform: admins publish quiz sets, issue one-time access codes, and participants take assessments anonymously.

## Stack

- Next.js (App Router) + TypeScript
- Drizzle ORM + Neon Postgres
- Better Auth (admin-only signup via `ADMIN_EMAILS`)
- Tailwind CSS + shadcn/ui

## Project structure

```text
app/                 # Routes only (pages, layouts, loading, error)
  admin/             # Protected admin UI
  faculty/           # Public faculty + quiz taking
  (auth)/            # Login / sign-up
actions/             # Server mutations
  admin/             # Faculty, subject, quiz, code CRUD
  quiz/              # Participant: resolve code, start, submit
dal/                 # Read-only data access
  admin/             # Admin lists + overview (auth-gated)
  public/            # Landing / faculty / quiz reads
db/                  # Schema, client, migrate script
lib/                 # Auth, action results, shared helpers
modules/             # Feature UI + Zod schemas (by domain)
  admin/
  auth/
  faculty/
  landing/
  quiz/
hooks/               # Shared React hooks
components/          # Design-system UI + providers
drizzle/             # SQL migrations
```

### Conventions

| Layer      | Responsibility                                              |
| ---------- | ----------------------------------------------------------- |
| `app/`     | Compose routes; no business logic                           |
| `dal/`     | Queries only; admin DAL calls `requireAdminForDal()`        |
| `actions/` | Mutations; validate with Zod → write DB → `revalidatePath`  |
| `modules/` | UI components, forms, feature schemas, stores               |

## Scripts

```bash
bun run dev          # Dev server (Turbopack)
bun run build        # Production build
bun run typecheck    # TypeScript check
bun run db:generate  # Generate migrations from schema
bun run db:migrate   # Apply migrations
bun run db:studio    # Drizzle Studio
```

## Env

Copy `.env.example` → `.env` and set:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET` / `BETTER_AUTH_URL`
- `ADMIN_EMAILS` — comma-separated emails allowed to register as admin
- `NEXT_PUBLIC_APP_URL`
