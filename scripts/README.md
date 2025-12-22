# Scripts de Seed y Testing

## seed-full-flow.sh

Script que ejecuta el flujo completo de creación de entidades:

1. **Tenant** → Crea un tenant con valores default
2. **Client** → Crea un client
3. **Subtenant** → Crea un subtenant vinculado al tenant
4. **Domain** → Crea un domain vinculado a tenant, subtenant y client
5. **Branding** → Crea un branding vinculado a tenant y subtenant

### Uso

```bash
# Usar URL por defecto (http://localhost:3000/api)
./scripts/seed-full-flow.sh

# O especificar URL personalizada
BASE_URL=http://localhost:3000/api ./scripts/seed-full-flow.sh
```

### Requisitos

- El servidor NestJS debe estar corriendo
- MongoDB debe estar disponible
- `curl` debe estar instalado

### Output

El script muestra:
- Progreso de cada paso
- IDs de cada entidad creada
- Resumen final con todos los datos
- Comandos para verificar en MongoDB y vía API

### Ejemplo de Output

```
🚀 Iniciando flujo completo de creación...

📝 Paso 1: Creando Tenant...
✅ Tenant creado: 507f1f77bcf86cd799439011

📝 Paso 2: Creando Client...
✅ Client creado: 507f1f77bcf86cd799439012

...

📊 RESUMEN DEL FLUJO COMPLETO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ TENANT
   ID: 507f1f77bcf86cd799439011
   Name: Regnum Christi
   ...
```

