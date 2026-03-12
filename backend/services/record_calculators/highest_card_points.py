from services.record_calculators.max_score_calculator import MaxScoreCalculator


HighestCardPointsCalculator = MaxScoreCalculator(
    extractor=lambda p: p.scores.card_points,
    code="highest_card_points",
    description="Mayor puntaje de cartas en una partida"
)