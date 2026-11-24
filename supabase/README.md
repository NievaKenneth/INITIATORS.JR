
# HOPE Inc. ERP — Database Setup

This folder contains the Supabase configuration and SQL migration files for the HOPE Inc. ERP project.

## Requirements

- Node.js 20 or later
- npm
- Access to the HOPE Inc. Supabase project

**Docker is not required** for the hosted database workflow described below.

## 1. Install project dependencies

From the project root, run:

```bash
npm install
```

## 2. Install the Supabase CLI

The Supabase CLI is used to create, check, and apply database migrations.

```bash
npm install --save-dev supabase
```

## 3. Authenticate with Supabase

Run:

```bash
npx supabase login
```

Follow the browser instructions to authenticate.

## 4. Link the project

Get the project reference from the HOPE Inc. Supabase Dashboard URL.

Run:

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
```

Replace `YOUR_PROJECT_REF` with the actual project reference.

Do not commit passwords, access tokens, or other credentials.

## 5. Create a migration

Run:

```bash
npm run db:new -- create_example_table
```

This creates a timestamped SQL migration file inside `supabase/migrations/`.

Write database changes in the generated SQL file.

## 6. Check migration status

Run:

```bash
npm run db:status
```

## 7. Preview migrations

Run:

```bash
npm run db:dry-run
```

Review the output before applying any changes.

## 8. Apply migrations

Only after reviewing and receiving team approval, run:

```bash
npm run db:push
```

This applies pending migrations to the linked Supabase project.

## Important Notes

- Keep migration files in GitHub so the team shares the same database change history.
- Do not run destructive SQL without reviewing it first.
- Never commit passwords, access tokens, or service-role keys.
- Do not use `supabase db reset` on the shared database.
- Do not apply migrations directly to the shared database without team review.
