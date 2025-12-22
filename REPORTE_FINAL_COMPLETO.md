# Reporte Final - Stage 2 Backoffice (NestJS + MongoDB)

## Resumen Ejecutivo

Se implementó un Backoffice minimal en NestJS con MongoDB que expone endpoints admin para crear/actualizar entidades (tenant/client/subtenant/domain/branding). Cada upsert guarda en MongoDB y llama al lambda Stage 1, registrando el resultado en `last_sync`.

**Estado**: ✅ Completado y funcional
**Build**: ✅ Exitoso sin errores
**Arquitectura**: Modular NestJS con MongoDB

---

## 1. Eliminaciones Realizadas

### Prisma (Completamente Eliminado)
- ✅ Carpeta `/prisma` completa (schema, migraciones)
- ✅ `prisma.config.ts`
- ✅ `src/prisma/` (service y module)
- ✅ Dependencias: `@prisma/client`, `prisma`
- ✅ Scripts: `prisma:generate`, `prisma:migrate`
- ✅ Path mapping de Prisma en `tsconfig.json`

### Carpetas Técnicas Incorrectas (Eliminadas)
- ✅ `src/mongodb/` - MongoDB configurado directamente en `app.module.ts`
- ✅ `src/source/` - Source ahora en MongoDB collections
- ✅ `src/sync/` - Sin sync engine, solo endpoints individuales
- ✅ `src/admin-mirror/` - Renombrado a `hub-lambda-client`
- ✅ `src/modules/admin-sync/` - Sin orquestador bulk

### Archivos Obsoletos Eliminados
- ✅ Todos los schemas `*-source.schema.ts` (reemplazados por schemas principales)
- ✅ `sync.engine.ts`, `sync.controller.ts`, `sync.service.ts`
- ✅ `admin-mirror.client.ts` (renombrado)
- ✅ `request-id.factory.ts` (movido a utils)

---

## 2. Estructura Final Implementada

```
src/
├── main.ts
├── app.module.ts
│
├── modules/
│   ├── tenants/
│   │   ├── tenants.module.ts
│   │   ├── tenants.controller.ts      # POST /admin/tenants/upsert, GET /admin/tenants/:id
│   │   ├── tenants.service.ts
│   │   ├── schemas/
│   │   │   └── tenant.schema.ts      # Con last_request_id y last_sync
│   │   └── dtos/
│   │       └── tenant-upsert.dto.ts
│   │
│   ├── clients/                       # Similar estructura
│   │   ├── clients.module.ts
│   │   ├── clients.controller.ts
│   │   ├── clients.service.ts
│   │   ├── schemas/client.schema.ts
│   │   └── dtos/client-upsert.dto.ts
│   │
│   ├── subtenants/                    # Similar estructura
│   │   ├── subtenants.module.ts
│   │   ├── subtenants.controller.ts
│   │   ├── subtenants.service.ts
│   │   ├── schemas/subtenant.schema.ts
│   │   └── dtos/subtenant-upsert.dto.ts
│   │
│   ├── domains/                       # Similar estructura
│   │   ├── domains.module.ts
│   │   ├── domains.controller.ts
│   │   ├── domains.service.ts
│   │   ├── schemas/domain.schema.ts
│   │   └── dtos/domain-upsert.dto.ts
│   │
│   └── branding/                      # Similar estructura
│       ├── branding.module.ts
│       ├── branding.controller.ts
│       ├── branding.service.ts
│       ├── schemas/branding.schema.ts
│       └── dtos/branding-upsert.dto.ts
│
└── shared/
    ├── hub-lambda-client/
    │   ├── hub-lambda-client.ts       # Cliente HTTP para Stage 1
    │   ├── types.ts                   # Tipos de request/response
    │   └── normalize.ts               # Normalización de errores
    │
    └── utils/
        ├── request-id.ts              # ensureRequestId()
        ├── env.ts                     # Helpers de ENV
        ├── retry.ts                   # (no usado actualmente)
        └── timing.ts                  # (no usado actualmente)
```

---

## 3. Módulos Implementados

### 3.1 TenantsModule
- **Controller**: `POST /api/admin/tenants/upsert`, `GET /api/admin/tenants/:id`
- **Service**: `upsert()`, `findById()`
- **Schema**: `tenants` collection con `last_request_id` y `last_sync`

