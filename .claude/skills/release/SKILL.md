---
name: release
description: Promote staging to production — propose the next version, write the user-facing NOVEDADES entry, open the release PRs and walk the owner through the deploy checklist
argument-hint: [optional: X.Y.Z to force the version]
disable-model-invocation: true
---

# Release

Promote `staging` to `main` (production) as version `X.Y.Z`. Process and conventions: `docs/deploy/README.md`.

**The agent never acts on production.** Supabase, Render, Vercel and the merge to `main` belong to the owner: show
what to do (command, SQL, screen) and wait for an explicit confirmation before moving on. Every **GATE** below is a
stop: ask, wait for the answer, then continue. Talk to the owner in Spanish.

GitHub: use the `mcp__github__*` tools (or `gh` when available). Repo: `facundo-p/tm-scorekeeper`.

## 0. Where are we

```bash
git status --short                       # must be clean
git fetch origin main staging --tags
git rev-list --count origin/main..origin/staging   # 0 → nothing to promote: stop
git describe --tags --abbrev=0 --match 'v*' origin/main 2>/dev/null   # last release tag (none on the first run)
git show origin/main:VERSION 2>/dev/null           # production version (missing before the first release)
git show origin/staging:VERSION
```

Resume instead of starting over:
- `staging`'s `VERSION` is greater than `main`'s and `docs/NOVEDADES.md` on `staging` has its entry → preparation is
  merged: go to step 5.
- An open PR `staging → main` exists → go to step 6.
- A `release/vX.Y.Z` PR to `staging` is open → wait for the owner to merge it, then step 5.
- Tag `vX.Y.Z` already exists → stop and ask.

## 1. What changed

Base: the last `v*` tag, or `origin/main` if there is none. One merge commit per PR on `staging`'s first parent:

```bash
git log --first-parent --format='%h %s' <base>..origin/staging
```

Read each PR (`pull_request_read`, number from `(#N)` or `Merge pull request #N`) when the title is not enough.
If the range closes a milestone, also read its section in `.planning/MILESTONES.md`.

Classify every PR as **visible** (a user notices it: screens, flows, data shown, rules, speed, access) or
**internal** (CI, infra, tests, refactors, docs, tooling, planning). Only visible ones reach NOVEDADES.

## 2. Version

Current = `staging`'s `VERSION`. Propose the bump (`$ARGUMENTS` overrides the proposal):

| Bump | When |
|---|---|
| MAJOR | milestone, or how the app or the API is used changes (login required, endpoints retired) |
| MINOR | new visible functionality |
| PATCH | fixes, or only internal changes |

The proposal is always «current + bump»; a `VERSION` that was bumped but never released is caught by the resume
rules of step 0 (its NOVEDADES entry exists), so it is never bumped twice.

## 3. NOVEDADES draft

Draft the entry for `docs/NOVEDADES.md` for the people who play, not for developers:
- Rioplatense Spanish, as the app speaks; short sentences; what they can do now and where (name the screen).
- No jargon or internal ids: no endpoint, migration, PR, commit, D-xx, F-xx, component, refactor.
- Group several PRs into one line when they are one thing for the user; leave out whatever they would not notice.
- Only the sections that have content:

```markdown
## X.Y.Z — YYYY-MM-DD

<One sentence: what this version is about.>

### Nuevo
- …

### Mejoras
- …

### Correcciones
- …

### Para tener en cuenta
- <changes in how to use it: new login, something that moved or was removed>
```

Only internal changes → the entry is just the heading and «Mejoras internas, sin cambios visibles.»

**GATE:** show the version and the draft, together with the list of PRs left out as internal. The owner approves or
edits. Do not continue without approval.

## 4. Preparation PR to `staging`

```bash
git checkout -b release/vX.Y.Z origin/staging
node tools/release/bump.mjs X.Y.Z          # VERSION, frontend/package*.json, backend/version.py
```

Insert the approved entry in `docs/NOVEDADES.md` right below `<!-- release:entradas -->` (newest first). If a
milestone section in `.planning/MILESTONES.md` says it is waiting for promotion, leave it: step 7 updates it.

```bash
node tools/release/bump.mjs --check && node --test tools/release/*.test.mjs
git add -A && git commit -m "release: vX.Y.Z (versión y novedades)"
git push -u origin release/vX.Y.Z
```

Open the PR to `staging` titled `Release vX.Y.Z: versión y novedades`, with the entry as the body. CI must be green.
**GATE:** the owner merges it (as any PR to `staging`). Then `git fetch origin staging`.

## 5. Before promoting

Generic, always:
- **Backup:** GitHub → Actions → *Backup Supabase to R2* → *Run workflow*, label `pre-vX.Y.Z`
  (`docs/backups.md`). The owner confirms the file is in R2.

Specific: if `docs/deploy/vX.Y-checklist.md` exists (`X.Y` = major.minor of the release), walk its section
«Antes de promover» item by item: show each command or SQL as written there, ask for the result, and stop on
anything that does not match. Items it already covers (backup) are not repeated.

**GATE:** the owner confirms every item. Any doubt → stop; never «we'll check later».

## 6. Promote

Open the PR `staging → main`: title `Release vX.Y.Z`, body = the NOVEDADES entry plus a link to the specific
checklist when there is one. Subscribe to its activity if the session can (`subscribe_pr_activity`); otherwise check
CI when the owner asks. A red check is real: report what failed and why; never re-run to «see if it passes».

When CI is green: **GATE** — tell the owner it is ready. **The owner merges, with a merge commit.** Do not merge.

## 7. After the merge

1. Follow the `migrate-and-deploy` run on `main` (`actions_list` / `get_job_logs`): `alembic upgrade head` must end
   without error and the Render hook must be called. If it fails: do **not** tag; show the matching case of
   «Si algo sale mal» (specific checklist, else `docs/deploy/README.md`) and stop.
2. Tag the merge commit (`merge_commit_sha` of the PR):

   ```bash
   git fetch origin main
   git tag -a vX.Y.Z <merge_commit_sha> -m "vX.Y.Z"
   git push origin vX.Y.Z
   ```

   If the push is refused, give the owner those two commands.
3. Verification with the owner, item by item (**GATE** each): the specific checklist's «Después del deploy» if it
   exists, and always the generic smoke on phone and computer — login, Inicio, Partidas, one report, Ranking — with
   the version visible at `$API/openapi.json` (`info.version` = `X.Y.Z`).
4. If a milestone section in `.planning/MILESTONES.md` says «Shipped to staging», add the production date through a
   small PR to `staging`.
5. Close with a summary: version, PRs, tag, what was verified, and the NOVEDADES entry ready to paste to the group.

## Edge cases

| Situation | Action |
|---|---|
| `staging` = `main` | Nothing to promote; stop |
| No tags yet | Base `origin/main`; production version is «sin versión» |
| `bump.mjs` rejects the version (not X.Y.Z, or not greater) | Report and go back to step 2 |
| Only internal changes | PATCH; one-line NOVEDADES entry |
| No specific checklist | Generic steps only |
| CI red on a release PR | Diagnose and report; fixes go through a normal PR to `staging`, then restart at step 0 |
| `migrate-and-deploy` failed | No tag; rollback instructions; stop |
| Tag already exists | Stop and ask |
