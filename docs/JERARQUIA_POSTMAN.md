# Jerarquía de Creación y Endpoints POST

## Orden de Creación (Jerarquía de Dependencias)

```
1. Tenants (no depende de nada)
   ↓
2. Clients (no depende de nada, pero puede ser usado por domains)
   ↓
3. Subtenants (requiere tenant_id)
   ↓
4. Domains (requiere tenant_id, opcionalmente subtenant_id y client_id)
   ↓
5. Brandings (opcionalmente tenant_id y subtenant_id)
```

## Endpoints POST

### 1. POST /api/admin/tenants

**Primero crear tenants** (no tiene dependencias)

```bash
POST http://localhost:3000/api/admin/tenants
Content-Type: application/json
x-request-id: (opcional)

{
  "id": "regnum-christi",        // opcional, si no viene se genera UUID
  "name": "Regnum Christi",
  "enabled": true,                // opcional, default: true
  "password_check_url": "https://auth.regnumchristi.org/check"  // opcional
}
```

**Ejemplo mínimo:**
```json
{
  "name": "Regnum Christi"
}
```

---

### 2. POST /api/admin/clients

**Segundo crear clients** (no tiene dependencias, pero puede ser usado por domains)

```bash
POST http://localhost:3000/api/admin/clients
Content-Type: application/json
x-request-id: (opcional)

{
  "id": "semperaltius",           // opcional, si no viene se genera UUID
  "name": "Semper Altius",
  "enabled": true,                // opcional, default: true
  "redirect_uris": [
    "https://app.semperaltius.edu.mx/callback",
    "https://app.semperaltius.edu.mx/logout"
  ],
  "pkce_required": true          // opcional
}
```

**Ejemplo mínimo:**
```json
{
  "name": "Semper Altius",
  "redirect_uris": ["https://app.semperaltius.edu.mx/callback"]
}
```

---

### 3. POST /api/admin/subtenants

**Tercero crear subtenants** (requiere tenant_id existente)

```bash
POST http://localhost:3000/api/admin/subtenants
Content-Type: application/json
x-request-id: (opcional)

{
  "id": "rcsa",                   // opcional, si no viene se genera UUID
  "tenant_id": "regnum-christi",  // REQUERIDO - debe existir
  "name": "RCSA",
  "enabled": true                 // opcional, default: true
}
```

**Ejemplo mínimo:**
```json
{
  "tenant_id": "regnum-christi",
  "name": "RCSA"
}
```

---

### 4. POST /api/admin/domains

**Cuarto crear domains** (requiere tenant_id, opcionalmente subtenant_id y client_id)

```bash
POST http://localhost:3000/api/admin/domains
Content-Type: application/json
x-request-id: (opcional)

{
  "host": "pagos.semperaltius.edu.mx",  // REQUERIDO - usado como _id
  "tenant_id": "regnum-christi",        // REQUERIDO - debe existir
  "default_subtenant_id": "rcsa",        // opcional - debe existir si se envía
  "client_id": "semperaltius",           // opcional - debe existir si se envía
  "enabled": true                        // opcional, default: true
}
```

**Ejemplo mínimo:**
```json
{
  "host": "pagos.semperaltius.edu.mx",
  "tenant_id": "regnum-christi"
}
```

---

### 5. POST /api/admin/brandings

**Quinto crear brandings** (opcionalmente tenant_id y subtenant_id)

```bash
POST http://localhost:3000/api/admin/brandings
Content-Type: application/json
x-request-id: (opcional)

{
  "id": "branding_rcsa_001",      // opcional, si no viene se genera UUID
  "scope": "tenant:regnum-christi",
  "tenant_id": "regnum-christi",  // opcional - debe existir si se envía
  "subtenant_id": "rcsa",         // opcional - debe existir si se envía
  "enabled": true                 // opcional, default: true
}
```

**Ejemplo mínimo:**
```json
{
  "scope": "tenant:regnum-christi"
}
```

---

## Orden Recomendado en Postman

### Collection: Backoffice CRUD

#### 1. Tenants
- `POST Create Tenant`
- `GET List Tenants`
- `GET Get Tenant by ID`
- `PATCH Update Tenant`
- `DELETE Soft Delete Tenant`

#### 2. Clients
- `POST Create Client`
- `GET List Clients`
- `GET Get Client by ID`
- `PATCH Update Client`
- `DELETE Soft Delete Client`

#### 3. Subtenants
- `POST Create Subtenant`
- `GET List Subtenants`
- `GET Get Subtenant by ID`
- `PATCH Update Subtenant`
- `DELETE Soft Delete Subtenant`

#### 4. Domains
- `POST Create Domain`
- `GET List Domains`
- `GET Get Domain by Host`
- `PATCH Update Domain`
- `DELETE Soft Delete Domain`

#### 5. Brandings
- `POST Create Branding`
- `GET List Brandings`
- `GET Get Branding by ID`
- `PATCH Update Branding`
- `DELETE Soft Delete Branding`

---

## Ejemplo Completo de Flujo

### Paso 1: Crear Tenant
```bash
POST /api/admin/tenants
{
  "id": "regnum-christi",
  "name": "Regnum Christi",
  "enabled": true
}
```
→ Respuesta: `{ "_id": "regnum-christi", ... }`

### Paso 2: Crear Client
```bash
POST /api/admin/clients
{
  "id": "semperaltius",
  "name": "Semper Altius",
  "redirect_uris": ["https://app.semperaltius.edu.mx/callback"]
}
```
→ Respuesta: `{ "_id": "semperaltius", ... }`

### Paso 3: Crear Subtenant
```bash
POST /api/admin/subtenants
{
  "id": "rcsa",
  "tenant_id": "regnum-christi",  // ← del Paso 1
  "name": "RCSA"
}
```
→ Respuesta: `{ "_id": "rcsa", ... }`

### Paso 4: Crear Domain
```bash
POST /api/admin/domains
{
  "host": "pagos.semperaltius.edu.mx",
  "tenant_id": "regnum-christi",        // ← del Paso 1
  "default_subtenant_id": "rcsa",        // ← del Paso 3
  "client_id": "semperaltius"            // ← del Paso 2
}
```
→ Respuesta: `{ "_id": "pagos.semperaltius.edu.mx", ... }`

### Paso 5: Crear Branding
```bash
POST /api/admin/brandings
{
  "id": "branding_rcsa_001",
  "scope": "tenant:regnum-christi",
  "tenant_id": "regnum-christi",         // ← del Paso 1
  "subtenant_id": "rcsa"                 // ← del Paso 3
}
```
→ Respuesta: `{ "_id": "branding_rcsa_001", ... }`

---

## Notas Importantes

1. **Tenants y Clients** pueden crearse en cualquier orden (no tienen dependencias entre sí)
2. **Subtenants** requiere que el `tenant_id` exista
3. **Domains** requiere que el `tenant_id` exista; `subtenant_id` y `client_id` son opcionales pero deben existir si se envían
4. **Brandings** no requiere nada, pero `tenant_id` y `subtenant_id` deben existir si se envían
5. Si envías un `id` personalizado y ya existe, recibirás **409 Conflict**
6. Si no envías `id`, se genera automáticamente un UUID

