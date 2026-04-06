import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type SectionCardProps = {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function SectionCard({
  title,
  actions,
  children,
  className,
}: SectionCardProps) {
  return (
    <section
      className={cn(
        "rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.06)] p-6",
        className
      )}
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xs font-medium uppercase tracking-wider text-outline">
          {title}
        </h2>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  );
}
