/** Espejo de MetaProcesoResponse del backend — meta configurable mes a mes, por proceso. */
export interface MetaProceso {
  id: number;
  procesoId: number;
  anio: number;
  /** 1 (enero) a 12 (diciembre). */
  mes: number;
  metaDiariaPorPersona: number;
  diasHabiles: number;
  horasLaboralesDia: number;
  /** Derivado en el backend: metaDiariaPorPersona * diasHabiles. */
  metaMensualPorPersona: number;
  /** Derivado en el backend: metaDiariaPorPersona / horasLaboralesDia. */
  ritmoEsperadoPorHora: number;
}
