from services.record_calculators.max_score_calculator import MaxScoreCalculator


HighestCardPointsCalculator = MaxScoreCalculator(
    extractor=lambda p: p.scores.card_points,
    code="highest_card_points",
    title="Magnate de proyectos",
    emoji="🃏",
    description="Mayor puntaje de CARTAS en una partida"
)