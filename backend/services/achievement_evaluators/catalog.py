"""Los 18 logros de v2.0 (F23, STAT-06, SEMANTICS §5), para el motor derivado.

Espejo de ACHIEVEMENTS en docs/redesign/mockup/js/data/catalog.js. Para agregar uno, ver el
skill `new-achievement`.
"""
from models.achievement_definition import AchievementDefinition
from models.achievement_tier import AchievementTier


def _tiers(*pairs: tuple[int, str]) -> tuple[AchievementTier, ...]:
    return tuple(AchievementTier(level=i, threshold=t, title=title) for i, (t, title) in enumerate(pairs, 1))


ACHIEVEMENTS: list[AchievementDefinition] = [
    AchievementDefinition("high_score", "Alcanzar X puntos en una partida", "trophy", "trophy", "max", "score",
                          "Los números no mienten. Los rivales, a veces.",
                          _tiers((50, "Colono"), (75, "Joven Promesa"), (100, "Gran Terraformador"), (125, "Leyenda de Marte"), (150, "Emperador de Marte"))),
    AchievementDefinition("games_played", "Jugar partidas de Terraforming Mars", "gamepad-2", "generation", "sum", "games",
                          "Una generación más. Siempre una generación más.",
                          _tiers((5, "Novato"), (10, "Habitué"), (25, "Veterano"), (50, "Terraformador Nato"), (100, "Adicto a Marte"))),
    AchievementDefinition("games_won", "Ganar partidas de Terraforming Mars", "crown", "crown", "sum", "wins",
                          "El Comité recuerda a quien entrega resultados.",
                          _tiers((3, "Primera Victoria"), (5, "Conquistador"), (10, "Dominador"), (20, "Invicto"), (50, "Señor de Marte"))),
    AchievementDefinition("win_streak", "Ganar partidas consecutivas", "flame", "flame", "max", "streak",
                          "El calor también se acumula.",
                          _tiers((2, "Racha"), (3, "Imparable"), (5, "Invencible"))),
    AchievementDefinition("greenery_tiles", "Sumar puntos de vegetación a lo largo de todas las partidas", "trees", "greenery", "sum", "greenery",
                          "Cada loseta verde es un poco más de oxígeno para todos.",
                          _tiers((25, "Jardinero Marciano"), (50, "Ecologista"), (100, "Guardián del Bosque"), (200, "Maestro Botánico"), (350, "Elfo Marciano"))),
    AchievementDefinition("all_maps", "Jugar en distintos mapas de Marte", "map", "maps", "sum", "maps",
                          "Del polo norte a la cuenca de Hellas.",
                          _tiers((2, "Explorador"), (3, "Cartógrafo"), (5, "Conquistador de Marte"), (7, "Señor de Marte"))),
    AchievementDefinition("stolen_awards", "Quedar 1.º en solitario en recompensas que financió otro, en una misma partida", "shield", "steal", "max", "stolen",
                          "Gracias por los 8 M€.",
                          _tiers((1, "Oportunista"), (2, "Ladrón"), (3, "Gran Estafador"))),
    AchievementDefinition("card_points", "Alcanzar X puntos de cartas en una partida", "layers", "card", "max", "cards",
                          "Proyecto aprobado. Y otro. Y otro más.",
                          _tiers((10, "Apostador"), (20, "Inversor"), (30, "Magnate"), (40, "Cerebro Corporativo"), (50, "Elon Musk"))),
    AchievementDefinition("milestone_master", "Ganar una partida habiendo reclamado los 3 hitos", "star", "milestone", "flag", "allMilestonesWin",
                          "Nadie más llegó a tiempo.",
                          _tiers((1, "Maestro de Hitos"))),
    AchievementDefinition("no_milestone_win", "Ganar una partida sin haber reclamado ningún hito", "zap", "lone", "flag", "noMilestoneWin",
                          "Sin banderas, sin ceremonias.",
                          _tiers((1, "Lobo Solitario"))),
    AchievementDefinition("award_master", "Ganar una partida quedando 1.º en las 3 recompensas", "trophy", "award", "flag", "allAwardsWin",
                          "Tres podios, un solo nombre.",
                          _tiers((1, "Rey de las Recompensas"))),
    AchievementDefinition("no_award_win", "Ganar una partida sin quedar 1.º en ninguna recompensa", "zap", "eye", "flag", "noAwardWin",
                          "Nadie lo vio venir.",
                          _tiers((1, "Incomprendido"))),
    AchievementDefinition("corp_collector", "Jugar con corporaciones distintas", "layers", "corp", "sum", "corps",
                          "Cada directorio tiene su manera de ver Marte.",
                          _tiers((5, "Consultor"), (10, "Accionista"), (20, "Holding"), (30, "Conglomerado"))),
    AchievementDefinition("photo_finish", "Ganar por 2 puntos o menos", "star", "photo", "flag", "photoFinish",
                          "Hubo que contar dos veces.",
                          _tiers((1, "Fotofinish"))),
    AchievementDefinition("blitz", "Ganar una partida de 9 generaciones o menos", "zap", "blitz", "flag", "blitz",
                          "El oxígeno subió más rápido de lo previsto.",
                          _tiers((1, "Blitz"))),
    AchievementDefinition("giant_killer", "Ganar una partida en la que jugaba el n.º 1 del ranking", "shield", "giant", "sum", "giantKills",
                          "Hasta los volcanes más altos tienen una ladera.",
                          _tiers((1, "Retador"), (3, "Matagigantes"), (6, "Verdugo del Consejo"))),
    AchievementDefinition("full_table", "Ganar una partida de 5 jugadores", "crown", "fullTable", "flag", "fullTableWin",
                          "Cinco corporaciones, un solo planeta.",
                          _tiers((1, "Mesa llena"))),
    AchievementDefinition("city_planner", "Alcanzar X puntos de ciudades en una partida", "map", "city", "max", "cities",
                          "Domos, calles, luces en la noche marciana.",
                          _tiers((10, "Loteador"), (15, "Urbanista"), (20, "Metrópolis"), (25, "Megalópolis"))),
]

ACHIEVEMENT_BY_CODE = {d.code: d for d in ACHIEVEMENTS}
