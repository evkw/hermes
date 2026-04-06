import { PrismaClient, SignalEventType } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// ---------------------------------------------------------------------------
// CONFIG: Title templates — add new entries here as you think of more
// ---------------------------------------------------------------------------

const TITLE_TEMPLATES: { generate: () => { title: string; description: string } }[] = [
  {
    generate: () => {
      const num = randInt(1000, 9999);
      return {
        title: `Review MR #${num}`,
        description: `Code review for merge request #${num}. Check for correctness, style, and test coverage.`,
      };
    },
  },
  {
    generate: () => {
      const num = randInt(1000, 9999);
      return {
        title: `Work on JIRA-${num}`,
        description: `Continue implementation work on JIRA-${num}. Update subtasks and log progress.`,
      };
    },
  },
  {
    generate: () => {
      const num = randInt(100, 999);
      return {
        title: `Debug production issue #${num}`,
        description: `Investigate and resolve production incident #${num}. Check logs and reproduce locally.`,
      };
    },
  },
  {
    generate: () => {
      const num = randInt(100, 999);
      return {
        title: `Update documentation for #${num}`,
        description: `Revise and improve docs related to ticket #${num}. Ensure examples are up to date.`,
      };
    },
  },
  {
    generate: () => {
      const num = randInt(1000, 9999);
      return {
        title: `Code review for PR #${num}`,
        description: `Review pull request #${num}. Focus on architecture decisions and edge cases.`,
      };
    },
  },
  {
    generate: () => {
      const num = randInt(1, 200);
      return {
        title: `Investigate flaky test #${num}`,
        description: `Test #${num} has been intermittently failing in CI. Identify root cause and stabilize.`,
      };
    },
  },
  {
    generate: () => {
      const major = randInt(1, 5);
      const minor = randInt(0, 20);
      return {
        title: `Deploy service v${major}.${minor}`,
        description: `Coordinate deployment of service version ${major}.${minor}. Verify health checks post-deploy.`,
      };
    },
  },
  {
    generate: () => {
      const topics = [
        "new caching layer",
        "alternative ORM",
        "message queue options",
        "monitoring tools",
        "auth provider migration",
        "CI pipeline improvements",
        "schema validation library",
        "edge runtime feasibility",
      ];
      const topic = pick(topics);
      return {
        title: `Spike: evaluate ${topic}`,
        description: `Research and evaluate ${topic}. Document findings and make a recommendation.`,
      };
    },
  },
  {
    generate: () => {
      const num = randInt(1000, 9999);
      return {
        title: `Write tests for JIRA-${num}`,
        description: `Add unit and integration tests for the changes introduced in JIRA-${num}.`,
      };
    },
  },
  {
    generate: () => {
      const areas = [
        "login flow",
        "dashboard queries",
        "report generation",
        "search indexing",
        "file upload endpoint",
        "notification delivery",
      ];
      const area = pick(areas);
      return {
        title: `Optimize ${area}`,
        description: `Profile and improve performance of ${area}. Target measurable latency reduction.`,
      };
    },
  },
];

const NOTES = [
  "Made good progress today, should be done tomorrow.",
  "Blocked on dependency — waiting for upstream team.",
  "Found the root cause, working on the fix.",
  "Discussed approach with the team, aligned on direction.",
  "Needs more investigation, deferring to next session.",
  "PR is up, waiting for review.",
  "Shipped a partial fix, monitoring for regressions.",
  "Paired with backend team to sort out the API contract.",
  "Added logging to help narrow down the issue.",
  "Refactored the approach — cleaner now but needs tests.",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

function weightedPick<T>(options: { value: T; weight: number }[]): T {
  const total = options.reduce((sum, o) => sum + o.weight, 0);
  let r = Math.random() * total;
  for (const o of options) {
    r -= o.weight;
    if (r <= 0) return o.value;
  }
  return options[options.length - 1].value;
}

function randomTimeOnDay(year: number, month: number, day: number): Date {
  const hour = randInt(7, 19);
  const minute = randInt(0, 59);
  const second = randInt(0, 59);
  return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

// ---------------------------------------------------------------------------
// CLI arg parsing
// ---------------------------------------------------------------------------

function parseArgs() {
  const args = process.argv.slice(2);
  const now = new Date();
  let month = now.getMonth() + 1; // 1-indexed
  let year = now.getFullYear();
  let clear = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--month" && args[i + 1]) {
      month = parseInt(args[++i], 10);
    } else if (args[i] === "--year" && args[i + 1]) {
      year = parseInt(args[++i], 10);
    } else if (args[i] === "--clear") {
      clear = true;
    } else {
      console.error(`Unknown argument: ${args[i]}`);
      printUsage();
      process.exit(1);
    }
  }

  if (isNaN(month) || month < 1 || month > 12) {
    console.error(`Invalid month: ${month}. Must be 1-12.`);
    process.exit(1);
  }
  if (isNaN(year) || year < 2000 || year > 2100) {
    console.error(`Invalid year: ${year}. Must be 2000-2100.`);
    process.exit(1);
  }

  return { month, year, clear };
}

