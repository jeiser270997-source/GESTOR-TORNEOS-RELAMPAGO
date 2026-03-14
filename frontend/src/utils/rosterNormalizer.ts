import type { Jugador } from '../types';

/**
 * Normaliza un roster copiado y pegado desde diferentes fuentes.
 * Soporta 5 formatos principales y remueve palabras clave.
 */
export const normalizeRoster = (text: string): Omit<Jugador, 'id'>[] => {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const players: Omit<Jugador, 'id'>[] = [];
  
  const keywordsToIgnore = ['manager', 'entrenador', 'niña', 'couch', 'asistente'];

  lines.forEach(line => {
    // Verificar si la línea contiene palabras clave para ignorar
    const lowerLine = line.toLowerCase();
    if (keywordsToIgnore.some(kw => lowerLine.includes(kw))) {
      return;
    }

    let nombre = '';
    let numero_camiseta: string | null = null;

    // FORMATO 1: Tabla (Excel/Google Sheets) con pipes o tabs
    // Ej: "1 | Antonio Olivera | 07" o "1\tAntonio Olivera\t07"
    if (line.includes('|') || line.includes('\t')) {
      const parts = line.split(/[|\t]/).map(p => p.trim());
      if (parts.length >= 2) {
        // Intentar detectar cuál es el nombre y cuál el número
        // Usualmente es: # | Nombre | Numero
        if (!isNaN(Number(parts[0])) && parts[1]) {
          nombre = parts[1];
          numero_camiseta = parts[2] || parts[0]; // Si hay 3 partes, la 3ra es el numero, sino la 1ra
        } else {
          nombre = parts[0];
          numero_camiseta = parts[1];
        }
      }
    }
    // FORMATO 3 y 5: Hashtag o Guion con numero al final o inicio
    // Ej: "1-luis Yaris #8" o "11-Jean Carlos García"
    else if (line.includes('#') || line.includes('-')) {
      // Remover numero de lista inicial si existe "1-name"
      const dashParts = line.split('-');
      let workingLine = line;
      if (dashParts.length > 1 && !isNaN(Number(dashParts[0]))) {
          workingLine = dashParts.slice(1).join('-').trim();
      }

      if (workingLine.includes('#')) {
        const hashParts = workingLine.split('#').map(p => p.trim());
        nombre = hashParts[0];
        numero_camiseta = hashParts[1];
      } else {
        // Si no hay hash pero hubo guion, el guion ya separó el indice
        nombre = workingLine;
      }
    }
    // FORMATO 4: Numerado "1. Jorge Diaz"
    else if (/^\d+\.\s/.test(line)) {
      nombre = line.replace(/^\d+\.\s/, '').trim();
    }
    // FORMATO 2: Simple "Andri hernandez"
    else {
      nombre = line;
    }

    // Limpieza final de nombre
    // Remover números al inicio o final si quedaron
    nombre = nombre.replace(/^\d+[\s\-_]+/, '').replace(/[\s\-_]+\d+$/, '').trim();

    if (nombre) {
      players.push({
        nombre,
        numero_camiseta: numero_camiseta ? numero_camiseta.toString() : null
      });
    }
  });

  // Validaciones finales: remover duplicados por nombre
  const uniquePlayers = players.filter((p, index, self) =>
    index === self.findIndex((t) => t.nombre === p.nombre)
  );

  return uniquePlayers;
};
