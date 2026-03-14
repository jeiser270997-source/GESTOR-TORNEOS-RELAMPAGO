# Gestor de Torneos Relámpago Envigado ⚾

Software personal para la gestión de cuadrangulares de softball con eliminación directa.

## Stack Tecnológico 🛠️

- **Frontend**: React 18 + TypeScript + Tailwind CSS (v4)
- **Backend**: Node.js + Express + TypeScript
- **BD**: SQLite + Prisma ORM
- **PDF**: html2pdf.js

## Estructura del Proyecto 📂

- `/frontend`: Aplicación SPA con React.
- `/backend`: API REST con Express y Prisma.
- `/backend/prisma`: Definición del esquema de base de datos.

## Funcionalidades Implementadas ✅

1. **Dashboard**: Listado de torneos activos y acceso rápido.
2. **Creación de Torneos**: Definición de fecha de inicio.
3. **Registro de Equipos**: 
   - Normalización de rosters (soporta 5 formatos).
   - Selección de 9 jugadores activos obligatoria.
   - Validación de delegados.
4. **Calendario Inteligente**:
   - Validación de horarios (Fijos en semana, seleccionables en finde).
   - Brackets automáticos (Semifinales + Final).
5. **Generador de Documentos**:
   - PDF de la Jornada con diseño landscape premium.
6. **Directorio de Contactos**:
   - Registro persistente de equipos y números de delegado.
7. **Generador de Mensajes**:
   - Plantillas para promoción en WhatsApp.

## Cómo Ejecutar 🚀

### Backend
```bash
cd backend
npm install
npx prisma db push
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Notas Técnicas 📝

- El sistema de normalización de rosters detecta automáticamente:
  - Tablas de Excel/Google Sheets.
  - Listas simples.
  - Formatos con Hashtag (#8).
  - Listas numeradas.
  - Mezclas con notas (ignora Managers/Entrenadores).
- No requiere autenticación (Uso Personal).
- Los horarios ocupados se validan por torneo para evitar traslapes.
