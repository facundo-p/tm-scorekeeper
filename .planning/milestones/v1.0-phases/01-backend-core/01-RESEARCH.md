# Phase 01: Backend Core - Research

**Researched:** 2026-03-31
**Domain:** Python / SQLAlchemy / Alembic / pytest — Achievement system backend
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Cada logro se define con `AchievementDefinition` (code, description, icon, fallback_icon, tiers, show_progress)
- **D-02:** Cada tier se define con `AchievementTier` (level, threshold, title)
- **D-03:** Las definiciones viven en código, no en DB. La DB solo persiste desbloqueos.
- **D-04:** Clase base abstracta `AchievementEvaluator` con `compute_tier()`, `get_progress()`, `evaluate()`
- **D-05:** `SingleGameThresholdEvaluator` — genérico con extractor lambda para single-game thresholds
- **D-06:** `AccumulatedEvaluator` — genérico con counter lambda, incluye `get_progress()` con current/target
- **D-07:** `WinStreakEvaluator` — custom, calcula racha máxima y racha actual para progreso
- **D-08:** `AllMapsEvaluator` — custom, evalúa mapas únicos jugados contra `MapName` enum existente
- **D-09:** Registry `ALL_EVALUATORS` centraliza todas las instancias, análogo a `ALL_CALCULATORS` de records
- **D-10:** Tabla `player_achievements`: id (serial PK), player_id (FK), code (varchar), tier (int), unlocked_at (date), con UniqueConstraint(player_id, code)
- **D-11:** Upsert atómico con `ON CONFLICT DO UPDATE` y condición `WHERE tier < excluded.tier` — tiers nunca bajan
- **D-12:** Relationship en modelo Player hacia achievements (`back_populates`)
- **D-13:** Migración Alembic para crear la tabla
- **D-14:** Incluir al menos: high_score (single-game, 5 tiers), games_played (acumulado, 5 tiers), games_won (acumulado, tiers TBD), win_streak (combinación, 3 tiers), all_maps (combinación, binario o con tiers por cantidad)
- **D-15:** Los umbrales exactos de tiers se calibrarán revisando datos reales de partidas existentes durante la implementación
- **D-16:** Evaluadores en `backend/services/achievement_evaluators/` — paralelo a `backend/services/record_calculators/`
- **D-17:** Misma estructura: `base.py` (ABC), archivos por evaluador, `registry.py`, factory si aplica
- **D-18:** Modelos de dominio en `backend/models/` (achievement_definition.py, achievement_tier.py, etc.)
- **D-19:** ORM model en `backend/db/models.py` (PlayerAchievement)
- **D-20:** Repository en `backend/repositories/achievement_repository.py`
- **D-21:** Unit tests por evaluador (compute_tier con distintos sets de games)
- **D-22:** Test de upsert no-downgrade (intentar bajar tier, verificar que no cambia)
- **D-23:** Test de registry completeness (todos los evaluadores registrados y con code único)

### Claude's Discretion

