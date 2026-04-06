This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Seeding Data

The project includes a script to populate the database with realistic signal data for testing and development.

> **Note:** Stop the dev server before running the seed script to avoid SQLite lock contention.

> **SQLite only:** This script uses the SQLite adapter and will only work with a local `file:` database. It will refuse to run if `DATABASE_URL` points to a non-SQLite connection. Do not point your local environment at a production database and run this script — the `--clear` flag will delete all data.

```bash
npx tsx scripts/seed-signals.ts [options]
```

| Option | Description | Default |
|--------|-------------|---------|
| `--month <1-12>` | Month to seed | Current month |
| `--year <number>` | Year to seed | Current year |
| `--clear` | Delete **all** existing signals before seeding | Off |

### Examples

```bash
# Seed the current month with default settings
npx tsx scripts/seed-signals.ts

# Seed a specific month
npx tsx scripts/seed-signals.ts --month 3 --year 2026

# Clear all existing data, then seed
npx tsx scripts/seed-signals.ts --clear --month 1 --year 2026
```

Each day in the target month gets 1–6 signals with randomized titles, descriptions, risk levels, and a mix of active/resolved statuses. Resolved signals include a full event trail (created → resolved). To add more title patterns, edit the `TITLE_TEMPLATES` array at the top of `scripts/seed-signals.ts`.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
