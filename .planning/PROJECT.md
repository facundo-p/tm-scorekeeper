# Terraforming Mars Stats — Sistema de Logros

## What This Is

App de seguimiento de estadísticas para partidas de Terraforming Mars. Ya tiene sistema de records (patrón strategy), perfiles de jugadores, historial de partidas, y cálculo de resultados. Este milestone agrega un sistema de logros/achievements persistentes para jugadores.

## Core Value

Los jugadores descubren y desbloquean logros al jugar, dándole más profundidad y motivación a cada partida. Los logros son permanentes — una vez ganados, no se pierden.

## Requirements

### Validated

- ✓ Registro y carga de partidas con puntajes — existing
- ✓ Sistema de records con patrón strategy (RecordCalculator, registry, factory) — existing
- ✓ Perfiles de jugadores con stats y records — existing
- ✓ Detalle de partida con resultados y records comparativos — existing
- ✓ API REST (FastAPI) + Frontend (React + TypeScript) — existing
- ✓ Sistema de logros con tiers progresivos — Validated in Phase 1: Backend Core
- ✓ Persistencia de logros desbloqueados (no se pierden) — Validated in Phase 1: Backend Core

### Active

- [ ] Evaluación automática de logros al finalizar partida
- [ ] Visualización de logros nuevos en pantalla de fin de partida (ícono + título, minimalista)
- [ ] Sección de logros en perfil de jugador (formato completo: ícono, título, descripción, tiers, progreso)
- [ ] Reestructuración del perfil de jugador en secciones (Stats, Records, Logros)
- [ ] Catálogo global de todos los logros disponibles
- [ ] Íconos SVG custom con fallback a librería de íconos / emoji
- [ ] Soporte para progreso parcial en logros que lo ameriten (acumulados)

### Out of Scope

- Rediseño visual de records — se deja para un milestone futuro
- Logros basados en records (ej: "tener el record de mayor puntaje") — descartado
- Notificaciones push o por email — innecesario para esta app
- Logros multijugador/cooperativos — complejidad sin valor claro
- Animaciones elaboradas de desbloqueo — la versión mini (ícono+título) es suficiente

## Context

### Arquitectura existente de records (referencia para logros)

El sistema de records usa un patrón strategy bien encapsulado:
- `RecordCalculator` (ABC): define `calculate(games)` → `RecordEntry` y `evaluate(games)` → `RecordComparison`
- Concrete strategies: `HighestSingleGameScoreCalculator`, `MostGamesPlayedCalculator`, etc.
- Factory pattern: `MaxScoreCalculator` genera calculators vía lambda extractors
- Registry: `ALL_CALCULATORS` centraliza todas las strategies
- Services: `GameRecordsService` (por partida) y `PlayerRecordsService` (por jugador)
- Mappers: `record_comparison_mapper.py` transforma domain → DTO resolviendo player IDs

### Modelo de logros definido

**Tipos de condición:**
1. **Single game** — se evalúa sobre la partida actual (ej: "Ganar con 100+ pts")
2. **Acumulado** — se evalúa sobre historial completo (ej: "Jugar 10 partidas")
3. **Combinación** — lógica compleja sobre secuencias o conjuntos (ej: "Ganar 3 seguidas", "Jugar en todos los mapas")

**Patrón híbrido de evaluación:**
- Evaluadores genéricos para casos simples (umbral en single game, conteo acumulado)
- Evaluadores custom para combinaciones complejas
- Inspirado en el strategy pattern de records, pero con más flexibilidad

**Tiers progresivos:**
- Un mismo logro puede tener múltiples niveles (ej: Puntaje 50 → 75 → 100 → 125 → 150)
- Solo se muestra el tier más alto alcanzado (el badge "evoluciona")
- Notificación diferenciada: Tier 1 = "Nuevo logro!", Tiers 2+ = "Logro mejorado!"

**Progreso parcial:**
- Los logros acumulados muestran progreso (ej: "7/10 partidas")
- Los logros de single game no muestran progreso (es binario por naturaleza)

**Visualización:**
- Fin de partida: versión mini (ícono + título)
- Perfil de jugador: versión completa (ícono, título, descripción, tier actual, progreso)
- Catálogo global: grilla con todos los logros y quién los tiene

**Íconos:**
- SVG custom como primera opción
- Fallback a librería de íconos (Lucide o similar)
- Fallback final a emoji/unicode

### Arquitectura de evaluación de logros

**Evaluación en create_game:**
Al crear una partida, `AchievementsService.evaluate_game()` recorre todos los evaluators para los jugadores de esa partida. Compara tier calculado vs persistido. Si hay cambio → INSERT/UPDATE en `player_achievements`.

