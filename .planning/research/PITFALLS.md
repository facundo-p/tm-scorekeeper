# Pitfalls Research

**Domain:** Achievement/gamification system added to an existing stats app (Terraforming Mars)
**Researched:** 2026-03-23
**Confidence:** HIGH (grounded in existing codebase + verified patterns from game development community)

---

## Critical Pitfalls

### Pitfall 1: Evaluating All Games History on Every create_game Call

**What goes wrong:**
`AchievementsService.evaluate_game()` fetches the full game history for each participating player to run `compute_tier()`. For a player with 50+ games and 5 players per game, every `create_game` call triggers 5 full-history loads. If evaluators call `get_progress()` too (for the profile response on end-of-game), that's another round.

**Why it happens:**
The evaluator interface receives `games: list[Game]` — it looks clean. But the caller has to load those games from somewhere, and the natural implementation loads all games for each player independently, producing N DB queries per player per game registered.

**How to avoid:**
Load game history once per player (not once per evaluator), and pass the same in-memory list to all evaluators. The `evaluate_game()` method should bulk-fetch all relevant player histories before the evaluator loop:

```python
# WRONG — evaluators fetching their own data
for evaluator in ALL_EVALUATORS:
    games = repo.get_games_for_player(player_id)  # repeated per evaluator
    evaluator.compute_tier(player_id, games)

# CORRECT — load once, pass to all
games_by_player = {
    pid: repo.get_games_for_player(pid)
    for pid in player_ids_in_game
}
for evaluator in ALL_EVALUATORS:
    evaluator.compute_tier(player_id, games_by_player[player_id])
```

**Warning signs:**
- Slow `create_game` response time as game count grows
- DB query count scales with `num_players * num_evaluators` instead of `num_players`
- SQLAlchemy lazy-load warnings in logs

**Phase to address:**
Phase implementing `AchievementsService.evaluate_game()` — define the bulk-load pattern upfront before writing any evaluator.

---

### Pitfall 2: Duplicate Achievement Unlock on Concurrent Requests

**What goes wrong:**
Two `create_game` calls for the same player arrive nearly simultaneously (e.g., correcting a game entry). Both read `persisted_tier = 0`, both compute `new_tier = 1`, both try to INSERT into `player_achievements`. Without a DB-level constraint, the player gets a duplicate row. With a constraint, one request crashes with an unhandled IntegrityError.

**Why it happens:**
The check-then-write pattern (`read persisted tier → compare → insert`) is not atomic. This is a classic TOCTOU (time-of-check/time-of-use) race condition.

**How to avoid:**
The `player_achievements` table already has a `UniqueConstraint("player_id", "code")` in the design. Make the service use `INSERT ... ON CONFLICT DO UPDATE` (upsert) instead of a conditional insert/update. This makes the write idempotent regardless of concurrency:

```python
# Use SQLAlchemy's insert with on_conflict_do_update
from sqlalchemy.dialects.postgresql import insert

stmt = insert(PlayerAchievement).values(
    player_id=player_id, code=code, tier=new_tier, unlocked_at=today
)
stmt = stmt.on_conflict_do_update(
    index_elements=["player_id", "code"],
    set_={"tier": new_tier}  # only update if new_tier > current (add WHERE clause)
)
```

Also: only update if `new_tier > existing_tier` to preserve higher tiers on recomputation.

**Warning signs:**
- IntegrityError exceptions in logs during concurrent game saves
- Duplicate achievement badges shown to a player
- Tests pass in isolation but fail under concurrent load

**Phase to address:**
Phase implementing the persistence layer (`AchievementsRepository`) — define the upsert as the default write operation from day one.

---

### Pitfall 3: Definition/DB Tier Drift After Changing Thresholds

**What goes wrong:**
The code definition for `GAMES_PLAYED` is updated to add a new Tier 6 (threshold: 200). Players who already have Tier 5 in DB are now "behind" — they have the old max tier persisted. Players who don't have Tier 6 yet but reach 200 games correctly get it. But if a threshold is *lowered* (Tier 3 drops from 25 to 20 games), players who had only Tier 2 in DB should now be at Tier 3, but won't be unless something recomputes.

**Why it happens:**
Definitions live in code, unlocks in DB. They can diverge silently whenever definitions change. The system only writes to DB when `computed_tier > persisted_tier`, never correcting downwards or catching newly-reachable tiers for existing players.

