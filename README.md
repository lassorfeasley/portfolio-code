# Lassor.com

Next.js 15 app that hydrates Lassor’s Webflow export, fetches live content from Supabase, and now ships with a fully authenticated `/admin` dashboard for managing projects (CRUD + uploads + preview).

## Admin dashboard

- Navigate to `/admin/login` and sign in with a Supabase Auth email/password account.
- Only addresses listed in `ADMIN_ALLOWED_EMAILS` can access admin routes; middleware automatically signs out unapproved users.
- Once signed in you can:
  - Browse/search existing projects (draft + archived states visible).
  - Create or edit projects with live form validation, toggle draft/archived flags, and view an embedded preview.
  - Upload assets directly to Supabase Storage via drag-and-drop; uploaded URLs are injected into the relevant fields.
  - Delete projects (with confirmation) and trigger automatic ISR revalidation so public pages refresh immediately.

## Data access layer

- All Supabase clients are created via `lib/supabase/{server,client,admin}.ts`, which now share a typed `Database` schema so you get autocomplete + type safety everywhere.
- Queries, inserts, and transforms live in `lib/domain/**/service.ts`; each service accepts an injected `TypedSupabaseClient`, so API routes, server components, and server actions all share the same logic.
- View-model shaping (e.g., `ProjectSummary`, `ProjectDetail`) is handled in adjacent `selectors.ts` files so UI components never need to care about raw Supabase response shapes.
- When adding a new feature, create/extend a domain module first, then call those helpers from pages or routes; this keeps SQL strings, env guards, and error handling in one place and makes testing straightforward (see `lib/domain/projects/service.test.ts` for examples).

## Environment variables

Set these in `.env.local` (and in your deployment provider):

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL (used by browser + middleware). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key for client-side auth. |
| `SUPABASE_URL` | ✅ | Server-side URL (falls back to `NEXT_PUBLIC_SUPABASE_URL`). |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service-role key for admin CRUD/storage. Never expose client-side. |
| `ADMIN_ALLOWED_EMAILS` | ✅ | Comma-separated list of email addresses allowed into `/admin`. |
| `ADMIN_UPLOAD_BUCKETS` | ➖ | Comma-separated allowlist of storage buckets (default `projects`). |
| `ADMIN_UPLOAD_BUCKET` | ➖ | Default bucket name when client omits one (default `projects`). |
| `ADMIN_UPLOAD_MAX_BYTES` | ➖ | Optional upload size ceiling in bytes (default 25MB). |
| `NEXT_PUBLIC_ADMIN_UPLOAD_BUCKET` | ➖ | Client-side default bucket label for uploader controls. |

## Development

```bash
npm install
npm run dev        # start Next.js locally
npm run lint       # eslint over the repo
npm run test       # vitest unit tests (validators, etc.)
```

## Media uploads

Uploads are proxied through `/api/admin/uploads` so the service-role key never hits the browser. Files are written to the bucket/prefix specified by the uploader UI (default `projects/<slug>`), and the endpoint returns the public URL that the form then attaches to featured/final/process image lists.

## Testing

- `npm run test` runs Vitest (currently covering validator logic; extend as you add more modules).
- Add new test files under `lib/**/*.{test,spec}.ts` to keep them automatically included.
