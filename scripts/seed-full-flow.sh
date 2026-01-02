#!/bin/bash

# Script para crear un flujo completo: Client -> Application -> Tenant -> Domain -> Branding
# Uso: ./scripts/seed-full-flow.sh
# O con URL personalizada: BASE_URL=http://localhost:3000/api ./scripts/seed-full-flow.sh

set -e

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuración
BASE_URL="${BASE_URL:-http://localhost:3000/api}"
API_BASE="${BASE_URL}/admin"

echo -e "${BLUE}🚀 Iniciando flujo completo de creación...${NC}"
echo -e "${BLUE}📍 Base URL: ${API_BASE}${NC}\n"

# ============================================
# 1. CREAR CLIENT (antes era Tenant)
# ============================================
echo -e "${YELLOW}📝 Paso 1: Creando Client...${NC}"

CLIENT_RESPONSE=$(curl -s -X POST "${API_BASE}/clients" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Regnum Christi",
    "password_check_endpoint": "http://localhost:4000/api/internal/password-check",
    "user_migrated_endpoint": "http://localhost:4000/api/internal/mark-user-migrated",
    "lookup_email_endpoint": "http://localhost:4000/api/internal/lookup-email",
    "slug": "regnum-christi",
    "logo": "https://example.com/logos/regnum-christi.png",
    "allow_auto_link": true,
    "enabled": true
  }')

# Extraer client_id (ObjectId) - mejor método usando jq si está disponible, sino grep
if command -v jq &> /dev/null; then
  CLIENT_ID=$(echo "$CLIENT_RESPONSE" | jq -r '._id // empty')
