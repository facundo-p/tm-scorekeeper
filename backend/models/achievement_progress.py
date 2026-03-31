from dataclasses import dataclass


@dataclass
class Progress:
    current: int
    target: int
