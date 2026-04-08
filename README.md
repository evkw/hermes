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

> **Warning:** Do not run this script against a production database.

```bash
npx tsx --require dotenv/config scripts/seed-signals.ts [options]
```

| Option | Description | Default |
|--------|-------------|---------|
| `--month <1-12>` | Month to seed | Current month |
| `--year <number>` | Year to seed | Current year |

### Examples

```bash
# Seed the current month with default settings
npx tsx --require dotenv/config scripts/seed-signals.ts

# Seed a specific month
npx tsx --require dotenv/config scripts/seed-signals.ts --month 3 --year 2026


```

Each day in the target month gets 1–6 signals with randomized titles, descriptions, risk levels, and a mix of active/resolved statuses. Resolved signals include a full event trail (created → resolved). To add more title patterns, edit the `TITLE_TEMPLATES` array at the top of `scripts/seed-signals.ts`.

## Self-Hosting with Docker

The recommended way to run Hermes is via Docker Compose, which bundles the app and a PostgreSQL database together.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### Start the app

```bash
docker compose up --build
```

This will:

1. Start a PostgreSQL 17 database (data persisted in a Docker volume)
2. Run Prisma migrations automatically
3. Build and start the Next.js app

The app will be available at [http://localhost:3001](http://localhost:3001).

### Ports

| Service | Port |
|---------|------|
| App | `3001` |
| Prod database | `5433` (exposed for external access) |

### Seeding the production database

To seed the Docker-hosted production database:

```bash
# Create a .env.production.local with the prod connection string
# DATABASE_URL="postgresql://postgres:hermes-prod@localhost:5433/hermes"

npx tsx --require dotenv/config scripts/seed-signals.ts --month 4 --year 2026
```

### Updating

After code or schema changes, rebuild and restart with a single command:

```bash
docker compose up --build
```

This will rebuild the app image, apply any new Prisma migrations, and restart the services. No separate `docker build` step is needed.

### Stopping

```bash
docker compose down
```

Database data is stored in the `hermes-pgdata` volume and persists across restarts. To delete all data:

```bash
docker compose down -v
```

### Development database

A separate local PostgreSQL container is used for development (port `5432`). See `.env` for the dev connection string. The Docker Compose stack uses its own isolated database so dev and prod data stay separate.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
