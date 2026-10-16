import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Equipo } from '../models/equipo.model';

export interface EquipoRequest {
  nombre: string;
  jefeInmediatoId: number | null;
}

/** Espeja com.productividad.equipo.EquipoController del backend — solo ADMIN. */
@Injectable({ providedIn: 'root' })
export class EquipoService {
  private readonly http = inject(HttpClient);

  listar(): Observable<Equipo[]> {
    return this.http.get<Equipo[]>(`${environment.apiUrl}/equipos`);
  }

  crear(request: EquipoRequest): Observable<Equipo> {
    return this.http.post<Equipo>(`${environment.apiUrl}/equipos`, request);
  }

  actualizar(id: number, request: EquipoRequest): Observable<Equipo> {
    return this.http.put<Equipo>(`${environment.apiUrl}/equipos/${id}`, request);
  }
}
