from models.achievement_definition import AchievementDefinition
from models.achievement_tier import AchievementTier

# NOTE: Icons are None for now — will be filled in Phase 3 (SVG custom icons)
# fallback_icon values are Lucide icon names

HIGH_SCORE = AchievementDefinition(
    code="high_score",
    description="Alcanzar X puntos en una partida",
    icon=None,
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
    description="Jugar partidas de Terraforming Mars",
    icon=None,
    fallback_icon="gamepad-2",
    tiers=[
        AchievementTier(level=1, threshold=5,   title="Novato"),
        AchievementTier(level=2, threshold=10,  title="Habitué"),
        AchievementTier(level=3, threshold=25,  title="Veterano"),
        AchievementTier(level=4, threshold=50,  title="Terraformador Nato"),
        AchievementTier(level=5, threshold=100, title="Adicto a Marte"),
    ],
    show_progress=True,
)

GAMES_WON = AchievementDefinition(
    code="games_won",
    description="Ganar partidas de Terraforming Mars",
    icon=None,
    fallback_icon="crown",
    tiers=[
        AchievementTier(level=1, threshold=3,   title="Primera Victoria"),
        AchievementTier(level=2, threshold=5,   title="Conquistador"),
        AchievementTier(level=3, threshold=10,  title="Dominador"),
        AchievementTier(level=4, threshold=20,  title="Invicto"),
        AchievementTier(level=5, threshold=50,  title="Señor de Marte"),
    ],
    show_progress=True,
)

WIN_STREAK = AchievementDefinition(
    code="win_streak",
    description="Ganar partidas consecutivas",
    icon=None,
    fallback_icon="flame",
    tiers=[
        AchievementTier(level=1, threshold=2, title="Racha"),
        AchievementTier(level=2, threshold=3, title="Imparable"),
        AchievementTier(level=3, threshold=5, title="Invencible"),
    ],
    show_progress=True,
)

GREENERY_TILES = AchievementDefinition(
    code="greenery_tiles",
    description="Colocar losetas de vegetación a lo largo de todas las partidas",
    icon=None,
    fallback_icon="trees",
    tiers=[
        AchievementTier(level=1, threshold=25,  title="Jardinero Marciano"),
        AchievementTier(level=2, threshold=50,  title="Ecologista"),
        AchievementTier(level=3, threshold=100, title="Guardián del Bosque"),
        AchievementTier(level=4, threshold=200, title="Maestro Botánico"),
        AchievementTier(level=5, threshold=350, title="Elfo Marciano"),
    ],
    show_progress=True,
)

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
