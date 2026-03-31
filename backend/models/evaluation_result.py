from dataclasses import dataclass


@dataclass
class EvaluationResult:
    new_tier: int | None       # None = no change
    is_new: bool = False       # True = first unlock (tier 1)
    is_upgrade: bool = False   # True = went from tier N to tier N+1
