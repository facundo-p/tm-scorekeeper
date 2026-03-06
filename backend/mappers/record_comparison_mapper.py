from schemas.game_records import RecordComparisonDTO, RecordResultDTO
from services.player_service import PlayerService


def record_comparison_to_dto(comparison, players):
    # players es una lista de jugadores ya cargada desde el servicio,
    # para evitar consultar la base de datos en cada conversión a DTO.
    """
    Creamos un diccionario {player_id: player} para poder
    buscar jugadores rápidamente por su id sin recorrer la lista.
    """
    players_by_id = {
            p.player_id: p
            for p in players
        }

    def entry_to_result(entry):
    
        # Buscamos el jugador correspondiente al entry usando su player_id.
        player = players_by_id[entry.player_id]

        return RecordResultDTO(
            game_id=entry.game_id,
            value=entry.value,
            # Se muestra el nombre del jugador en lugar de su ID para una mejor legibilidad.
            player_name=player.name,
        )
    
    
    """
    compared es None en el caso de que no haya un record anterior,
    es decir, el primer registro de ese tipo. En ese caso,
    no hay nada con lo que comparar, por lo que se deja como None.
    Cuando hay un record anterior, se convierte a DTO para mostrarlo en la respuesta.
    """
    compared = None
    if comparison.compared is not None:
        compared = entry_to_result(comparison.compared)

    # Record actual convertido a DTO para mostrarlo en la respuesta.
    current = entry_to_result(comparison.current)

    return RecordComparisonDTO(
        description=comparison.description,
        achieved=comparison.achieved,
        compared=compared,
        current=current,
    )