# HOPE Inc. ERP

## Getting started

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Replace the sample values with the HOPE Inc. Supabase project URL and anon key.
4. Run `npm run dev` and open [http://localhost:3000](http://localhost:3000).

The Supabase URL and anon key are validated when a Supabase client is created.
The browser and server clients are available from `src/lib/supabase/client.ts`
and `src/lib/supabase/server.ts`. Do not put service-role keys in client
environment variables; `.env.local` is ignored by Git.

## Application structure

- `src/app` - Next.js App Router routes, root layout, and global styles.
- `src/components` - shared application UI.
- `src/features` - module-specific code for user management, customers,
  products, human resources, sales, and reports.
- `src/lib/supabase` - validated configuration and reusable Supabase clients.

The module folders are placeholders for later sprint tasks.
