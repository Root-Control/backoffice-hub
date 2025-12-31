# CURLs para Postman - Orden Jerárquico

Base URL: `http://localhost:3000/api/admin`

**Orden de creación:** Tenants → Clients → Subtenants → Domains → Brandings

---

## 1️⃣ TENANTS (Sin dependencias)

### 1.1 POST - Create Tenant

```bash
curl --location 'http://localhost:3000/api/admin/tenants' \
--header 'Content-Type: application/json' \
--header 'x-request-id: tenant-create-001' \
--data '{
    "name": "Regnum Christi",
    "password_check_endpoint": "http://localhost:4000/api/internal/password-check",
    "user_migrated_endpoint": "http://localhost:4000/api/internal/mark-user-migrated",
    "slug": "regnum-christi",
    "logo": "https://example.com/logos/regnum-christi.png",
    "enabled": true
}'
```

**💾 Guardar el `_id` de la respuesta como `TENANT_ID`**

### 1.2 GET - List All Tenants

```bash
curl --location 'http://localhost:3000/api/admin/tenants'
```

### 1.3 GET - Get Tenant by ID

```bash
curl --location 'http://localhost:3000/api/admin/tenants/507f1f77bcf86cd799439011'
```

### 1.4 PATCH - Update Tenant

```bash
curl --location --request PATCH 'http://localhost:3000/api/admin/tenants/507f1f77bcf86cd799439011' \
--header 'Content-Type: application/json' \
--header 'x-request-id: tenant-update-001' \
--data '{
    "name": "Regnum Christi Updated",
    "slug": "regnum-christi-updated",
    "logo": "https://example.com/logos/regnum-christi-updated.png",
    "enabled": false
}'
```

### 1.5 DELETE - Soft Delete Tenant

```bash
curl --location --request DELETE 'http://localhost:3000/api/admin/tenants/507f1f77bcf86cd799439011' \
--header 'x-request-id: tenant-delete-001'
```

---

## 2️⃣ CLIENTS (Sin dependencias, pero usado por Domains)

### 2.1 POST - Create Client

