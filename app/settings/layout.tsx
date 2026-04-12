import { SettingsSidebar } from "./components/settings-sidebar";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row gap-8 md:gap-12">
      <aside className="md:w-52 shrink-0 md:sticky md:top-36 md:self-start">
        <h1 className="text-2xl font-semibold tracking-tight text-on-surface mb-4 hidden md:block">
          Settings
        </h1>
        <SettingsSidebar />
      </aside>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
