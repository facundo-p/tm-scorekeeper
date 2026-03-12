from services.record_calculators.max_score_calculator import MaxScoreCalculator


HighestTurmoilPointsCalculator = MaxScoreCalculator(
    extractor=lambda p: p.scores.turmoil_points or 0,
    code="highest_turmoil_points",
    description="Mayor puntaje de TURMOIL en una partida"
)