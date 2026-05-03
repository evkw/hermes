/**
 * Barrel re-export for backward compatibility.
 * Individual modules live in signal-*.ts files.
 */
export {
  createSignal,
  updateSignal,
  getSignalWithEvents,
  type CreateSignalState,
  type UpdateSignalState,
} from "./crud";

export {
  resolveSignal,
  resolveSignalWithChecklistCheck,
  unresolveSignal,
  increaseRisk,
  type ResolveSignalResult,
} from "./lifecycle";

export {
  toggleFocusToday,
  markWorkedToday,
  getFocusedSignals,
  focusSignal,
  unfocusSignal,
  displaceAndFocusSignal,
  type DisplaceSignalState,
} from "./focus";

export {
  createSignalSource,
  updateSignalSource,
  deleteSignalSource,
  type SourceActionState,
} from "./sources";

export {
  createSignalEvent,
  updateSignalOwner,
  toggleSummaryExclusion,
  type CreateEventState,
  type UpdateOwnerState,
} from "./events";

export {
  createChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
  type ChecklistItemState,
} from "./checklist";
