# Novedades

Lo que cambia en cada versión, contado para quienes usan la app. La entrada de cada versión la redacta el skill
`/release` al preparar el despliegue (ver [`deploy/README.md`](deploy/README.md)); la más nueva va arriba.

<!-- release:entradas -->

## 2.0.0 — 2026-11-27

La app se renovó entera: nuevo diseño con Marte de fondo, más estadísticas y temporadas del grupo.

### Nuevo
- Diseño nuevo en todas las pantallas, pensado para el teléfono, con un Marte que se puede girar y acompaña cada partida.
- Temporadas: el grupo terraforma su propio Marte partida a partida. En Inicio se ve cuánto falta para cerrarla, la carrera por promedio y los campeones anteriores.
- Ceremonia al terminar de registrar una partida: resultados, cambios de ELO, récords rotos y logros desbloqueados.
- Ranking con ELO por tamaño de mesa, forma reciente, victorias contra lo esperado y cara a cara entre jugadores.
- Perfil de cada jugador con su historial, corporaciones y mapas favoritos, rivales y récords.
- Récords con su historia y 18 logros con niveles. Tocando el ícono de cualquier logro o récord se ve qué significa.
- Al registrar, cada jugador puede elegir el color de cubo que usó en esa partida.

### Mejoras
- Registrar partida va por categoría, con un marcador provisorio arriba y buscador de corporaciones.
- Las partidas se pueden editar y eliminar, y todo (ELO, récords y logros) se recalcula solo.
- La matriz de cara a cara ya muestra a todas las parejas que jugaron juntas.

### Correcciones
- La temporada ya no se queda trabada en «falta 1 partida»: muestra cuántas faltan y qué parámetro falta completar.

### Para tener en cuenta
- Para entrar hace falta usuario y contraseña (se los pasamos por el grupo).
- Las temporadas se recalcularon con una regla nueva de oxígeno, así que algunas fechas de cierre o campeones anteriores pueden haber cambiado.

