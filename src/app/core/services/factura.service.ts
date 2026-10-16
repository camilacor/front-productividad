import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CasoFactura, Empleado, RendimientoPorEmpleado, RendimientoProceso } from '../models/caso-factura.model';

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

  rendimiento(
    procesoId: number,
    desde: string,
    hasta: string,
    usuarioId?: number | null,
  ): Observable<RendimientoProceso> {
    const params: Record<string, string | number> = { procesoId, desde, hasta };
    if (usuarioId) {
      params['usuarioId'] = usuarioId;
    }
    return this.http.get<RendimientoProceso>(`${environment.apiUrl}/facturas/rendimiento`, { params });
  }

  /**
   * Lista completa de empleados para el filtro "por empleado" — independiente de qué proceso se
   * haya consultado, así se puede combinar "todos los procesos" con un empleado puntual sin que
   * dependa de que esa persona haya aparecido en la última consulta de un solo proceso.
   */
  listarEmpleados(): Observable<Empleado[]> {
    return this.http.get<Empleado[]>(`${environment.apiUrl}/facturas/empleados`);
  }

  /**
   * La "visual de todos los empleados" — restringido en el backend a roles != EMPLEADO. Con
   * `usuarioId`, el desglose trae solo esa persona en vez de agrupar a todos.
   */
  rendimientoPorEmpleado(
    procesoId: number,
    desde: string,
    hasta: string,
    usuarioId?: number | null,
  ): Observable<RendimientoPorEmpleado> {
    const params: Record<string, string | number> = { procesoId, desde, hasta };
    if (usuarioId) {
      params['usuarioId'] = usuarioId;
    }
    return this.http.get<RendimientoPorEmpleado>(`${environment.apiUrl}/facturas/rendimiento-por-empleado`, {
      params,
    });
  }

  /**
   * URL del .xlsx — se usa en un link de navegación de página completa, no por HttpClient: así la
   * cookie de sesión viaja sola (SameSite=Lax) sin pelear con CORS/blobs solo para descargar un
   * archivo (mismo patrón que la exportación CSV de permisos).
   *
   * Sin `procesoId` el backend incluye todos los procesos (una hoja — o tres — por cada uno). Sin
   * `desde`/`hasta` usa las 3 hojas de siempre (Diaria/Semanal/Mensual a hoy); con ambos, exporta
   * ese rango puntual en una sola hoja por proceso. Con `usuarioId`, cada hoja trae solo esa
   * persona. Las fechas son `yyyy-MM-dd` (de un `<input type="date">`) y acá se convierten al
   * rango de instantes que espera el backend.
   */
  exportarRendimientoUrl(opciones: {
    procesoId?: number | null;
    desde?: string | null;
    hasta?: string | null;
    usuarioId?: number | null;
  }): string {
    const params = new URLSearchParams();
    if (opciones.procesoId) {
      params.set('procesoId', String(opciones.procesoId));
    }
    if (opciones.desde && opciones.hasta) {
      params.set('desde', new Date(`${opciones.desde}T00:00:00`).toISOString());
      params.set('hasta', new Date(`${opciones.hasta}T23:59:59.999`).toISOString());
    }
    if (opciones.usuarioId) {
      params.set('usuarioId', String(opciones.usuarioId));
    }
    const query = params.toString();
    return `${environment.apiUrl}/facturas/rendimiento-por-empleado/exportar${query ? '?' + query : ''}`;
  }
}
