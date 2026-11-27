from pydantic import BaseModel, Field


class LoginRequestDTO(BaseModel):
    username: str = Field(min_length=1, max_length=200)
    password: str = Field(min_length=1, max_length=1000)


class TokenResponseDTO(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class MeDTO(BaseModel):
    username: str
