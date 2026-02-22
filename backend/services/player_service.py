from models.player import Player
from schemas.player import PlayerCreateDTO

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