```bash
curl --location 'http://localhost:3000/api/admin/clients' \
--header 'Content-Type: application/json' \
--header 'x-request-id: client-create-001' \
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

**💾 Guardar el `_id` de la respuesta como `CLIENT_ID`**

### 2.2 GET - List All Clients

```bash
curl --location 'http://localhost:3000/api/admin/clients'
```

### 2.3 GET - Get Client by ID

```bash
curl --location 'http://localhost:3000/api/admin/clients/507f1f77bcf86cd799439012'
```

### 2.4 PATCH - Update Client

```bash
curl --location --request PATCH 'http://localhost:3000/api/admin/clients/507f1f77bcf86cd799439012' \
--header 'Content-Type: application/json' \
--header 'x-request-id: client-update-001' \
--data '{
    "name": "Semper Altius Updated",
    "pkce_required": false,
    "redirect_uris": [
        "https://app.semperaltius.edu.mx/callback"
    ]
}'
```

### 2.5 DELETE - Soft Delete Client

```bash
curl --location --request DELETE 'http://localhost:3000/api/admin/clients/507f1f77bcf86cd799439012' \
--header 'x-request-id: client-delete-001'
```

---

## 3️⃣ SUBTENANTS (Depende de Tenant)

### 3.1 POST - Create Subtenant

```bash
curl --location 'http://localhost:3000/api/admin/subtenants' \
--header 'Content-Type: application/json' \
--header 'x-request-id: subtenant-create-001' \
--data '{
    "tenant_id": "507f1f77bcf86cd799439011",
    "name": "RCSA",
    "logo": "https://example.com/logos/rcsa.png",
    "enabled": true
}'
```

**💾 Usar `TENANT_ID` del paso 1.1. Guardar el `_id` de la respuesta como `SUBTENANT_ID`**

### 3.2 GET - List All Subtenants

```bash
curl --location 'http://localhost:3000/api/admin/subtenants'
```

### 3.3 GET - Get Subtenant by ID

```bash
curl --location 'http://localhost:3000/api/admin/subtenants/507f1f77bcf86cd799439013'
```

### 3.4 PATCH - Update Subtenant

```bash
curl --location --request PATCH 'http://localhost:3000/api/admin/subtenants/507f1f77bcf86cd799439013' \
--header 'Content-Type: application/json' \
--header 'x-request-id: subtenant-update-001' \
--data '{
    "name": "RCSA Updated",
    "logo": "https://example.com/logos/rcsa-updated.png",
    "enabled": false
}'
```

### 3.5 DELETE - Soft Delete Subtenant

```bash
curl --location --request DELETE 'http://localhost:3000/api/admin/subtenants/507f1f77bcf86cd799439013' \
--header 'x-request-id: subtenant-delete-001'
```

---

## 4️⃣ DOMAINS (Depende de Tenant, opcionalmente Subtenant y Client)

### 4.1 POST - Create Domain

```bash
curl --location 'http://localhost:3000/api/admin/domains' \
--header 'Content-Type: application/json' \
--header 'x-request-id: domain-create-001' \
--data '{
    "host": "pagos.semperaltius.edu.mx",
    "tenant_id": "507f1f77bcf86cd799439011",
    "default_subtenant_id": "507f1f77bcf86cd799439013",
    "client_id": "507f1f77bcf86cd799439012",
    "enabled": true
}'
```

**💾 Usar `TENANT_ID` (paso 1.1), `SUBTENANT_ID` (paso 3.1), `CLIENT_ID` (paso 2.1). Guardar el `_id` de la respuesta como `DOMAIN_ID`**

### 4.2 GET - List All Domains

```bash
curl --location 'http://localhost:3000/api/admin/domains'
```

### 4.3 GET - Get Domain by ID

```bash
curl --location 'http://localhost:3000/api/admin/domains/507f1f77bcf86cd799439014'
```

### 4.4 PATCH - Update Domain

```bash
curl --location --request PATCH 'http://localhost:3000/api/admin/domains/507f1f77bcf86cd799439014' \
--header 'Content-Type: application/json' \
--header 'x-request-id: domain-update-001' \
--data '{
    "default_subtenant_id": "507f1f77bcf86cd799439015",
    "enabled": false
}'
```

### 4.5 DELETE - Soft Delete Domain

```bash
curl --location --request DELETE 'http://localhost:3000/api/admin/domains/507f1f77bcf86cd799439014' \
--header 'x-request-id: domain-delete-001'
```

---

## 5️⃣ BRANDINGS (Requiere Subtenant - 1 branding por subtenant)

### 5.1 POST - Create Branding

```bash
curl --location 'http://localhost:3000/api/admin/brandings' \
--header 'Content-Type: application/json' \
--header 'x-request-id: branding-create-001' \
--data '{
    "subtenant_id": "507f1f77bcf86cd799439013",
    "enabled": true
}'
```

**💾 Usar `SUBTENANT_ID` (paso 3.1)**

**Nota**: Solo puede existir 1 branding por subtenant. Si intentas crear otro, recibirás `409 Conflict` con mensaje `BRANDING_ALREADY_EXISTS_FOR_SUBTENANT`.

### 5.2 GET - List All Brandings

```bash
curl --location 'http://localhost:3000/api/admin/brandings'
```

### 5.3 GET - Get Branding by ID

```bash
curl --location 'http://localhost:3000/api/admin/brandings/507f1f77bcf86cd799439015'
```

### 5.4 PATCH - Update Branding

```bash
curl --location --request PATCH 'http://localhost:3000/api/admin/brandings/507f1f77bcf86cd799439015' \
--header 'Content-Type: application/json' \
--header 'x-request-id: branding-update-001' \
--data '{
    "enabled": false
}'
```

**Nota**: Solo se puede actualizar `enabled`. `subtenant_id` no se puede cambiar.

### 5.5 DELETE - Soft Delete Branding

```bash
curl --location --request DELETE 'http://localhost:3000/api/admin/brandings/507f1f77bcf86cd799439015' \
--header 'x-request-id: branding-delete-001'
```

---

## 📋 FLUJO COMPLETO SECUENCIAL

### Paso 1: Crear Tenant (1.1)

```bash
curl --location 'http://localhost:3000/api/admin/tenants' \
--header 'Content-Type: application/json' \
--data '{
    "name": "Regnum Christi",
    "password_check_endpoint": "http://localhost:4000/api/internal/password-check",
    "user_migrated_endpoint": "http://localhost:4000/api/internal/mark-user-migrated",
    "slug": "regnum-christi",
    "logo": "https://example.com/logos/regnum-christi.png",
    "enabled": true
}'
```

**→ Guardar `_id` como `TENANT_ID`**

### Paso 2: Crear Client (2.1)

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

**→ Guardar `_id` como `CLIENT_ID`**

### Paso 3: Crear Subtenant (3.1)

```bash
curl --location 'http://localhost:3000/api/admin/subtenants' \
--header 'Content-Type: application/json' \
--data '{
    "tenant_id": "694a1ed0a5c76e653ababd10",
    "name": "RCSA",
    "logo": "https://example.com/logos/rcsa.png",
    "enabled": true
}'
```

**→ Usar `TENANT_ID` del Paso 1. Guardar `_id` como `SUBTENANT_ID`**

### Paso 4: Crear Domain (4.1)

```bash
curl --location 'http://localhost:3000/api/admin/domains' \
--header 'Content-Type: application/json' \
--data '{
    "host": "pagos.semperaltius.edu.mx",
    "tenant_id": "694a1ed0a5c76e653ababd10",
    "default_subtenant_id": "694a1f02a5c76e653ababd1a",
    "client_id": "694a1ee6a5c76e653ababd14",
    "enabled": true
}'
```

**→ Usar `TENANT_ID` (Paso 1), `SUBTENANT_ID` (Paso 3), `CLIENT_ID` (Paso 2). Guardar `_id` como `DOMAIN_ID`**

### Paso 5: Crear Branding (5.1)

```bash
curl --location 'http://localhost:3000/api/admin/brandings' \
--header 'Content-Type: application/json' \
--data '{
    "subtenant_id": "694a1f02a5c76e653ababd1a",
    "enabled": true
}'
```

**→ Usar `SUBTENANT_ID` (Paso 3). Solo puede existir 1 branding por subtenant (409 si ya existe)**

---

## 🔗 Diagrama de Dependencias

```
1. TENANT (sin dependencias)
   ↓
