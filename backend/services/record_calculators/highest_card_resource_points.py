from services.record_calculators.max_score_calculator import MaxScoreCalculator


HighestCardResourcePointsCalculator = MaxScoreCalculator(
    extractor=lambda p: p.scores.card_resource_points,
    code="highest_card_resource_points",
    description="Mayor puntaje de RECURSOS de carta"
)