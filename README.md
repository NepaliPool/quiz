# QuizDesk

Faculty-first quiz platform: admins publish quiz sets, issue one-time access codes, and participants take assessments anonymously.

## Stack

- Next.js (App Router) + TypeScript + React 19
- Drizzle ORM + Neon Postgres
- Better Auth (admin-only signup via `ADMIN_EMAILS`)
- TanStack Query (admin list fetching + cache invalidation)
- Tailwind CSS + shadcn/ui

## Features

- **Admin** — faculties, subjects, quiz sets (with publish toggle), access codes (available / issued / used / expired), users
- **Public** — browse faculties → open a published quiz set → unlock with a one-time code → take → view results
- Admin list filters stay in the URL (shareable); list data loads via React Query so search/filter doesn’t remount the page

## Project structure

```text
app/                 # Routes only (pages, layouts, loading, error)
  admin/             # Protected admin UI
  faculty/           # Public faculty + quiz taking + results
  (auth)/            # Login / sign-up
  api/auth/          # Better Auth handler
actions/             # Server mutations (+ admin list reads for React Query)
  admin/             # Faculty, subject, quiz, code CRUD + list* actions
  quiz/              # Participant: resolve code, start, submit, unlock sheet
dal/                 # Read-only data access
  admin/             # Admin lists + overview (auth-gated)
  public/            # Landing / faculty / quiz / result reads
db/                  # Schema, client, migrate script
lib/                 # Auth, SEO, action results, shared helpers
modules/             # Feature UI + Zod schemas (by domain)
  admin/             # Includes React Query hooks under hooks/queries/
  auth/
  faculty/
  landing/
  quiz/
hooks/               # Shared React hooks
components/          # Design-system UI + providers
drizzle/             # SQL migrations
.github/             # CODEOWNERS
```

### Conventions

| Layer      | Responsibility                                                                   |
| ---------- | -------------------------------------------------------------------------------- |
| `app/`     | Compose routes; no business logic                                                |
| `dal/`     | Queries only; admin DAL calls `requireAdminForDal()` (redirect) or throw paths   |
| `actions/` | Mutations + admin `list*` reads for queryFns; Zod → DB → revalidate / invalidate |
| `modules/` | UI components, forms, feature schemas; admin lists use TanStack Query            |

Admin list filters use URL search params. React Query keys derive from those params; mutations call `queryClient.invalidateQueries` instead of relying only on `router.refresh()`.

Correct answers (`isCorrect`) are never sent on the public take payload. They appear only on the result / answer-sheet flow after a completed attempt. The public quiz page ships **metadata only** (title, counts, section names); prompts and options are returned from `startAttempt` after a valid access code.

## Scripts

```bash
bun run dev          # Dev server (Turbopack)
bun run build        # Production build
bun run start        # Production server
bun run lint         # ESLint
bun run typecheck    # TypeScript check
bun run db:generate  # Generate migrations from schema
bun run db:migrate   # Apply migrations
bun run db:push      # Push schema (dev)
bun run db:studio    # Drizzle Studio
```

## Env

Copy `.env.example` → `.env` and set:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET` / `BETTER_AUTH_URL`
- `ADMIN_EMAILS` — comma-separated emails allowed to register as admin
- `NEXT_PUBLIC_APP_URL`

## License

MIT — see [LICENSE](./LICENSE).