- Umbrales exactos de tiers para games_won y all_maps — calibrar con datos si hay partidas existentes
- Decisión de si AllMaps tiene tiers (ej: 2/5 mapas, 3/5, 5/5) o es binario (todos o nada) — elegir lo que sea más coherente con el patrón

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CORE-01 | Sistema define logros con código, descripción, ícono, fallback, y flag de progreso | `AchievementDefinition` dataclass en `backend/models/achievement_definition.py` — patrón directo de `RecordEntry` |
| CORE-02 | Cada logro soporta múltiples tiers con level, threshold y título por tier | `AchievementTier` dataclass en `backend/models/achievement_tier.py` |
| CORE-03 | Evaluador base (ABC) con `compute_tier()`, `get_progress()`, y `evaluate()` | `AchievementEvaluator` ABC en `backend/services/achievement_evaluators/base.py` — replicar `RecordCalculator` |
| CORE-04 | Evaluador genérico `SingleGameThresholdEvaluator` con extractor lambda | `SingleGameThresholdEvaluator` en `backend/services/achievement_evaluators/single_game_threshold.py` — usa `calculate_results()` para `total_points` |
| CORE-05 | Evaluador genérico `AccumulatedEvaluator` con counter lambda y progreso | `AccumulatedEvaluator` en `backend/services/achievement_evaluators/accumulated.py` |
| CORE-06 | Evaluador custom `WinStreakEvaluator` con progreso de racha actual | `WinStreakEvaluator` en `backend/services/achievement_evaluators/win_streak.py` — necesita ordenar partidas por fecha |
| CORE-07 | Evaluador custom `AllMapsEvaluator` con progreso de mapas jugados | `AllMapsEvaluator` en `backend/services/achievement_evaluators/all_maps.py` — usa `MapName` enum (5 valores) |
| CORE-08 | Registry centralizado `ALL_EVALUATORS` con logros iniciales definidos | `backend/services/achievement_evaluators/registry.py` + `backend/services/achievement_evaluators/definitions.py` |
| PERS-01 | Tabla `player_achievements` con player_id, code, tier, unlocked_at y constraint unique | `PlayerAchievement` ORM en `backend/db/models.py` + `Player.achievements` relationship |
| PERS-02 | Migración Alembic para crear la tabla | Nueva migración en `backend/db/migrations/versions/` usando `op.create_table()` |
| PERS-03 | Repository con upsert atómico (ON CONFLICT DO UPDATE, solo si tier sube) | `AchievementRepository` en `backend/repositories/achievement_repository.py` — `insert().on_conflict_do_update()` de SQLAlchemy |
| PERS-04 | Relationship en modelo Player hacia achievements | `Player.achievements = relationship("PlayerAchievement", back_populates="player")` en `backend/db/models.py` |
</phase_requirements>

---

## Summary

Este phase implementa la capa backend completa del sistema de logros: modelos de dominio, evaluadores con patrón strategy, persistencia con upsert atómico, y registry centralizado. No hay API ni frontend.

El patrón a replicar está completamente definido en el código existente. `RecordCalculator` → `AchievementEvaluator`, `ALL_CALCULATORS` → `ALL_EVALUATORS`, `GamesRepository` → `AchievementRepository`. La diferencia estructural clave es que los evaluadores de logros reciben `player_id` como parámetro (cada evaluación es por jugador), mientras que los calculadores de records evalúan globalmente. El upsert atómico es el único componente sin precedente directo en el codebase.

Para `WinStreakEvaluator`, el input `games: list[Game]` NO viene con garantía de orden cronológico. La racha debe calcularse ordenando las partidas por `game.date` antes de iterar. Para `AllMaps`, el enum `MapName` tiene exactamente 5 valores (Hellas, Tharsis, Elysium, Vastitas Borealis, Amazonis Planitia) — los tiers con fracciones (2/5, 3/5, 5/5) son más coherentes que binario, ya que siguen el patrón de tiers progresivos del resto del sistema.

**Primary recommendation:** Implementar en orden: modelos de dominio → ORM + migración → repository → evaluadores (base → genéricos → custom) → registry + definiciones. Los tests de evaluadores no requieren DB (puro domain logic).

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| SQLAlchemy | Existente en proyecto | ORM + upsert atómico | Stack del proyecto, no cambiar |
| Alembic | Existente en proyecto | Migraciones DB | Stack del proyecto, no cambiar |
| pytest | Existente en proyecto | Testing | Stack del proyecto, `backend/tests/` |
| Python dataclasses | stdlib | Modelos de dominio | Patrón establecido (`RecordEntry`, `RecordComparison`) |

### SQLAlchemy Upsert (PostgreSQL)

El upsert atómico usa la API de `sqlalchemy.dialects.postgresql`:

