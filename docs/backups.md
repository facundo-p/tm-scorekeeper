# Backups de la base de datos

Workflow manual para dumpear la DB Postgres de Supabase y persistir el archivo en un bucket de Cloudflare R2.

Ubicación: [`.github/workflows/backup-supabase.yml`](../.github/workflows/backup-supabase.yml)

---

## Cuándo correrlo

- **Antes de migraciones** que toquen schema o datos críticos.
- **Antes de refactors** que cambien tablas o constraints.
- **Periódicamente** (semanal/mensual) a criterio del owner — no hay schedule automático.

---

## Cómo dispararlo

1. GitHub → repo → **Actions** → **Backup Supabase to R2**
2. Botón **Run workflow** (esquina superior derecha)
3. Elegir branch (cualquiera funciona — el workflow no depende del checkout, solo de los secrets)
4. Opcional: `label` — sufijo descriptivo para el archivo (ej. `pre-migration-005`, `weekly`)
5. **Run workflow**

El job tarda ~30s–2min según el tamaño de la DB.

---

## Naming convention

```
tm-scorekeeper-<UTC-YYYYMMDD-HHMMSS>[-<label>].sql.gz
```

Ejemplos:
- `tm-scorekeeper-20260426-143022.sql.gz`
- `tm-scorekeeper-20260426-143022-pre-migration.sql.gz`

Timestamp en UTC para ordenamiento lexicográfico estable.

---

## Cómo restaurar

> ⚠️ **WARNING**: el dump contiene `DROP` implícito vía recreación de objetos. Ejecutar contra una DB de producción **sobreescribe** datos. Hacer SIEMPRE en una DB de prueba primero.

### Restaurar a una DB local de prueba

```bash
# 1. Descargar el backup desde R2 (Cloudflare dashboard o aws CLI)
aws s3 cp \
  s3://tm-scorekeeper-backups/tm-scorekeeper-20260426-143022.sql.gz \
  ./backup.sql.gz \
  --endpoint-url https://<ACCOUNT_ID>.r2.cloudflarestorage.com

# 2. Verificar integridad
gunzip -t backup.sql.gz

# 3. Crear DB destino y restaurar
createdb tm_restore_test
gunzip -c backup.sql.gz | psql postgresql://localhost/tm_restore_test
```

### Restaurar a producción (último recurso)

1. Confirmar que es necesario (data loss real, no un mistake reversible).
2. Avisar a los usuarios — la restauración deja la DB inconsistente durante la operación.
3. Restaurar primero en staging/dummy, validar.
4. Coordinar ventana de mantenimiento.
5. `gunzip -c backup.sql.gz | psql "$SUPABASE_DIRECT_URL"`

---

## Retención

El workflow **no elimina backups antiguos**. La retención se configura en Cloudflare R2 con una **lifecycle rule**:

1. Cloudflare dashboard → R2 → bucket → **Settings** → **Object lifecycle rules**
2. Crear regla: por ejemplo, eliminar objetos con prefijo `tm-scorekeeper-` después de 90 días.

Recomendación inicial: 90 días, ajustar según costo y compliance.

---

## Secrets requeridos en GitHub

Configurar en: repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret | Valor | Dónde se obtiene |
|---|---|---|
| `SUPABASE_DIRECT_URL` | Connection string Postgres de Supabase, **modo direct** (puerto 5432) | Supabase dashboard → Project Settings → Database → Connection string → URI con "Use connection pooling" en **OFF** |
| `CLOUDFLARE_R2_ACCOUNT_ID` | Account ID de Cloudflare | R2 dashboard → API (sidebar derecha) |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | Access Key ID del API token | R2 → **Manage R2 API Tokens** → **Create API token** (scope: read/write al bucket) |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | Secret Access Key del mismo token | Mismo token (solo se ve una vez al crear) |
| `CLOUDFLARE_R2_BUCKET` | Nombre del bucket | El que hayas creado, ej. `tm-scorekeeper-backups` |

