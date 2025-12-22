# Stage 2 - Backoffice Sync Orchestrator (NestJS + MongoDB)

## Arquitectura

```
┌─────────────────┐
│  Source (Mongo) │ (source_tenants, source_clients, etc.)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AdminSync      │ (Orchestrator)
│  Service        │
└────────┬────────┘
         │
         ├──► Módulos de Entidades
         │    ├── TenantsService.fetchSource() + upsertAll()
         │    ├── ClientsService.fetchSource() + upsertAll()
         │    ├── SubtenantsService.fetchSource() + upsertAll()
         │    ├── DomainsService.fetchSource() + upsertAll()
         │    └── BrandingService.fetchSource() + upsertAll()
         │
         ├──► HubAdminClient (HTTP Client)
         │    └──► Stage 1 Lambdas
         │         ├── tenants-upsert
         │         ├── clients-upsert
         │         ├── subtenants-upsert
         │         ├── domains-upsert
         │         └── branding-upsert
         │
         └──► MongoDB (Auditoría)
              ├── sync_runs
              └── sync_steps
```

### Flujo de Sincronización

1. **Source Collections** en MongoDB contienen los datos fuente
2. **AdminSyncService** ejecuta sync en orden:
   - tenants → clients → subtenants → domains → branding
3. Para cada etapa:
   - Cada módulo llama `fetchSource()` desde MongoDB
   - Para cada item:
     - **RequestIdFactory** genera `request_id` determinístico (SHA256)
     - **HubAdminClient** envía request a lambda correspondiente
     - Resultado se guarda en **sync_steps** (audit trail)
4. Retry policy aplica solo para errores transitorios
5. Resultados se persisten en MongoDB

## Estructura de Módulos

```
src/
├── modules/
│   ├── admin-sync/          # Orquestador principal
│   │   ├── admin-sync.service.ts
│   │   ├── admin-sync.controller.ts
│   │   ├── schemas/
│   │   │   ├── sync-run.schema.ts
│   │   │   └── sync-step.schema.ts
│   │   └── dtos/
│   │       └── run-sync.dto.ts
│   ├── tenants/             # Módulo de tenants
│   │   ├── tenants.service.ts
│   │   ├── schemas/
│   │   │   └── tenant-source.schema.ts
│   │   └── tenants.module.ts
│   ├── clients/             # Módulo de clients
│   ├── subtenants/          # Módulo de subtenants
│   ├── domains/             # Módulo de domains
│   └── branding/           # Módulo de branding
└── shared/
    ├── hub-admin-client/    # Cliente HTTP para Stage 1
    │   ├── hub-admin-client.ts
    │   ├── hub-admin.types.ts
    │   └── hub-admin.errors.ts
    └── utils/               # Utilidades
        ├── request-id.ts
        ├── retry.ts
        ├── timing.ts
        └── env.ts
```

## Configuración ENV

Crear archivo `.env` basado en `.env.example`:

```bash
ADMIN_SYNC_TOKEN=hiroshi
ADMIN_TIMEOUT_MS=8000
ADMIN_RETRY_MAX=4
ADMIN_RETRY_BASE_DELAY_MS=300
ADMIN_CONCURRENCY=3

ADMIN_TENANTS_UPSERT_URL=http://localhost:9000/lambda-url/tenants-upsert/admin/tenants/upsert
ADMIN_CLIENTS_UPSERT_URL=http://localhost:9000/lambda-url/clients-upsert/admin/clients/upsert
ADMIN_SUBTENANTS_UPSERT_URL=http://localhost:9000/lambda-url/subtenants-upsert/admin/subtenants/upsert
ADMIN_DOMAINS_UPSERT_URL=http://localhost:9000/lambda-url/domains-upsert/admin/domains/upsert
ADMIN_BRANDING_UPSERT_URL=http://localhost:9000/lambda-url/branding-upsert/admin/branding/upsert

MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=identity_backoffice
```

## Cómo Correr Local

### Prerrequisitos

1. Node.js 18+
2. MongoDB corriendo (local o remoto)
3. Las lambdas de Stage 1 corriendo en `localhost:9000` (via `cargo lambda watch`)

### Setup Inicial

```bash
# 1. Instalar dependencias
npm install

# 2. Crear archivo .env
cp .env.example .env

# 3. Asegurar que MongoDB está corriendo
# Local: mongod (o docker run -d -p 27017:27017 mongo:latest)

# 4. Seedear source data
npm run seed:source
```

### Ejecutar Backoffice

```bash
# Modo desarrollo (watch)
npm run start:dev

# Modo producción
npm run build
npm run start:prod
```

El servidor estará disponible en `http://localhost:3000/api`

## Seed de Source Data

El script `scripts/seed_source.ts` inserta datos iniciales en las colecciones source:

```bash
npm run seed:source
```

Esto crea:
- tenant: `regnum-christi`
- client: `semperaltius`
- subtenant: `rcsa` (tenant: regnum-christi)
- domain: `pagos.semperaltius.edu.mx` (tenant: regnum-christi, subtenant: rcsa, client: semperaltius)
- branding: `branding_rcsa_001` (tenant: regnum-christi, subtenant: rcsa)

## Cómo Leer Resultados

### Desde la API

```bash
# Disparar sync
curl -X POST http://localhost:3000/api/admin/sync/run

# Ver status de un run
curl http://localhost:3000/api/admin/sync/runs/{run_id}

# Ver steps detallados (paginado)
curl "http://localhost:3000/api/admin/sync/runs/{run_id}/steps?page=1&limit=50"
```

### Desde MongoDB

```javascript
// Conectar a MongoDB
use identity_backoffice

// Ver últimos 5 runs
db.sync_runs.find().sort({ started_at: -1 }).limit(5).pretty()

// Ver steps de un run específico
db.sync_steps.find({ run_id: ObjectId("...") }).sort({ created_at: 1 })

// Ver solo errores de un run
db.sync_steps.find({ 
  run_id: ObjectId("..."), 
  ok: false 
}).pretty()
```

## Endpoints de la API

### POST `/api/admin/sync/run`

Dispara una corrida de sincronización completa (async).

**Response**:
```json
{
  "run_id": "507f1f77bcf86cd799439011",
  "status": "running",
  "message": "Sync started"
}
```

### GET `/api/admin/sync/runs/:id`

Obtiene el status y resumen de un run.

**Response**:
```json
{
  "id": "507f1f77bcf86cd799439011",
  "status": "success",
  "started_at": "2024-01-01T00:00:00.000Z",
  "finished_at": "2024-01-01T00:00:10.000Z",
  "totals": {
    "total": 5,
    "success": 5,
    "failed": 0
  },
  "errors": []
}
```

### GET `/api/admin/sync/runs/:id/steps`

Obtiene los steps detallados de un run (paginado).

**Query Params**:
- `page`: Número de página (default: 1)
- `limit`: Items por página (default: 50)

## Semántica de Reintentos

### Errores Transitorios (se reintentan)
- `TIMEOUT`, `CONNECTION_ERROR`, `SERVER_ERROR`, `TEMPORARY_UNAVAILABLE`
- HTTP 5xx
- Backoff exponencial con jitter

### Errores Permanentes (NO se reintentan)
- `NOT_FOUND`, `VALIDATION_ERROR`, `INVALID_TOKEN`, `MISSING_AUTH`

## Request ID Determinístico

```
request_id = SHA256(entityType|naturalKey|version).substring(0, 32)
```

Garantiza idempotencia: el mismo item con la misma versión siempre genera el mismo `request_id`.
