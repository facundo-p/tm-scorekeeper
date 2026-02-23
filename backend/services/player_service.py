from models.player import Player
from schemas.player import PlayerCreateDTO
from schemas.player import PlayerUpdateDTO


class PlayerService:
    def __init__(self, player_repository):
        self.player_repository = player_repository

    def create_player(self, dto: PlayerCreateDTO) -> str:
        name = dto.name.strip()

        self._validate_unique_name(name)

        player = Player(
            player_id=None,
            name=name,
            is_active=True,
        )
        created_player = self.player_repository.create(player)

        return created_player.player_id
    
    def update_player(self, player_id: str, dto: PlayerUpdateDTO) -> None:
        player = self.player_repository.get(player_id)

        if dto.name is not None:
            new_name = dto.name.strip()

            self._validate_unique_name(new_name, exclude_id=player_id)

            player.name = new_name

        if dto.is_active is not None:
            player.is_active = dto.is_active

        self.player_repository.update(player)

    def _validate_unique_name(self, name: str, exclude_id: str | None = None) -> None:
        normalized = name.strip().lower()
        #Revisa si el nombre ya existe en otro jugador registrado con case insensitive y lanza error si eso se cumple.
        for player in self.player_repository.get_all():
            if player.name.strip().lower() == normalized:
                if exclude_id is None or player.player_id != exclude_id:
                    raise ValueError("Player with this name already exists")
                
    
    #Devuelve lista de jugadores totales, activos o no activos ordenados alfabéticamente.
    def get_players(self, active: bool | None = None) -> list[Player]:
        players = self.player_repository.get_all()

        if active is not None:
            players = [p for p in players if p.is_active == active]

        return sorted(players, key=lambda p: p.name.lower())