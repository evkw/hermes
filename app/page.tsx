export default function Home() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <header>
      <h1 className="text-[3.5rem] font-semibold tracking-[-0.04em] text-on-surface leading-tight">
        Morning Brief
      </h1>
      <p className="text-on-surface-variant font-medium mt-2">{today}</p>
    </header>
  );
}
