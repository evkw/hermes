# Hermes — Design Rules (V1)

## Core Principle

> Show exactly what matters, one decision at a time, with zero noise.

The UI must not reintroduce complexity that the backend has already removed through aggregation and prioritisation.

---

## Primary UX Model — Focus Mode

- One signal displayed at a time
- User performs a single action before moving on
- No dense lists by default
- No dashboards in V1

---

## Signal Card Design

### Structure

- Title (1–2 lines, high emphasis)
- Optional summary (max 2 lines)
- Subtle divider (or whitespace separation)
- One primary action
- Minimal secondary actions

### Example

```
Pipeline failed on main branch

Build failed after last merge to main. Likely blocking deployment.

[Investigate failure]

Later    •    Mark done
```

---

## Visual Design Rules

### 1. No Visual Noise

- No heavy borders
- Prefer whitespace over containers
- Avoid shadows unless extremely subtle

### 2. Intentional Colour Usage (Critical)

Colour is rare, deliberate, and highly meaningful.

- Default UI is neutral (greys, black, white)
- Colour must never be decorative
- Colour is reserved for urgency and importance only

Priority signals:

- Red → Immediate action required (drop everything)
- Yellow → Needs action today (will become a problem if ignored)

Rules:

- No colour gradients
- No multiple competing colours on a screen
- No colour used for styling or branding emphasis
- When colour appears, it must feel significant and intentional

### 3. Typography-First Hierarchy

- Title carries primary weight
- Summary is secondary and optional
- Actions are clear but not visually dominant

### 4. No Images

- Images are not used anywhere in the product
- They do not add value to decision-making
- All UI elements must be functional and purposeful

---

## Interaction Rules

### 1. Single Clear Action

Every signal must answer:

> What should I do next?

- Only one primary CTA allowed
- No toolbars or multiple competing actions

### 2. Progressive Disclosure

- Source context is hidden by default
- Expand only when user explicitly requests it

Example:

```
[Show context →]
```

### 3. Forward Momentum

Interaction loop:

1. See signal
2. Take action or defer
3. Move to next signal

---

## Information Density Rules

### Hidden by Default

Do NOT show unless expanded:

- Source count
- Timestamps
- Integration labels
- Tags

### Visible by Default

Only show:

- Title
- Short summary (optional)
- Primary action

---

## Priority Handling

- Signals are pre-sorted by backend priority
- Do NOT display priority labels (HIGH / MEDIUM / LOW)
- Do NOT use colour coding for priority

The system should be trusted to surface the right item.

---

## Navigation & Layout

### Main Screen

- Centered single card
- Minimal top bar (date + progress only)

Example:

```
March 26
3 / 12

[ Signal Card ]
```

### Progress Awareness

- Show progress (e.g. 3 / 12)
- Do not show full list by default

---

## Secondary Actions

Secondary actions must be:

- Low emphasis
- Inline text (not buttons)
- Optional

Allowed:

- Later
- Mark done

---

## Escape Hatch (Required)

A minimal "View all" mode must exist:

- Simple vertical list
- No additional UI complexity
- Same card design, reduced size

This is not the default experience.

---

## Behavioural Enhancements (V1 or V1.1)

### Quick Wins Mode

Optional filter:

- Shows low-effort signals only
- Designed for short time windows

---

## Anti-Patterns (Avoid at All Costs)

- Dashboards with multiple panels
- Colour-heavy priority systems
- Dense tables or grids
- Multiple competing CTAs per signal
- Showing all metadata by default
- Forcing users to compare signals side-by-side

---

## Guiding Philosophy

- Reduce thinking, not increase it
- Prioritisation happens in the system, not the UI
- The UI exists to drive action, not analysis
- Calm > clever
- Simple > powerful-looking

---

## Future Considerations (Not V1)

- Command center / dense view
- Priority matrix
- Advanced filtering UI
- Bulk actions

Only introduce these if they do not compromise the focus-first experience.

