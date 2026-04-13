<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Dynamic pages rule

Any `page.tsx` that fetches data from the database (Prisma calls, server actions that query DB) **must** export `export const dynamic = "force-dynamic";` at the top level. Without this, Next.js will attempt to statically prerender the page at build time, which fails because `DATABASE_URL` is not available during `docker build`. This applies to all pages that use `async` server components with DB access.
<!-- END:nextjs-agent-rules -->
