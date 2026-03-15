# 🚀 Guía de Despliegue — Gestor Torneos Relámpago

## ¿Cómo funciona la app?

```
FRONTEND (React/Vite) ──► BACKEND (Node/Express) ──► SQLite (base de datos)
     Vercel (gratis)           Railway (gratis)          en Railway
```

---

## OPCIÓN 1: Railway + Vercel (RECOMENDADO - 100% gratis)

### Paso 1 — Subir el código a GitHub

1. Crea una cuenta en [github.com](https://github.com) si no tienes
2. Crea un repositorio nuevo llamado `gestor-torneos`
3. Sube todo el contenido de esta carpeta al repo

### Paso 2 — Desplegar el BACKEND en Railway

1. Ve a [railway.app](https://railway.app) y crea cuenta con tu GitHub
2. Click en **New Project** → **Deploy from GitHub repo**
3. Selecciona tu repositorio `gestor-torneos`
4. Railway detectará el `Dockerfile` del backend automáticamente
5. En la configuración del servicio, agrega estas **variables de entorno**:
   ```
   DATABASE_URL=file:./prisma/dev.db
   PORT=3001
   FRONTEND_URL=https://TU-APP.vercel.app  (lo agregas después)
   ```
6. En **Settings → Root Directory** escribe: `backend`
7. Click **Deploy** — espera ~2 minutos
8. Copia la URL que te da Railway, algo como: `https://gestor-torneos-production.up.railway.app`

### Paso 3 — Desplegar el FRONTEND en Vercel

1. Ve a [vercel.com](https://vercel.com) y crea cuenta con GitHub
2. Click en **New Project** → importa tu repo `gestor-torneos`
3. En configuración:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Agrega esta **variable de entorno**:
   ```
   VITE_API_URL=https://TU-URL-DE-RAILWAY.up.railway.app/api
   ```
   (reemplaza con la URL que copiaste en el Paso 2)
5. Click **Deploy** — espera ~1 minuto
6. Copia la URL de Vercel (ej: `https://gestor-torneos.vercel.app`)

### Paso 4 — Conectar frontend con backend

1. Vuelve a Railway
2. Agrega/actualiza la variable `FRONTEND_URL` con tu URL de Vercel
3. Haz **Redeploy**

✅ ¡Listo! Tu app está en línea.

---

## OPCIÓN 2: Todo en Railway (más simple)

Railway puede correr el frontend y backend juntos con Docker Compose.

1. En Railway, selecciona tu repo
2. Railway detectará el `docker-compose.yml`
3. Configura las variables de entorno como arriba
4. Listo

---

## Problema de la base de datos en producción

⚠️ **IMPORTANTE**: SQLite en Railway se resetea si el servicio se reinicia (porque el filesystem no es persistente en el plan gratuito).

### Solución recomendada (gratis):

**Railway ofrece PostgreSQL gratis.** Cambiar a PostgreSQL toma 5 minutos:

1. En Railway, agrega un servicio **PostgreSQL** a tu proyecto
2. Railway te dará una variable `DATABASE_URL` automáticamente
3. En el `schema.prisma`, cambia:
   ```prisma
   datasource db {
     provider = "postgresql"   // era "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
4. También en `schema.prisma`, cambia el tipo `String` de los campos JSON a usar el tipo nativo de arrays de Postgres (opcional pero mejor)
5. Haz `npx prisma migrate deploy` desde Railway

---

## Variables de entorno resumen

### Backend (Railway):
| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | `file:./prisma/dev.db` (SQLite) o la URL de PostgreSQL |
| `PORT` | `3001` |
| `FRONTEND_URL` | `https://tu-app.vercel.app` |

### Frontend (Vercel):
| Variable | Valor |
|----------|-------|
| `VITE_API_URL` | `https://tu-backend.up.railway.app/api` |

---

## Comandos útiles para desarrollo local

```bash
# Backend
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev

# Frontend (en otra terminal)
cd frontend
npm install
npm run dev
```

O con Docker:
```bash
docker-compose up
```

---

## ¿Cuánto cuesta?

| Servicio | Plan | Costo |
|----------|------|-------|
| Railway (backend) | Hobby (gratis) | $0/mes con $5 crédito inicial |
| Vercel (frontend) | Hobby (gratis) | $0/mes |
| Dominio propio | Opcional | ~$10/año |