else
  CLIENT_ID=$(echo "$CLIENT_RESPONSE" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
fi

if [ -z "$CLIENT_ID" ]; then
  echo -e "${RED}❌ Error: No se pudo crear el client${NC}"
  echo "$CLIENT_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Client creado: ${CLIENT_ID}${NC}"
echo "   Response: $(echo "$CLIENT_RESPONSE" | head -c 200)..."
echo ""

# ============================================
# 2. CREAR APPLICATION (antes era Client OAuth)
# ============================================
echo -e "${YELLOW}📝 Paso 2: Creando Application...${NC}"

APPLICATION_RESPONSE=$(curl -s -X POST "${API_BASE}/applications" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Semper Altius",
    "redirect_uris": [
      "https://app.semperaltius.edu.mx/callback",
      "https://app.semperaltius.edu.mx/logout",
      "http://localhost:4300/callback"
    ],
    "pkce_required": true,
    "enabled": true
  }')

# Extraer application_id
if command -v jq &> /dev/null; then
  APPLICATION_ID=$(echo "$APPLICATION_RESPONSE" | jq -r '._id // empty')
else
  APPLICATION_ID=$(echo "$APPLICATION_RESPONSE" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
fi

if [ -z "$APPLICATION_ID" ]; then
  echo -e "${RED}❌ Error: No se pudo crear la application${NC}"
  echo "$APPLICATION_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Application creada: ${APPLICATION_ID}${NC}"
echo "   Response: $(echo "$APPLICATION_RESPONSE" | head -c 200)..."
echo ""

# ============================================
# 3. CREAR TENANT (antes era Subtenant)
# ============================================
echo -e "${YELLOW}📝 Paso 3: Creando Tenant...${NC}"

TENANT_RESPONSE=$(curl -s -X POST "${API_BASE}/tenants" \
  -H "Content-Type: application/json" \
  -d "{
    \"client_id\": \"${CLIENT_ID}\",
    \"name\": \"RCSA\",
    \"logo\": \"https://example.com/logos/rcsa.png\",
    \"enabled\": true
  }")

# Extraer tenant_id
if command -v jq &> /dev/null; then
  TENANT_ID=$(echo "$TENANT_RESPONSE" | jq -r '._id // empty')
else
  TENANT_ID=$(echo "$TENANT_RESPONSE" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
fi

if [ -z "$TENANT_ID" ]; then
  echo -e "${RED}❌ Error: No se pudo crear el tenant${NC}"
  echo "$TENANT_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Tenant creado: ${TENANT_ID}${NC}"
echo "   Response: $(echo "$TENANT_RESPONSE" | head -c 200)..."
echo ""

# ============================================
# 4. CREAR DOMAIN
# ============================================
echo -e "${YELLOW}📝 Paso 4: Creando Domain...${NC}"

# Validar que las variables necesarias estén definidas
if [ -z "$CLIENT_ID" ] || [ -z "$TENANT_ID" ] || [ -z "$APPLICATION_ID" ]; then
  echo -e "${RED}❌ Error: Faltan variables necesarias para crear el domain${NC}"
  echo "   CLIENT_ID: ${CLIENT_ID:-vacío}"
  echo "   TENANT_ID: ${TENANT_ID:-vacío}"
  echo "   APPLICATION_ID: ${APPLICATION_ID:-vacío}"
  exit 1
fi

# Construir JSON de forma segura
if command -v jq &> /dev/null; then
  DOMAIN_JSON=$(jq -n \
    --arg host "pagos.semperaltius.edu.mx" \
    --arg tenant_id "${CLIENT_ID}" \
    --arg default_tenant_id "${TENANT_ID}" \
    --arg application_id "${APPLICATION_ID}" \
    '{host: $host, tenant_id: $tenant_id, default_tenant_id: $default_tenant_id, application_id: $application_id, enabled: true}')
else
  DOMAIN_JSON="{\"host\":\"pagos.semperaltius.edu.mx\",\"tenant_id\":\"${CLIENT_ID}\",\"default_tenant_id\":\"${TENANT_ID}\",\"application_id\":\"${APPLICATION_ID}\",\"enabled\":true}"
fi

DOMAIN_RESPONSE=$(curl -s -X POST "${API_BASE}/domains" \
  -H "Content-Type: application/json" \
  -d "${DOMAIN_JSON}")

DOMAIN_HOST="pagos.semperaltius.edu.mx"
# Extraer domain_id
if command -v jq &> /dev/null; then
  DOMAIN_ID=$(echo "$DOMAIN_RESPONSE" | jq -r '._id // empty')
else
  DOMAIN_ID=$(echo "$DOMAIN_RESPONSE" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
fi

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
  -d "{
    \"tenant_id\": \"${TENANT_ID}\",
    \"enabled\": true
  }")

# Extraer branding_id
if command -v jq &> /dev/null; then
  BRANDING_ID=$(echo "$BRANDING_RESPONSE" | jq -r '._id // empty')
else
  BRANDING_ID=$(echo "$BRANDING_RESPONSE" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
fi

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
echo -e "${GREEN}✅ CLIENT${NC}"
echo "   ID: ${CLIENT_ID}"
echo "   Name: Regnum Christi"
echo "   Slug: regnum-christi"
echo "   Password Check Endpoint: http://localhost:4000/api/internal/password-check"
echo "   User Migrated Endpoint: http://localhost:4000/api/internal/mark-user-migrated"
echo "   Lookup Email Endpoint: http://localhost:4000/api/internal/lookup-email"
echo ""
echo -e "${GREEN}✅ APPLICATION${NC}"
echo "   ID: ${APPLICATION_ID}"
echo "   Name: Semper Altius"
echo "   Redirect URIs: https://app.semperaltius.edu.mx/callback, https://app.semperaltius.edu.mx/logout"
echo "   PKCE Required: true"
echo ""
echo -e "${GREEN}✅ TENANT${NC}"
echo "   ID: ${TENANT_ID}"
echo "   Client ID: ${CLIENT_ID}"
echo "   Name: RCSA"
echo ""
echo -e "${GREEN}✅ DOMAIN${NC}"
echo "   ID: ${DOMAIN_ID}"
echo "   Host: ${DOMAIN_HOST}"
echo "   Tenant ID (Client): ${CLIENT_ID}"
echo "   Default Tenant ID: ${TENANT_ID}"
echo "   Application ID: ${APPLICATION_ID}"
echo ""
echo -e "${GREEN}✅ BRANDING${NC}"
echo "   ID: ${BRANDING_ID}"
echo "   Tenant ID: ${TENANT_ID}"
echo "   Enabled: true"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}🔍 Verificar en MongoDB:${NC}"
echo "   db.clients.findOne({_id: ObjectId('${CLIENT_ID}')})"
echo "   db.applications.findOne({_id: ObjectId('${APPLICATION_ID}')})"
echo "   db.tenants.findOne({_id: ObjectId('${TENANT_ID}')})"
echo "   db.domains.findOne({_id: ObjectId('${DOMAIN_ID}')})"
echo "   db.brandings.findOne({_id: ObjectId('${BRANDING_ID}')})"
echo ""
echo -e "${YELLOW}🔍 Verificar vía API:${NC}"
echo "   GET ${API_BASE}/clients/${CLIENT_ID}"
echo "   GET ${API_BASE}/applications/${APPLICATION_ID}"
echo "   GET ${API_BASE}/tenants/${TENANT_ID}"
echo "   GET ${API_BASE}/domains/${DOMAIN_ID}"
echo "   GET ${API_BASE}/brandings/${BRANDING_ID}"
echo ""
echo -e "${GREEN}✨ Flujo completo ejecutado exitosamente!${NC}"