2. CLIENT (sin dependencias)
   ↓
3. SUBTENANT (requiere: tenant_id)
   ↓
4. DOMAIN (requiere: tenant_id, opcional: subtenant_id, client_id)
   ↓
5. BRANDING (requiere: subtenant_id) - 1 branding por subtenant
```

---

## 🔧 Variables de Postman

Crea estas variables en tu colección:

| Variable       | Valor                             | Se llena en |
| -------------- | --------------------------------- | ----------- |
| `base_url`     | `http://localhost:3000/api/admin` | -           |
| `TENANT_ID`    | (vacío inicialmente)              | Paso 1.1    |
| `CLIENT_ID`    | (vacío inicialmente)              | Paso 2.1    |
| `SUBTENANT_ID` | (vacío inicialmente)              | Paso 3.1    |
| `DOMAIN_ID`    | (vacío inicialmente)              | Paso 4.1    |

Luego usa `{{base_url}}`, `{{TENANT_ID}}`, etc. en tus requests.

---

## 📝 Notas Importantes

1. **Orden obligatorio**: Debes crear Tenant y Client antes de Subtenant y Domain
2. **ObjectId**: Los IDs son ObjectId de MongoDB (24 caracteres hex)
3. **Domains**: Usa `id` (ObjectId) igual que las demás entidades
4. **x-request-id**: Header opcional para idempotencia
5. **DELETE**: Es soft delete (marca `enabled=false` y `deleted_at`)

---

## ⚠️ Errores Comunes

- **400 Bad Request**: Campos faltantes o inválidos
- **404 Not Found**: ID/ObjectId inválido o entidad no existe
- **INVALID_OBJECTID**: El ID no es un ObjectId válido (aplica a todas las entidades)
- **409 Conflict**:
  - Intentar crear un domain con un `host` que ya existe
  - Intentar crear un branding para un `subtenant_id` que ya tiene branding (solo 1 branding por subtenant)

---

## 🤖 Script Automatizado - Flujo Completo

### Script Bash: `scripts/seed-full-flow.sh`

Script que automatiza todo el flujo de creación, extrayendo automáticamente los IDs de cada respuesta para usarlos en los siguientes pasos.

#### Uso

```bash
# Ejecutar con URL por defecto (http://localhost:3000/api)
./scripts/seed-full-flow.sh

# O con URL personalizada
BASE_URL=http://localhost:3000/api ./scripts/seed-full-flow.sh
```

#### Requisitos

- El servidor NestJS debe estar corriendo
- MongoDB debe estar disponible
- `curl` debe estar instalado
- `jq` es opcional (mejora la extracción de IDs, pero no es requerido)

#### Lo que hace el script

