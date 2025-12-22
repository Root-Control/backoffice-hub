# Stage 2 - Backoffice (NestJS + MongoDB) - Minimal

## Arquitectura

Backoffice expone endpoints admin para crear/actualizar entidades (tenant/client/subtenant/domain/branding). Cada upsert:

1. Valida/normaliza payload
2. Asegura request_id (genera si no viene)
3. Guarda/upsertea en MongoDB (como source)
4. Llama al lambda Stage 1 con S2S token
5. Guarda resultado del lambda (sync_id, ok/error) en el mismo documento
6. Responde con request_id, lambda response, y el record guardado

```
┌─────────────┐
│   Cliente   │ (UI/API Client)
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Backoffice API │
│  /admin/*/upsert│
└────────┬────────┘
         │
         ├──► MongoDB (source + last_sync)
         │
         └──► HubLambdaClient
              └──► Stage 1 Lambdas
                   (Authorization: Bearer ADMIN_SYNC_TOKEN)
```

## Estructura

```
src/
├── modules/
│   ├── tenants/
│   │   ├── tenants.controller.ts    # POST /admin/tenants/upsert, GET /admin/tenants/:id
│   │   ├── tenants.service.ts
│   │   ├── schemas/tenant.schema.ts
│   │   └── dtos/tenant-upsert.dto.ts
│   ├── clients/    # Similar estructura
│   ├── subtenants/ # Similar estructura
│   ├── domains/    # Similar estructura
│   └── branding/   # Similar estructura
└── shared/
    ├── hub-lambda-client/  # Cliente HTTP para Stage 1
    └── utils/
        └── request-id.ts   # ensureRequestId()
```

## Configuración ENV

```bash
PORT=3000
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=identity_backoffice

ADMIN_SYNC_TOKEN=hiroshi
ADMIN_TIMEOUT_MS=8000

ADMIN_TENANTS_UPSERT_URL=http://localhost:9000/lambda-url/tenants-upsert/admin/tenants/upsert
ADMIN_CLIENTS_UPSERT_URL=http://localhost:9000/lambda-url/clients-upsert/admin/clients/upsert
ADMIN_SUBTENANTS_UPSERT_URL=http://localhost:9000/lambda-url/subtenants-upsert/admin/subtenants/upsert
ADMIN_DOMAINS_UPSERT_URL=http://localhost:9000/lambda-url/domains-upsert/admin/domains/upsert
ADMIN_BRANDING_UPSERT_URL=http://localhost:9000/lambda-url/branding-upsert/admin/branding/upsert
```

## Cómo Correr Local

### Prerrequisitos

1. Node.js 18+
2. MongoDB corriendo
3. Lambdas Stage 1 corriendo en `localhost:9000`

### Setup

```bash
# 1. Instalar dependencias
npm install

# 2. Crear .env
cp .env.example .env

# 3. Iniciar MongoDB (Docker)
docker run -d -p 27017:27017 --name mongodb mongo:latest

# 4. Build
npm run build

# 5. Iniciar servidor
npm run start:dev
```

## Endpoints

### POST `/api/admin/tenants/upsert`

Crea o actualiza un tenant.

**Request**:
```json
{
  "request_id": "optional-request-id",
  "tenant": {
    "id": "regnum-christi",
    "enabled": true,
    "name": "Regnum Christi",
    "password_check_url": "https://auth.regnumchristi.org/check"
  }
}
```

**Response**:
```json
{
  "request_id": "a1b2c3d4e5f678901234567890123456",
  "lambda": {
    "ok": true,
    "sync_id": "sync-tenant-001"
  },
  "stored": {
    "id": "regnum-christi",
    "enabled": true,
    "name": "Regnum Christi",
    "last_request_id": "a1b2c3d4e5f678901234567890123456",
    "last_sync": {
      "ok": true,
      "sync_id": "sync-tenant-001"
    }
  }
}
```

### GET `/api/admin/tenants/:id`

Obtiene un tenant por ID.

**Response**:
```json
{
  "_id": "regnum-christi",
  "enabled": true,
  "name": "Regnum Christi",
  "password_check_url": "https://auth.regnumchristi.org/check",
  "last_request_id": "a1b2c3d4e5f678901234567890123456",
  "last_sync": {
    "ok": true,
    "sync_id": "sync-tenant-001",
    "http_status": 200,
    "updated_at": "2024-12-20T23:00:00.000Z"
  }
}
```

### Endpoints similares

- `POST /api/admin/clients/upsert`, `GET /api/admin/clients/:id`
- `POST /api/admin/subtenants/upsert`, `GET /api/admin/subtenants/:id`
- `POST /api/admin/domains/upsert`, `GET /api/admin/domains/:host`
- `POST /api/admin/branding/upsert`, `GET /api/admin/branding/:id`

## Documento MongoDB

Cada entidad se guarda en su colección con:

- `_id`: ID natural (id o host)
- Campos de la entidad (enabled, name, etc.)
- `last_request_id`: Último request_id usado
- `last_sync`: Resultado del último sync al lambda
  - `ok`: boolean
  - `sync_id`: string (si ok=true)
  - `error_code`: string (si ok=false)
  - `error_message`: string (si ok=false)
  - `http_status`: number
  - `updated_at`: Date

## Request ID

Si no se proporciona `request_id` en el payload, se genera automáticamente:

```
request_id = SHA256(entityType|naturalKey|timestamp).substring(0, 32)
```

Si se proporciona, se usa tal cual.

## Flujo de Upsert

1. **Validar payload**: Campos mínimos requeridos
2. **Asegurar request_id**: Generar si no viene
3. **Upsert en MongoDB**: Guardar/actualizar documento
4. **Llamar lambda Stage 1**: Con `Authorization: Bearer ${ADMIN_SYNC_TOKEN}`
5. **Actualizar last_sync**: Guardar resultado del lambda
6. **Responder**: request_id, lambda response, stored doc

Si el lambda falla, el documento se guarda igual pero con `last_sync.ok=false`.

## Verificar en MongoDB

```javascript
use identity_backoffice

// Ver tenant
db.tenants.findOne({ _id: "regnum-christi" })

// Ver last_sync
db.tenants.findOne({ _id: "regnum-christi" }, { last_sync: 1 })
```

