# 📋 Lista Completa de Endpoints Lambda

Este documento lista **TODOS** los endpoints Lambda a los que se comunica el Backoffice desde todos los módulos.

---

## 🔑 Variables de Entorno Requeridas

Todos los endpoints Lambda se configuran mediante variables de entorno:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `ADMIN_SYNC_TOKEN` | Token de autenticación Bearer | `Bearer token123...` |
| `ADMIN_TIMEOUT_MS` | Timeout en milisegundos (default: 8000ms) | `8000` |
| `ADMIN_TENANTS_UPSERT_URL` | URL del Lambda para Tenants | `http://localhost:9000/lambda-url/tenants-upsert/admin/tenants/upsert` |
| `ADMIN_CLIENTS_UPSERT_URL` | URL del Lambda para Clients | `http://localhost:9000/lambda-url/clients-upsert/admin/clients/upsert` |
| `ADMIN_SUBTENANTS_UPSERT_URL` | URL del Lambda para Subtenants | `http://localhost:9000/lambda-url/subtenants-upsert/admin/subtenants/upsert` |
| `ADMIN_DOMAINS_UPSERT_URL` | URL del Lambda para Domains | `http://localhost:9000/lambda-url/domains-upsert/admin/domains/upsert` |
| `ADMIN_BRANDING_UPSERT_URL` | URL del Lambda para Branding | `http://localhost:9000/lambda-url/branding-upsert/admin/branding/upsert` |

---

## 📡 Endpoints Lambda por Módulo

### 1. **TENANTS** (Módulo: `src/modules/tenants/`)

**Endpoint Lambda:**
```
POST ${ADMIN_TENANTS_UPSERT_URL}
```

**Se llama desde:**
- `POST /api/admin/tenants` (create)
- `PATCH /api/admin/tenants/:id` (update)
- `DELETE /api/admin/tenants/:id` (soft delete)

**Método HTTP:** `POST`

**Headers:**
```http
Content-Type: application/json
Authorization: Bearer ${ADMIN_SYNC_TOKEN}
```

**Body Structure:**
```json
{
  "request_id": "string (32 chars)",
  "tenant": {
    "id": "string (ObjectId hex)",
    "enabled": boolean,
    "name": "string",
    "password_check_endpoint": "string",
    "user_migrated_endpoint": "string",
    "slug": "string",
    "logo": "string (optional)",
    "allow_auto_link": "boolean (optional)",
    ...otros campos personalizados
  }
}
```

**Archivo que lo invoca:**
- `src/shared/sync/sync.service.ts` → `syncTenant()`
- `src/shared/hub-lambda-client/hub-lambda-client.ts` → `upsertTenant()`

---

### 2. **CLIENTS** (Módulo: `src/modules/clients/`)

**Endpoint Lambda:**
```
POST ${ADMIN_CLIENTS_UPSERT_URL}
```

**Se llama desde:**
- `POST /api/admin/clients` (create)
- `PATCH /api/admin/clients/:id` (update) ⚠️ **Este es el que usaste**
- `DELETE /api/admin/clients/:id` (soft delete)

**Método HTTP:** `POST`

**Headers:**
```http
Content-Type: application/json
Authorization: Bearer ${ADMIN_SYNC_TOKEN}
```

**Body Structure:**
```json
{
  "request_id": "string (32 chars)",
  "client": {
    "id": "string (ObjectId hex)",
    "enabled": boolean,
    "name": "string",
    "redirect_uris": ["string"],
    "pkce_required": "boolean (optional)",
    ...otros campos personalizados
  }
}
```

**Archivo que lo invoca:**
- `src/modules/clients/clients.service.ts` → `create()`, `update()`, `delete()`
- `src/shared/sync/sync.service.ts` → `syncClient()`
- `src/shared/hub-lambda-client/hub-lambda-client.ts` → `upsertClient()`

**⚠️ NOTA IMPORTANTE:** Si hiciste un PATCH a un client y no se actualizó, verifica:
1. Que el `ADMIN_CLIENTS_UPSERT_URL` esté configurado correctamente
2. Que el `ADMIN_SYNC_TOKEN` sea válido
3. Revisa el campo `last_sync` en el documento MongoDB del client
4. Revisa la colección `sync_outbox` por si el sync falló y está en cola

---

### 3. **SUBTENANTS** (Módulo: `src/modules/subtenants/`)

**Endpoint Lambda:**
```
POST ${ADMIN_SUBTENANTS_UPSERT_URL}
```

**Se llama desde:**
- `POST /api/admin/subtenants` (create)
- `PATCH /api/admin/subtenants/:id` (update)
- `DELETE /api/admin/subtenants/:id` (soft delete)

**Método HTTP:** `POST`

**Headers:**
```http
Content-Type: application/json
Authorization: Bearer ${ADMIN_SYNC_TOKEN}
```

**Body Structure:**
```json
{
  "request_id": "string (32 chars)",
  "subtenant": {
    "id": "string (ObjectId hex)",
    "tenant_id": "string (ObjectId hex)",
    "enabled": boolean,
    "name": "string",
    ...otros campos personalizados
  }
}
```

**Archivo que lo invoca:**
- `src/modules/subtenants/subtenants.service.ts` → `create()`, `update()`, `delete()`
- `src/shared/sync/sync.service.ts` → `syncSubtenant()`
- `src/shared/hub-lambda-client/hub-lambda-client.ts` → `upsertSubtenant()`

---

