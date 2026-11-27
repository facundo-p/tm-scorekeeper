# 35-02 SUMMARY — API deprecada retirada

- **Siete endpoints fuera**, cada uno con su reemplazo en la API v2:
  - informe (`GET /games/{id}/report`);
  - ficha (`GET /players/{id}/insights`);
  - `POST /admin/recompute`.
- **Campos del contrato viejo fuera:**
  - `emoji` y `record` en récords;
  - `icon` y `fallback_icon` en logros.
- **Motor de récords v1 borrado:** con él se fueron sus servicios, schemas y mappers. Solo lo usaban los endpoints retirados.
- **Tests:**
  - el golden compara contra el informe y el replay contra el historial guardado;
  - los co-poseedores se prueban en el motor v2;
  - un test fija que lo retirado responde 404/405.
- **README del backend:** documenta el cambio que rompe, con su reemplazo (D-82).
