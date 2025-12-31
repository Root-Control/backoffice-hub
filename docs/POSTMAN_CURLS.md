# CURLs para Postman - Backoffice API

Base URL: `http://localhost:3000/api/admin`

---

## 🔵 TENANTS

### POST - Create Tenant
```bash
curl --location 'http://localhost:3000/api/admin/tenants' \
--header 'Content-Type: application/json' \
--header 'x-request-id: custom-request-id-123' \
--data '{
    "name": "Regnum Christi",
    "password_check_endpoint": "https://auth.regnumchristi.org/api/check-password",
    "user_migrated_endpoint": "https://auth.regnumchristi.org/api/user-migrated",
    "slug": "regnum-christi",
    "enabled": true
}'
```

### GET - List All Tenants
```bash
curl --location 'http://localhost:3000/api/admin/tenants'
```

### GET - Get Tenant by ID
```bash
curl --location 'http://localhost:3000/api/admin/tenants/507f1f77bcf86cd799439011'
```

### PATCH - Update Tenant
```bash
curl --location --request PATCH 'http://localhost:3000/api/admin/tenants/507f1f77bcf86cd799439011' \
--header 'Content-Type: application/json' \
--header 'x-request-id: update-request-id-456' \
--data '{
    "name": "Regnum Christi Updated",
    "slug": "regnum-christi-updated",
    "enabled": false
}'
```

### DELETE - Soft Delete Tenant
```bash
curl --location --request DELETE 'http://localhost:3000/api/admin/tenants/507f1f77bcf86cd799439011' \
--header 'x-request-id: delete-request-id-789'
```

---

## 🟢 CLIENTS

### POST - Create Client
```bash
curl --location 'http://localhost:3000/api/admin/clients' \
--header 'Content-Type: application/json' \
--header 'x-request-id: client-request-id-123' \
--data '{
    "name": "Semper Altius",
    "redirect_uris": [
        "https://app.semperaltius.edu.mx/callback",
        "https://app.semperaltius.edu.mx/logout"
    ],
    "pkce_required": true,
    "enabled": true
}'
```

### GET - List All Clients
```bash
curl --location 'http://localhost:3000/api/admin/clients'
```

### GET - Get Client by ID
```bash
curl --location 'http://localhost:3000/api/admin/clients/507f1f77bcf86cd799439012'
```

### PATCH - Update Client
```bash
curl --location --request PATCH 'http://localhost:3000/api/admin/clients/507f1f77bcf86cd799439012' \
--header 'Content-Type: application/json' \
--header 'x-request-id: client-update-456' \
--data '{
    "name": "Semper Altius Updated",
    "pkce_required": false,
    "redirect_uris": [
        "https://app.semperaltius.edu.mx/callback"
    ]
}'
```

### DELETE - Soft Delete Client
```bash
curl --location --request DELETE 'http://localhost:3000/api/admin/clients/507f1f77bcf86cd799439012' \
--header 'x-request-id: client-delete-789'
```

---

## 🟡 SUBTENANTS

### POST - Create Subtenant
```bash
curl --location 'http://localhost:3000/api/admin/subtenants' \
--header 'Content-Type: application/json' \
--header 'x-request-id: subtenant-request-id-123' \
--data '{
    "tenant_id": "507f1f77bcf86cd799439011",
    "name": "RCSA",
    "enabled": true
}'
```

### GET - List All Subtenants
```bash
curl --location 'http://localhost:3000/api/admin/subtenants'
```

### GET - Get Subtenant by ID
```bash
curl --location 'http://localhost:3000/api/admin/subtenants/507f1f77bcf86cd799439013'
```

### PATCH - Update Subtenant
```bash
curl --location --request PATCH 'http://localhost:3000/api/admin/subtenants/507f1f77bcf86cd799439013' \
--header 'Content-Type: application/json' \
--header 'x-request-id: subtenant-update-456' \
--data '{
    "name": "RCSA Updated",
    "enabled": false
}'
```

### DELETE - Soft Delete Subtenant
```bash
curl --location --request DELETE 'http://localhost:3000/api/admin/subtenants/507f1f77bcf86cd799439013' \
--header 'x-request-id: subtenant-delete-789'
```

---

## 🟠 DOMAINS

### POST - Create Domain
```bash
curl --location 'http://localhost:3000/api/admin/domains' \
--header 'Content-Type: application/json' \
--header 'x-request-id: domain-request-id-123' \
--data '{
    "host": "pagos.semperaltius.edu.mx",
    "tenant_id": "507f1f77bcf86cd799439011",
    "default_subtenant_id": "507f1f77bcf86cd799439013",
    "client_id": "507f1f77bcf86cd799439012",
    "enabled": true
}'
```

### GET - List All Domains
```bash
curl --location 'http://localhost:3000/api/admin/domains'
```

### GET - Get Domain by Host
```bash
curl --location 'http://localhost:3000/api/admin/domains/pagos.semperaltius.edu.mx'
```

