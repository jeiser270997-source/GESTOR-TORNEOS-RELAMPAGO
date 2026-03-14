import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// TORNEOS
app.get('/api/torneos', async (req, res) => {
  try {
    const torneos = await prisma.torneo.findMany({ 
      include: { equipos: true, juegos: true },
      orderBy: { numero_interno: 'desc' }
    });
    const formatted = torneos.map(t => ({
      ...t,
      horarios_ocupados: JSON.parse(t.horarios_ocupados)
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tournaments' });
  }
});

app.post('/api/torneos', async (req, res) => {
  try {
    const { fecha_inicio } = req.body;
    let max = await prisma.torneo.aggregate({ _max: { numero_interno: true } });
    const numero_interno = max._max.numero_interno ? (max._max.numero_interno + 1) : 1;
    
    const torneo = await prisma.torneo.create({
      data: {
        numero_interno,
        fecha_inicio: new Date(fecha_inicio),
        estado: 'creado',
        horarios_ocupados: '[]'
      }
    });
    res.json({ ...torneo, horarios_ocupados: [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create tournament' });
  }
});

app.get('/api/torneos/:id', async (req, res) => {
  try {
    const torneo = await prisma.torneo.findUnique({
      where: { id: req.params.id },
      include: { equipos: { include: { roster: true } }, juegos: true }
    });
    if (!torneo) return res.status(404).json({ error: 'Not found' });
    res.json({
      ...torneo,
      horarios_ocupados: JSON.parse(torneo.horarios_ocupados)
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.delete('/api/torneos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Delete cascading manually since we're on SQLite and might not have enabled cascading deletes
    await prisma.juego.deleteMany({ where: { torneo_id: id } });
    const equipos = await prisma.equipo.findMany({ where: { torneo_id: id } });
    for (const equipo of equipos) {
        await prisma.jugador.deleteMany({ where: { equipo_id: equipo.id } });
    }
    await prisma.equipo.deleteMany({ where: { torneo_id: id } });
    await prisma.torneo.delete({ where: { id } });
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete tournament' });
  }
});

// EQUIPOS
app.post('/api/torneos/:id/equipos', async (req, res) => {
  try {
    const { nombre, numero_delegado, roster } = req.body;
    const equipo = await prisma.equipo.create({
      data: {
        nombre,
        numero_delegado,
        torneo_id: req.params.id,
        roster: {
          create: roster.map((p: any) => ({
            nombre: p.nombre,
            numero_camiseta: p.numero_camiseta ? p.numero_camiseta.toString() : null
          }))
        }
      },
      include: { roster: true }
    });
    res.json(equipo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed' });
  }
});

app.delete('/api/equipos/:id', async (req, res) => {
    try {
        await prisma.jugador.deleteMany({ where: { equipo_id: req.params.id } });
        await prisma.equipo.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed' });
    }
});

app.put('/api/equipos/:id', async (req, res) => {
    try {
        const { nombre, numero_delegado, roster } = req.body;
        
        // Update basic info
        await prisma.equipo.update({
            where: { id: req.params.id },
            data: { nombre, numero_delegado }
        });

        // Update roster: easiest is delete and recreate if provided
        if (roster) {
            await prisma.jugador.deleteMany({ where: { equipo_id: req.params.id } });
            await prisma.jugador.createMany({
                data: roster.map((p: any) => ({
                    nombre: p.nombre,
                    numero_camiseta: p.numero_camiseta ? p.numero_camiseta.toString() : null,
                    equipo_id: req.params.id
                }))
            });
        }

        const updated = await prisma.equipo.findUnique({ 
            where: { id: req.params.id },
            include: { roster: true }
        });
        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update team' });
    }
});

// CONTACTOS
app.get('/api/contactos', async (req, res) => {
    try {
        const contactos = await prisma.contacto.findMany();
        const formatted = contactos.map(c => ({
            ...c,
            torneos_participados: JSON.parse(c.torneos_participados)
        }));
        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: 'Failed' });
    }
});

// JUEGOS
app.post('/api/torneos/:id/juegos', async (req, res) => {
  try {
    const { juegos } = req.body; // Array of juego data
    
    // Validate conflicts (simplified for now, should check across torneos)
    // In a real app we'd query all 'programado' games' times
    
    const createdJuegos = await Promise.all(juegos.map((j: any) => 
      prisma.juego.create({
        data: {
          ronda: j.ronda,
          equipo_local_id: j.equipo_local_id,
          equipo_visitante_id: j.equipo_visitante_id,
          fecha: new Date(j.fecha),
          hora: j.hora,
          torneo_id: req.params.id
        }
      })
    ));

    // Update occupied hours for this tournament
    const hours = juegos.map((j: any) => `${j.fecha}T${j.hora}`);
    await prisma.torneo.update({
        where: { id: req.params.id },
        data: { 
            horarios_ocupados: JSON.stringify(hours),
            estado: 'en_progreso'
        }
    });

    res.json(createdJuegos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed' });
  }
});

app.put('/api/juegos/:id', async (req, res) => {
    try {
        const { equipo_local_id, equipo_visitante_id, fecha, hora, estado } = req.body;
        const updated = await prisma.juego.update({
            where: { id: req.params.id },
            data: {
                equipo_local_id,
                equipo_visitante_id,
                fecha: fecha ? new Date(fecha) : undefined,
                hora,
                estado
            }
        });
        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update game' });
    }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