Usamos `SUPABASE_DIRECT_URL` separado de `DATABASE_URL` (el que usa el backend en Render) para garantizar que `pg_dump` siempre conecte vía direct connection — el pooler no soporta `pg_dump` (ver caveat abajo).

---

## Caveat: qué endpoint de Supabase usar

Supabase expone tres endpoints para Postgres:

| Tipo | Host | Puerto | Sirve para `pg_dump`? | Reachable desde GH Actions free? |
|---|---|---|---|---|
| **Direct** | `db.<PROJECT_REF>.supabase.co` | `5432` | ✅ Sí | ❌ **IPv6 only en plan free** |
| **Transaction pooler** | `<region>.pooler.supabase.com` | `6543` | ❌ No (modo transaction rompe `COPY`) | ✅ IPv4 |
| **Session pooler** | `<region>.pooler.supabase.com` | `5432` | ✅ Sí (session mode = full Postgres protocol) | ✅ IPv4 |

Los runners de GitHub Actions no tienen conectividad IPv6 → el endpoint **direct** falla con `Network is unreachable`. La única combinación que sirve para correr `pg_dump` desde GH Actions en plan free es el **Session Pooler**.

### Qué tiene que tener `SUPABASE_DIRECT_URL`

A pesar del nombre del secret, en plan free debe apuntar al **Session Pooler**:

```
postgresql://postgres.<PROJECT_REF>:<PASSWORD>@<region>.pooler.supabase.com:5432/postgres
```

Identificadores clave:
- User es `postgres.<PROJECT_REF>` (con el project ref después del punto, no solo `postgres`)
- Host es `<region>.pooler.supabase.com`
- Puerto **5432** (no 6543 — eso sería transaction mode)

En el dashboard de Supabase: **Project Settings** → **Database** → **Connection string** → seleccionar **Session pooler** (o "Session mode" dentro del dropdown de Connection pooling). Copiar la URI tal cual.

> Nota sobre el naming: el secret se llama `SUPABASE_DIRECT_URL` por contraste con el `DATABASE_URL` del backend (que usa el transaction pooler). En plan paid de Supabase con add-on de IPv4 se podría apuntar al endpoint direct real. Cuando eso pase, actualizar este doc.

---

## Troubleshooting

| Error | Causa | Fix |
|---|---|---|
| `ERROR: SUPABASE_DIRECT_URL secret is not set` | El secret no está configurado en GitHub | Agregar el secret en Settings → Secrets and variables → Actions |
| `pg_dump: error: query failed: ERROR: prepared statement "..." does not exist` | `SUPABASE_DIRECT_URL` apunta al pooler en vez de direct | Regenerar la connection string con "Use connection pooling" OFF |
| `ERROR: Backup file is N bytes (<1KB). pg_dump likely produced an empty dump.` | `pg_dump` falló sin output (URL inválida, host inalcanzable, permisos) | Revisar logs del step previo; verificar el valor de `SUPABASE_DIRECT_URL` |
| `An error occurred (NoSuchBucket)` | Bucket no existe o nombre incorrecto en `CLOUDFLARE_R2_BUCKET` | Verificar nombre exacto en R2 dashboard |
| `An error occurred (InvalidAccessKeyId)` | Credenciales R2 inválidas o revocadas | Regenerar API token en R2 |
| `pg_dump: error: aborting because of server version mismatch` | Supabase upgradeó Postgres a una versión > el cliente instalado | Bumpear `postgresql-client-NN` al major nuevo en el step **Install postgresql-client** del workflow (y la línea de `/usr/lib/postgresql/NN/bin`) |
| `Network is unreachable` contra `db.<ref>.supabase.co` | El host **direct** de Supabase es IPv6-only en plan free; los runners de GH Actions no tienen IPv6 | Cambiar `SUPABASE_DIRECT_URL` al **Session Mode Pooler** (host `<region>.pooler.supabase.com:5432`, user `postgres.<project_ref>`). El pooler en session mode soporta `pg_dump` y es IPv4 |