### PATCH - Update Domain
```bash
curl --location --request PATCH 'http://localhost:3000/api/admin/domains/pagos.semperaltius.edu.mx' \
--header 'Content-Type: application/json' \
--header 'x-request-id: domain-update-456' \
--data '{
    "default_subtenant_id": "507f1f77bcf86cd799439014",
    "enabled": false
}'
```

### DELETE - Soft Delete Domain
```bash
curl --location --request DELETE 'http://localhost:3000/api/admin/domains/pagos.semperaltius.edu.mx' \
--header 'x-request-id: domain-delete-789'
```

---

## 🟣 BRANDINGS

### POST - Create Branding
```bash
curl --location 'http://localhost:3000/api/admin/brandings' \
--header 'Content-Type: application/json' \
--header 'x-request-id: branding-request-id-123' \
--data '{
    "scope": "tenant:507f1f77bcf86cd799439011",
    "tenant_id": "507f1f77bcf86cd799439011",
    "subtenant_id": "507f1f77bcf86cd799439013",
    "enabled": true
}'
```

### GET - List All Brandings
```bash
curl --location 'http://localhost:3000/api/admin/brandings'
```

### GET - Get Branding by ID
```bash
curl --location 'http://localhost:3000/api/admin/brandings/507f1f77bcf86cd799439015'
```

### PATCH - Update Branding
```bash
curl --location --request PATCH 'http://localhost:3000/api/admin/brandings/507f1f77bcf86cd799439015' \
--header 'Content-Type: application/json' \
--header 'x-request-id: branding-update-456' \
--data '{
    "scope": "tenant:507f1f77bcf86cd799439011:subtenant:507f1f77bcf86cd799439013",
    "enabled": false
}'
```

### DELETE - Soft Delete Branding
```bash
curl --location --request DELETE 'http://localhost:3000/api/admin/brandings/507f1f77bcf86cd799439015' \
--header 'x-request-id: branding-delete-789'
```

---

## 📋 FLUJO COMPLETO (Orden de creación)

### 1. Crear Tenant
```bash
curl --location 'http://localhost:3000/api/admin/tenants' \
--header 'Content-Type: application/json' \
--data '{
    "name": "Regnum Christi",
    "password_check_endpoint": "https://auth.regnumchristi.org/api/check-password",
    "user_migrated_endpoint": "https://auth.regnumchristi.org/api/user-migrated",
    "slug": "regnum-christi",
    "enabled": true
}'
```
**Guardar el `_id` de la respuesta como `TENANT_ID`**

### 2. Crear Client
```bash
curl --location 'http://localhost:3000/api/admin/clients' \
--header 'Content-Type: application/json' \
--data '{
    "name": "Semper Altius",
    "redirect_uris": [
        "https://app.semperaltius.edu.mx/callback",
        "https://app.semperaltius.edu.mx/logout"
    ],
    "pkce_required": true,
    "enabled": true
}'
```
**Guardar el `_id` de la respuesta como `CLIENT_ID`**

### 3. Crear Subtenant
```bash
curl --location 'http://localhost:3000/api/admin/subtenants' \
--header 'Content-Type: application/json' \
--data '{
    "tenant_id": "{{TENANT_ID}}",
    "name": "RCSA",
    "enabled": true
}'
```
**Guardar el `_id` de la respuesta como `SUBTENANT_ID`**

### 4. Crear Domain
```bash
curl --location 'http://localhost:3000/api/admin/domains' \
--header 'Content-Type: application/json' \
--data '{
    "host": "pagos.semperaltius.edu.mx",
    "tenant_id": "{{TENANT_ID}}",
    "default_subtenant_id": "{{SUBTENANT_ID}}",
    "client_id": "{{CLIENT_ID}}",
    "enabled": true
}'
```

### 5. Crear Branding
```bash
curl --location 'http://localhost:3000/api/admin/brandings' \
--header 'Content-Type: application/json' \
--data '{
    "scope": "tenant:{{TENANT_ID}}",
    "tenant_id": "{{TENANT_ID}}",
    "subtenant_id": "{{SUBTENANT_ID}}",
    "enabled": true
}'
```

---

## 🔧 Variables de Postman

Crea estas variables en tu colección de Postman:

- `base_url`: `http://localhost:3000/api/admin`
- `TENANT_ID`: (se llena después de crear el tenant)
- `CLIENT_ID`: (se llena después de crear el client)
- `SUBTENANT_ID`: (se llena después de crear el subtenant)

Luego usa `{{base_url}}`, `{{TENANT_ID}}`, etc. en tus requests.

---

## 📝 Notas

1. **ObjectId**: Los IDs son ObjectId de MongoDB (24 caracteres hexadecimales)
2. **x-request-id**: Header opcional para idempotencia
3. **DELETE**: Es soft delete (marca `enabled=false` y `deleted_at`)
4. **Domains**: Usa `host` en lugar de `id` para GET/PATCH/DELETE
5. **Validación**: Todos los campos son validados por `class-validator` en los DTOs

---

## ⚠️ Errores Comunes

- **400 Bad Request**: Campos faltantes o inválidos
- **404 Not Found**: ID/ObjectId inválido o entidad no existe
- **INVALID_OBJECTID**: El ID no es un ObjectId válido (solo para tenants/clients/subtenants/brandings)