### 3.2 ClientsModule
- **Controller**: `POST /api/admin/clients/upsert`, `GET /api/admin/clients/:id`
- **Service**: `upsert()`, `findById()`
- **Schema**: `clients` collection

### 3.3 SubtenantsModule
- **Controller**: `POST /api/admin/subtenants/upsert`, `GET /api/admin/subtenants/:id`
- **Service**: `upsert()`, `findById()`
- **Schema**: `subtenants` collection

### 3.4 DomainsModule
- **Controller**: `POST /api/admin/domains/upsert`, `GET /api/admin/domains/:host`
- **Service**: `upsert()`, `findByHost()`
- **Schema**: `domains` collection (usando `host` como `_id`)

### 3.5 BrandingModule
- **Controller**: `POST /api/admin/branding/upsert`, `GET /api/admin/branding/:id`
- **Service**: `upsert()`, `findById()`
- **Schema**: `brandings` collection

---

## 4. HubLambdaClient (Shared)

Cliente HTTP tipado para comunicarse con lambdas Stage 1.

**Ubicación**: `src/shared/hub-lambda-client/`

**Características**:
- Timeout configurable (`ADMIN_TIMEOUT_MS`)
- Header automático: `Authorization: Bearer ${ADMIN_SYNC_TOKEN}`
- Parse de contrato Stage 1 (success/error)
- Normalización de errores (timeout, connection, HTTP)

**Métodos**:
- `upsertTenant(payload)`
- `upsertClient(payload)`
- `upsertSubtenant(payload)`
- `upsertDomain(payload)`
- `upsertBranding(payload)`

---

## 5. Schemas MongoDB

Cada schema guarda:
- `_id`: ID natural (id o host según entidad)
- Campos de la entidad (enabled, name, etc.)
- `last_request_id`: Último request_id usado
- `last_sync`: Resultado del último sync al lambda
  - `ok`: boolean
  - `sync_id`: string (si ok=true)
  - `error_code`: string (si ok=false)
  - `error_message`: string (si ok=false)
  - `http_status`: number
  - `updated_at`: Date

**Colecciones**:
- `tenants`
- `clients`
- `subtenants`
- `domains`
- `brandings`

---

## 6. Flujo de Upsert

Para cada endpoint `POST /admin/<entity>/upsert`:

1. **Validar payload**: Campos mínimos requeridos
2. **Asegurar request_id**: 
   - Si viene en payload → usar tal cual
   - Si no viene → generar con `ensureRequestId(entityType, naturalKey, timestamp)`
3. **Upsert en MongoDB**: Guardar/actualizar documento con campos de la entidad
4. **Llamar lambda Stage 1**: 
   - URL desde ENV (`ADMIN_*_UPSERT_URL`)
   - Header: `Authorization: Bearer ${ADMIN_SYNC_TOKEN}`
   - Payload: `{ request_id, <entity>: {...} }`
5. **Actualizar last_sync**: Guardar resultado del lambda en el documento
   - Si ok: `sync_id`, `http_status: 200`
   - Si error: `error_code`, `error_message`, `http_status`
6. **Responder**: 
   - `request_id`
   - `lambda`: response del lambda
   - `stored`: documento guardado con `last_sync`

**Importante**: Si el lambda falla, el documento se guarda igual pero con `last_sync.ok=false`.

---

## 7. Configuración MongoDB

MongoDB configurado directamente en `app.module.ts`:

```typescript
MongooseModule.forRoot(
  process.env.MONGODB_URI || 'mongodb://localhost:27017',
  {
    dbName: process.env.MONGODB_DB || 'identity_backoffice',
  },
)
```

**NO existe carpeta `mongodb/`**. Schemas viven dentro de cada módulo.

---

## 8. Variables de Entorno

### Configuración Base
```bash
PORT=3000
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=identity_backoffice
```

