# Hermes Specification

---

# 🟢 spec_v1.md

## Purpose
Hermes V1 is a **manual-first personal workflow system** focused on helping a single user:
- Regain context quickly
- Decide what to focus on
- Track progress across the day
- Produce a daily standup summary

V1 intentionally avoids integrations and automation.

---

## Core Daily Loop

### 1. Morning Brief
**Goal:** Decide what to focus on today

- Shows signals one-by-one
- User actions:
  - ✅ Focus Today
  - ⏭ Skip for now

**Output:**
- A set of signals marked as `focusedToday`

---

### 2. In Flight
**Goal:** Operate on active work

Sections:
- **Focused Today (pinned)**
- **Everything Else In Flight (scannable list)**

Capabilities:
- View signals
- Jump into Signal Detail
- Add/remove focus

---

### 3. Signal Detail
**Goal:** Deep work and updates

Capabilities:
- Add events (manual updates)
- Attach links/sources
- Mark as resolved
- Increase risk level
- Edit signal details

---

### 4. Daily Retro
**Goal:** Record what actually happened

Flow:
- Walk through signals one-by-one

Actions:
- ✅ Worked on today
- ⚠️ Increase risk
- ✔ Resolve
- ⏭ Skip

---

### 5. Standup Summary
**Goal:** Generate daily output

- Produces dot-point summary of:
  - What was worked on
  - What was resolved
  - What is at risk

- Copy/paste into external tools (e.g. Notion)

---

## Core Concepts

### Signal
A unit of work or concern

Fields:
- id
- title (required)
- description (optional)
- status: active | resolved
- riskLevel: active | atRisk | needsAttention
- createdAt
- lastWorkedAt

---

### Focus Today
Represents intent for the current day

- Derived from date
- Example field:
  - `focusedOnDate`

Used to:
- Populate In Flight (focused section)
- Drive daily prioritisation

---

### Event (Manual Source)
Represents an update or piece of context

Fields:
- id
- signalId
- note
- optional link
- createdAt

---

## New Signal Form

### Default
- Title (required)
- Description (optional)

### Expanded (optional)
- Risk level
- Initial event
- Link

Design principle:
- Fast capture first
- Enrichment later

---

## Risk Model

- Active = normal
- At Risk = dragging / needs attention soon
- Needs Attention = urgent

**No "stale" concept in V1**

---

## UI Principles

- One primary action per screen
- Avoid dense forms
- Progressive disclosure for complexity
- Focused view > list overload

---

# 🔵 spec_future.md

## Integrations
- Jira
- Teams
- GitLab
- Outlook

Capabilities:
- Auto-create signals
- Sync updates into events

---

## Rules Engine (Solomon)
- Automatically classify signals
- Assign risk levels
- Prioritise work
- Provide reasoning

---

## Smart Briefing
- Auto-generated morning brief
- AI summarisation
- Suggested focus items

---

## Calendar View
- Timeline of work
- Search historical activity
- Answer questions like:
  - "When did this start?"
  - "What happened over time?"

---

## Global In-Flight Panel
- Accessible from any screen
- Quick glance at:
  - Needs attention
  - At risk
  - Active
- Opens as overlay/drawer

---

## Advanced Timeline
- Horizontal timeline view
- Keyboard navigation
- Preview panel
- Event-level inspection

---

## Multi-user / SaaS
- Shared signals
- Team workflows
- Permissions

---

## Hephaestus / UI generation
- Dynamic forms
- Config-driven layouts

---

## Chiron / Knowledge layer
- Inline explanations
- Context expansion

---

## Design Principle for Future
- Automation enhances decisions
- Never removes user control