```python
from sqlalchemy.dialects.postgresql import insert

stmt = insert(PlayerAchievement).values(
    player_id=player_id,
    code=code,
    tier=tier,
    unlocked_at=unlocked_at,
)
stmt = stmt.on_conflict_do_update(
    index_elements=["player_id", "code"],  # columnas del UniqueConstraint
    set_={"tier": stmt.excluded.tier, "unlocked_at": stmt.excluded.unlocked_at},
    where=PlayerAchievement.tier < stmt.excluded.tier,  # solo si sube
)
session.execute(stmt)
session.commit()
```

**Nota crítica:** La condición `where=` en `on_conflict_do_update` garantiza el invariante "tier nunca baja". Si el `excluded.tier` es menor o igual al existente, el UPDATE no ocurre (NO-OP). Este es el mecanismo correcto para PostgreSQL. Fuente: SQLAlchemy docs para `Insert.on_conflict_do_update`.

**Installation:** Sin cambios. Stack existente.

---

## Architecture Patterns

### Recommended Project Structure

```
backend/
├── models/
│   ├── achievement_definition.py   # AchievementDefinition dataclass
│   ├── achievement_tier.py         # AchievementTier dataclass
│   ├── achievement_progress.py     # Progress dataclass
│   └── evaluation_result.py        # EvaluationResult dataclass
├── db/
│   ├── models.py                   # + PlayerAchievement ORM + Player.achievements
│   └── migrations/versions/
│       └── XXXX_add_player_achievements.py
├── repositories/
│   └── achievement_repository.py   # upsert + queries
└── services/
    └── achievement_evaluators/
        ├── __init__.py
        ├── base.py                 # AchievementEvaluator ABC
        ├── single_game_threshold.py
        ├── accumulated.py
        ├── win_streak.py
        ├── all_maps.py
        ├── definitions.py          # HIGH_SCORE, GAMES_PLAYED, etc.
        └── registry.py             # ALL_EVALUATORS list
```

### Pattern 1: Dataclass Domain Models

**What:** Modelos de dominio como `@dataclass` puras, sin dependencia de ORM.
**When to use:** Siempre para domain models — `AchievementDefinition`, `AchievementTier`, `Progress`, `EvaluationResult`.
**Example:**
```python
# Fuente: backend/models/record_entry.py (patrón existente)
from dataclasses import dataclass, field

@dataclass
class AchievementTier:
    level: int
    threshold: int
    title: str

@dataclass
class AchievementDefinition:
    code: str
    description: str
    icon: str | None
    fallback_icon: str
    tiers: list[AchievementTier]
    show_progress: bool
```

### Pattern 2: AchievementEvaluator ABC

**What:** Clase base abstracta con `compute_tier()` abstracto, `get_progress()` con default `None`, y `evaluate()` concreto.
**When to use:** Todos los evaluadores heredan de esta base.
**Example:**
```python
# Fuente: PROJECT.md — código aprobado durante inicialización
from abc import ABC, abstractmethod
from models.game import Game
from models.achievement_definition import AchievementDefinition

class AchievementEvaluator(ABC):
    definition: AchievementDefinition

    @property
    def code(self) -> str:
        return self.definition.code

    @abstractmethod
    def compute_tier(self, player_id: str, games: list[Game]) -> int:
        """Retorna tier máximo alcanzado (0 = ninguno)."""

    def get_progress(self, player_id: str, games: list[Game], current_tier: int):
        """Progreso hacia el siguiente tier. None si no aplica."""
        return None

    def _next_tier(self, current_tier: int):
        """Helper: retorna el AchievementTier siguiente al actual, o None."""
        for tier in self.definition.tiers:
            if tier.level == current_tier + 1:
                return tier
        return None

    def evaluate(self, player_id: str, games: list[Game], persisted_tier: int):
        computed = self.compute_tier(player_id, games)
        if computed > persisted_tier:
            return EvaluationResult(
                new_tier=computed,
                is_new=(persisted_tier == 0),
                is_upgrade=(persisted_tier > 0),
            )
        return EvaluationResult(new_tier=None)
```

**Nota:** `_next_tier()` es un helper compartido por `AccumulatedEvaluator` y `WinStreakEvaluator` para `get_progress()`. Debe vivir en la base.

