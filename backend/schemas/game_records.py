from pydantic import BaseModel


class RecordAttributeDTO(BaseModel):
    label: str
    value: str


class RecordResultDTO(BaseModel):
    value: int
    title: str | None = None
    emoji: str | None = None
    attributes: list[RecordAttributeDTO]


class RecordComparisonDTO(BaseModel):
    code: str
    title: str | None = None
    emoji: str | None = None
    description: str
    achieved: bool
    compared: RecordResultDTO | None
    current: RecordResultDTO