function printUsage() {
  console.log(`
Usage: npx tsx scripts/seed-signals.ts [options]

Options:
  --month <1-12>   Month to seed (default: current month)
  --year  <number>  Year to seed (default: current year)
`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { month, year, clear } = parseArgs();
  const totalDays = daysInMonth(year, month);
  const monthName = new Date(year, month - 1).toLocaleString("en-US", { month: "long" });

  console.log(`\nSeeding signals for ${monthName} ${year} (${totalDays} days)...`);
  if (clear) console.log("--clear flag set: will delete all existing signals first.\n");

  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error("ERROR: DATABASE_URL is not set. Aborting.");
    process.exit(1);
  }

  console.log(`Using database: ${dbUrl.slice(0, 30)}...`);

  const adapter = new PrismaPg({ connectionString: dbUrl });
  const db = new PrismaClient({ adapter });

  try {
    // Build signal data
    type SignalInput = Parameters<typeof db.signal.create>[0]["data"];
    const signalInputs: SignalInput[] = [];
    let activeCount = 0;
    let resolvedCount = 0;

    for (let day = 1; day <= totalDays; day++) {
      const count = randInt(1, 6);

      for (let i = 0; i < count; i++) {
        const template = pick(TITLE_TEMPLATES);
        const { title, description } = template.generate();
        const createdAt = randomTimeOnDay(year, month, day);

        const status = weightedPick([
          { value: "active" as const, weight: 60 },
          { value: "resolved" as const, weight: 40 },
        ]);

        const riskLevel = weightedPick([
          { value: "active" as const, weight: 60 },
          { value: "at_risk" as const, weight: 25 },
          { value: "needs_attention" as const, weight: 15 },
        ]);

        // Build events
        const events: {
          eventType: SignalEventType;
          note?: string;
          createdAt: Date;
        }[] = [{ eventType: SignalEventType.created, createdAt }];

        let resolvedAt: Date | undefined;
        let lastWorkedAt: Date | undefined;

        if (status === "resolved") {
          resolvedCount++;
          const daysLater = randInt(1, 5);
          resolvedAt = new Date(createdAt.getTime() + daysLater * 24 * 60 * 60 * 1000);
          // Add some hour jitter to resolvedAt
          resolvedAt.setUTCHours(randInt(9, 18), randInt(0, 59), randInt(0, 59));
          lastWorkedAt = resolvedAt;

          events.push({ eventType: SignalEventType.resolved, createdAt: resolvedAt });

          // Resolved signals have risk reset to active
        } else {
          activeCount++;
          // ~70% chance of having been worked on
          if (Math.random() < 0.7) {
            const hoursLater = randInt(1, 72);
            lastWorkedAt = new Date(createdAt.getTime() + hoursLater * 60 * 60 * 1000);
            events.push({ eventType: SignalEventType.worked_today, createdAt: lastWorkedAt });
          }
        }

        // ~30% chance of a note
        if (Math.random() < 0.3) {
          const noteTime = new Date(
            createdAt.getTime() + randInt(1, 48) * 60 * 60 * 1000
          );
          events.push({
            eventType: SignalEventType.note_added,
            note: pick(NOTES),
            createdAt: noteTime,
          });
        }

        signalInputs.push({
          title,
          description,
          status,
          riskLevel: status === "resolved" ? "active" : riskLevel,
          createdAt,
          updatedAt: resolvedAt ?? lastWorkedAt ?? createdAt,
          resolvedAt: resolvedAt ?? null,
          lastWorkedAt: lastWorkedAt ?? null,
          events: { create: events },
        });
      }
    }

    // Insert all signals in a transaction
    await db.$transaction(
      signalInputs.map((data) => db.signal.create({ data }))
    );

    console.log(`\nDone! Created ${signalInputs.length} signals for ${monthName} ${year}.`);
    console.log(`  Active:   ${activeCount}`);
    console.log(`  Resolved: ${resolvedCount}`);
    console.log(`  Date range: ${monthName} 1–${totalDays}, ${year}\n`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
