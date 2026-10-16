import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CasoFactura, RendimientoPorEmpleado, RendimientoProceso } from '../models/caso-factura.model';

export interface IniciarCasoRequest {
  numeroFactura: string;
  procesoId: number;
}

/** Espeja com.productividad.factura.FacturaController del backend. */
@Injectable({ providedIn: 'root' })
export class FacturaService {
  private readonly http = inject(HttpClient);

  iniciar(request: IniciarCasoRequest): Observable<CasoFactura> {
    return this.http.post<CasoFactura>(`${environment.apiUrl}/facturas/iniciar`, request);
  }

  finalizar(casoId: number): Observable<CasoFactura> {
    return this.http.post<CasoFactura>(`${environment.apiUrl}/facturas/${casoId}/finalizar`, {});
  }

  /** 204 (sin caso en curso) llega como body `null`. */
  enCurso(): Observable<CasoFactura | null> {
    return this.http.get<CasoFactura | null>(`${environment.apiUrl}/facturas/en-curso`);
  }

  rendimiento(procesoId: number, desde: string, hasta: string): Observable<RendimientoProceso> {
    return this.http.get<RendimientoProceso>(`${environment.apiUrl}/facturas/rendimiento`, {
      params: { procesoId, desde, hasta },
    });
  }

  /** La "visual de todos los empleados" — restringido en el backend a roles != EMPLEADO. */
  rendimientoPorEmpleado(procesoId: number, desde: string, hasta: string): Observable<RendimientoPorEmpleado> {
    return this.http.get<RendimientoPorEmpleado>(`${environment.apiUrl}/facturas/rendimiento-por-empleado`, {
      params: { procesoId, desde, hasta },
    });
  }

  /**
   * URL del .xlsx (Diaria/Semanal/Mensual) — se usa en un link de navegación de página completa,
   * no por HttpClient: así la cookie de sesión viaja sola (SameSite=Lax) sin pelear con
   * CORS/blobs solo para descargar un archivo (mismo patrón que la exportación CSV de permisos).
   */
  exportarRendimientoUrl(procesoId: number): string {
    return `${environment.apiUrl}/facturas/rendimiento-por-empleado/exportar?procesoId=${procesoId}`;
  }
}
