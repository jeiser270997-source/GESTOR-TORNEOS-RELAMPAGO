import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : ['http://localhost:5173', 'http://localhost:4173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS no permitido'), false);
  }
}));

app.use(express.json({ limit: '2mb' }));

// Helper JSON — SQLite no tiene arrays nativos
const toArr = (val: string | string[]): string[] => {
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val); } catch { return []; }
};
const toJson = (val: string[]): string => JSON.stringify(val);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ════════════════════════════════════════════════════════════════
// TORNEOS
// ════════════════════════════════════════════════════════════════

app.get('/api/torneos', async (_req, res) => {
  try {
    const torneos = await prisma.torneo.findMany({
      include: { equipos: { include: { roster: true } }, juegos: true },
      orderBy: { numero_interno: 'desc' }
    });
    res.json(torneos.map(t => ({ ...t, horarios_ocupados: toArr(t.horarios_ocupados) })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener torneos' });
  }
});

app.post('/api/torneos', async (req, res) => {
  try {
    const { fecha_inicio } = req.body;
    if (!fecha_inicio || isNaN(Date.parse(fecha_inicio))) {
      return res.status(400).json({ error: 'Fecha de inicio inválida' });
    }
    const max = await prisma.torneo.aggregate({ _max: { numero_interno: true } });
    const numero_interno = (max._max.numero_interno ?? 0) + 1;
    const torneo = await prisma.torneo.create({
      data: { numero_interno, fecha_inicio: new Date(fecha_inicio), estado: 'creado' }
    });
    res.json({ ...torneo, horarios_ocupados: [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear torneo' });
  }
});

app.get('/api/torneos/:id', async (req, res) => {
  try {
    const torneo = await prisma.torneo.findUnique({
      where: { id: req.params.id },
      include: { equipos: { include: { roster: true } }, juegos: true }
    });
    if (!torneo) return res.status(404).json({ error: 'Torneo no encontrado' });
    res.json({ ...torneo, horarios_ocupados: toArr(torneo.horarios_ocupados) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener torneo' });
  }
});

app.delete('/api/torneos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.$transaction(async (tx) => {
      await tx.juego.deleteMany({ where: { torneo_id: id } });
      const equipos = await tx.equipo.findMany({ where: { torneo_id: id } });
      const ids = equipos.map(e => e.id);
      if (ids.length) await tx.jugador.deleteMany({ where: { equipo_id: { in: ids } } });
      await tx.equipo.deleteMany({ where: { torneo_id: id } });
      await tx.torneo.delete({ where: { id } });
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar torneo' });
  }
});

// ════════════════════════════════════════════════════════════════
// EQUIPOS
// ════════════════════════════════════════════════════════════════

app.post('/api/torneos/:id/equipos', async (req, res) => {
  try {
    const { nombre, numero_delegado, roster } = req.body;
    const count = await prisma.equipo.count({ where: { torneo_id: req.params.id } });
    if (count >= 4) return res.status(400).json({ error: 'El torneo ya tiene 4 equipos' });
    if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre del equipo es requerido' });

    const equipo = await prisma.equipo.create({
      data: {
        nombre: nombre.trim(),
        numero_delegado: numero_delegado ?? '',
        torneo_id: req.params.id,
        roster: {
          create: (roster ?? []).map((p: { nombre: string; numero_camiseta?: string | null }) => ({
            nombre: p.nombre,
            numero_camiseta: p.numero_camiseta ? String(p.numero_camiseta) : null
          }))
        }
      },
      include: { roster: true }
    });

    if (numero_delegado) await upsertContacto(nombre.trim(), numero_delegado, req.params.id);
    res.json(equipo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al agregar equipo' });
  }
});

app.delete('/api/equipos/:id', async (req, res) => {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.jugador.deleteMany({ where: { equipo_id: req.params.id } });
      await tx.equipo.delete({ where: { id: req.params.id } });
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar equipo' });
  }
});

app.put('/api/equipos/:id', async (req, res) => {
  try {
    const { nombre, numero_delegado, roster } = req.body;
    await prisma.$transaction(async (tx) => {
      await tx.equipo.update({
        where: { id: req.params.id },
        data: {
          ...(nombre?.trim() && { nombre: nombre.trim() }),
          ...(numero_delegado !== undefined && { numero_delegado })
        }
      });
      if (roster !== undefined) {
        await tx.jugador.deleteMany({ where: { equipo_id: req.params.id } });
        if (roster.length > 0) {
          await tx.jugador.createMany({
            data: roster.map((p: { nombre: string; numero_camiseta?: string | null }) => ({
              nombre: p.nombre,
              numero_camiseta: p.numero_camiseta ? String(p.numero_camiseta) : null,
              equipo_id: req.params.id
            }))
          });
        }
      }
    });
    const updated = await prisma.equipo.findUnique({ where: { id: req.params.id }, include: { roster: true } });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar equipo' });
  }
});

// ════════════════════════════════════════════════════════════════
// JUEGOS
// ════════════════════════════════════════════════════════════════

app.post('/api/torneos/:id/juegos', async (req, res) => {
  try {
    const { juegos } = req.body;
    const existingCount = await prisma.juego.count({ where: { torneo_id: req.params.id } });
    if (existingCount > 0) {
      return res.status(400).json({ error: 'Este torneo ya tiene juegos. Usa editar final para cambiar equipos.' });
    }
    for (const j of juegos) {
      if (!j.fecha || isNaN(Date.parse(j.fecha))) {
        return res.status(400).json({ error: `Fecha inválida para ${j.ronda}` });
      }
    }

    const createdJuegos = await prisma.$transaction(
      juegos.map((j: { ronda: string; equipo_local_id: string; equipo_visitante_id: string; fecha: string; hora: string }) =>
        prisma.juego.create({
          data: { ronda: j.ronda, equipo_local_id: j.equipo_local_id, equipo_visitante_id: j.equipo_visitante_id, fecha: new Date(j.fecha), hora: j.hora, torneo_id: req.params.id }
        })
      )
    );

    const torneoActual = await prisma.torneo.findUnique({ where: { id: req.params.id } });
    const horasExistentes = toArr(torneoActual?.horarios_ocupados ?? '[]');
    const nuevasHoras = juegos.map((j: { fecha: string; hora: string }) => `${j.fecha.split('T')[0]}T${j.hora}`);
    const todasLasHoras = [...new Set([...horasExistentes, ...nuevasHoras])];

    await prisma.torneo.update({
      where: { id: req.params.id },
      data: { horarios_ocupados: toJson(todasLasHoras), estado: 'en_progreso' }
    });

    res.json(createdJuegos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar juegos' });
  }
});

app.put('/api/juegos/:id', async (req, res) => {
  try {
    const { equipo_local_id, equipo_visitante_id, fecha, hora, estado } = req.body;
    const existing = await prisma.juego.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Juego no encontrado' });

    const updated = await prisma.juego.update({
      where: { id: req.params.id },
      data: {
        ...(equipo_local_id !== undefined && { equipo_local_id }),
        ...(equipo_visitante_id !== undefined && { equipo_visitante_id }),
        ...(fecha && { fecha: new Date(fecha) }),
        ...(hora !== undefined && { hora }),
        ...(estado !== undefined && { estado })
      }
    });

    // Si cambiaron fecha/hora, reconstruir horarios_ocupados desde todos los juegos del torneo
    if ((fecha || hora !== undefined) && existing.torneo_id) {
      const todosJuegos = await prisma.juego.findMany({ where: { torneo_id: existing.torneo_id } });
      const nuevosHorarios = [...new Set(
        todosJuegos.map(j => `${j.fecha.toISOString().split('T')[0]}T${j.hora}`)
      )];
      await prisma.torneo.update({
        where: { id: existing.torneo_id },
        data: { horarios_ocupados: toJson(nuevosHorarios) }
      });
    }

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar juego' });
  }
});

// ════════════════════════════════════════════════════════════════
// CONTACTOS
// ════════════════════════════════════════════════════════════════

app.get('/api/contactos', async (_req, res) => {
  try {
    const contactos = await prisma.contacto.findMany({ orderBy: { total_participaciones: 'desc' } });
    res.json(contactos.map(c => ({ ...c, torneos_participados: toArr(c.torneos_participados) })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener contactos' });
  }
});

// ════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════

async function upsertContacto(nombreEquipo: string, numeroDelegado: string, torneoId: string) {
  try {
    const existing = await prisma.contacto.findUnique({ where: { nombre_equipo: nombreEquipo } });
    if (existing) {
      const torneos = toArr(existing.torneos_participados);
      if (!torneos.includes(torneoId)) {
        torneos.push(torneoId);
        await prisma.contacto.update({
          where: { nombre_equipo: nombreEquipo },
          data: { numero_delegado: numeroDelegado, torneos_participados: toJson(torneos), total_participaciones: torneos.length }
        });
      }
    } else {
      await prisma.contacto.create({
        data: { nombre_equipo: nombreEquipo, numero_delegado: numeroDelegado, torneos_participados: toJson([torneoId]), total_participaciones: 1 }
      });
    }
  } catch (err) {
    console.error('Error upsertContacto:', err);
  }
}

// ════════════════════════════════════════════════════════════════
// PING — mantener Supabase activo cada 3 días
// ════════════════════════════════════════════════════════════════

const TRES_DIAS = 1000 * 60 * 60 * 24 * 3;
setInterval(async () => {
  try {
    await prisma.torneo.count();
    console.log('✅ Ping a Supabase OK');
  } catch (err) {
    console.error('❌ Ping falló:', err);
  }
}, TRES_DIAS);

app.listen(PORT, () => {
  console.log(`✅ Backend corriendo en http://localhost:${PORT}`);
});