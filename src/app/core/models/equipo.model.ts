/** Espejo de EquipoResponse del backend. */
export interface Equipo {
  id: number;
  nombre: string;
  jefeInmediatoId: number | null;
  jefeInmediatoNombre: string | null;
}
