# Feature Research

**Domain:** Achievement / Gamification system for board game stats tracker
**Researched:** 2026-03-23
**Confidence:** MEDIUM — board game companion apps are niche; patterns drawn from BGA, NemeStats, BGStats, and general gamification research. Core design principles are HIGH confidence; specific feature prioritization is MEDIUM.

---

## Feature Landscape

### Table Stakes (Users Expect These)

These are the features any achievement system needs to not feel broken or incomplete. Missing any of these degrades the experience significantly.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Persistent unlocks (never lost) | Achievements that disappear feel like a bug, not a feature. Players expect earned things to stay earned. | LOW | Already decided: unlocks stored in DB, permanent |
| Unlock notification at end of game | Without immediate feedback, the action-reward connection is broken. Players won't notice they earned anything. | LOW | Mini display (icon + title) already decided; toast-style on result screen |
| Achievement visible on player profile | Profiles without achievements feel incomplete once the system exists. Players expect to see their history. | MEDIUM | Full view with icon, title, tier, description, progress |
| Progress indicator for cumulative achievements | "7/10 partidas" is the minimum viable motivation hook. Without it, players have no reason to push toward the next tier. | LOW | Only for accumulated-type; already decided. Single-game stays binary. |
| Global achievement catalog | Players need to know what exists to have goals. A hidden catalog makes achievements feel like surprises rather than goals. | MEDIUM | Grid with all achievements, locked/unlocked state visible |
| Tier display showing highest tier only | Showing all unlocked tiers creates visual clutter. Standard pattern (see BGA, Steam) is to show the evolved badge. | LOW | Already decided. Badge "evolves". |
| Differentiated notification: new vs. upgraded | Without differentiation, unlocking tier 3 feels the same as unlocking for the first time. Players feel cheated of a "new" moment. | LOW | Already decided. "Nuevo logro!" vs "Logro mejorado!" |
| Unlock date stored | Users ask "when did I earn this?" — it's basic provenance data. Very low effort, expected by default. | LOW | `unlocked_at` field already in DB model |
| Evaluator runs automatically on game save | Manually triggering achievement evaluation is not acceptable UX. Must be invisible. | LOW | `AchievementsService.evaluate_game()` triggered in `create_game` |

### Differentiators (Competitive Advantage)

These features go beyond what users assume. They align with the app's core value of deepening investment in Terraforming Mars stats.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| TM-specific achievement definitions | Generic "played 10 games" is fine but "won with 100+ pts in a single game" ties achievements to Terraforming Mars knowledge. Players who know the game will value game-specific thresholds. | MEDIUM | Requires designing a good initial catalog. Single-game, accumulated, and combination types cover this space well. |
| Combination / streak achievements | "Ganar 3 seguidas" rewards a pattern of play that simpler systems miss. NemeStats uses Nemesis/streak stats as a differentiator. BGA has these as well. | HIGH | Custom evaluators (WinStreakEvaluator pattern). Highest complexity but high perceived value. |
| Progress toward next tier (not just current tier) | Showing "you're at tier 3, and 7/10 games toward tier 4" creates a pull-forward effect that generic achievement lists don't have. | LOW | Already in the `get_progress()` contract. |
| Contextual progress hint near unlock threshold | When a player is close (e.g. 80%+ progress), surfacing a hint ("Solo te faltan 2 partidas para el siguiente nivel") increases engagement. Research shows contextual reminders are a meaningful differentiator. | MEDIUM | Not in current scope. Flag for v1.x if desired. |
| SVG custom icons per achievement | Most board game companion apps use emoji or generic icon libraries. Custom SVGs make achievements feel crafted for this specific game, increasing perceived value. | MEDIUM | Fallback chain already decided (SVG → Lucide → emoji). Can ship with fallbacks and add SVGs progressively. |
| Reconciler for retroactive correctness | Players who trust that their achievements are always accurate will engage more. The reconciler prevents situations where changing a tier threshold creates permanent inconsistency. | MEDIUM | `AchievementsReconciler` already designed. |
| Catalog shows which players have each achievement | "3 de 5 jugadores tienen esto" adds social dimension without requiring social features. NemeStats uses this pattern effectively. | MEDIUM | Currently in scope as "catálogo global". |

### Anti-Features (Commonly Requested, Often Problematic)

