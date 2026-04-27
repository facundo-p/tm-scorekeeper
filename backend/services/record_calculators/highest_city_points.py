from services.record_calculators.max_score_calculator import MaxScoreCalculator


HighestCityPointsCalculator = MaxScoreCalculator(
    extractor=lambda p: p.scores.city_points,
    code="highest_city_points",
    title="Urbanista supremo",
    emoji="🏙️",
    description="Mayor puntaje de losetas de CIUDAD en una partida"
)