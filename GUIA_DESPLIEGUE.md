# 🚀 Guía de Despliegue — Gestor Torneos Relámpago

## Arquitectura

```
Vercel (frontend gratis)
    ↓
Railway (backend gratis)
    ↓
Supabase (PostgreSQL gratis)
```

---

## ⚠️ NOTA IMPORTANTE

El proyecto usa **SQLite localmente** y **PostgreSQL en producción** (Supabase).
Antes de desplegar en Railway debes cambiar `backend/prisma/schema.prisma`:
- Línea `provider = "sqlite"` → `provider = "postgresql"`
- Todos los campos `String @default("[]")` → `String[] @default([])`
- Agregar `directUrl = env("DIRECT_URL")` al datasource

O simplemente sigue la guía paso a paso abajo.

---

## PASO 1 — Crear la base de datos en Supabase

1. Ve a **[supabase.com](https://supabase.com)** → crear cuenta gratis
2. **New Project** → ponle nombre `gestor-torneos`, elige región **US East**
3. Anota la contraseña que creas — la necesitarás
4. Espera ~2 minutos que termine de crear
5. Ve a **Settings → Database**
6. Baja hasta **Connection string** → selecciona **URI**
7. Copia las **dos URLs**:

   **Transaction pooler** (para `DATABASE_URL`):
   ```
   postgresql://postgres.xxxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

   **Session pooler / Direct** (para `DIRECT_URL`):
   ```
   postgresql://postgres.xxxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
   ```

---

## PASO 2 — Subir el código a GitHub

Si no lo has hecho:
```bash
git init
git add .
git commit -m "inicial"
git remote add origin https://github.com/TU-USUARIO/gestor-torneos.git
git push -u origin main
```

---

## PASO 3 — Desplegar el Backend en Railway

1. Ve a **[railway.app](https://railway.app)** → crear cuenta con GitHub
2. **New Project → Deploy from GitHub repo**
3. Selecciona tu repositorio
4. Railway detectará el `Dockerfile` automáticamente
5. Ve a **Settings → General → Root Directory** y escribe: `backend`
6. Ve a **Variables** y agrega:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | La URL de Supabase (Transaction pooler) |
| `DIRECT_URL` | La URL de Supabase (Direct/Session) |
| `PORT` | `3001` |
| `FRONTEND_URL` | (lo agregas después con la URL de Vercel) |

7. Click **Deploy** — espera ~3 minutos
8. Railway ejecutará automáticamente `npx prisma migrate deploy` y creará todas las tablas en Supabase
9. Copia la URL pública que te da Railway, ej: `https://gestor-torneos.up.railway.app`
10. Verifica que funciona: abre `https://gestor-torneos.up.railway.app/health` → debe mostrar `{"status":"ok"}`

---

## PASO 4 — Desplegar el Frontend en Vercel

1. Ve a **[vercel.com](https://vercel.com)** → crear cuenta con GitHub
2. **New Project** → importa tu repositorio
3. Configura:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Agrega variable de entorno:

| Variable | Valor |
|----------|-------|
| `VITE_API_URL` | `https://TU-URL-RAILWAY.up.railway.app/api` |

5. Click **Deploy** — espera ~1 minuto
6. Copia la URL de Vercel, ej: `https://gestor-torneos.vercel.app`

---

## PASO 5 — Conectar frontend con backend

1. Vuelve a **Railway → Variables**
2. Agrega/actualiza: `FRONTEND_URL` = `https://gestor-torneos.vercel.app`
3. Railway hace redeploy automático

✅ **¡Listo! Tu app está en línea.**

---

## Desarrollo local

Para correr localmente (usa SQLite, no necesita Supabase):
```bash
docker-compose up
```

Abre: **http://localhost:5173**

Para parar:
```bash
docker-compose down
```

---

## Costos

| Servicio | Plan | Costo |
|----------|------|-------|
| Vercel | Hobby | **Gratis** |
| Railway | Hobby | **Gratis** ($5 crédito inicial) |
| Supabase | Free | **Gratis** (500MB, suficiente) |