### 4. **DOMAINS** (Módulo: `src/modules/domains/`)

**Endpoint Lambda:**
```
POST ${ADMIN_DOMAINS_UPSERT_URL}
```

**Se llama desde:**
- `POST /api/admin/domains` (create)
- `PATCH /api/admin/domains/:host` (update)
- `DELETE /api/admin/domains/:host` (soft delete)

**Método HTTP:** `POST`

**Headers:**
```http
Content-Type: application/json
Authorization: Bearer ${ADMIN_SYNC_TOKEN}
```

**Body Structure:**
```json
{
  "request_id": "string (32 chars)",
  "domain": {
    "id": "string (ObjectId hex)",
    "host": "string",
    "enabled": boolean,
    "tenant_id": "string (ObjectId hex)",
    "default_subtenant_id": "string (ObjectId hex, optional)",
    "client_id": "string (ObjectId hex, optional)",
    ...otros campos personalizados
  }
}
```

**Archivo que lo invoca:**
- `src/modules/domains/domains.service.ts` → `create()`, `update()`, `delete()`
- `src/shared/sync/sync.service.ts` → `syncDomain()`
- `src/shared/hub-lambda-client/hub-lambda-client.ts` → `upsertDomain()`

---

### 5. **BRANDING** (Módulo: `src/modules/brandings/`)

**Endpoint Lambda:**
```
POST ${ADMIN_BRANDING_UPSERT_URL}
```

**Se llama desde:**
- `POST /api/admin/brandings` (create)
- `PATCH /api/admin/brandings/:id` (update)
- `DELETE /api/admin/brandings/:id` (soft delete)

**Método HTTP:** `POST`

**Headers:**
```http
Content-Type: application/json
Authorization: Bearer ${ADMIN_SYNC_TOKEN}
```

**Body Structure:**
```json
{
  "request_id": "string (32 chars)",
  "branding": {
    "id": "string (ObjectId hex)",
    "subtenant_id": "string (ObjectId hex)",
    "enabled": boolean,
    ...otros campos personalizados
  }
}
```

**Archivo que lo invoca:**
- `src/modules/brandings/brandings.service.ts` → `create()`, `update()`, `delete()`
- `src/shared/sync/sync.service.ts` → `syncBranding()`
- `src/shared/hub-lambda-client/hub-lambda-client.ts` → `upsertBranding()`

---

## 🔄 Flujo de Sincronización

Cuando se ejecuta una operación CRUD (Create, Update, Delete) en cualquier módulo:

1. **Se persiste** el cambio en MongoDB
2. **Se llama** a `SyncService.sync<Entity>(doc, requestId)`
3. **Se construye** el payload según el tipo de entidad
4. **Se envía** `POST` al lambda Stage 1 correspondiente
5. **Se actualiza** `last_sync` en el documento MongoDB
6. **Si falla**, se encola en `sync_outbox` para retry

---

## 📊 Resumen de Endpoints

| # | Entidad | Variable ENV | Endpoint Lambda | Módulo Backoffice |
|---|---------|--------------|-----------------|-------------------|
| 1 | **Tenant** | `ADMIN_TENANTS_UPSERT_URL` | `POST /admin/tenants/upsert` | `src/modules/tenants/` |
| 2 | **Client** | `ADMIN_CLIENTS_UPSERT_URL` | `POST /admin/clients/upsert` | `src/modules/clients/` |
| 3 | **Subtenant** | `ADMIN_SUBTENANTS_UPSERT_URL` | `POST /admin/subtenants/upsert` | `src/modules/subtenants/` |
| 4 | **Domain** | `ADMIN_DOMAINS_UPSERT_URL` | `POST /admin/domains/upsert` | `src/modules/domains/` |
| 5 | **Branding** | `ADMIN_BRANDING_UPSERT_URL` | `POST /admin/branding/upsert` | `src/modules/brandings/` |

**Total: 5 endpoints Lambda**

---

## 🔍 Debugging: Si un PATCH no se actualiza

Si hiciste un PATCH (por ejemplo a un client) y no se actualizó en el Lambda:

### 1. Verificar el documento en MongoDB:
```javascript
db.clients.findOne({ _id: ObjectId("...") })
// Revisa el campo "last_sync"
```

### 2. Verificar `sync_outbox`:
```javascript
db.sync_outbox.find({ 
  entity_type: "client", 
  entity_key: "...",
  status: "PENDING" 
})
```

### 3. Verificar variables de entorno:
```bash
echo $ADMIN_CLIENTS_UPSERT_URL
echo $ADMIN_SYNC_TOKEN
```

### 4. Verificar logs del Backoffice:
Busca errores relacionados con:
- `Sync failed for client`
- `TIMEOUT`
- `CONNECTION_ERROR`
- `HTTP_*`

### 5. Verificar que el Lambda esté corriendo:
```bash
curl -X POST ${ADMIN_CLIENTS_UPSERT_URL} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ADMIN_SYNC_TOKEN}" \
  -d '{"request_id":"test","client":{"id":"test","enabled":true,"name":"test"}}'
```

---

## 📝 Archivos Clave

- **Cliente Lambda:** `src/shared/hub-lambda-client/hub-lambda-client.ts`
- **Servicio de Sync:** `src/shared/sync/sync.service.ts`
- **Outbox Service:** `src/shared/sync/outbox.service.ts`
- **Documentación completa:** `docs/forlambda.md`

---

**Última actualización:** 2024-01-15

