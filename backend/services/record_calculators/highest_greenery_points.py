from services.record_calculators.max_score_calculator import MaxScoreCalculator


HighestGreeneryPointsCalculator = MaxScoreCalculator(
    extractor=lambda p: p.scores.greenery_points,
    code="highest_greenery_points",
    title="Rey de los bosques",
    emoji="🌿",
    description="Mayor puntaje de losetas de VEGETACIÓN en una partida"
)