### Pattern 3: WinStreak — Ordenamiento de partidas

**What:** Las partidas en `games: list[Game]` no están garantizadas en orden cronológico. El `WinStreakEvaluator` debe ordenarlas por fecha antes de calcular rachas.
**When to use:** Siempre que la lógica dependa de secuencia temporal.
**Example:**
```python
def _calculate_max_streak(self, player_id: str, games: list[Game]) -> int:
    sorted_games = sorted(games, key=lambda g: g.date)
    streak = 0
    max_streak = 0
    for game in sorted_games:
        results = calculate_results(game)
        winner = results.results[0]
        if winner.player_id == player_id and not winner.tied:
            streak += 1
            max_streak = max(max_streak, streak)
        else:
            streak = 0
    return max_streak

def _calculate_current_streak(self, player_id: str, games: list[Game]) -> int:
    """Racha activa al final del historial (para progreso)."""
    sorted_games = sorted(games, key=lambda g: g.date)
    streak = 0
    for game in reversed(sorted_games):
        results = calculate_results(game)
        player_participated = any(r.player_id == player_id for r in results.results)
        if not player_participated:
            continue  # skip games where player didn't play
        winner = results.results[0]
        if winner.player_id == player_id and not winner.tied:
            streak += 1
        else:
            break
    return streak
```

### Pattern 4: AllMaps — Tiers con fracciones

**What:** `MapName` tiene exactamente 5 valores. Los tiers progresivos (2/5, 3/5, 5/5) son más coherentes con el patrón del sistema que el binario.
**When to use:** `AllMapsEvaluator` con 3 tiers: umbral 2, 3, 5.
**Example:**
```python
ALL_MAPS = AchievementDefinition(
    code="all_maps",
    description="Jugar en distintos mapas de Marte",
    icon=None,
    fallback_icon="map",
    tiers=[
        AchievementTier(level=1, threshold=2, title="Explorador"),
        AchievementTier(level=2, threshold=3, title="Cartógrafo"),
        AchievementTier(level=3, threshold=5, title="Conquistador de Marte"),
    ],
    show_progress=True,
)

class AllMapsEvaluator(AchievementEvaluator):
    def __init__(self, definition):
        self.definition = definition

    def compute_tier(self, player_id: str, games: list[Game]) -> int:
        played_maps = {
            game.map_name
            for game in games
            if any(pr.player_id == player_id for pr in game.player_results)
        }
        count = len(played_maps)
        achieved_tier = 0
        for tier in self.definition.tiers:
            if count >= tier.threshold:
                achieved_tier = tier.level
        return achieved_tier

    def get_progress(self, player_id: str, games: list[Game], current_tier: int):
        played_maps = {
            game.map_name
            for game in games
            if any(pr.player_id == player_id for pr in game.player_results)
        }
        next_tier = self._next_tier(current_tier)
        if not next_tier:
            return None
        return Progress(current=len(played_maps), target=next_tier.threshold)
```

### Pattern 5: Upsert atómico en repository

**What:** `ON CONFLICT DO UPDATE ... WHERE tier < excluded.tier` usando SQLAlchemy postgresql dialect.
**When to use:** Método `upsert()` del `AchievementRepository`.

```python
from sqlalchemy.dialects.postgresql import insert as pg_insert
from datetime import date

class AchievementRepository:
    def __init__(self, session_factory=get_session):
        self._session_factory = session_factory

    def upsert(self, player_id: str, code: str, tier: int) -> None:
        stmt = pg_insert(PlayerAchievementORM).values(
            player_id=player_id,
            code=code,
            tier=tier,
            unlocked_at=date.today(),
        )
        stmt = stmt.on_conflict_do_update(
            index_elements=["player_id", "code"],
            set_={
                "tier": stmt.excluded.tier,
                "unlocked_at": stmt.excluded.unlocked_at,
            },
            where=PlayerAchievementORM.tier < stmt.excluded.tier,
        )
        with self._session_factory() as session:
            session.execute(stmt)
            session.commit()

    def get_for_player(self, player_id: str) -> list[PlayerAchievementORM]:
        with self._session_factory() as session:
            return (
                session.query(PlayerAchievementORM)
                .filter(PlayerAchievementORM.player_id == player_id)
                .all()
            )
```

