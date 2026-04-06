export function EmptyFocus() {
    return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant/60 py-12 px-6 text-center">

            <h3 className="text-base font-semibold text-on-surface">Clear horizon</h3>
            <p className="mt-1 max-w-xs text-sm text-secondary">
                You have no active threads prioritized for today. Start fresh with a
                briefing or select a signal to focus on.
            </p>

            <div className="mt-6 flex items-center gap-3">
                <a
                    href="/"
                    className="inline-flex h-9 items-center rounded-lg bg-on-surface px-4 text-sm font-medium text-surface transition-colors hover:bg-on-surface/85"
                >
                    Start Morning Brief
                </a>
                <a
                    href="#everything-else"
                    className="inline-flex h-9 items-center rounded-lg border border-outline-variant/60 bg-surface px-4 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container"
                >
                    Focus on a signal below
                </a>
            </div>
        </div>
    );
}
