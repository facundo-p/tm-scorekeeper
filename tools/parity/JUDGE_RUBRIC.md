# Rúbrica del juez visual (v2.0)

El subagente `visual-judge` recibe tandas de hasta 10 composiciones `tools/parity/out/<run>/judge/<escenario>-<viewport>.png`:
a la izquierda el **mockup**, en el medio la **app**, a la derecha el **mapa de diferencias** (pixelmatch; el planeta y las máscaras no cuentan). También recibe `summary.json` con las métricas.

## Áreas (0 a 2 cada una)

| Área | 2 | 1 | 0 |
|---|---|---|---|
| Layout y espaciado | Misma grilla, alineaciones y márgenes | Corrimientos de pocos px que no cambian la lectura | Bloques en otro orden, tamaño o columna |
| Tipografía | Misma familia, peso, tamaño, ancho (Saira) y tracking | Diferencias sutiles de interlineado o ancho | Otra familia o jerarquía |
| Color y materiales | Tokens, chaflanes, biseles, brillos y gradientes iguales | Matices levemente distintos | Colores o materiales de otro sistema |
| Íconos | Mismos glifos y tamaños | Variante cercana | Faltan o son otros |
| Textos y números | Mismos textos, formatos (es-AR, signos, ▲▼, M€) y valores | Una diferencia menor de redacción | Valores distintos o datos faltantes |
| Estados interactivos | Foco, selección, hover y deshabilitado iguales | Diferencia menor en un estado | Estado ausente o incorrecto |
| Planeta y cielo | Planeta en el mismo lugar, tamaño y región; estrellas y grano presentes | Encuadre o brillo levemente distintos | Falta el planeta o el cielo |
| Responsive | Mismo comportamiento en el viewport (rail/dock, columnas, cortes) | Un quiebre distinto sin pérdida de contenido | Desborde, contenido cortado o layout de otro tamaño |

## Veredicto

- **Aprueba** con ≥ 14/16 y ningún 0.
- **No puede aprobar** un escenario cuyas métricas fallaron en `summary.json`.
- Cada diferencia se informa con región, elemento, esperado (mockup) y obtenido (app).

## Formato de respuesta

```json
{"scenarios": [{"id": "home-desktop", "scores": {"layout": 2, "typography": 2, "color": 2, "icons": 2, "text": 2, "interactive": 2, "planet": 2, "responsive": 2}, "total": 16, "verdict": "APPROVE", "differences": []}]}
```