### Pattern 6: Alembic migration

**What:** Migración manual (no autogenerate) para crear tabla `player_achievements`.
**When to use:** Agregar `back_populates` en `Player` ORM ANTES de correr autogenerate, o escribir la migración a mano.

**Truco importante:** El proyecto usa `env.py` que requiere `DATABASE_URL` como variable de entorno. Para generar la migración:
```bash
cd backend && DATABASE_URL=postgresql://... alembic revision --autogenerate -m "add_player_achievements"
```
O escribirla manualmente siguiendo el patrón de `a9ed5386f94f_initial_schema.py`.

### Anti-Patterns to Avoid

- **Persistir progreso en DB:** El progreso se calcula on-demand. Solo se persiste el tier desbloqueado y `unlocked_at`.
- **Evaluar logros dentro del repository:** El repository solo hace persistence. La lógica de evaluación vive en los evaluadores.
- **Instanciar evaluadores con `games_for_current()` estilo records:** Los evaluadores de logros siempre reciben el historial completo del jugador — no hay noción de "juego actual" en la evaluación.
- **Importar `AchievementDefinition` desde `registry.py`:** Las definiciones van en `definitions.py`, el registry importa de allí. Evita imports circulares.
- **Usar `session.merge()` para upsert:** No respeta el invariante de no-downgrade. Usar siempre `pg_insert().on_conflict_do_update()`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Upsert atómico PostgreSQL | INSERT + SELECT + UPDATE en Python | `sqlalchemy.dialects.postgresql.insert().on_conflict_do_update()` | Race condition si dos requests concurrentes evalúan el mismo jugador |
| Orden de partidas para racha | Asumir que la lista ya viene ordenada | `sorted(games, key=lambda g: g.date)` | `GamesRepository.get_games_by_player()` no garantiza orden |
| Calcular total_score del jugador | Sumar campos manualmente | `calculate_results(game)` de `services/helpers/results.py` | Ya existe, maneja turmoil_points=None |
| Detectar ganador de partida | Iterar player_results y comparar puntajes | `calculate_results(game).results[0]` | Maneja empates, tiebreaker por MC |

**Key insight:** El codebase ya tiene `calculate_results()` que resuelve el scoring completo (incluyendo turmoil_points=None). Los evaluadores deben usarlo en lugar de reimplementar lógica de puntaje.

---

## Common Pitfalls

### Pitfall 1: `get_session()` retorna Session, no context manager

**What goes wrong:** `with self._session_factory() as session:` falla si `get_session()` no está configurado como context manager.
**Why it happens:** En `backend/db/session.py`, `get_session()` retorna un `Session` directamente (no es un `contextmanager`). `GamesRepository` usa `with self._session_factory() as session:` — esto funciona porque `Session` tiene `__enter__`/`__exit__` en SQLAlchemy.
**How to avoid:** Seguir exactamente el mismo patrón que `GamesRepository`. El `with session:` cierra la sesión automáticamente pero NO hace rollback en excepción — el `commit()` explícito es necesario.
**Warning signs:** `AttributeError: __enter__` si se cambia la factory.

### Pitfall 2: `on_conflict_do_update` con `where=` clause

**What goes wrong:** La condición `where=PlayerAchievementORM.tier < stmt.excluded.tier` referencia la columna ORM de la tabla existente, no el `excluded`. Si se escribe mal, el upsert puede actualizar cuando no debe.
**Why it happens:** `stmt.excluded.tier` es el valor que se intentó insertar. `PlayerAchievementORM.tier` es el valor en la fila existente. La condición correcta es "actualizar solo si el tier existente es MENOR que el nuevo".
**How to avoid:** Test explícito de no-downgrade (D-22). Verificar con `tier=1` existente y `tier=1` intentado → no debe cambiar `unlocked_at`.
**Warning signs:** Test de downgrade pasa sin activarse.

