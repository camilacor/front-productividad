import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MetaProceso } from '../models/meta-proceso.model';
import { Proceso } from '../models/proceso.model';

export interface ProcesoRequest {
  nombre: string;
  activo: boolean;
}

export interface MetaProcesoRequest {
  anio: number;
  mes: number;
  metaDiariaPorPersona: number;
  diasHabiles: number;
  horasLaboralesDia: number;
}

/** Espeja com.productividad.proceso.ProcesoController del backend. */
@Injectable({ providedIn: 'root' })
export class ProcesoService {
  private readonly http = inject(HttpClient);

  listar(): Observable<Proceso[]> {
    return this.http.get<Proceso[]>(`${environment.apiUrl}/procesos`);
  }

  crear(request: ProcesoRequest): Observable<Proceso> {
    return this.http.post<Proceso>(`${environment.apiUrl}/procesos`, request);
  }

  actualizar(id: number, request: ProcesoRequest): Observable<Proceso> {
    return this.http.put<Proceso>(`${environment.apiUrl}/procesos/${id}`, request);
  }

  listarMetas(procesoId: number): Observable<MetaProceso[]> {
    return this.http.get<MetaProceso[]>(`${environment.apiUrl}/procesos/${procesoId}/metas`);
  }

  definirMeta(procesoId: number, request: MetaProcesoRequest): Observable<MetaProceso> {
    return this.http.post<MetaProceso>(`${environment.apiUrl}/procesos/${procesoId}/metas`, request);
  }
}