**How to avoid:**
The Reconciler is the correct solution — run it after any definition change. Make reconciliation a documented step in the "how to add/modify an achievement" workflow. The Reconciler must handle both directions:
- Upgrade: computed > persisted → update
- (Optional) Downgrade: computed < persisted → decide policy (usually keep highest, since achievements are permanent)

Add a migration checklist comment in the definitions file:
```python
# WHEN CHANGING THRESHOLDS: run `python manage.py reconcile_achievements`
# Lowering a threshold: existing players will get upgraded on reconcile
# Raising a threshold: existing players keep their current tier (no downgrade)
```

**Warning signs:**
- Players complaining they "should have" an achievement they don't
- Achievement counts in the catalog don't add up after a deploy
- Tier shown in profile doesn't match what the player earned based on their stats

**Phase to address:**
Phase implementing the Reconciler — test it with a simulated definition change before shipping.

---

### Pitfall 4: Progress Calculation Inconsistency Between Endpoints

**What goes wrong:**
`GET /players/{id}/achievements` calculates progress on-demand. `POST /games` evaluates tier unlocks. Both call `compute_tier()` and potentially `get_progress()`, but with different game lists (one loads all history, the other only runs during create_game flow). If the game list passed during evaluation doesn't include the game just saved, or if the profile endpoint loads a stale snapshot, the progress bar and the unlock notification can disagree (e.g., "7/10 games" shown when the player actually just hit 10 and unlocked it).

**Why it happens:**
The `evaluate_game()` call in `create_game` runs before or after the game is committed to DB, and the profile endpoint queries independently. Timing of DB commits vs. service calls determines what "games" each path sees.

**How to avoid:**
Establish a clear rule: `evaluate_game()` runs *after* the game is committed to the DB. The evaluators always load game history from the repository (including the just-saved game). The profile endpoint reads from the same source. This ensures both paths see the same state.

Document this ordering constraint explicitly in `GamesService.create_game()`:

```python
def create_game(self, game_dto: GameDTO) -> str:
    # ... validations ...
    game_id = self.games_repository.create(game)  # commit first
    self.achievements_service.evaluate_game(game_id)  # then evaluate
    return game_id
```

**Warning signs:**
- End-of-game shows "Achievement unlocked!" but profile still shows progress bar at 9/10
- Progress bar jumps from 9/10 to showing the tier complete only on next page load
- Tests for progress and unlock disagree on boundary values (e.g., exactly at threshold)

**Phase to address:**
Phase integrating `evaluate_game()` into `create_game()` — verify ordering with a test that checks both the unlock and the progress after the call returns.

---

### Pitfall 5: Notification Flooding for Tiered Achievements

**What goes wrong:**
A player hasn't used the app in 3 months and then registers 8 games at once (catching up). Each `create_game` call evaluates achievements independently. The player gets 5 separate "Achievement unlocked/upgraded!" notifications for `GAMES_PLAYED` as it goes from Tier 1 → 2 → 3 → 4 → 5 across sequential registrations. In practice they all fire in the same session — or worse, all 5 tier upgrades happen from a single reconciler run and the UI shows 5 sequential modals.

**Why it happens:**
The evaluation model processes one game at a time and emits a notification for each tier delta found. If multiple tiers are crossed in one session, each gets its own notification.

**How to avoid:**
`evaluate_game()` should return only the *final achieved tier* compared to the tier at the start of the session, not intermediate jumps. If a player goes from Tier 0 to Tier 3 in one `create_game` evaluation, return one `EvaluationResult(new_tier=3, is_new=True)`, not three separate results. The frontend shows one toast — "Achievement unlocked: Veterano (Tier 3)" — not three.