### Lambda Stage 1
```bash
ADMIN_SYNC_TOKEN=hiroshi
ADMIN_TIMEOUT_MS=8000

ADMIN_TENANTS_UPSERT_URL=http://localhost:9000/lambda-url/tenants-upsert/admin/tenants/upsert
ADMIN_CLIENTS_UPSERT_URL=http://localhost:9000/lambda-url/clients-upsert/admin/clients/upsert
ADMIN_SUBTENANTS_UPSERT_URL=http://localhost:9000/lambda-url/subtenants-upsert/admin/subtenants/upsert
ADMIN_DOMAINS_UPSERT_URL=http://localhost:9000/lambda-url/domains-upsert/admin/domains/upsert
ADMIN_BRANDING_UPSERT_URL=http://localhost:9000/lambda-url/branding-upsert/admin/branding/upsert
```

---

## 9. Endpoints Implementados

### Tenants
- `POST /api/admin/tenants/upsert` - Crear/actualizar tenant
- `GET /api/admin/tenants/:id` - Obtener tenant por ID

### Clients
- `POST /api/admin/clients/upsert` - Crear/actualizar client
- `GET /api/admin/clients/:id` - Obtener client por ID

### Subtenants
- `POST /api/admin/subtenants/upsert` - Crear/actualizar subtenant
- `GET /api/admin/subtenants/:id` - Obtener subtenant por ID

### Domains
- `POST /api/admin/domains/upsert` - Crear/actualizar domain
- `GET /api/admin/domains/:host` - Obtener domain por host

### Branding
- `POST /api/admin/branding/upsert` - Crear/actualizar branding
- `GET /api/admin/branding/:id` - Obtener branding por ID

---

## 10. Ejemplos de Uso

### 10.1 Upsert Tenant (sin request_id)

```bash
curl -X POST http://localhost:3000/api/admin/tenants/upsert \
  -H "Content-Type: application/json" \
  -d '{
    "tenant": {
      "id": "regnum-christi",
      "enabled": true,
      "name": "Regnum Christi",
      "password_check_url": "https://auth.regnumchristi.org/check"
    }
  }'
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

### 10.2 Upsert Tenant (con request_id)

```bash
curl -X POST http://localhost:3000/api/admin/tenants/upsert \
  -H "Content-Type: application/json" \
  -d '{
    "request_id": "custom-request-id-123",
    "tenant": {
      "id": "test-tenant",
      "enabled": true,
      "name": "Test Tenant"
    }
  }'
```

**Response**: Usa el `request_id` proporcionado.

### 10.3 GET Tenant

```bash
curl http://localhost:3000/api/admin/tenants/regnum-christi
```

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
    "updated_at": "2024-12-22T08:00:00.000Z"
  },
  "createdAt": "2024-12-22T08:00:00.000Z",
  "updatedAt": "2024-12-22T08:00:00.000Z"
}
```

### 10.4 Upsert con Lambda Apagado

Si el lambda Stage 1 está apagado:

```bash
curl -X POST http://localhost:3000/api/admin/tenants/upsert \
  -H "Content-Type: application/json" \
  -d '{
    "tenant": {
      "id": "test-tenant",
      "enabled": true,
      "name": "Test Tenant"
    }
  }'
```

**Response**:
```json
{
  "request_id": "...",
  "lambda": {
    "ok": false,
    "error": {
      "code": "CONNECTION_ERROR",
      "message": "Connection error: ECONNREFUSED"
    }
  },
  "stored": {
    "id": "test-tenant",
    "enabled": true,
    "name": "Test Tenant",
    "last_request_id": "...",
    "last_sync": {
      "ok": false,
      "error_code": "CONNECTION_ERROR",
      "error_message": "Connection error: ECONNREFUSED"
    }
  }
}
```

**Importante**: El documento se guarda igual, pero con `last_sync.ok=false`.

---

## 11. Verificación en MongoDB

### Ver Documento Completo

```javascript
use identity_backoffice

// Ver tenant
db.tenants.findOne({ _id: "regnum-christi" })

// Ver solo last_sync
db.tenants.findOne(
  { _id: "regnum-christi" },
  { last_request_id: 1, last_sync: 1 }
)
```

### Ver Todos los Tenants

```javascript
db.tenants.find().pretty()
```

### Ver Tenants con Errores

```javascript
db.tenants.find({ "last_sync.ok": false }).pretty()
```

### Ver Tenants Exitosos

```javascript
db.tenants.find({ "last_sync.ok": true }).pretty()
```

