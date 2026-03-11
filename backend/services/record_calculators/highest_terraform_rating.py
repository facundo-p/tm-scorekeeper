from services.record_calculators.max_score_field import MaxScoreFieldCalculator

HighestTerraformRatingCalculator = MaxScoreFieldCalculator(
    field="terraform_rating",
    code="highest_terraform_rating",
    description="Mayor Terraform Rating en una partida"
)