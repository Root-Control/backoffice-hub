# Smoke Tests - Backoffice CRUD + Sync

## Setup

```bash
# 1. Start MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:latest

# 2. Create .env from .env.example
cp .env.example .env

# 3. Install and build
npm install
npm run build

# 4. Start server
npm run start:dev
```

## Test 1: Create Tenant

```bash
curl -X POST http://localhost:3000/api/admin/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Regnum Christi",
    "enabled": true,
    "password_check_url": "https://auth.regnumchristi.org/check"
  }' | jq '.'
```

**Expected**: Tenant created with `_id` (UUID if not provided), `last_sync` populated.

**Verify in MongoDB**:
```javascript
use identity_backoffice
db.tenants.findOne({ name: "Regnum Christi" })
// Check: _id, name, enabled, last_sync.ok, last_sync.sync_id
```

## Test 2: Update Tenant

```bash
# Get the tenant ID from previous response
TENANT_ID="<id-from-create>"

curl -X PATCH http://localhost:3000/api/admin/tenants/$TENANT_ID \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Regnum Christi Updated"
  }' | jq '.'
```

**Expected**: Tenant updated, `last_sync.updated_at` refreshed.

## Test 3: Soft Delete Tenant

```bash
curl -X DELETE http://localhost:3000/api/admin/tenants/$TENANT_ID \
  -H "Content-Type: application/json" | jq '.'
```

**Expected**: HTTP 204, tenant has `enabled=false` and `deleted_at` set.

**Verify in MongoDB**:
```javascript
db.tenants.findOne({ _id: "<tenant-id>" })
// Check: enabled: false, deleted_at: ISODate(...)
```

## Test 4: Find All Tenants

```bash
curl http://localhost:3000/api/admin/tenants | jq '.'
```

**Expected**: List of tenants (excluding soft-deleted ones).

## Test 5: Find One Tenant

```bash
curl http://localhost:3000/api/admin/tenants/$TENANT_ID | jq '.'
```

**Expected**: Single tenant document.

## Test 6: Lambda Down Scenario

1. Stop Stage 1 lambdas (or use invalid URL in .env)
2. Create a tenant:

```bash
curl -X POST http://localhost:3000/api/admin/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Tenant",
    "enabled": true
  }' | jq '.'
```

**Expected**: 
- Tenant created successfully (CRUD doesn't fail)
- `last_sync.ok = false`
- `last_sync.error_code` and `last_sync.error_message` populated
- Outbox entry created

**Verify in MongoDB**:
```javascript
// Check tenant
db.tenants.findOne({ name: "Test Tenant" })
// last_sync.ok: false, last_sync.error_code: "CONNECTION_ERROR" or similar

// Check outbox
db.sync_outbox.find({ entity_type: "tenant", status: "PENDING" })
// Should have entry with status: "PENDING" or "FAILED"
```

## Test 7: Outbox Retry

```bash
# In Node.js console or create a script
# Call OutboxService.processPending() to retry failed syncs
```

**Expected**: Outbox items with `status: "PENDING"` or `"FAILED"` are retried.

## Test 8: Create with Custom ID

```bash
curl -X POST http://localhost:3000/api/admin/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "id": "regnum-christi",
    "name": "Regnum Christi",
    "enabled": true
  }' | jq '.'
```

**Expected**: Tenant created with `_id: "regnum-christi"`.

## Test 9: Create with Duplicate ID (409 Conflict)

```bash
curl -X POST http://localhost:3000/api/admin/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "id": "regnum-christi",
    "name": "Duplicate",
    "enabled": true
  }' | jq '.'
```

**Expected**: HTTP 409 Conflict.

## Test 10: Update Non-Existent (404)

```bash
curl -X PATCH http://localhost:3000/api/admin/tenants/non-existent \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test"
  }' | jq '.'
```

**Expected**: HTTP 404 Not Found.

## Summary

- ✅ CRUD operations work
- ✅ Sync to lambda happens after create/update/delete
- ✅ `last_sync` is updated in document
- ✅ If lambda fails, outbox is populated
- ✅ Soft delete works (enabled=false, deleted_at set)
- ✅ Custom IDs work
- ✅ Duplicate IDs return 409
- ✅ Non-existent entities return 404

