from services.record_calculators.max_score_calculator import MaxScoreCalculator


HighestCardResourcePointsCalculator = MaxScoreCalculator(
    extractor=lambda p: p.scores.card_resource_points,
    code="highest_card_resource_points",
    title="Barón de los recursos",
    emoji="⚙️",
    description="Mayor puntaje de RECURSOS de carta"
)