For the reconciler case: batch all reconciler results per player and deduplicate before showing anything in UI (the reconciler runs server-side and doesn't show UI notifications by design).

**Warning signs:**
- Multiple modals or toasts stacking for the same achievement after a game save
- Players reporting "I got the same achievement 3 times"
- `EvaluationResult` returns a list instead of a single result and the caller maps it to multiple notifications

**Phase to address:**
Phase implementing the end-of-game notification UI — validate with a scenario where a player jumps multiple tiers.

---

### Pitfall 6: Reconciler Causing Unexpected Downgrades

**What goes wrong:**
The Reconciler is designed to correct discrepancies. If an evaluator has a bug that was fixed (e.g., `WinStreakEvaluator` was counting wrong and giving inflated tiers), running the reconciler will *lower* persisted tiers. Players who "earned" Tier 3 under the buggy evaluator now see Tier 1. This feels like the app took away their achievement.

**Why it happens:**
The reconciler by design corrects in both directions. But achievements are supposed to be permanent — the PROJECT.md explicitly states "once gained, they are not lost."

**How to avoid:**
The reconciler must only upgrade, never downgrade. Add a guard in the reconciler logic:

```python
if computed_tier > persisted_tier:
    update(player_id, code, computed_tier)
# If computed_tier < persisted_tier: log the discrepancy, do NOT update
```

If a bug inflated tiers, address it as a data migration with an explicit decision — don't let the reconciler silently take away achievements.

**Warning signs:**
- Players losing previously shown tiers after a deploy that ran reconciliation
- Reconciler logs show "downgrading player X from tier 3 to tier 1" — this line should never exist
- The word "downgrade" appearing anywhere in reconciler code

**Phase to address:**
Phase implementing the Reconciler — make the "no downgrade" rule a test case.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcode `show_progress=False` for all achievements initially | Faster first pass | Progress bars never appear; requires retroactive changes to definitions | Never — define `show_progress` correctly per achievement from the start |
| Skip the Reconciler and re-evaluate all on every profile load | No reconciler to build | Profile loads become O(all players * all games) as dataset grows | Never — reconciler is a core architectural decision already made |
| Store `progress` in DB alongside `tier` | Simplifies profile query | Progress becomes stale; conflicts with "on-demand" decision | Never — on-demand calculation is the right call for this scale |
| Evaluate achievements synchronously in `create_game` without error handling | Simple code path | A bug in one evaluator crashes game creation | Acceptable in early phases if evaluator bugs are guarded with try/except and logged |
| Use a single `unlocked_at` date for all tiers | Simpler schema | Can't show "upgraded on date X" in UI | Acceptable — current schema design only stores one `unlocked_at`, which is fine |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading all games for all players on every `create_game` | Slow game saves, DB query count scales with `players * evaluators` | Bulk-load per player once, pass to all evaluators | At ~20 games per player with 5 evaluators |
| On-demand progress computing full history on every profile view | Slow profile page as game count grows | This is acceptable at current scale; add caching if needed later | At ~500 games per player (unlikely for this app) |
| Reconciler running on startup against all players simultaneously | Slow startup, potential DB lock contention | Make reconciler a manual CLI command, not automatic | First time with >10 players and >50 games each |
| Fetching player achievements for all players in the catalog view with N+1 | Catalog page slow as player count grows | JOIN `player_achievements` and `players` in a single query | At ~15+ players |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| `create_game` + `evaluate_game` | Running evaluation before DB commit — evaluators don't see the new game | Always call `evaluate_game` after `games_repository.create()` returns |
| Reconciler + existing `PlayerAchievement` rows | Running `INSERT` instead of upsert — crashes on existing rows | Use `INSERT ... ON CONFLICT DO UPDATE` or check existence first |
| Frontend achievement notification + existing game-result modal | Showing achievement toast inside the result flow causes z-index/ordering bugs | Treat achievements as a separate response field, not an interrupt |
| `AchievementEvaluator.get_progress()` + `show_progress=False` | Calling `get_progress()` on achievements that don't show it, leaking internal data | Check `definition.show_progress` before calling `get_progress()` in the service |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing all locked achievements in the profile by default | Overwhelming — the profile becomes a todo list instead of a celebration | Default to showing only unlocked achievements; offer "show all" toggle |
| Animating every tier upgrade separately when multiple unlock at once | Multiple stacked modals disrupt the end-of-game experience | Batch all achievements from one game into a single notification pass |
| Showing progress bars for single-game (binary) achievements | Misleading — "0/1 wins with 100+ points" makes no sense as a bar | Only show progress for achievements with `show_progress=True` |
| Showing "Achievement Improved!" without showing what tier was reached | Player doesn't know what they achieved | Always include tier name in upgrade notifications ("Mejorado: Gran Terraformador") |
| Catalog that shows achievement descriptions before they're unlocked | Spoils the discovery; achievements should feel earned | Consider hiding description for locked achievements (show "???" or generic hint) |

---

## "Looks Done But Isn't" Checklist

- [ ] **Achievement evaluation:** Verify the evaluator runs *after* game is committed to DB — test by checking that the game just saved is visible to the evaluator.
- [ ] **Duplicate protection:** Verify upsert (not conditional insert) is used — test by calling `create_game` twice with the same player and confirming only one achievement row exists.
- [ ] **Reconciler direction:** Verify reconciler never lowers a tier — test by seeding a player with Tier 5, running reconciler with a lowered threshold, confirming Tier 5 remains.
- [ ] **Progress accuracy:** Verify progress points to the *next* tier, not the current — `Progress(current=7, target=10)` when at Tier 1 and Tier 2 requires 10.
- [ ] **Notification de-duplication:** Verify a player who jumps 3 tiers gets one notification — not three — at the end of a game.
- [ ] **`show_progress` gating:** Verify single-game achievements never return a `progress` field in the API response.
- [ ] **Tier title in notification:** Verify the notification message includes the *title of the reached tier*, not just "Achievement unlocked".
- [ ] **Profile section empty state:** Verify the profile handles zero achievements gracefully — no broken layout when a player has never unlocked anything.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Duplicate achievement rows in DB | LOW | Delete duplicates manually; add the UniqueConstraint if missing; run reconciler |
| Wrong tiers persisted due to evaluator bug | MEDIUM | Fix the evaluator; run reconciler (upgrades only); manually correct specific cases if downgrade needed via migration |
| Missing achievements for pre-system games | LOW | Run reconciler — it processes all historical games, not just new ones |
| Notification storm shown to user | LOW | UI fix — debounce/batch notifications; no DB changes needed |
| Progress bar shows wrong value | LOW | On-demand calculation — fix the evaluator logic; no DB migration needed |
| Reconciler accidentally downgrades tiers | HIGH | Restore from DB backup if caught early; otherwise manual data migration per player |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| N+1 history loading | Phase: AchievementsService core implementation | Test that `create_game` with 5 players issues at most 5 DB queries for history loading |
| Duplicate unlock on concurrent requests | Phase: AchievementsRepository (persistence layer) | Test: call `evaluate_game` twice for same player/achievement, confirm single DB row |
| Definition/DB tier drift | Phase: Reconciler implementation | Test: change a threshold, run reconciler, verify affected players are updated |
| Progress inconsistency between endpoints | Phase: Integration of evaluate_game into create_game | Test: register a game, immediately query profile, verify progress and tier agree |
| Notification flooding for tier jumps | Phase: End-of-game notification UI | Test: player jumps 3 tiers, confirm single notification with final tier |
| Reconciler downgrades | Phase: Reconciler implementation | Test: seed Tier 5, lower threshold in definition, run reconciler, assert Tier 5 unchanged |

---

## Sources

- Project context: `.planning/PROJECT.md` — architecture decisions, model definitions, evaluator patterns
- Cogmind achievement system design: [Designing and Building a Robust, Comprehensive Achievement System](https://www.gamedeveloper.com/design/designing-and-building-a-robust-comprehensive-achievement-system) — MEDIUM confidence (paywalled, partial content only)
- Steam achievement notification spam community thread: [Paradox Interactive Forums — Excessive notification spam for progress](https://forum.paradoxplaza.com/forum/threads/excessive-notification-spam-for-progress-on-steam-achievements-1-1000-2-1000-3-1000-etc.1604503/) — HIGH confidence (real user reports)
- Race condition / TOCTOU pattern: general backend engineering knowledge + [Race Condition 101 — Medium](https://keroayman77.medium.com/race-condition-101-how-i-exploited-a-real-bug-bounty-scenario-to-break-backend-validation-c39352815f0a) — MEDIUM confidence
- SQLAlchemy N+1 prevention: [How to Avoid N+1 Queries — SQLServerCentral](https://www.sqlservercentral.com/articles/how-to-avoid-n1-queries-comprehensive-guide-and-python-code-examples) — HIGH confidence
- Gamification over-complexity: [7 Gamification Mistakes — Gamify](https://www.gamify.com/gamification-blog/7-gamification-mistakes-and-how-to-avoid-them) — LOW confidence (generic, not code-level)
- Existing codebase: `GamesService.create_game()`, `Game` model, repository structure — HIGH confidence (direct inspection)

---
*Pitfalls research for: Achievement system — Terraforming Mars Stats app*
*Researched: 2026-03-23*
