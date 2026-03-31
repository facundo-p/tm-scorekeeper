from dataclasses import dataclass, field


@dataclass
class EvaluationResult:
    new_tier: int | None
    is_new: bool = False
    is_upgrade: bool = False