### Pitfall 3: WinStreak ignora partidas donde el jugador no participó

**What goes wrong:** Al calcular `current_streak`, si se itera en reverso y el jugador no participó en alguna partida intermedia, se puede cortar la racha incorrectamente.
**Why it happens:** El historial completo incluye partidas de múltiples jugadores. El evaluador recibe todas las partidas del jugador específico (filtradas por `game_repository.get_games_by_player()`), pero vale aclararlo.
**How to avoid:** Verificar que la fuente de datos que llegará al evaluador son las partidas del jugador (no de todos). Agregar una guarda `if any(pr.player_id == player_id for pr in game.player_results)` en el loop por si acaso.

### Pitfall 4: `Player.achievements` relationship en ORM

**What goes wrong:** Agregar `Player.achievements` sin `back_populates` correcto genera SAWarning en SQLAlchemy.
**Why it happens:** SQLAlchemy requiere que ambos lados de la relación declaren `back_populates`.
**How to avoid:** En `Player` agregar `achievements = relationship("PlayerAchievement", back_populates="player", cascade="all, delete-orphan")`. En `PlayerAchievement` agregar `player = relationship("Player", back_populates="achievements")`.

### Pitfall 5: `conftest.py` no crea la nueva tabla en tests

**What goes wrong:** Los tests de upsert fallan con `relation "player_achievements" does not exist`.
**Why it happens:** `conftest.py` usa `Base.metadata.create_all(bind=engine)`. Si `PlayerAchievement` está importado en `db/models.py` antes de que `Base.metadata` sea leído por el test, la tabla SÍ se crea. Si no se importa, no aparece.
**How to avoid:** Asegurar que el import de `db.models` en `conftest.py` se realiza DESPUÉS de definir `PlayerAchievement` en ese módulo.

---

## Code Examples

### ORM Model completo

```python
# Agregar a backend/db/models.py
# Fuente: PROJECT.md + patrón ORM existente

class PlayerAchievement(Base):
    __tablename__ = "player_achievements"

    id = Column(Integer, primary_key=True, autoincrement=True)
    player_id = Column(String, ForeignKey("players.id", ondelete="CASCADE"), nullable=False)
    code = Column(String, nullable=False)
    tier = Column(Integer, nullable=False, default=1)
    unlocked_at = Column(Date, nullable=False)

    __table_args__ = (
        UniqueConstraint("player_id", "code", name="uq_player_achievement"),
    )

    player = relationship("Player", back_populates="achievements")


# En Player class, agregar:
# achievements = relationship("PlayerAchievement", back_populates="player", cascade="all, delete-orphan")
```

### Migración Alembic

```python
# Fuente: patrón de a9ed5386f94f_initial_schema.py

def upgrade() -> None:
    op.create_table(
        "player_achievements",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("player_id", sa.String(), nullable=False),
        sa.Column("code", sa.String(), nullable=False),
        sa.Column("tier", sa.Integer(), nullable=False),
        sa.Column("unlocked_at", sa.Date(), nullable=False),
        sa.ForeignKeyConstraint(["player_id"], ["players.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("player_id", "code", name="uq_player_achievement"),
    )


def downgrade() -> None:
    op.drop_table("player_achievements")
```

### Registry pattern

