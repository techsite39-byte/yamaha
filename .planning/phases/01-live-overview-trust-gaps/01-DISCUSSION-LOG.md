# Phase 1: Live Overview & Trust Gaps - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-11-14
**Phase:** 1-Live Overview & Trust Gaps
**Areas discussed:** Overview hierarchy, Freshness, Chart range

---

## Overview hierarchy

| Option | Description | Selected |
|--------|-------------|----------|
| KPI snapshot | Lead with a compact metric row, then follow-up queues and trends. | ✓ |
| Pending work | Lead with pending bookings and enquiries. | |
| Recent activity | Lead with the latest bookings and enquiries. | |

**User's choice:** KPI snapshot first.
**Notes:** Use a primary metric row and compact secondary row; retain every requested metric.

### Metric layout

| Option | Description | Selected |
|--------|-------------|----------|
| Primary and secondary | Emphasize motorcycles, bookings, pending work, and enquiries in the primary row. | ✓ |
| Equal tiles | Give every metric equal visual weight. | |
| Grouped metrics | Group by catalogue, bookings, and customer engagement. | |

**User's choice:** Primary row plus compact secondary row.
**Notes:** All requested counts remain available.

### Recent activity layout

| Option | Description | Selected |
|--------|-------------|----------|
| Side by side | Separate booking and enquiry panels on desktop, stacked on mobile. | ✓ |
| Tabs | Switch between separate booking and enquiry lists. | |
| Unified feed | Interleave bookings and enquiries in one feed. | |

**User's choice:** Side-by-side panels.
**Notes:** Stack the panels at mobile widths.

### Quick action placement

| Option | Description | Selected |
|--------|-------------|----------|
| Header actions | Put compact actions beside the page heading. | ✓ |
| Dedicated card | Use a separate card near the KPI row. | |
| Below activity | Place shortcuts after recent activity. | |

**User's choice:** Header actions.
**Notes:** Shortcuts are Motorcycles, Bookings, and Enquiries.

### KPI interaction

| Option | Description | Selected |
|--------|-------------|----------|
| Navigate to section | Navigate to the related admin section and filter where practical. | ✓ |
| Display only | Keep KPI cards non-interactive. | |

**User's choice:** Navigate to the related section.
**Notes:** Apply a relevant filter when practical.

### Actionable count treatment

| Option | Description | Selected |
|--------|-------------|----------|
| Subtle status accents | Accent actionable counts and keep totals neutral. | ✓ |
| Equal neutral emphasis | Use the same treatment for all counts. | |
| Strong alert colors | Use prominent alerts for pending/unread counts. | |

**User's choice:** Subtle status accents.
**Notes:** Keep the visual treatment restrained.

### Overview chart

| Option | Description | Selected |
|--------|-------------|----------|
| Trend lines | Show separate booking and enquiry trends over time. | ✓ |
| Grouped bars | Compare monthly booking and enquiry counts. | |
| Booking pipeline | Emphasize booking-status distribution. | |

**User's choice:** Separate trend lines.
**Notes:** Chart data must come from the API.

---

## Freshness

| Option | Description | Selected |
|--------|-------------|----------|
| Load on entry and manual refresh | Fetch on route entry and retain the explicit refresh action. | ✓ |
| Periodic auto-refresh | Poll at a fixed interval. | |
| Real-time push updates | Use a push-based update channel. | |

**User's choice:** Remaining discussion choices were resolved automatically at the user's request; load on entry and manual refresh was selected as the conservative default.
**Notes:** Do not add polling; show last-updated time and actual backend/storage availability. Never report failed or unavailable services as connected.

---

## Chart range

| Option | Description | Selected |
|--------|-------------|----------|
| Recent activity | Focus on a recent 30-day window. | |
| Trailing 12 calendar months | Show monthly booking and enquiry trends for the last 12 calendar months. | ✓ |
| All available history | Include the full historical dataset. | |

**User's choice:** Remaining discussion choices were resolved automatically at the user's request; trailing 12 calendar months was selected as the default.
**Notes:** Zero-count months are valid only after a successful query. Errors are not replaced with sample values or zeros.

---

## the agent's Discretion

- Use the existing admin API helpers, components, routes, and styling patterns where appropriate.
- Choose accessible chart rendering and responsive breakpoints without changing the decisions recorded in CONTEXT.md.
- Implement technical details within the approved phase boundary and preserve existing authentication.

## Deferred Ideas

None.
