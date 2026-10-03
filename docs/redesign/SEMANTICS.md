# Semántica de las estadísticas (v2.0)

Definición única de cada número que muestra la app. La implementación de referencia es `mockup/js/data/derive.js`; el backend la reproduce y `fixtures/golden.json` (exportado de `derive.js`) lo verifica. Si este documento y el código no coinciden, es un bug de uno de los dos.

Decisiones citadas: `.planning/v2.0/DECISIONS.md`.

## 1. Partida

- **Total** de un jugador = TR + hitos + recompensas + cartas + recursos de cartas + vegetación + ciudades + Turmoil (`null` cuenta 0). Los M€ no suman.
- **Mesa** (`n`) = cantidad de resultados de la partida (2 a 5).
- **Posiciones:** orden por (total desc, M€ desc). Dos jugadores con el mismo total y los mismos M€ empatan: comparten la posición y la siguiente se saltea (1, 1, 3). `tied` vale `true` para **todos** los miembros de un grupo empatado (D-17).
- **Ganadores** (`winners()`, D-07): todos los resultados con posición 1. Los co-ganadores cuentan todos como victoria en perfil, rachas, récords y logros.
- **Margen** = total de la primera fila − total de la primera fila con posición > 1 (0 si no hay ninguna).
- **Decidida por M€** = hay al menos 2 resultados y los dos primeros tienen el mismo total.
- **Orden canónico** de partidas: (`date`, `id`) (D-19); desde F21, (`date`, `created_at`, `id`). Todo lo acumulado (ELO, récords, logros, rachas, temporadas) recorre las partidas en este orden.

## 2. Redondeo

Half-even en todos lados (D-06), como `round()` de Python: `round(2.5) = 2`, `round(3.5) = 4`.
- Enteros: `roundHalfEven(x)`.
- Un decimal: `roundHalfEven(x × 10) / 10` (puntos por generación).
- Los porcentajes y promedios que se muestran se redondean al formatear; los valores de la API van sin redondear salvo que se indique.

## 3. ELO

- Por pares, K = 32, inicial 1000. Para cada jugador `a`: Σ sobre los rivales `b` de (s − e), con s = 1 si `a` quedó delante, 0,5 si empataron, 0 si quedó detrás, y e = 1 / (1 + 10^((ELO_b − ELO_a)/400)) con los ELO **previos** a la partida.
- delta = roundHalfEven(32 × Σ). ELO posterior = previo + delta.
- **Pico** = máximo ELO posterior alcanzado. **Último delta** = delta de su última partida.
- **Rango** = posición entre los jugadores activos con al menos una partida, por ELO desc.
- **ELO de mesa N** (§9): la misma cuenta reproducida desde 1000 solo sobre las partidas de N jugadores. Nunca se guarda.

## 4. Récords

16 récords oficiales (D-02 del dueño: los 7 nuevos dejan de ser «propuestos»). `lower_is_better` solo en `closest_win` y `fastest_win`.

### 4.1 Por partida (`scope: game`)

Candidatos de cada partida, por jugador:

| Código | Valor |
|---|---|
| `highest_single_game_score` | total |
| `highest_terraform_rating` | TR |
| `highest_card_points` | puntos de cartas |
| `highest_card_resource_points` | puntos por recursos de cartas |
| `highest_greenery_points` | vegetación |
| `highest_city_points` | ciudades |
| `highest_turmoil_points` | Turmoil (solo valores > 0) |
| `biggest_margin` | margen, solo para el ganador y solo si hay un único ganador |
| `closest_win` | margen, solo para el ganador y solo si hay un único ganador (0 = decidida por M€) |
| `points_per_generation` | roundHalfEven1(total / generaciones) |
| `fastest_win` | generaciones, para cada ganador |
| `richest_finish` | M€ finales |

Reglas (D-05):
- **Mejor de la partida:** el máximo (o mínimo si `lower_is_better`) entre los candidatos, y todos los jugadores que lo alcanzan. En récords «más es mejor» se descartan los valores 0 (sin dueño); en «menos es mejor» el 0 vale (`closest_win` decidido por M€).
- **Primera partida con candidatos:** establece el récord (`kind: set`), no lo «rompe».
- **Supera** (estrictamente mejor): el récord cambia de dueño; los poseedores pasan a ser los jugadores de esta partida (`kind: broken`). Se registra **un solo quiebre** por récord y partida, aunque varios jugadores lo superen: el valor es el mejor de la partida y todos los que lo alcanzaron son co-poseedores.
- **Iguala:** los jugadores nuevos que igualan el valor se suman como co-poseedores (`kind: tied`); no es un quiebre.
- **Poseedor:** `{player_id, game_id, date, map}`, con la partida en que ese jugador alcanzó el valor.
- **Historial:** una entrada por evento `{value, player_id (el primero), holders, game_id, date, kind}`.

