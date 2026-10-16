/** Espejo de EstadoPermiso del backend — RECHAZADO_JEFE y RECHAZADO_DIRECCION son terminales. */
export type EstadoPermiso =
  | 'PENDIENTE_JEFE'
  | 'PENDIENTE_DIRECCION'
  | 'APROBADO'
  | 'RECHAZADO_JEFE'
  | 'RECHAZADO_DIRECCION';

export const ESTADO_PERMISO_LABEL: Record<EstadoPermiso, string> = {
  PENDIENTE_JEFE: 'Pendiente de jefe inmediato',
  PENDIENTE_DIRECCION: 'Pendiente de Dirección',
  APROBADO: 'Aprobado',
  RECHAZADO_JEFE: 'Rechazado por jefe inmediato',
  RECHAZADO_DIRECCION: 'Rechazado por Dirección',
};

/** Espejo de PermisoResponse del backend. */
export interface Permiso {
  id: number;
  usuarioId: number;
  usuarioNombre: string;
  fechaInicio: string;
  fechaFin: string;
  pagado: boolean;
  motivo: string | null;
  estado: EstadoPermiso;
  aprobadorJefeNombre: string | null;
  fechaDecisionJefe: string | null;
  comentarioJefe: string | null;
  aprobadorDireccionNombre: string | null;
  fechaDecisionDireccion: string | null;
  comentarioDireccion: string | null;
  createdAt: string;
}
