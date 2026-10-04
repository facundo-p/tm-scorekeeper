from models.player import Player
from models.player_colors import ColorTaken, first_free
from schemas.player import PlayerCreateDTO
from schemas.player import PlayerUpdateDTO


class PlayerService:
    def __init__(self, player_repository):
        self.player_repository = player_repository

    def create_player(self, dto: PlayerCreateDTO) -> str:
        name = dto.name.strip()

        self._validate_unique_name(name)

        if dto.color is not None:
            self._check_color_free(dto.color)
        player = Player(
            player_id=None,
            name=name,
            is_active=True,
            color=dto.color,
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

        self._apply_color(player, dto.color)
        self.player_repository.update(player)

    def _active_colors(self, exclude_id: str | None = None) -> list[str]:
        return [p.color for p in self.player_repository.get_all() if p.is_active and p.player_id != exclude_id]

    def _check_color_free(self, color: str, exclude_id: str | None = None) -> None:
        if color in self._active_colors(exclude_id):
            raise ColorTaken(f"Color '{color}' is already used by an active player")

    def _apply_color(self, player: Player, color: str | None) -> None:
        """Color pedido (409 si lo tiene otro activo); al reactivar con el color ocupado, el primero libre."""
        if color is not None:
            self._check_color_free(color, exclude_id=player.player_id)
            player.color = color
        elif player.is_active and player.color in self._active_colors(exclude_id=player.player_id):
            player.color = first_free(self._active_colors(exclude_id=player.player_id))

    def first_game_dates(self) -> dict:
        return self.player_repository.first_game_dates()

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