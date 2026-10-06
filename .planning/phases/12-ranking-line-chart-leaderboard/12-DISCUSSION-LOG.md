# Phase 12: Ranking line chart + leaderboard - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-01
**Phase:** 12-ranking-line-chart-leaderboard
**Areas discussed:** Chart legend, "Última delta" scope, Single-game hint placement, Chart height on desktop

---

## Chart legend

| Option | Description | Selected |
|--------|-------------|----------|
| Recharts `<Legend>` inside chart | Player names + colored line swatches inside chart area. Chart is self-contained. | ✓ |
| No legend (rely on MultiSelect) | MultiSelect above already shows active players. Less visual clutter but chart alone doesn't identify colors. | |

**User's choice:** Recharts `<Legend>` inside chart
**Notes:** User selected the self-contained layout where the chart screenshot is readable without the filters visible.

---

## "Última delta" scope in leaderboard

| Option | Description | Selected |
|--------|-------------|----------|
| Last delta in filtered window | Delta from most recent game visible in the current chart (respects 'Desde' filter). | |
| Always global last delta | Always from the player's most recent game overall, ignoring date filter. Reflects current momentum. | ✓ |

**User's choice:** Always global last delta
**Notes:** The leaderboard "Última delta" should reflect a player's current momentum, not what happened in the zoomed-in window. This means the leaderboard receives the full unfiltered `dataset`.

---

## Single-game hint placement

| Option | Description | Selected |
|--------|-------------|----------|
| Small note below the chart | Muted-text line directly under the chart. Non-intrusive; chart with single dot renders first. | ✓ |
| Caption above the chart | Small muted label above the chart container, seen before the minimal chart. | |

**User's choice:** Small muted note below the chart
**Notes:** User prefers non-intrusive placement — single dot renders, hint adds context below without a warning banner blocking the view.

---

## Chart height on desktop

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed 280px everywhere | Same height mobile and desktop. Simpler, consistent with skeleton. | |
| Taller on desktop (e.g. 400px) | 280px mobile, 400px desktop via media query. More vertical space for ELO variation. | ✓ |

**User's choice:** Taller on desktop (400px at ≥768px)
**Notes:** `ResponsiveContainer` handles width; height is set on the wrapper div via media query in the CSS Module.

---

## Claude's Discretion

- Exact `player_id` hash function (deterministic, uniform, outputs palette index)
- Exact 6–8 colors in the palette (must pass 3:1 WCAG contrast against `#2c1810`)
- X-axis tick format (short date labels, sparse, mobile-readable)
- Whether `EloLeaderboard` receives raw `dataset` or pre-computed `leaderboardRows`
- Internal function naming in components

## Deferred Ideas

- Date presets (RANK-FUT-01)
- Click-line-to-highlight (RANK-FUT-03)
- Switchable X-axis (RANK-FUT-04)
- Accessible data table as always-visible (RANK-FUT-02)
- Leaderboard click-through to player profile
- Backend params cleanup (`from`/`player_ids` not used by frontend)