```python
# backend/services/achievement_evaluators/registry.py
# Fuente: backend/services/record_calculators/registry.py (patrón a replicar)

from .single_game_threshold import SingleGameThresholdEvaluator
from .accumulated import AccumulatedEvaluator
from .win_streak import WinStreakEvaluator
from .all_maps import AllMapsEvaluator
from .definitions import HIGH_SCORE, GAMES_PLAYED, GAMES_WON, WIN_STREAK, ALL_MAPS
from services.helpers.results import calculate_results

def _count_games(player_id, games):
    return sum(
        1 for g in games
        if any(pr.player_id == player_id for pr in g.player_results)
    )

def _count_wins(player_id, games):
    wins = 0
    for g in games:
        results = calculate_results(g)
        if results.results and results.results[0].player_id == player_id and not results.results[0].tied:
            wins += 1
    return wins

ALL_EVALUATORS = [
    SingleGameThresholdEvaluator(
        HIGH_SCORE,
        extractor=lambda pr: calculate_results_for_player(pr),
    ),
    AccumulatedEvaluator(GAMES_PLAYED, counter=_count_games),
    AccumulatedEvaluator(GAMES_WON, counter=_count_wins),
    WinStreakEvaluator(WIN_STREAK),
    AllMapsEvaluator(ALL_MAPS),
]
```

**Nota sobre `SingleGameThresholdEvaluator`:** El extractor lambda de `high_score` debe usar `total_points` calculado por `calculate_results()`, NO acceder a `pr.scores.terraform_rating` directamente. El código de ejemplo en `PROJECT.md` usa `lambda pr: pr.total_score` pero `PlayerResult` domain model no tiene ese atributo. Usar `calculate_results(game)` dentro del evaluador es el enfoque correcto — ver Pitfall adicional abajo.

### SingleGameThresholdEvaluator — fix crítico del extractor

```python
# El extractor en PROJECT.md usa pr.total_score — ese atributo NO existe en PlayerResult.
# La forma correcta es operar sobre game completo:

class SingleGameThresholdEvaluator(AchievementEvaluator):
    def __init__(self, definition, extractor):
        self.definition = definition
        self.extractor = extractor  # recibe (player_id, game) -> int

    def compute_tier(self, player_id: str, games: list[Game]) -> int:
        from services.helpers.results import calculate_results
        max_value = 0
        for game in games:
            results = calculate_results(game)
            for r in results.results:
                if r.player_id == player_id:
                    max_value = max(max_value, self.extractor(player_id, game, results))
        achieved_tier = 0
        for tier in self.definition.tiers:
            if max_value >= tier.threshold:
                achieved_tier = tier.level
        return achieved_tier

# Registry:
SingleGameThresholdEvaluator(
    HIGH_SCORE,
    extractor=lambda pid, game, results: next(
        (r.total_points for r in results.results if r.player_id == pid), 0
    ),
)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| INSERT + check + UPDATE para upsert | `INSERT ... ON CONFLICT DO UPDATE WHERE` | PostgreSQL 9.5+ / SQLAlchemy 1.1+ | Atómico, sin race conditions |
| Clase abstracta con `@abc.abstractmethod` | Mismo patrón — ya establecido en proyecto | N/A | Sin cambio necesario |

**Deprecated/outdated:**
- `session.merge()`: No usar para upsert con condiciones — no es atómico y no soporta `WHERE` clause.

---

## Open Questions

1. **`SingleGameThresholdEvaluator` extractor signature**
   - What we know: `PlayerResult` domain model tiene `scores.terraform_rating`, etc. pero NO `total_score`. El helper `calculate_results(game)` retorna `GameResultDTO` con `results[].total_points`.
   - What's unclear: ¿El extractor recibe `(player_id, game)` y llama `calculate_results` internamente, o el evaluador lo llama antes? Ambas son válidas.
   - Recommendation: Definir el extractor como `lambda pid, game_result_dto: value` donde el evaluador llama `calculate_results()` y pasa el DTO al lambda. Esto es más testeable.

2. **Umbrales de `games_won` y `all_maps`**
   - What we know: Claude's Discretion — calibrar con datos reales.
   - What's unclear: Cuántas partidas han sido jugadas en la DB real.
   - Recommendation: Durante implementación, consultar `SELECT COUNT(*) FROM games` y `SELECT DISTINCT map_name FROM games` para elegir umbrales realistas. Si hay pocos datos, usar umbrales bajos (5/10/25/50/100 para games_won).

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | pytest (detectado en `backend/tests/`) |
| Config file | Ninguno explícito — pytest descubre tests automáticamente |
| Quick run command | `cd backend && pytest tests/test_achievement_evaluators.py -x` |
| Full suite command | `cd backend && pytest tests/ -x` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CORE-03 | `evaluate()` retorna `EvaluationResult` correcto al subir tier | unit | `pytest tests/test_achievement_evaluators.py::TestAchievementEvaluatorBase -x` | ❌ Wave 0 |
| CORE-04 | `SingleGameThreshold.compute_tier()` con distintos scores | unit | `pytest tests/test_achievement_evaluators.py::TestSingleGameThreshold -x` | ❌ Wave 0 |
| CORE-05 | `AccumulatedEvaluator.compute_tier()` y `get_progress()` | unit | `pytest tests/test_achievement_evaluators.py::TestAccumulatedEvaluator -x` | ❌ Wave 0 |
| CORE-06 | `WinStreakEvaluator` racha máxima y racha actual | unit | `pytest tests/test_achievement_evaluators.py::TestWinStreakEvaluator -x` | ❌ Wave 0 |
| CORE-07 | `AllMapsEvaluator` tiers por mapas únicos | unit | `pytest tests/test_achievement_evaluators.py::TestAllMapsEvaluator -x` | ❌ Wave 0 |
| CORE-08 | Registry: todos los evaluadores tienen code único | unit | `pytest tests/test_achievement_evaluators.py::TestRegistry -x` | ❌ Wave 0 |
| PERS-03 | Upsert no-downgrade: intentar bajar tier → no cambia | integration | `pytest tests/integration/test_achievement_repository.py -x` | ❌ Wave 0 |
| PERS-04 | `Player.achievements` relationship cargable | integration | `pytest tests/integration/test_achievement_repository.py -x` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `cd backend && pytest tests/test_achievement_evaluators.py -x`
- **Per wave merge:** `cd backend && pytest tests/ -x`
- **Phase gate:** Full suite green antes de `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `backend/tests/test_achievement_evaluators.py` — cubre CORE-03 a CORE-08
- [ ] `backend/tests/integration/test_achievement_repository.py` — cubre PERS-03, PERS-04 (requiere DB)
- [ ] Fixtures compartidas en `backend/tests/conftest.py` — `make_player`, `make_game` ya existen y son reutilizables

