import { db } from "@/lib/db";
import { CalendarView } from "./components/calendar-view";

export const dynamic = "force-dynamic";

export type DayCounts = {
  created: number;
  worked: number;
  resolved: number;
};

export type DaySignalActivity = {
  signalId: string;
  title: string;
  created: boolean;
  worked: boolean;
  resolved: boolean;
};

export type DayDetail = {
  counts: DayCounts;
  signals: DaySignalActivity[];
};

export type MonthData = Record<string, DayDetail>;

async function getMonthData(year: number, month: number): Promise<MonthData> {
  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + 1, 1));

  const [signals, events] = await Promise.all([
    db.signal.findMany({
      where: {
        createdAt: { gte: start, lt: end },
      },
      select: { id: true, title: true, createdAt: true },
    }),
    db.signalEvent.findMany({
      where: {
        createdAt: { gte: start, lt: end },
        eventType: { in: ["worked_today", "resolved"] },
      },
      select: { eventType: true, createdAt: true, signalId: true, signal: { select: { title: true } } },
    }),
  ]);

  const data: MonthData = {};

  function getKey(date: Date): string {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
  }

  function ensure(key: string): DayDetail {
    if (!data[key]) data[key] = { counts: { created: 0, worked: 0, resolved: 0 }, signals: [] };
    return data[key];
  }

  function ensureSignal(day: DayDetail, signalId: string, title: string): DaySignalActivity {
    let entry = day.signals.find((s) => s.signalId === signalId);
    if (!entry) {
      entry = { signalId, title, created: false, worked: false, resolved: false };
      day.signals.push(entry);
    }
    return entry;
  }

  for (const s of signals) {
    const key = getKey(s.createdAt);
    const day = ensure(key);
    day.counts.created++;
    ensureSignal(day, s.id, s.title).created = true;
  }

  for (const e of events) {
    const key = getKey(e.createdAt);
    const day = ensure(key);
    const entry = ensureSignal(day, e.signalId, e.signal.title);
    if (e.eventType === "worked_today") {
      day.counts.worked++;
      entry.worked = true;
    }
    if (e.eventType === "resolved") {
      day.counts.resolved++;
      entry.resolved = true;
    }
  }

  return data;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const year = params.year ? parseInt(params.year, 10) : now.getFullYear();
  const month = params.month ? parseInt(params.month, 10) - 1 : now.getMonth();

  const monthData = await getMonthData(year, month);

  return (
    <div className="max-w-screen-xl mx-auto px-6 md:px-12 py-8">
      <CalendarView year={year} month={month} data={monthData} />
    </div>
  );
}
