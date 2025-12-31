# Ejemplos de Body para Upsert a Lambdas

Este documento muestra **ejemplos completos y reales** del body JSON que se envía a cada lambda Stage 1 desde el Backoffice.

---

## 📋 Índice

1. [Tenant](#1-tenant)
2. [Client](#2-client)
3. [Subtenant](#3-subtenant)
4. [Domain](#4-domain)
5. [Branding](#5-branding)

---

## 1. Tenant

**Endpoint:** `POST ${ADMIN_TENANTS_UPSERT_URL}`

**Headers:**

```http
Content-Type: application/json
Authorization: Bearer ${ADMIN_SYNC_TOKEN}
```

**Body completo:**

```json
{
  "request_id": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "tenant": {
    "id": "694e4d50a6b13540fa2c362c",
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

**Campos enviados:**

- `id` (string): ObjectId del tenant convertido a hex string
- `enabled` (boolean): Estado del tenant
- `name` (string): Nombre del tenant
- `password_check_endpoint` (string): URL para verificar contraseñas
- `user_migrated_endpoint` (string): URL para marcar usuarios migrados
- `slug` (string): Slug único del tenant
- `logo` (string): URL del logo del tenant
- `allow_auto_link` (boolean): Si se permite auto-link de usuarios (default: true)

---

## 2. Client

**Endpoint:** `POST ${ADMIN_CLIENTS_UPSERT_URL}`

**Headers:**

```http
Content-Type: application/json
Authorization: Bearer ${ADMIN_SYNC_TOKEN}
```

**Body completo:**

```json
{
  "request_id": "b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7",
  "client": {
    "id": "694e4d58a6b13540fa2c3632",
    "enabled": true,
    "name": "Semper Altius",
    "redirect_uris": [
      "https://app.semperaltius.edu.mx/callback",
      "https://app.semperaltius.edu.mx/logout",
      "http://localhost:4200"
    ],
    "pkce_required": true
  }
}
```

**Campos enviados:**

- `id` (string): ObjectId del client convertido a hex string
- `enabled` (boolean): Estado del client
- `name` (string): Nombre del client
- `redirect_uris` (string[]): Array de URIs de redirección permitidas
- `pkce_required` (boolean, opcional): Si PKCE es requerido

---

## 3. Subtenant

**Endpoint:** `POST ${ADMIN_SUBTENANTS_UPSERT_URL}`

**Headers:**

```http
Content-Type: application/json
Authorization: Bearer ${ADMIN_SYNC_TOKEN}
```

**Body completo:**

```json
{
  "request_id": "c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8",
  "subtenant": {
    "id": "694e4d5da6b13540fa2c3636",
    "tenant_id": "694e4d50a6b13540fa2c362c",
    "enabled": true,
    "name": "RCSA",
    "logo": "https://example.com/logos/rcsa.png"
  }
}
```

**Campos enviados:**

- `id` (string): ObjectId del subtenant convertido a hex string
- `tenant_id` (string): ObjectId del tenant padre (hex string)
- `enabled` (boolean): Estado del subtenant
- `name` (string): Nombre del subtenant
- `logo` (string): URL del logo del subtenant (obligatorio)

---

## 4. Domain

**Endpoint:** `POST ${ADMIN_DOMAINS_UPSERT_URL}`

**Headers:**

```http
Content-Type: application/json
Authorization: Bearer ${ADMIN_SYNC_TOKEN}
```

**Body completo:**

```json
{
  "request_id": "d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9",
  "domain": {
    "id": "694e4d63a6b13540fa2c363b",
    "host": "pagos.semperaltius.edu.mx",
    "enabled": true,
    "tenant_id": "694e4d50a6b13540fa2c362c",
    "default_subtenant_id": "694e4d5da6b13540fa2c3636",
    "client_id": "694e4d58a6b13540fa2c3632"
  }
}
```

**Campos enviados:**

- `id` (string): ObjectId del domain convertido a hex string
- `host` (string): Host del dominio (se canonicaliza automáticamente en el lambda)
- `enabled` (boolean): Estado del dominio
- `tenant_id` (string): ObjectId del tenant (hex string)
- `default_subtenant_id` (string, opcional): ObjectId del subtenant por defecto
- `client_id` (string, opcional): ObjectId del client asociado

---

## 5. Branding

**Endpoint:** `POST ${ADMIN_BRANDING_UPSERT_URL}`

**Headers:**

```http
Content-Type: application/json
Authorization: Bearer ${ADMIN_SYNC_TOKEN}
```

**Body completo:**

```json
{
  "request_id": "e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0",
  "branding": {
    "id": "694e4d69a6b13540fa2c3640",
    "subtenant_id": "694e4d5da6b13540fa2c3636",
    "enabled": true
  }
}
```

**Campos enviados:**

- `id` (string): ObjectId del branding convertido a hex string
- `subtenant_id` (string): ObjectId del subtenant (hex string) - **obligatorio**
- `enabled` (boolean): Estado del branding

**Nota importante:** Solo puede existir 1 branding por subtenant.

---

## 📝 Notas Generales

### Request ID

El `request_id` puede ser:

1. **Proporcionado** via header `X-Request-Id` en la request del cliente → se usa ese
2. **Generado automáticamente** usando SHA256:
   ```
   request_id = sha256("${action}|${entityType}|${entityKey}|${timestamp}").substring(0, 32)
   ```

### Campos que NO se envían

Los siguientes campos **NUNCA** se envían al lambda:

- `_id` (se envía como `id`)
- `createdAt` / `updatedAt` / `created_at` / `updated_at` (timestamps de MongoDB)
- `deleted_at` (soft delete es interno)
- `last_sync` (metadata de sync)

### Respuesta Esperada

Todos los lambdas deben responder con:

**Éxito:**

```json
{
  "ok": true,
  "sync_id": "sync_abc123...",
  "id": "694e4d50a6b13540fa2c362c"
}
```

**Error:**

```json
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Descripción del error",
    "details": {}
  }
}
```

---

**Última actualización:** 2025-12-26
