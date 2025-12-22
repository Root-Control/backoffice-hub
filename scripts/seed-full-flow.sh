#!/bin/bash

# Script para crear un flujo completo: Tenant -> Client -> Subtenant -> Domain -> Branding
# Uso: ./scripts/seed-full-flow.sh

set -e

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuración
BASE_URL="${BASE_URL:-http://localhost:3000/api}"
API_BASE="${BASE_URL}/admin"

echo -e "${BLUE}🚀 Iniciando flujo completo de creación...${NC}\n"

# ============================================
# 1. CREAR TENANT
# ============================================
echo -e "${YELLOW}📝 Paso 1: Creando Tenant...${NC}"

TENANT_RESPONSE=$(curl -s -X POST "${API_BASE}/tenants" \
  -H "Content-Type: application/json" \
  -H "x-request-id: seed-tenant-$(date +%s)" \
  -d '{
    "name": "Regnum Christi",
    "password_check_endpoint": "https://auth.regnumchristi.org/api/check-password",
    "user_migrated_endpoint": "https://auth.regnumchristi.org/api/user-migrated",
    "slug": "regnum-christi",
    "enabled": true
  }')

# Extraer tenant_id (ObjectId)
TENANT_ID=$(echo "$TENANT_RESPONSE" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$TENANT_ID" ]; then
  echo -e "${RED}❌ Error: No se pudo crear el tenant${NC}"
  echo "$TENANT_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Tenant creado: ${TENANT_ID}${NC}"
echo "   Response: $(echo "$TENANT_RESPONSE" | head -c 200)..."
echo ""

# ============================================
# 2. CREAR CLIENT
# ============================================
echo -e "${YELLOW}📝 Paso 2: Creando Client...${NC}"

CLIENT_RESPONSE=$(curl -s -X POST "${API_BASE}/clients" \
  -H "Content-Type: application/json" \
  -H "x-request-id: seed-client-$(date +%s)" \
  -d '{
    "name": "Semper Altius",
    "redirect_uris": [
      "https://app.semperaltius.edu.mx/callback",
      "https://app.semperaltius.edu.mx/logout"
    ],
    "pkce_required": true,
    "enabled": true
  }')

CLIENT_ID=$(echo "$CLIENT_RESPONSE" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$CLIENT_ID" ]; then
  echo -e "${RED}❌ Error: No se pudo crear el client${NC}"
  echo "$CLIENT_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Client creado: ${CLIENT_ID}${NC}"
echo "   Response: $(echo "$CLIENT_RESPONSE" | head -c 200)..."
echo ""

# ============================================
# 3. CREAR SUBTENANT
# ============================================
echo -e "${YELLOW}📝 Paso 3: Creando Subtenant...${NC}"

SUBTENANT_RESPONSE=$(curl -s -X POST "${API_BASE}/subtenants" \
  -H "Content-Type: application/json" \
  -H "x-request-id: seed-subtenant-$(date +%s)" \
  -d "{
    \"tenant_id\": \"${TENANT_ID}\",
    \"name\": \"RCSA\",
    \"enabled\": true
  }")

SUBTENANT_ID=$(echo "$SUBTENANT_RESPONSE" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$SUBTENANT_ID" ]; then
  echo -e "${RED}❌ Error: No se pudo crear el subtenant${NC}"
  echo "$SUBTENANT_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Subtenant creado: ${SUBTENANT_ID}${NC}"
echo "   Response: $(echo "$SUBTENANT_RESPONSE" | head -c 200)..."
echo ""

# ============================================
# 4. CREAR DOMAIN
# ============================================
echo -e "${YELLOW}📝 Paso 4: Creando Domain...${NC}"

DOMAIN_RESPONSE=$(curl -s -X POST "${API_BASE}/domains" \
  -H "Content-Type: application/json" \
  -H "x-request-id: seed-domain-$(date +%s)" \
  -d "{
    \"host\": \"pagos.semperaltius.edu.mx\",
    \"tenant_id\": \"${TENANT_ID}\",
    \"default_subtenant_id\": \"${SUBTENANT_ID}\",
    \"client_id\": \"${CLIENT_ID}\",
    \"enabled\": true
  }")

DOMAIN_HOST="pagos.semperaltius.edu.mx"
DOMAIN_ID=$(echo "$DOMAIN_RESPONSE" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$DOMAIN_ID" ]; then
  echo -e "${RED}❌ Error: No se pudo crear el domain${NC}"
  echo "$DOMAIN_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Domain creado: ${DOMAIN_HOST} (${DOMAIN_ID})${NC}"
echo "   Response: $(echo "$DOMAIN_RESPONSE" | head -c 200)..."
echo ""

# ============================================
# 5. CREAR BRANDING
# ============================================
echo -e "${YELLOW}📝 Paso 5: Creando Branding...${NC}"

BRANDING_RESPONSE=$(curl -s -X POST "${API_BASE}/brandings" \
  -H "Content-Type: application/json" \
  -H "x-request-id: seed-branding-$(date +%s)" \
  -d "{
    \"scope\": \"tenant:${TENANT_ID}\",
    \"tenant_id\": \"${TENANT_ID}\",
    \"subtenant_id\": \"${SUBTENANT_ID}\",
    \"enabled\": true
  }")

BRANDING_ID=$(echo "$BRANDING_RESPONSE" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$BRANDING_ID" ]; then
  echo -e "${RED}❌ Error: No se pudo crear el branding${NC}"
  echo "$BRANDING_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Branding creado: ${BRANDING_ID}${NC}"
echo "   Response: $(echo "$BRANDING_RESPONSE" | head -c 200)..."
echo ""

# ============================================
# RESUMEN FINAL
# ============================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 RESUMEN DEL FLUJO COMPLETO${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}✅ TENANT${NC}"
echo "   ID: ${TENANT_ID}"
echo "   Name: Regnum Christi"
echo "   Slug: regnum-christi"
echo "   Password Check Endpoint: https://auth.regnumchristi.org/api/check-password"
echo "   User Migrated Endpoint: https://auth.regnumchristi.org/api/user-migrated"
echo ""
echo -e "${GREEN}✅ CLIENT${NC}"
echo "   ID: ${CLIENT_ID}"
echo "   Name: Semper Altius"
echo "   Redirect URIs: https://app.semperaltius.edu.mx/callback, https://app.semperaltius.edu.mx/logout"
echo "   PKCE Required: true"
echo ""
echo -e "${GREEN}✅ SUBTENANT${NC}"
echo "   ID: ${SUBTENANT_ID}"
echo "   Tenant ID: ${TENANT_ID}"
echo "   Name: RCSA"
echo ""
echo -e "${GREEN}✅ DOMAIN${NC}"
echo "   ID: ${DOMAIN_ID}"
echo "   Host: ${DOMAIN_HOST}"
echo "   Tenant ID: ${TENANT_ID}"
echo "   Default Subtenant ID: ${SUBTENANT_ID}"
echo "   Client ID: ${CLIENT_ID}"
echo ""
echo -e "${GREEN}✅ BRANDING${NC}"
echo "   ID: ${BRANDING_ID}"
echo "   Scope: tenant:${TENANT_ID}"
echo "   Tenant ID: ${TENANT_ID}"
echo "   Subtenant ID: ${SUBTENANT_ID}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}🔍 Verificar en MongoDB:${NC}"
echo "   db.tenants.findOne({_id: ObjectId('${TENANT_ID}')})"
echo "   db.clients.findOne({_id: ObjectId('${CLIENT_ID}')})"
echo "   db.subtenants.findOne({_id: ObjectId('${SUBTENANT_ID}')})"
echo "   db.domains.findOne({host: '${DOMAIN_HOST}'})"
echo "   db.brandings.findOne({_id: ObjectId('${BRANDING_ID}')})"
echo ""
echo -e "${YELLOW}🔍 Verificar vía API:${NC}"
echo "   GET ${API_BASE}/tenants/${TENANT_ID}"
echo "   GET ${API_BASE}/clients/${CLIENT_ID}"
echo "   GET ${API_BASE}/subtenants/${SUBTENANT_ID}"
echo "   GET ${API_BASE}/domains/${DOMAIN_HOST}"
echo "   GET ${API_BASE}/brandings/${BRANDING_ID}"
echo ""
echo -e "${GREEN}✨ Flujo completo ejecutado exitosamente!${NC}"

