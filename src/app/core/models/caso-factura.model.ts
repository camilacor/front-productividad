/** Espejo de CasoFacturaResponse del backend. */
export interface CasoFactura {
  id: number;
  numeroFactura: string;
  procesoId: number;
  procesoNombre: string;
  usuarioId: number;
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
  horasExtraNecesarias: number | null;
}

/** Una fila del desglose por empleado — espejo de RendimientoEmpleadoResponse. */
export interface RendimientoEmpleado {
  usuarioId: number;
  usuarioNombre: string;
  casosCompletados: number;
  tiempoPromedioSegundos: number | null;
  productividadRealPorHora: number | null;
  cumplimientoPct: number | null;
  horasExtraNecesarias: number | null;
}

/** Espejo de RendimientoPorEmpleadoResponse — la "visual de todos los empleados". */
export interface RendimientoPorEmpleado {
  procesoId: number;
  procesoNombre: string;
  desde: string;
  hasta: string;
  ritmoEsperadoPorHora: number | null;
  empleados: RendimientoEmpleado[];
}
