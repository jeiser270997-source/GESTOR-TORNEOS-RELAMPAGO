export interface Torneo {
  id: string;
  numero_interno: number;
  nombre_externo: string; // "Torneos Relámpago Envigado"
  fecha_inicio: string; // ISO String mapping from Date
  fecha_fin_estimada?: string;
  estado: 'creado' | 'en_progreso' | 'finalizado';
  equipos: Equipo[];
  juegos: Juego[];
  horarios_ocupados: string[]; // ISO 8601 Strings
}

export interface Equipo {
  id: string;
  nombre: string;
  numero_delegado: string;
  pago_confirmado: boolean;
  roster: Jugador[];
  jugadores_activos: string[]; // 9 IDs
  torneo_id: string;
}

export interface Jugador {
  id: string;
  nombre: string;
  numero_camiseta: string | null;
  equipo_id?: string;
}

export interface Juego {
  id: string;
  ronda: 'semifinal_1' | 'semifinal_2' | 'final';
  equipo_local_id: string;
  equipo_visitante_id: string;
  fecha: string;
  hora: string; // "18:30"
  estado: 'programado' | 'en_progreso' | 'finalizado';
  marcador?: { local: number; visitante: number };
  torneo_id?: string;
}

export interface Contacto {
  id: string;
  nombre_equipo: string;
  numero_delegado: string;
  torneos_participados: string[];
  total_participaciones: number;
}
