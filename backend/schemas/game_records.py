from pydantic import BaseModel


class RecordAttributeDTO(BaseModel):
    label: str
    value: str


class RecordResultDTO(BaseModel):
    value: int
    attributes: list[RecordAttributeDTO]


class RecordComparisonDTO(BaseModel):
    description: str
    achieved: bool
    compared: RecordResultDTO | None
    current: RecordResultDTO
