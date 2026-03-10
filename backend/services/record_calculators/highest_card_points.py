from services.record_calculators.max_score_field import MaxScoreFieldCalculator


HighestCardPointsCalculator = MaxScoreFieldCalculator(
    field="card_points",
    code="highest_card_points",
    description="Mayor puntaje de cartas en una partida"
)