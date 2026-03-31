# Hermes V1 Database Schema

## Purpose
This schema reflects the current **manual-first V1** direction for Hermes.

It is intentionally small and avoids premature support for:
- integrations
- automation
- AI briefing generation
- rules engine persistence
- multi-user SaaS concerns

The goal is to support the current V1 loop well:
- create signals quickly
- focus on selected work for today
- add manual updates over time
- mark work as done
- generate a simple standup summary from recorded activity

---

## Design Principles

1. Keep the schema easy to understand and debug manually.
2. Prefer simple tables over highly abstracted future-proof models.
3. Allow future expansion without forcing future complexity into V1.
4. Preserve useful history where it helps timeline, retro, and standup flows.

---

## Recommended Tables

### 1. `signals`
Primary unit of work or concern.

| Column | Type | Required | Notes |
|---|---|---:|---|
| `id` | string / uuid | yes | Primary key |
| `title` | string | yes | Main label for the signal |
| `description` | text | no | Optional longer context |
| `status` | enum | yes | `active` or `resolved` |
| `risk_level` | enum | yes | `active`, `at_risk`, `needs_attention` |
| `created_at` | datetime | yes | When the signal was created |
| `updated_at` | datetime | yes | Updated on every write |
| `last_worked_at` | datetime | no | Last day the user explicitly worked on it |
| `resolved_at` | datetime | no | When the signal was resolved |
| `focused_on_date` | date | no | Used for morning focus / in-flight pinned section |

#### Notes
- `focused_on_date` is enough for the current single-user V1 flow.
- `resolved_at` is recommended even though the split spec only says “mark as resolved,” because it will help timeline, retro, and future reporting with almost no extra complexity.
- `status` and `resolved_at` should stay consistent.

---

### 2. `signal_events`
Manual updates and context attached to a signal over time.

| Column | Type | Required | Notes |
|---|---|---:|---|
| `id` | string / uuid | yes | Primary key |
| `signal_id` | string / uuid | yes | FK to `signals.id` |
| `event_type` | enum | yes | See suggested values below |
| `note` | text | no | Optional user-entered context |
| `link` | string | no | Optional related URL |
| `created_at` | datetime | yes | When the event was recorded |

#### Recommended `event_type` values
- `created`
- `note_added`
- `worked_today`
- `risk_increased`
- `resolved`
- `reopened`
- `link_attached`
- `edited`

#### Notes
- This table replaces the more complex source/event history ideas from the older spec.
- It keeps the app timeline-friendly without introducing integration-level complexity.
- Not every event needs a note.

---

## Relationships

- One `signal` can have many `signal_events`
- Every `signal_event` belongs to exactly one `signal`

---

## Minimal Enum Definitions

### `signal_status`
- `active`
- `resolved`

### `risk_level`
- `active`
- `at_risk`
- `needs_attention`

### `signal_event_type`
- `created`
- `note_added`
- `worked_today`
- `risk_increased`
- `resolved`
- `reopened`
- `link_attached`
- `edited`

---

## Suggested Constraints

### `signals`
- primary key on `id`
- `title` must not be empty
- `status` must be a valid enum value
- `risk_level` must be a valid enum value
- if `status = resolved`, `resolved_at` should usually be present

### `signal_events`
- primary key on `id`
- foreign key `signal_id -> signals.id`
- `event_type` must be a valid enum value
- cascade delete is acceptable for V1 if a signal is deleted

---

## Suggested Indexes

### `signals`
- index on `status`
- index on `risk_level`
- index on `focused_on_date`
- index on `last_worked_at`
- index on `created_at`

### `signal_events`
- index on `signal_id`
- index on `created_at`
- composite index on (`signal_id`, `created_at`)

---

## What Is Deliberately Out of Scope for V1

These belonged to the older, larger schema and are intentionally excluded from the current V1 database design:
- users / auth ownership tables
- integrations and encrypted tokens
- rules tables
- merge suggestions
- briefing snapshot tables
- spaces / producers / signal types
- external source deduplication keys
- multi-user permissions

These can be added later when Hermes moves beyond manual-first V1.

---

## Future Expansion Path

If Hermes expands later, the safest next additions would likely be:
1. `users`
2. `integrations`
3. `briefing_runs`
4. richer source provenance model
5. rules engine persistence

That order preserves the current V1 shape without overcomplicating it now.

---

## Recommended Prisma Shape (Conceptual)

```prisma
model Signal {
  id            String      @id @default(cuid())
  title         String
  description   String?
  status        SignalStatus
  riskLevel     RiskLevel
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  lastWorkedAt  DateTime?
  resolvedAt    DateTime?
  focusedOnDate DateTime?

  events        SignalEvent[]

  @@index([status])
  @@index([riskLevel])
  @@index([focusedOnDate])
  @@index([lastWorkedAt])
  @@index([createdAt])
}

model SignalEvent {
  id        String          @id @default(cuid())
  signalId  String
  eventType SignalEventType
  note      String?
  link      String?
  createdAt DateTime        @default(now())

  signal    Signal          @relation(fields: [signalId], references: [id], onDelete: Cascade)

  @@index([signalId])
  @@index([createdAt])
  @@index([signalId, createdAt])
}

enum SignalStatus {
  active
  resolved
}

enum RiskLevel {
  active
  at_risk
  needs_attention
}

enum SignalEventType {
  created
  note_added
  worked_today
  risk_increased
  resolved
  reopened
  link_attached
  edited
}
```

---

## Decision Triggers That Should Reopen This Schema

If any of these are introduced, the schema should be reviewed immediately:
- multiple users
- integrations or sync
- automatic signal creation
- merge/split workflows
- AI-generated briefings persisted to history
- spaces like work/personal/project
- recurring focus history instead of one date field
- attachments/files stored directly in Hermes
- comments or collaboration from multiple people

---

## Current Recommendation

Build V1 on just:
- `signals`
- `signal_events`

That is enough to support the current manual-first product without dragging future Hermes concerns back into the implementation.

