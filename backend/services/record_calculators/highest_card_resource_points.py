from services.record_calculators.max_score_field import MaxScoreFieldCalculator


HighestCardResourcePointsCalculator = MaxScoreFieldCalculator(
    field="card_resource_points",
    code="highest_card_resource_points",
    description="Mayor puntaje de recursos de carta en una partida"
)