### 4.2 De carrera (`scope: career`)

| Código | Valor por jugador |
|---|---|
| `most_games_played` | partidas jugadas |
| `most_games_won` | victorias (§1, co-ganadores incluidos) |
| `highest_elo` | pico de ELO |
| `longest_streak` | mejor racha de victorias consecutivas |

- **Poseedores:** todos los jugadores con el valor máximo, si es > 0 (activos e inactivos).
- **Historial** (D-18): se recorre el orden canónico recalculando los líderes después de cada partida; se agrega una entrada solo cuando cambia el conjunto de poseedores. `kind: tied` si el valor no cambió y se sumó alguien sin que nadie saliera; `broken` en otro caso; `set` la primera.

### 4.3 Contexto en una partida

Para cada récord por partida con candidatos: `broken` (si lo rompió), `tied` (si alguien lo igualó), `best` (mejor de la partida), `before` (último evento del historial anterior a la partida en el orden canónico) y `gap = |before.value − best.value|`.
- **Cerca del récord:** no roto, con `before`, `gap ≤ 3` (un empate cuenta, gap 0); ordenados por gap, máximo 3 por partida.

## 5. Logros

18 logros (12 existentes + 6 nuevos del dueño). Se derivan del historial (D-04): se recorren las partidas del jugador en orden canónico acumulando métricas; cada nivel queda fechado con la **primera partida** en que la métrica alcanzó su umbral. Editar o borrar partidas, o cargar una vieja, puede cambiar o quitar niveles.

«Ganó» = posición 1 (§1). Métricas tras cada partida:

| Logro | Métrica | Tipo | Umbrales |
|---|---|---|---|
| `high_score` | máximo total en una partida | max | 50/75/100/125/150 |
| `games_played` | partidas jugadas | sum | 5/10/25/50/100 |
| `games_won` | victorias | sum | 3/5/10/20/50 |
| `win_streak` | mejor racha de victorias | max | 2/3/5 |
| `greenery_tiles` | Σ puntos de vegetación | sum | 25/50/100/200/350 |
| `all_maps` | mapas distintos jugados | sum | 2/3/5/7 |
| `stolen_awards` | máximo, en una partida, de recompensas donde quedó 1.º **solo** y que financió otro | max | 1/2/3 |
| `card_points` | máximo de puntos de cartas en una partida | max | 10/20/30/40/50 |
| `milestone_master` | ganó con 3 hitos reclamados | flag | 1 |
| `no_milestone_win` | ganó sin hitos | flag | 1 |
| `award_master` | ganó una partida con 3 recompensas financiadas quedando 1.º en las 3 | flag | 1 |
| `no_award_win` | ganó sin quedar 1.º en ninguna recompensa | flag | 1 |
| `corp_collector` | corporaciones distintas jugadas | sum | 5/10/20/30 |
| `photo_finish` | ganó, único ganador, margen ≤ 2 | flag | 1 |
| `blitz` | ganó una partida de ≤ 9 generaciones | flag | 1 |
| `giant_killer` | victorias con ELO previo **estrictamente** menor que el máximo ELO previo de la mesa (D-08) | sum | 1/3/6 |
| `full_table` | ganó una partida de 5 jugadores | flag | 1 |
| `city_planner` | máximo de puntos de ciudades en una partida | max | 10/15/20/25 |

- **Nivel actual** = mayor nivel alcanzado. **Progreso** (solo si no es `flag` y hay nivel siguiente) = `min(valor, umbral siguiente) / umbral siguiente`; en `win_streak` el progreso usa la racha **actual**.
- **Vista por mesa** (§9): la misma cuenta sobre el subconjunto; se rotula y nunca se guarda.

## 6. Jugador

Sobre sus partidas (del subconjunto si hay filtro):

