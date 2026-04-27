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
| `DATABASE_URL` | Connection string Postgres de Supabase (**direct**, ver caveat abajo) | Supabase dashboard → Project settings → Database → Connection string |
| `CLOUDFLARE_R2_ACCOUNT_ID` | Account ID de Cloudflare | R2 dashboard → API (sidebar derecha) |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | Access Key ID del API token | R2 → **Manage R2 API Tokens** → **Create API token** (scope: read/write al bucket) |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | Secret Access Key del mismo token | Mismo token (solo se ve una vez al crear) |
| `CLOUDFLARE_R2_BUCKET` | Nombre del bucket | El que hayas creado, ej. `tm-scorekeeper-backups` |

`DATABASE_URL` ya existe (lo usa `deploy.yml` para correr migraciones). Verificar el caveat antes de reusar el mismo secret.

---

## Caveat: pooler vs direct connection

Supabase expone dos endpoints para Postgres:

| Tipo | Puerto | Sirve para |
|---|---|---|
| **Direct** | `5432` | `pg_dump`, sesiones largas, transacciones grandes |
| **Pooler** (PgBouncer) | `6543` | Queries cortas en modo transaction pooling |

**`pg_dump` falla contra el pooler** (PgBouncer transaction mode no soporta `COPY` ni sesiones que exceden una transacción).

### Cómo verificar

Mirar el host en `DATABASE_URL`:
- Direct: `db.<PROJECT_REF>.supabase.co` — puerto `5432`
- Pooler: `<region>.pooler.supabase.com` — puerto `6543` (o `5432` con `?pgbouncer=true`)

### Si `DATABASE_URL` es el pooler

El backend en Render probablemente usa el pooler (recomendado para apps web). En ese caso:

1. Agregar un secret aparte `SUPABASE_DIRECT_URL` con la connection string del puerto `5432`.
2. Editar `.github/workflows/backup-supabase.yml`: cambiar `${{ secrets.DATABASE_URL }}` → `${{ secrets.SUPABASE_DIRECT_URL }}` en el step **Dump database and compress**.

---

## Troubleshooting

| Error | Causa | Fix |
|---|---|---|
| `pg_dump: error: query failed: ERROR: prepared statement "..." does not exist` | `DATABASE_URL` apunta al pooler | Usar direct connection (ver caveat) |
| `An error occurred (NoSuchBucket)` | Bucket no existe o nombre incorrecto en `CLOUDFLARE_R2_BUCKET` | Verificar nombre exacto en R2 dashboard |
| `An error occurred (InvalidAccessKeyId)` | Credenciales R2 inválidas o revocadas | Regenerar API token en R2 |
| `pg_dump: error: server version: 16.x; pg_dump version: 15.x` | Supabase upgradeó Postgres | Actualizar `postgresql-client-15` → `-16` en el workflow |
