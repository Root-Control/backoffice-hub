# Plan de Refactor: Renombrado Masivo de Nomenclatura

## Estado: ✅ Cambios guardados en commit `5b6b1b9`

## Mapeo de Renombres

### Entidades Principales
- `tenants` → `clients` (entidad top-level del negocio)
- `subtenants` → `tenants` (subdivisión de client)
- `clients` → `applications` (OAuth client con redirect_uris)

### IDs y Referencias
- `subtenant_id` → `tenant_id` (en domains, brandings)
- `tenant_id` (antiguo) → `client_id` (en subtenants, domains)
- `client_id` (antiguo OAuth) → `application_id` (en domains)

## Orden de Ejecución (CRÍTICO para evitar colisiones)

### FASE 1: clients → applications
**Razón:** Evitar colisión cuando renombremos tenants → clients

**Archivos a renombrar:**
- `src/modules/clients/` → `src/modules/applications/`
- Todos los archivos dentro: `clients.*` → `applications.*`
- Clases: `ClientsController` → `ApplicationsController`, etc.

**Referencias a actualizar:**
- `client_id` en domains → `application_id`
- Variables ENV: `ADMIN_CLIENTS_UPSERT_URL` → `ADMIN_APPLICATIONS_UPSERT_URL`
- Rutas HTTP: `/admin/clients` → `/admin/applications`
- Sync service: `syncClient()` → `syncApplication()`
- Lambda client: `upsertClient()` → `upsertApplication()`
- Types: `UpsertClientPayload` → `UpsertApplicationPayload`

### FASE 2: subtenants → tenants
**Razón:** Después de que clients ya sea applications, podemos renombrar subtenants

**Archivos a renombrar:**
- `src/modules/subtenants/` → `src/modules/tenants/` (⚠️ CONFLICTO - necesitamos mover/eliminar el antiguo primero)
- Todos los archivos: `subtenants.*` → `tenants.*`
- Clases: `SubtenantsController` → `TenantsController`, etc.

**Referencias a actualizar:**
- `subtenant_id` → `tenant_id` (en brandings, domains)
- `tenant_id` (en subtenants) → `client_id` (ahora apunta al antiguo tenant)
- Variables ENV: `ADMIN_SUBTENANTS_UPSERT_URL` → `ADMIN_TENANTS_UPSERT_URL`
- Rutas HTTP: `/admin/subtenants` → `/admin/tenants`
- Sync service: `syncSubtenant()` → `syncTenant()`
- Lambda client: `upsertSubtenant()` → `upsertTenant()`
- Types: `UpsertSubtenantPayload` → `UpsertTenantPayload`

**⚠️ PROBLEMA:** Ya existe `src/modules/tenants/` (el antiguo tenant)
**Solución:** 
1. Renombrar `tenants/` → `clients_temp/` temporalmente
2. Renombrar `subtenants/` → `tenants/`
3. Renombrar `clients_temp/` → `clients/`

### FASE 3: tenants (antiguo) → clients
**Razón:** Finalmente renombrar el antiguo tenant a client

**Archivos a renombrar:**
- `src/modules/clients_temp/` → `src/modules/clients/` (después de FASE 2)
- Todos los archivos: `tenants.*` → `clients.*`
- Clases: `TenantsController` → `ClientsController`, etc.

**Referencias a actualizar:**
- `tenant_id` (en subtenants/domains) → `client_id` (ya hecho en FASE 2)
- Variables ENV: `ADMIN_TENANTS_UPSERT_URL` → `ADMIN_CLIENTS_UPSERT_URL`
- Rutas HTTP: `/admin/tenants` → `/admin/clients` (⚠️ CONFLICTO - ya existe en FASE 2)
- Sync service: `syncTenant()` → `syncClient()` (⚠️ CONFLICTO)
- Lambda client: `upsertTenant()` → `upsertClient()` (⚠️ CONFLICTO)
- Types: `UpsertTenantPayload` → `UpsertClientPayload` (⚠️ CONFLICTO)

**⚠️ PROBLEMA:** En FASE 2 ya renombramos subtenants → tenants, así que hay conflictos
**Solución:** El orden correcto debe ser:
1. FASE 1: clients → applications ✅
2. FASE 2: tenants (antiguo) → clients_temp
3. FASE 3: subtenants → tenants
4. FASE 4: clients_temp → clients

## Plan Revisado (Orden Correcto)

### FASE 1: clients → applications
- Renombrar carpeta y archivos
- Actualizar todas las referencias
- Actualizar rutas HTTP
- Actualizar variables ENV
- Actualizar sync service
- Actualizar lambda client
- Actualizar types

### FASE 2: tenants (antiguo) → clients_temp
- Renombrar carpeta temporalmente
- Actualizar referencias internas
- NO actualizar rutas aún (para evitar conflictos)

### FASE 3: subtenants → tenants
- Renombrar carpeta y archivos
- Actualizar `subtenant_id` → `tenant_id`
- Actualizar `tenant_id` (en subtenants) → `client_id`
- Actualizar rutas HTTP
- Actualizar variables ENV
- Actualizar sync service
- Actualizar lambda client
- Actualizar types

### FASE 4: clients_temp → clients
- Renombrar carpeta final
- Actualizar rutas HTTP (ahora seguro)
- Actualizar variables ENV
- Actualizar sync service
- Actualizar lambda client
- Actualizar types

## Archivos Críticos a Actualizar

### Core
- `src/app.module.ts` - imports de módulos
- `src/shared/sync/sync.service.ts` - métodos sync*
- `src/shared/hub-lambda-client/hub-lambda-client.ts` - métodos upsert*
- `src/shared/hub-lambda-client/types.ts` - interfaces
- `src/shared/utils/request-id.ts` - EntityType enum
- `src/shared/sync/outbox.service.ts` - callLambda switch

### Módulos
- Cada módulo: controller, service, module, schemas, dtos
- `domains` - referencias a tenant_id, subtenant_id, client_id
- `brandings` - referencias a subtenant_id

### Scripts y Docs
- `scripts/seed-full-flow.sh`
- `docs/*.md`
- Variables ENV en documentación

## Checklist de Verificación

- [ ] Compilación exitosa (`npm run build`)
- [ ] No quedan referencias al vocabulario viejo
- [ ] Rutas HTTP correctas
- [ ] Variables ENV actualizadas
- [ ] Tests pasan (si existen)
- [ ] Documentación actualizada