These are features that sound appealing but create more problems than value for this specific app and user base.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Record-based achievements ("tener el record de X") | Feels natural — records and achievements are close siblings | Records change over time; an achievement tied to a record would need to be revocable (contradicts "permanent" principle) or become permanently tied to a historical state. Creates confusion and complexity without proportional value. | Separate domain: records stay as records. Achievements reward behaviors, not current standings. |
| Leaderboard / achievement ranking between players | Social competition feels motivating | Small group app (family/friends). Leaderboards pit players against each other and can reduce motivation for players at the bottom. BGA's leaderboard works at scale; here it would just show "Facundo has more achievements than you". | Show catalog with who-has-what context, but not ranked. |
| Push / email notifications | "Never miss an unlock" | This is a personal stats tracker, not a live service. Notification infrastructure (APNS, FCM, SMTP) is enormous overhead for zero marginal value — users open the app when they play. | In-app notification at game end is sufficient. |
| Animated unlock sequences (elaborate) | First-time unlock feels special | High animation complexity (Lottie, CSS keyframes, orchestration) for a moment that lasts 2 seconds. Risk of slowing down game-end flow on mobile. | Mini display (icon + title) with a simple CSS fade-in is sufficient and already decided. |
| Secret / hidden achievements | Mystery creates curiosity | For a small group app, hidden achievements feel like a puzzle for its own sake. Players don't have the volume of play to discover them organically. Hidden achievements also prevent informed goal-setting. | All achievements visible in catalog, even locked ones. Show description so players know what to aim for. |
| Achievements based on multi-player cooperation | "Play X games with the same group" | Requires tracking group identity across sessions (complex) and raises fairness questions when groups are fluid. | Combine individual accumulated achievements with the natural social context of playing together. |
| Negative / penalty achievements | "Lose 5 games in a row" as a joke badge | Punitive mechanics consistently reduce engagement (documented in gamification research). Even ironic negative achievements can make casual players feel targeted. | Keep all achievements aspirational and forward-looking. |
| Complex UI unlock animations shown on the catalog | Visual flair | Catalog is browsed, not actively unlocked. Animating every badge on page load is performance overhead and motion noise. | Animate only at the moment of unlock notification; catalog is static. |

---

## Feature Dependencies

```
[Game Save (existing)]
    └──triggers──> [Achievement Evaluator]
                       └──requires──> [Achievement Definitions (code)]
                       └──requires──> [Player Achievements Table (DB)]
                       └──produces──> [EvaluationResult: new/upgraded tier]
                                          └──feeds──> [End-of-game Notification]

[Player Profile]
    └──requires──> [Player Achievements Table]
    └──requires──> [Progress Calculation (on-demand)]
                       └──requires──> [Achievement Definitions (code)]

[Global Catalog]
    └──requires──> [Achievement Definitions (code)]
    └──enhances-with──> [Player Achievements Table (who has what)]

[Reconciler]
    └──requires──> [Achievement Evaluator]
    └──requires──> [Player Achievements Table]
    └──independent-of──> [Game Save trigger]
```

### Dependency Notes

- **Achievement Evaluator requires Definitions:** Evaluators are instantiated from `AchievementDefinition` objects in `ALL_EVALUATORS`. Definitions must be written before any evaluation can run.
- **Progress Calculation is on-demand, not persisted:** Depends on evaluator + full game history. Cannot be decoupled from having the evaluator available.
- **End-of-game notification requires EvaluationResult:** The `evaluate_game()` response must carry unlock events back to the API layer so the frontend can display them. The schema of this response is a shared contract between backend and frontend.
- **Global Catalog enhances with player data:** The catalog can render as a pure static list (just definitions) before any games are played. The "who has it" overlay is additive, not blocking.
- **Reconciler is independent of game flow:** Can run at startup or on demand without affecting the normal path. Dependency is only on the same evaluator logic.

---

## MVP Definition

### Launch With (v1)

Minimum to make the achievement system feel complete and not broken.

- [ ] Achievement definitions for initial catalog (3-5 well-designed achievements covering all 3 types) — core value proof
- [ ] Evaluator runs on `create_game`, persists new/upgraded tiers — without this, nothing works
- [ ] End-of-game notification: mini display (icon + title + new/improved label) — without this, players don't know they unlocked something
- [ ] Player profile section: full achievement list with icon, title, tier, description, progress for accumulated — without this, achievements have nowhere to live
- [ ] Global catalog: all achievements with locked/unlocked state — without this, achievements have no discoverability
- [ ] Reconciler (manual/startup) — without this, changing tier thresholds creates permanent inconsistency
- [ ] Profile restructured into sections (Stats, Records, Logros) — needed to accommodate achievement section without breaking existing layout

