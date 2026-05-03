type EmptySignalSlotProps = {
  slotNumber: number;
  totalSlots: number;
};

export function EmptySignalSlot({
  slotNumber,
  totalSlots,
}: EmptySignalSlotProps) {
  return (
    <div className="flex min-h-[100px] flex-col gap-4 rounded-2xl border border-dashed border-outline-variant/70 bg-surface-container-low/70 p-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-outline">
              {slotNumber} of {totalSlots}
            </span>
          </div>

          <p className="mt-3 text-sm font-medium text-on-surface">
            Empty Focus Slot
          </p>
        </div>
      </div>
    </div>
  );
}