1. **Crea Tenant** → Extrae `TENANT_ID` de la respuesta
2. **Crea Client** → Extrae `CLIENT_ID` de la respuesta
3. **Crea Subtenant** → Usa `TENANT_ID` del paso 1, extrae `SUBTENANT_ID`
4. **Crea Domain** → Usa `TENANT_ID`, `SUBTENANT_ID`, `CLIENT_ID`, extrae `DOMAIN_ID`
5. **Crea Branding** → Usa `SUBTENANT_ID`, extrae `BRANDING_ID` (solo 1 branding por subtenant)
6. **Muestra resumen completo** con todos los IDs y comandos para verificar

#### Ejemplo de Output

```
🚀 Iniciando flujo completo de creación...
📍 Base URL: http://localhost:3000/api/admin

📝 Paso 1: Creando Tenant...
✅ Tenant creado: 507f1f77bcf86cd799439011

📝 Paso 2: Creando Client...
✅ Client creado: 507f1f77bcf86cd799439012

📝 Paso 3: Creando Subtenant...
✅ Subtenant creado: 507f1f77bcf86cd799439013

📝 Paso 4: Creando Domain...
✅ Domain creado: pagos.semperaltius.edu.mx (507f1f77bcf86cd799439014)

📝 Paso 5: Creando Branding...
✅ Branding creado: 507f1f77bcf86cd799439015

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 RESUMEN DEL FLUJO COMPLETO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ TENANT
   ID: 507f1f77bcf86cd799439011
   Name: Regnum Christi
   Slug: regnum-christi
   Password Check Endpoint: http://localhost:4000/api/internal/password-check
   User Migrated Endpoint: http://localhost:4000/api/internal/mark-user-migrated

✅ CLIENT
   ID: 507f1f77bcf86cd799439012
   Name: Semper Altius
   Redirect URIs: https://app.semperaltius.edu.mx/callback, https://app.semperaltius.edu.mx/logout
   PKCE Required: true

✅ SUBTENANT
   ID: 507f1f77bcf86cd799439013
   Tenant ID: 507f1f77bcf86cd799439011
   Name: RCSA

✅ DOMAIN
   ID: 507f1f77bcf86cd799439014
   Host: pagos.semperaltius.edu.mx
   Tenant ID: 507f1f77bcf86cd799439011
   Default Subtenant ID: 507f1f77bcf86cd799439013
   Client ID: 507f1f77bcf86cd799439012

✅ BRANDING
   ID: 507f1f77bcf86cd799439015
   Scope: tenant:507f1f77bcf86cd799439011
   Tenant ID: 507f1f77bcf86cd799439011
   Subtenant ID: 507f1f77bcf86cd799439013

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 Verificar en MongoDB:
   db.tenants.findOne({_id: ObjectId('507f1f77bcf86cd799439011')})
   db.clients.findOne({_id: ObjectId('507f1f77bcf86cd799439012')})
   db.subtenants.findOne({_id: ObjectId('507f1f77bcf86cd799439013')})
   db.domains.findOne({_id: ObjectId('507f1f77bcf86cd799439014')})
   db.brandings.findOne({_id: ObjectId('507f1f77bcf86cd799439015')})

🔍 Verificar vía API:
   GET http://localhost:3000/api/admin/tenants/507f1f77bcf86cd799439011
   GET http://localhost:3000/api/admin/clients/507f1f77bcf86cd799439012
   GET http://localhost:3000/api/admin/subtenants/507f1f77bcf86cd799439013
   GET http://localhost:3000/api/admin/domains/507f1f77bcf86cd799439014
   GET http://localhost:3000/api/admin/brandings/507f1f77bcf86cd799439015

✨ Flujo completo ejecutado exitosamente!
```

#### Características

- ✅ **Extracción automática de IDs**: Usa `jq` si está disponible, sino `grep`
- ✅ **Manejo de errores**: Se detiene si algún paso falla
- ✅ **Colores en consola**: Verde para éxito, amarillo para progreso, azul para resumen
- ✅ **Comandos listos**: Incluye comandos MongoDB y URLs API para verificar
- ✅ **Configurable**: Puedes cambiar la URL base con variable de entorno

#### Ubicación

El script está en: `scripts/seed-full-flow.sh`

#### Notas

- El script usa `set -e` para detenerse en caso de error
- Los IDs se extraen automáticamente de las respuestas JSON
- Si un paso falla, el script muestra el error y se detiene
- Todos los valores están hardcodeados en el script (puedes modificarlos según necesites)
