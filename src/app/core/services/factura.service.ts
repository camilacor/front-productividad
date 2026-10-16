import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CasoFactura, RendimientoProceso } from '../models/caso-factura.model';

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
}