- **Partidas**, **victorias**, **% de victorias** (victorias / partidas), **% de podio** (posición ≤ 2).
- **Promedio de puntos** = roundHalfEven(promedio de totales). **Posición media** = promedio de posiciones. **Mejor** = máximo total y su partida.
- **Hitos por partida** = promedio de hitos reclamados. **Recompensas por partida** = promedio de recompensas donde quedó 1.º (co-primeros incluidos).
- **Más reclamados** (#35, #66): el hito con más reclamos y la recompensa con más primeros puestos; si empatan, todos los empatados.
- **Puntos por generación** = promedio de total / generaciones.
- **ADN de puntaje:** promedio por categoría y su peso (promedio / suma de promedios). **Arquetipo:** la categoría con mayor cociente peso propio / peso del grupo entre las que pesan más de 2 %.
- **Por corporación y por mapa:** partidas, victorias, promedio de puntos (half-even) y posición media; orden por partidas desc y victorias desc.
- **Rachas:** mejor y actual (victorias consecutivas). **Forma:** las últimas 8 posiciones con su mesa.
- **Rivales:** sobre el cara a cara (§7) con al menos 4 partidas compartidas. Némesis = menor % de partidas delante; víctima = mayor %; desempate por más partidas compartidas.

## 7. Cara a cara

Para cada par (a, b) de jugadores que compartieron partidas: partidas, delante (posición de a menor), detrás y empatados. % = delante / partidas.

## 8. Equidad (D del dueño, punto 6)

Sobre las partidas del jugador (del subconjunto si hay filtro), con `n` = mesa de cada partida:
- **Esperado** = Σ (1/n).
- **Victorias vs. esperado** = victorias − esperado (con signo) y victorias / esperado en % (sin dato si esperado = 0).
- **Posición relativa** = promedio de (n − posición) / (n − 1), en %. 100 % = siempre primero, 0 % = siempre último.
- **Por tamaño de mesa** (punto 7): una fila por n = 2, 3, 4, 5 con partidas, victorias, % vs. esperado, promedio de puntos y posición relativa.

## 9. Filtros

- **Mesa** (`?mesa=N`, N ∈ 2..5; la UI del filtro llega al mockup en F18): subconjunto de partidas con exactamente N jugadores. Todo lo de §3–§8 se recalcula **solo** sobre ese subconjunto, incluido el ELO (ELO de mesa) y los logros (vista calculada y rotulada). Filtrar nunca escribe en la base.
- **Mapa y expansión** (Récords, #37): subconjunto de partidas de ese mapa / que incluyen esa expansión; se combinan con la mesa.
- Un subconjunto vacío devuelve estructuras vacías (sin errores).

## 10. Temporadas

El grupo terraforma su propio Marte (punto 4 del dueño):
- Cada partida suma +0,8 pasos de temperatura (tope 19; cada paso son 2 °C desde −30), O₂ += Σ vegetación de la partida / 52 (tope 14) y océanos +0,375 (tope 9).
- La temporada **cierra** en la partida en que los tres parámetros llegan al tope; la siguiente partida abre la temporada nueva.
- Lecturas: temperatura = −30 + 2 × ⌊pasos⌋, O₂ = ⌊O₂⌋ %, océanos = ⌊océanos⌋; % terraformado = promedio de ⌊t⌋/19, ⌊O₂⌋/14 y ⌊océanos⌋/9.
- **Carrera** (en el mockup desde F18; hasta entonces `derive.js` ordena por TR aportado por encima de 20 y el golden lo refleja): por **promedio** de puntos por partida de la temporada (total o una categoría; Turmoil solo sobre partidas con Turmoil), con filtro de mesa. Hacen falta **3 partidas** para clasificar; los demás se listan aparte con su promedio y «le faltan N partidas».
- **Campeón** (D-15, en el mockup desde F18): el primer clasificado por promedio total al cierre; desempate por más partidas y después por mejor puntaje.

## 11. Bitácora

Eventos ordenados por fecha desc y, dentro del mismo día, temporada → récord → logro → partida:
- **Partida:** «X ganó en M por N puntos» o «por desempate de M€».
- **Récord roto** (`kind: broken`): «X rompió «título»: valor (antes V, Y)»; con co-poseedores, los nombres se unen con «y».
- **Logro:** primer nivel de los logros de un solo nivel y niveles ≥ 2 de los de varios (si en una partida sube varios niveles, solo el mayor).
- **Temporada completa:** «Temporada N completa: Marte terraformado. Campeón: X».

## 12. Resumen del grupo

Partidas, generaciones totales, promedio del ganador (half-even), generaciones por partida, primera y última fecha, corporación más usada y cantidad de corporaciones usadas, mapas con victorias, ADN del grupo.

## 13. Orden del archivo (#65)

Columnas: fecha, ganador (nombre del primer ganador), mapa y jugadores (tamaño de mesa); cada una ascendente o descendente. Por defecto, fecha descendente.
- Desempate: en las columnas que no son fecha, por fecha descendente (y después id); en fecha, por cantidad de jugadores ascendente.
- Solo el orden por fecha agrupa la lista por mes; los demás muestran una lista corrida donde cada partida indica mes y año.
- Tocar la columna activa invierte el sentido; tocar otra empieza descendente.