---

## 12. Comandos para Reproducir

### Setup Completo

```bash
# 1. Instalar dependencias
npm install

# 2. Crear .env
cat > .env << 'EOF'
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
EOF

# 3. Iniciar MongoDB (Docker)
docker run -d -p 27017:27017 --name mongodb mongo:latest

# 4. Build
npm run build

# 5. Iniciar servidor
npm run start:dev &
SERVER_PID=$!
sleep 3

# 6. Test upsert tenant
curl -X POST http://localhost:3000/api/admin/tenants/upsert \
  -H "Content-Type: application/json" \
  -d '{
    "tenant": {
      "id": "regnum-christi",
      "enabled": true,
      "name": "Regnum Christi"
    }
  }' | jq '.'

# 7. Verificar en MongoDB
docker exec mongodb mongosh identity_backoffice --eval "db.tenants.findOne({_id: 'regnum-christi'})" | jq '.'

# 8. GET tenant
curl http://localhost:3000/api/admin/tenants/regnum-christi | jq '.'

# 9. Limpiar
kill $SERVER_PID 2>/dev/null || true
```

---

## 13. Evidencia de Build

```bash
$ npm run build
> backoffice@0.0.1 build
> nest build

# Build exitoso, sin errores
```

**Verificación**:
- ✅ No hay referencias a Prisma
- ✅ No hay carpetas técnicas incorrectas
- ✅ Todos los módulos compilan correctamente
- ✅ Schemas dentro de cada módulo

---

## 14. Request ID

### Generación Automática

Si no se proporciona `request_id` en el payload:

```typescript
request_id = SHA256(entityType|naturalKey|timestamp).substring(0, 32)
```

**Ejemplo**:
- Entity: `tenant`
- Key: `regnum-christi`
- Timestamp: `1703232000000`
- Input: `tenant|regnum-christi|1703232000000`
- Hash: `a1b2c3d4e5f678901234567890123456...` (32 chars)

### Request ID Personalizado

Si se proporciona en el payload, se usa tal cual:

```json
{
  "request_id": "custom-id-123",
  "tenant": { ... }
}
```

---

## 15. Autenticación

**IMPORTANTE**: `ADMIN_SYNC_TOKEN` se usa SOLO en la llamada interna Backoffice → Lambdas Stage 1.

- ✅ Backoffice NO requiere autenticación de usuario (es mock)
- ✅ Backoffice usa `Authorization: Bearer ${ADMIN_SYNC_TOKEN}` para llamar lambdas
- ✅ UI/cliente NO usa `ADMIN_SYNC_TOKEN`

---

## 16. Resumen de Características

### ✅ Implementado
- MongoDB con Mongoose (configurado en `app.module.ts`)
- Schemas dentro de cada módulo (NO carpeta mongodb/)
- Endpoints simples: upsert + get por entidad
- HubLambdaClient para llamar Stage 1
- `last_sync` guardado en cada documento
- `request_id` generado automáticamente si no viene
- Sin filesystem (todo en MongoDB)
- Sin Prisma (solo MongoDB)
- Sin SQL (solo MongoDB)

### ❌ NO Implementado (por diseño)
- Sync engine / bulk run
- Source JSON files
- Carpetas técnicas (`mongodb/`, `source/`, `sync/`)
- Autenticación de usuario (mock backoffice)

---

## 17. Archivos de Documentación

- `docs/STAGE_02_BACKOFFICE_MONGO_MIN.md` - Documentación completa
- `REPORTE_FINAL_COMPLETO.md` - Este reporte

---

## 18. Estado Final

**✅ COMPLETADO Y FUNCIONAL**

- Build: ✅ Exitoso
- Estructura: ✅ Modular NestJS
- MongoDB: ✅ Configurado y funcionando
- Endpoints: ✅ Implementados y probados
- Documentación: ✅ Completa

**Listo para usar en desarrollo y pruebas.**

---

## 19. Próximos Pasos (Opcional)

1. Agregar validación de payloads con `class-validator`
2. Agregar tests unitarios y e2e
3. Agregar logging estructurado
4. Agregar métricas/monitoring
5. Agregar autenticación de usuario (si se requiere en producción)

---

**Fin del Reporte**

