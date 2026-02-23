from models.player import Player
from schemas.player import PlayerCreateDTO
from schemas.player import PlayerUpdateDTO


class PlayerService:
    def __init__(self, player_repository):
        self.player_repository = player_repository

    def create_player(self, dto: PlayerCreateDTO) -> str:
        player = Player(
            player_id=None,
            name=dto.name
        )

        created_player = self.player_repository.create(player)

        return created_player.player_id
    
    def update_player(self, player_id: str, dto: PlayerUpdateDTO) -> None:
        player = self.player_repository.get(player_id)

        if dto.name is not None:
            player.name = dto.name

        if dto.is_active is not None:
            player.is_active = dto.is_active

        self.player_repository.update(player)