from services.record_calculators.max_score_calculator import MaxScoreCalculator


HighestTerraformRatingCalculator = MaxScoreCalculator(
    extractor=lambda p: p.scores.terraform_rating,
    code="highest_terraform_rating",
    title="Arquitecto climático",
    description="Mayor VALOR DE TERRAFORMACIÓN en una partida"
)