**Progreso on-demand:**
Al consultar el perfil (`GET /players/{id}/achievements`), se calculan los logros persistidos + progreso parcial de los no desbloqueados. El progreso no se persiste.

**Reconciliación:**
Un `AchievementsReconciler` que puede correrse manualmente o al startup. Recalcula todos los logros para todos los jugadores y corrige discrepancias (ej: si se cambian los umbrales de tiers).

### Referencia de implementación (código ejemplo)

```python
# === MODELOS ===

@dataclass
class AchievementTier:
    level: int           # 1, 2, 3...
    threshold: int       # 50, 75, 100...
    title: str           # "Joven Promesa", "Gran Terraformador"

@dataclass
class AchievementDefinition:
    code: str            # "high_score"
    description: str     # "Alcanzar X puntos en una partida"
    icon: str | None     # "high_score.svg" (None = usar fallback)
    fallback_icon: str   # "trophy" (nombre en librería de íconos)
    tiers: list[AchievementTier]
    show_progress: bool  # ¿Mostrar barra de progreso?

@dataclass
class Progress:
    current: int
    target: int

@dataclass
class EvaluationResult:
    new_tier: int | None       # None = sin cambios
    is_new: bool = False       # True = primer desbloqueo
    is_upgrade: bool = False   # True = subió de tier


# === EVALUATOR BASE ===

class AchievementEvaluator(ABC):
    definition: AchievementDefinition

    @property
    def code(self) -> str:
        return self.definition.code

    @abstractmethod
    def compute_tier(self, player_id: str, games: list[Game]) -> int:
        """Retorna el tier máximo alcanzado (0 = ninguno)."""
        pass

    def get_progress(self, player_id: str, games: list[Game], current_tier: int) -> Progress | None:
        """Progreso hacia el siguiente tier. None si no aplica."""
        return None

    def evaluate(self, player_id: str, games: list[Game], persisted_tier: int) -> EvaluationResult:
        """Compara tier calculado vs persistido."""
        computed = self.compute_tier(player_id, games)
        if computed > persisted_tier:
            return EvaluationResult(
                new_tier=computed,
                is_new=(persisted_tier == 0),
                is_upgrade=(persisted_tier > 0),
            )
        return EvaluationResult(new_tier=None)


# === EVALUADORES GENÉRICOS ===

class SingleGameThresholdEvaluator(AchievementEvaluator):
    """Para logros tipo 'alcanzar X puntos en UNA partida'."""
    def __init__(self, definition, extractor: Callable):
        self.definition = definition
        self.extractor = extractor

    def compute_tier(self, player_id, games):
        max_value = 0
        for game in games:
            for pr in game.player_results:
                if pr.player_id == player_id:
                    max_value = max(max_value, self.extractor(pr))
        achieved_tier = 0
        for tier in self.definition.tiers:
            if max_value >= tier.threshold:
                achieved_tier = tier.level
        return achieved_tier

class AccumulatedEvaluator(AchievementEvaluator):
    """Para logros tipo 'jugar N partidas' o 'ganar N partidas'."""
    def __init__(self, definition, counter: Callable):
        self.definition = definition
        self.counter = counter

    def compute_tier(self, player_id, games):
        count = self.counter(player_id, games)
        achieved_tier = 0
        for tier in self.definition.tiers:
            if count >= tier.threshold:
                achieved_tier = tier.level
        return achieved_tier

    def get_progress(self, player_id, games, current_tier):
        count = self.counter(player_id, games)
        next_tier = self._next_tier(current_tier)
        if not next_tier:
            return None
        return Progress(current=count, target=next_tier.threshold)


# === EVALUADOR CUSTOM (ejemplo) ===

class WinStreakEvaluator(AchievementEvaluator):
    def __init__(self, definition):
        self.definition = definition

    def compute_tier(self, player_id, games):
        max_streak = self._calculate_max_streak(player_id, games)
        achieved_tier = 0
        for tier in self.definition.tiers:
            if max_streak >= tier.threshold:
                achieved_tier = tier.level
        return achieved_tier

    def get_progress(self, player_id, games, current_tier):
        current_streak = self._calculate_current_streak(player_id, games)
        next_tier = self._next_tier(current_tier)
        if not next_tier:
            return None
        return Progress(current=current_streak, target=next_tier.threshold)


# === DEFINICIONES CONCRETAS (ejemplos) ===

HIGH_SCORE = AchievementDefinition(
    code="high_score",
    description="Alcanzar X puntos en una partida",
    icon="high_score.svg",
    fallback_icon="trophy",
    tiers=[
        AchievementTier(level=1, threshold=50,  title="Colono"),
        AchievementTier(level=2, threshold=75,  title="Joven Promesa"),
        AchievementTier(level=3, threshold=100, title="Gran Terraformador"),
        AchievementTier(level=4, threshold=125, title="Leyenda de Marte"),
        AchievementTier(level=5, threshold=150, title="Emperador de Marte"),
    ],
    show_progress=False,
)

GAMES_PLAYED = AchievementDefinition(
    code="games_played",
    description="Jugar partidas",
    icon=None,
    fallback_icon="gamepad",
    tiers=[
        AchievementTier(level=1, threshold=5,   title="Novato"),
        AchievementTier(level=2, threshold=10,  title="Habitué"),
        AchievementTier(level=3, threshold=25,  title="Veterano"),
        AchievementTier(level=4, threshold=50,  title="Terraformador Nato"),
        AchievementTier(level=5, threshold=100, title="Adicto a Marte"),
    ],
    show_progress=True,
)

WIN_STREAK = AchievementDefinition(
    code="win_streak",
    description="Ganar partidas consecutivas",
    icon="streak.svg",
    fallback_icon="flame",
    tiers=[
        AchievementTier(level=1, threshold=2, title="Racha"),
        AchievementTier(level=2, threshold=3, title="Imparable"),
        AchievementTier(level=3, threshold=5, title="Invencible"),
    ],
    show_progress=True,
)


# === REGISTRY ===

ALL_EVALUATORS = [
    SingleGameThresholdEvaluator(HIGH_SCORE, extractor=lambda pr: pr.total_score),
    AccumulatedEvaluator(GAMES_PLAYED, counter=lambda pid, games: count_player_games(pid, games)),
    WinStreakEvaluator(WIN_STREAK),
]


# === DB MODEL ===

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


# === API RESPONSE SHAPE ===
# GET /players/{id}/achievements
# [
#   {
#     "code": "high_score",
#     "title": "Gran Terraformador",    <- título del tier actual
#     "description": "Alcanzar X puntos en una partida",
#     "icon": "high_score.svg",
#     "fallback_icon": "trophy",
#     "tier": 3,
#     "max_tier": 5,
#     "unlocked": true,
#     "unlocked_at": "2026-03-15",
#     "progress": { "current": 108, "target": 125 }  <- hacia tier 4
#   }
# ]
```