### Add After Validation (v1.x)

- [ ] Contextual "almost there" hint when player is 80%+ toward next tier — adds pull-forward motivation; add if players ask "how close am I?"
- [ ] SVG custom icons for high-value achievements — start with Lucide fallbacks, upgrade as art becomes available
- [ ] Combination achievements beyond win streak (e.g. "play on all maps") — higher complexity; validate that simpler achievements get used first

### Future Consideration (v2+)

- [ ] Per-achievement stats in catalog (how many players have it, rarity %) — interesting but requires usage data to be meaningful
- [ ] Achievement filtering/search in catalog — only valuable when catalog grows beyond ~15-20 entries
- [ ] Time-based achievements (e.g. "earn X in 30 days") — adds temporal mechanics; only valuable if app has sustained daily usage

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Evaluator on game save | HIGH | LOW | P1 |
| End-of-game notification (mini) | HIGH | LOW | P1 |
| Player profile achievement section | HIGH | MEDIUM | P1 |
| Global achievement catalog | HIGH | MEDIUM | P1 |
| Initial achievement definitions (3-5 types) | HIGH | MEDIUM | P1 |
| Progress indicator (accumulated only) | HIGH | LOW | P1 |
| Reconciler | MEDIUM | MEDIUM | P1 |
| Profile section restructure | MEDIUM | LOW | P1 |
| Custom SVG icons | MEDIUM | HIGH | P2 |
| Combination achievements (non-streak) | HIGH | HIGH | P2 |
| Contextual "almost there" hint | MEDIUM | MEDIUM | P2 |
| Catalog filtering / search | LOW | MEDIUM | P3 |
| Per-achievement rarity stats | LOW | LOW | P3 |
| Time-based achievements | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

| Feature | BGA (BoardGameArena) | NemeStats | BGStats | Our Approach |
|---------|----------------------|-----------|---------|--------------|
| Achievement tiers | Yes (Bronze/Silver/Gold equivalent) | Yes (multiple levels) | Custom Insight levels (user-defined) | Tiers baked into definitions, not user-defined |
| Permanent unlocks | Yes | Yes | N/A (manual) | Yes, core principle |
| Progress indicators | Yes | Partial (NemePoints) | Win %, H-index | Yes, for accumulated type only |
| Global catalog | Yes (large, 700+ achievements) | Yes (smaller catalog) | No | Yes, curated |
| Who-has-it visibility | Yes, social | Yes, within group | No | Yes, within player group |
| End-of-game notification | Yes (toast style) | No | No | Yes, mini display |
| Differentiated new vs. upgrade | No (uniform notification) | No | No | Yes — differentiator |
| Combination / streak achievements | Yes | Yes (Nemesis/streak) | No | Yes (win streak in v1) |
| Custom icons | Generic icons | Freepik icons | No | SVG custom + fallback chain |
| Record-based achievements | No | No | No | Explicitly excluded |
| Hidden/secret achievements | Some | No | No | Explicitly excluded |

---

## Sources

- [BGA Achievements FAQ](https://forum.boardgamearena.com/viewtopic.php?t=15001) — XP/achievement system structure, tier patterns, catalog approach (MEDIUM confidence, documentation from 2020-2023 era)
- [NemeStats Badges and Achievements](https://nemestats.com/Home/AboutBadgesAndAchievements) — permanent achievements, dynamic badges, Bronze/Silver/Gold tiers (HIGH confidence, official source)
- [What Makes Achievement Systems Work — Trophy](https://trophy.so/blog/what-makes-achievement-systems-work) — visibility, progress indicators, immediate notification as table stakes (MEDIUM confidence, single source)
- [Collectible Achievements UX Pattern](https://ui-patterns.com/patterns/CollectibleAchievements) — difficulty curve, quality over quantity, tier patterns (MEDIUM confidence)
- [Why Badges Fail in Gamification — Game Developer](https://www.gamedeveloper.com/design/why-badges-fail-in-gamification-4-strategies-to-make-them-work-properly) — anti-pattern analysis (MEDIUM confidence)
- [BGStats Wishlist and Features](https://www.bgstatsapp.com/board-game-stats/wishlist/) — what users request in board game trackers (MEDIUM confidence)
- [Gamification Design Patterns 2025 — Smartico](https://www.smartico.ai/blog-post/gamification-strategies-in-2025) — general gamification principles, engagement data (LOW confidence, marketing source)

---

*Feature research for: Achievement/gamification system — Terraforming Mars Stats companion app*
*Researched: 2026-03-23*
