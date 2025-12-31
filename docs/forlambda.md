# Requests a Lambdas Stage 1 - Documentación Completa

Este documento explica **exactamente** qué requests se envían desde el Backoffice (Stage 2) hacia los Lambdas Stage 1, incluyendo el método HTTP, headers, body completo y ejemplos reales.

---

## 📋 Índice

1. [Flujo General](#flujo-general)
2. [Headers Comunes](#headers-comunes)
3. [Request ID](#request-id)
4. [Tenant](#1-tenant)
5. [Client](#2-client)
6. [Subtenant](#3-subtenant)
7. [Domain](#4-domain)
8. [Branding](#5-branding)
9. [Respuestas Esperadas](#respuestas-esperadas)
10. [Manejo de Errores](#manejo-de-errores)

---

## Flujo General

Cuando se ejecuta una operación CRUD (Create, Update, Delete) en el Backoffice:

1. **Se persiste** el cambio en MongoDB
2. **Se llama** a `SyncService.sync<Entity>(doc, requestId)`
3. **Se construye** el payload según el tipo de entidad
4. **Se envía** POST al lambda Stage 1 correspondiente
5. **Se actualiza** `last_sync` en el documento MongoDB
6. **Si falla**, se encola en `sync_outbox` para retry

---

## Headers Comunes

Todas las requests a los lambdas incluyen estos headers:

```http
Content-Type: application/json
Authorization: Bearer ${ADMIN_SYNC_TOKEN}
```

**Variables de entorno:**

- `ADMIN_SYNC_TOKEN`: Token de autenticación server-to-server
- `ADMIN_TIMEOUT_MS`: Timeout en milisegundos (default: 8000ms)

---

## Request ID

El `request_id` se genera de dos formas:

1. **Si se proporciona** via header `X-Request-Id` en la request del cliente → se usa ese
2. **Si no se proporciona** → se genera determinísticamente usando SHA256:
   ```
   request_id = sha256("${action}|${entityType}|${entityKey}|${timestamp}").substring(0, 32)
   ```

Donde:

- `action`: `'create' | 'update' | 'delete'`
- `entityType`: `'tenant' | 'client' | 'subtenant' | 'domain' | 'branding'`
- `entityKey`: `_id` (ObjectId como string) o `host` (para domains)
- `timestamp`: `Date.now()`

---

## 1. Tenant

### Endpoint

```
POST ${ADMIN_TENANTS_UPSERT_URL}
```

**Variable de entorno:** `ADMIN_TENANTS_UPSERT_URL`

### Estructura del Body

```json
{
  "request_id": "abc123...",
  "tenant": {
    "id": "507f1f77bcf86cd799439011",
    "enabled": true,
    "name": "Regnum Christi",
    "password_check_endpoint": "http://localhost:4000/api/internal/password-check",
    "user_migrated_endpoint": "http://localhost:4000/api/internal/mark-user-migrated",
    "slug": "regnum-christi",
    "logo": "https://example.com/logos/regnum-christi.png",
    "allow_auto_link": true
  }
}
```

### Campos Incluidos

| Campo                     | Tipo      | Descripción                                           |
| ------------------------- | --------- | ----------------------------------------------------- |
| `id`                      | `string`  | `_id` del tenant convertido a string (ObjectId → hex) |
| `enabled`                 | `boolean` | Estado del tenant                                     |
| `name`                    | `string`  | Nombre del tenant                                     |
| `password_check_endpoint` | `string`  | URL para verificar contraseñas                        |
| `user_migrated_endpoint`  | `string`  | URL para marcar usuarios migrados                     |
| `slug`                    | `string`  | Slug único del tenant                                 |
| `logo`                    | `string`  | URL del logo del tenant                               |
| `allow_auto_link`         | `boolean` | Si se permite auto-link de usuarios                   |

### Campos Excluidos (NO se envían)

- `_id` (se envía como `id`)
- `createdAt` / `updatedAt` (timestamps de MongoDB)
- `deleted_at` (soft delete)
- `last_sync` (metadata de sync)
- Cualquier otro campo personalizado que no esté en la lista de exclusiones

### Ejemplo Real

**Documento en MongoDB:**

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "enabled": true,
  "name": "Regnum Christi",
  "password_check_endpoint": "http://localhost:4000/api/internal/password-check",
  "user_migrated_endpoint": "http://localhost:4000/api/internal/mark-user-migrated",
  "slug": "regnum-christi",
  "logo": "https://example.com/logos/regnum-christi.png",
  "allow_auto_link": true,
  "createdAt": ISODate("2024-01-15T10:00:00Z"),
  "updatedAt": ISODate("2024-01-15T10:00:00Z"),
  "deleted_at": null,
  "last_sync": null
}
```

**Body enviado al Lambda:**

```json
{
  "request_id": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "tenant": {
    "id": "507f1f77bcf86cd799439011",
    "enabled": true,
    "name": "Regnum Christi",
    "password_check_endpoint": "http://localhost:4000/api/internal/password-check",
    "user_migrated_endpoint": "http://localhost:4000/api/internal/mark-user-migrated",
    "slug": "regnum-christi",
    "logo": "https://example.com/logos/regnum-christi.png",
    "allow_auto_link": true
  }
}
```

---

## 2. Client

### Endpoint

```
POST ${ADMIN_CLIENTS_UPSERT_URL}
```

**Variable de entorno:** `ADMIN_CLIENTS_UPSERT_URL`

### Estructura del Body

```json
{
  "request_id": "abc123...",
  "client": {
    "id": "507f1f77bcf86cd799439012",
    "enabled": true,
    "name": "Semper Altius",
    "redirect_uris": [
      "https://app.semperaltius.edu.mx/callback",
      "https://app.semperaltius.edu.mx/logout"
    ],
    "pkce_required": true
  }
}
```

### Campos Incluidos

| Campo           | Tipo       | Descripción                                           |
| --------------- | ---------- | ----------------------------------------------------- |
| `id`            | `string`   | `_id` del client convertido a string (ObjectId → hex) |
| `enabled`       | `boolean`  | Estado del client                                     |
| `name`          | `string`   | Nombre del client                                     |
| `redirect_uris` | `string[]` | Array de URIs de redirección permitidas               |
| `pkce_required` | `boolean?` | Si PKCE es requerido (opcional)                       |

### Campos Excluidos (NO se envían)

- `_id` (se envía como `id`)
- `createdAt` / `updatedAt`
- `deleted_at`
- `last_sync`

### Ejemplo Real

**Documento en MongoDB:**

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439012"),
  "enabled": true,
  "name": "Semper Altius",
  "redirect_uris": [
    "https://app.semperaltius.edu.mx/callback",
    "https://app.semperaltius.edu.mx/logout"
  ],
  "pkce_required": true,
  "createdAt": ISODate("2024-01-15T10:05:00Z"),
  "updatedAt": ISODate("2024-01-15T10:05:00Z"),
  "deleted_at": null
}
```

**Body enviado al Lambda:**

```json
{
  "request_id": "b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7",
  "client": {
    "id": "507f1f77bcf86cd799439012",
    "enabled": true,
    "name": "Semper Altius",
    "redirect_uris": [
      "https://app.semperaltius.edu.mx/callback",
      "https://app.semperaltius.edu.mx/logout"
    ],
    "pkce_required": true
  }
}
```

---

## 3. Subtenant

### Endpoint

```
POST ${ADMIN_SUBTENANTS_UPSERT_URL}
```

**Variable de entorno:** `ADMIN_SUBTENANTS_UPSERT_URL`

### Estructura del Body

```json
{
  "request_id": "abc123...",
  "subtenant": {
    "id": "507f1f77bcf86cd799439013",
    "tenant_id": "507f1f77bcf86cd799439011",
    "enabled": true,
    "name": "RCSA"
  }
}
```

### Campos Incluidos

| Campo       | Tipo      | Descripción                                              |
| ----------- | --------- | -------------------------------------------------------- |
| `id`        | `string`  | `_id` del subtenant convertido a string (ObjectId → hex) |
| `tenant_id` | `string`  | `_id` del tenant padre (ObjectId como string)            |
| `enabled`   | `boolean` | Estado del subtenant                                     |
| `name`      | `string`  | Nombre del subtenant                                     |

### Campos Excluidos (NO se envían)

- `_id` (se envía como `id`)
- `createdAt` / `updatedAt`
- `deleted_at`
- `last_sync`

### Ejemplo Real

**Documento en MongoDB:**

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439013"),
  "tenant_id": "507f1f77bcf86cd799439011",
  "enabled": true,
  "name": "RCSA",
  "createdAt": ISODate("2024-01-15T10:10:00Z"),
  "updatedAt": ISODate("2024-01-15T10:10:00Z"),
  "deleted_at": null
}
```

**Body enviado al Lambda:**

```json
{
  "request_id": "c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8",
  "subtenant": {
    "id": "507f1f77bcf86cd799439013",
    "tenant_id": "507f1f77bcf86cd799439011",
    "enabled": true,
    "name": "RCSA"
  }
}
```

---

## 4. Domain

### Endpoint

```
POST ${ADMIN_DOMAINS_UPSERT_URL}
```

**Variable de entorno:** `ADMIN_DOMAINS_UPSERT_URL`

### Estructura del Body

```json
{
  "request_id": "abc123...",
  "domain": {
    "id": "507f1f77bcf86cd799439014",
    "host": "pagos.semperaltius.edu.mx",
    "enabled": true,
    "tenant_id": "507f1f77bcf86cd799439011",
    "default_subtenant_id": "507f1f77bcf86cd799439013",
    "client_id": "507f1f77bcf86cd799439012"
  }
}
```

### Campos Incluidos

| Campo                  | Tipo      | Descripción                                           |
| ---------------------- | --------- | ----------------------------------------------------- |
| `id`                   | `string`  | `_id` del domain convertido a string (ObjectId → hex) |
| `host`                 | `string`  | Host del dominio (se canonicaliza automáticamente)    |
| `enabled`              | `boolean` | Estado del dominio                                    |
| `tenant_id`            | `string`  | `_id` del tenant (ObjectId como string)               |
| `default_subtenant_id` | `string?` | `_id` del subtenant por defecto (opcional)            |
| `client_id`            | `string?` | `_id` del client asociado (opcional)                  |

### Campos Excluidos (NO se envían)

- `_id` (se envía como `id`)
- `createdAt` / `updatedAt`
- `deleted_at`
- `last_sync`

### Nota Importante

- El `request_id` se genera usando el `_id` del domain (igual que las demás entidades)
- El `host` se canonicaliza automáticamente en el Lambda (lowercase, sin puerto)
- El `host` tiene índice único en MongoDB del Lambda (no puede haber duplicados)
- El formato ahora es consistente con todos los demás endpoints (tenant, client, subtenant, branding): todos usan `id` como identificador

### Ejemplo Real

**Documento en MongoDB:**

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439014"),
  "host": "pagos.semperaltius.edu.mx",
  "enabled": true,
  "tenant_id": "507f1f77bcf86cd799439011",
  "default_subtenant_id": "507f1f77bcf86cd799439013",
  "client_id": "507f1f77bcf86cd799439012",
  "createdAt": ISODate("2024-01-15T10:15:00Z"),
  "updatedAt": ISODate("2024-01-15T10:15:00Z"),
  "deleted_at": null
}
```

**Body enviado al Lambda:**

```json
{
  "request_id": "d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9",
  "domain": {
    "id": "507f1f77bcf86cd799439014",
    "host": "pagos.semperaltius.edu.mx",
    "enabled": true,
    "tenant_id": "507f1f77bcf86cd799439011",
    "default_subtenant_id": "507f1f77bcf86cd799439013",
    "client_id": "507f1f77bcf86cd799439012"
  }
}
```

---

## 5. Branding

### Endpoint

```
POST ${ADMIN_BRANDING_UPSERT_URL}
```

**Variable de entorno:** `ADMIN_BRANDING_UPSERT_URL`

### Estructura del Body

```json
{
  "request_id": "abc123...",
  "branding": {
    "id": "507f1f77bcf86cd799439015",
    "subtenant_id": "507f1f77bcf86cd799439013",
    "enabled": true
  }
}
```

### Campos Incluidos

| Campo          | Tipo      | Descripción                                             |
| -------------- | --------- | ------------------------------------------------------- |
| `id`           | `string`  | `_id` del branding convertido a string (ObjectId → hex) |
| `subtenant_id` | `string`  | `_id` del subtenant (ObjectId como string)              |
| `enabled`      | `boolean` | Estado del branding                                     |

### Campos Excluidos (NO se envían)

- `_id` (se envía como `id`)
- `created_at` / `updated_at` (timestamps de MongoDB)
- `deleted_at`
- `last_sync`

### Nota Importante

- **Solo existe 1 branding por subtenant**
- El `subtenant_id` es **obligatorio** y se convierte de ObjectId a string
- NO se envía `scope` ni `tenant_id` (contrato anterior eliminado)

### Ejemplo Real

**Documento en MongoDB:**

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439015"),
  "subtenant_id": ObjectId("507f1f77bcf86cd799439013"),
  "enabled": true,
  "created_at": ISODate("2024-01-15T10:20:00Z"),
  "updated_at": ISODate("2024-01-15T10:20:00Z"),
  "deleted_at": null
}
```

**Body enviado al Lambda:**

```json
{
  "request_id": "e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0",
  "branding": {
    "id": "507f1f77bcf86cd799439015",
    "subtenant_id": "507f1f77bcf86cd799439013",
    "enabled": true
  }
}
```

---

## Respuestas Esperadas

Todos los lambdas Stage 1 deben responder con el siguiente contrato:

### Respuesta Exitosa

```json
{
  "ok": true,
  "sync_id": "sync_abc123...",
  "id": "507f1f77bcf86cd799439011" // Para tenant/client/subtenant/branding
}
```

O para Domain (ahora también retorna `id`):

```json
{
  "ok": true,
  "sync_id": "sync_abc123...",
  "id": "507f1f77bcf86cd799439014"
}
```

**Nota**: Domain ahora retorna `id` igual que las demás entidades, manteniendo consistencia en el contrato.

### Respuesta con Error

```json
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Descripción del error",
    "details": {
      // Opcional: detalles adicionales
    }
  }
}
```

### Códigos de Error Comunes

| Código                | Descripción                     |
| --------------------- | ------------------------------- |
| `VALIDATION_ERROR`    | Datos inválidos en el payload   |
| `NOT_FOUND`           | Entidad no encontrada           |
| `INVALID_TOKEN`       | Token de autenticación inválido |
| `MISSING_AUTH`        | Falta header de autenticación   |
| `TIMEOUT`             | Request excedió el timeout      |
| `CONNECTION_ERROR`    | Error de conexión con el lambda |
| `UNEXPECTED_RESPONSE` | Formato de respuesta inesperado |

---

## Manejo de Errores

### Flujo de Error

1. **Si el lambda responde con `ok: false`**:
   - Se actualiza `last_sync` en MongoDB con `ok: false` y detalles del error
   - Se encola en `sync_outbox` para retry posterior
   - **NO se rompe** la operación CRUD original

2. **Si hay timeout**:
   - Se marca como `TIMEOUT` en `last_sync`
   - Se encola en outbox

3. **Si hay error de conexión**:
   - Se marca como `CONNECTION_ERROR` en `last_sync`
   - Se encola en outbox

### Estructura de `last_sync` en MongoDB

```json
{
  "last_sync": {
    "ok": false,
    "http_status": 500,
    "sync_id": null,
    "error_code": "TIMEOUT",
    "error_message": "Request timeout after 8000ms",
    "updated_at": ISODate("2024-01-15T10:25:00Z"),
    "request_id": "e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0"
  }
}
```

### Outbox Pattern

Si el sync falla, se crea un documento en `sync_outbox`:

```json
{
  "_id": ObjectId("..."),
  "entity_type": "branding",
  "entity_key": "507f1f77bcf86cd799439015",
  "request_id": "e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0",
  "payload": {
    "request_id": "e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0",
    "branding": {
      "id": "507f1f77bcf86cd799439015",
      "subtenant_id": "507f1f77bcf86cd799439013",
      "enabled": true
    }
  },
  "status": "PENDING",
  "attempts": 0,
  "last_error": "Request timeout after 8000ms",
  "next_retry_at": ISODate("2024-01-15T10:25:05Z")
}
```

El `OutboxService.processPending()` puede procesar estos items para retry.

---

## Resumen de Endpoints

| Entidad   | Variable ENV                  | Endpoint                        |
| --------- | ----------------------------- | ------------------------------- |
| Tenant    | `ADMIN_TENANTS_UPSERT_URL`    | `POST /admin/tenants/upsert`    |
| Client    | `ADMIN_CLIENTS_UPSERT_URL`    | `POST /admin/clients/upsert`    |
| Subtenant | `ADMIN_SUBTENANTS_UPSERT_URL` | `POST /admin/subtenants/upsert` |
| Domain    | `ADMIN_DOMAINS_UPSERT_URL`    | `POST /admin/domains/upsert`    |
| Branding  | `ADMIN_BRANDING_UPSERT_URL`   | `POST /admin/branding/upsert`   |

---

## Notas Finales

1. **Todos los ObjectIds se convierten a string** (hex) antes de enviar
2. **Los timestamps de MongoDB NO se envían** (`createdAt`, `updatedAt`, `created_at`, `updated_at`)
3. **El campo `deleted_at` NO se envía** (soft delete es interno)
4. **El campo `last_sync` NO se envía** (metadata interna)
5. **El `request_id` es determinístico** si no se proporciona via header
6. **Si el sync falla, NO se rompe la operación CRUD** (se encola en outbox)
7. **El timeout es configurable** via `ADMIN_TIMEOUT_MS` (default: 8000ms)

---

**Última actualización:** 2024-01-15
**Versión:** 1.0
