export type TipoGeneracion = 'MANUAL' | 'AUTOMATICA';

/** Espejo de CasoFacturaResponse del backend. */
export interface CasoFactura {
  id: number;
  numeroFactura: string;
  procesoId: number;
  procesoNombre: string;
  usuarioId: number;
  tipoGeneracion: TipoGeneracion;
  horaInicio: string;
  horaFin: string | null;
  duracionSegundos: number | null;
}

/**
 * Espejo de RendimientoProcesoResponse. Los campos nullable son null cuando el proceso no tiene
 * una meta configurada para el mes de `hasta` (ver MetaProceso en el backend).
 */
export interface RendimientoProceso {
  procesoId: number;
  procesoNombre: string;
  desde: string;
  hasta: string;
  casosCompletados: number;
  tiempoPromedioSegundos: number | null;
  ritmoEsperadoPorHora: number | null;
  productividadRealPorHora: number | null;
  cumplimientoPct: number | null;
  facturasManuales: number;
  facturasAutomaticas: number;
  porcentajeManual: number | null;
  porcentajeAutomatica: number | null;
  horasExtraNecesarias: number | null;
}