### Stack existente

- Frontend: React 18 + TypeScript + Vite, CSS Modules con variables CSS
- Backend: FastAPI + SQLAlchemy + PostgreSQL + Alembic
- Testing: Vitest + Testing Library (frontend), pytest (backend)
- Theme: oscuro con tonos cálidos (marrones/naranjas, palette Terraforming Mars)

## Constraints

- **Stack**: Mantener React + FastAPI + PostgreSQL + SQLAlchemy existente
- **Patterns**: Seguir los patrones establecidos (repository, service, mapper, strategy)
- **Mobile-first**: Diseño responsive, componentes pequeños
- **CSS**: Modules con variables CSS, sin inline styles
- **Extensibilidad**: Agregar nuevos logros debe ser tan simple como agregar un nuevo record calculator

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Patrón híbrido (genérico + custom) para condiciones | Balance entre DRY para casos simples y flexibilidad para combinaciones complejas | — Pending |
| Tiers progresivos en vez de logros independientes por nivel | Más elegante: el badge evoluciona, reduce clutter visual | — Pending |
| Solo mostrar tier más alto en perfil | Evita saturación visual, el badge "crece" en vez de multiplicarse | — Pending |
| Notificación diferenciada (nuevo vs mejorado) | El jugador distingue un logro completamente nuevo de una mejora | — Pending |
| SVG custom con fallback chain | Permite iterar: arrancar con fallbacks e ir sumando SVGs custom | — Pending |
| Perfil de jugador con secciones | Escala mejor al agregar logros; separa concerns visuales | — Pending |
| No incluir rediseño de records en este milestone | Foco en logros; records funciona, solo es feo | — Pending |
| Logros persistentes (no se pierden) | A diferencia de records que cambian, los logros son permanentes — motivación acumulativa | — Pending |
| Definiciones en código, no en DB | Consistente con records; la DB solo persiste desbloqueos | — Pending |
| Reconciliador manual/startup | Permite cambiar umbrales de tiers sin inconsistencias | — Pending |
| Progreso on-demand (no persistido) | Cambia con cada partida, no tiene sentido persistirlo | — Pending |

---
*Last updated: 2026-03-31 — Phase 1 (Backend Core) complete: persistence layer + evaluator system*