---

## Sources

### Primary (HIGH confidence)

- Codebase: `backend/services/record_calculators/` — patrón strategy completo leído directamente
- Codebase: `backend/db/models.py` — ORM models existentes, `UniqueConstraint` ya importado
- Codebase: `backend/repositories/game_repository.py` — repository pattern con session factory
- Codebase: `backend/db/migrations/versions/a9ed5386f94f_initial_schema.py` — patrón de migraciones Alembic
- Codebase: `backend/services/helpers/results.py` — `calculate_results()`, scoring logic
- Codebase: `backend/models/enums.py` — `MapName` con 5 valores exactos
- Codebase: `backend/tests/test_record_calculators.py` — patrón de tests unitarios
- `.planning/PROJECT.md` §"Referencia de implementación" — código de referencia aprobado

### Secondary (MEDIUM confidence)

- SQLAlchemy PostgreSQL `insert().on_conflict_do_update()` con `where=` clause — patrón documentado en SQLAlchemy official docs, verificado como el mecanismo correcto para upsert condicional.

### Tertiary (LOW confidence)

- Ninguno — todas las afirmaciones se basan en código fuente directo del proyecto o en APIs SQLAlchemy establecidas.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — stack existente leído directamente del codebase
- Architecture: HIGH — patrones establecidos, código de referencia aprobado en PROJECT.md
- Pitfalls: HIGH — identificados leyendo el código real (session pattern, PlayerResult fields)
- Upsert SQL: HIGH — API SQLAlchemy postgresql dialect es estable

**Research date:** 2026-03-31
**Valid until:** 2026-05-01 (stack estable, sin fast-moving dependencies)
