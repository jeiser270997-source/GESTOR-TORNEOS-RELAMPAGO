import { format, parseISO, isWeekend } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Formatea fecha a formato largo en español
 * Ejemplo: "2026-03-15" → "DOMINGO 15 DE MARZO"
 */
export const formatFechaCorta = (fecha: string): string => {
  if (!fecha) return '';
  try {
    return format(parseISO(fecha), "EEEE dd 'de' MMMM", { locale: es }).toUpperCase();
  } catch {
    return fecha;
  }
};

/**
 * Convierte hora 24h a formato 12h con AM/PM
 * Ejemplo: "19:30" → "7:30 PM"
 */
export const format12h = (hora24: string): string => {
  if (!hora24 || !hora24.includes(':')) return hora24;
  const [h, m] = hora24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
};

/**
 * Obtiene la hora efectiva según si es fin de semana
 * Si es entre semana, devuelve la hora fija
 * Si es fin de semana, devuelve la hora seleccionada
 */
export const getHoraEfectiva = (
  fecha: string,
  hora: string,
  horaEntreSemana: string
): string => {
  if (!fecha) return hora;
  return isWeekend(parseISO(fecha)) ? hora : horaEntreSemana;
};

/**
 * Valida si una fecha es fin de semana
 */
export const esFinDeSemana = (fecha: string): boolean => {
  if (!fecha) return false;
  return isWeekend(parseISO(fecha));
};