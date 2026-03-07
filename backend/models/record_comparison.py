from dataclasses import dataclass
from .record_entry import RecordEntry


@dataclass
class RecordComparison:
    code: str
    description: str
    achieved: bool
    compared: RecordEntry
    current: RecordEntry