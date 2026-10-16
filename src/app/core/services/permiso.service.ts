import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Permiso } from '../models/permiso.model';

export interface SolicitarPermisoRequest {
  fechaInicio: string;
  fechaFin: string;
  pagado: boolean;
  motivo: string;
}

/** Espeja com.productividad.permiso.PermisoController del backend. */
@Injectable({ providedIn: 'root' })
export class PermisoService {
  private readonly http = inject(HttpClient);

  solicitar(request: SolicitarPermisoRequest): Observable<Permiso> {
    return this.http.post<Permiso>(`${environment.apiUrl}/permisos`, request);
  }

  misSolicitudes(): Observable<Permiso[]> {
    return this.http.get<Permiso[]>(`${environment.apiUrl}/permisos/mios`);
  }

  pendientesParaJefe(): Observable<Permiso[]> {
    return this.http.get<Permiso[]>(`${environment.apiUrl}/permisos/pendientes-jefe`);
  }

  pendientesParaDireccion(): Observable<Permiso[]> {
    return this.http.get<Permiso[]>(`${environment.apiUrl}/permisos/pendientes-direccion`);
  }

  aprobarJefe(id: number, comentario: string): Observable<Permiso> {
    return this.http.post<Permiso>(`${environment.apiUrl}/permisos/${id}/aprobar-jefe`, { comentario });
  }

  rechazarJefe(id: number, comentario: string): Observable<Permiso> {
    return this.http.post<Permiso>(`${environment.apiUrl}/permisos/${id}/rechazar-jefe`, { comentario });
  }

  aprobarDireccion(id: number, comentario: string): Observable<Permiso> {
    return this.http.post<Permiso>(`${environment.apiUrl}/permisos/${id}/aprobar-direccion`, { comentario });
  }

  rechazarDireccion(id: number, comentario: string): Observable<Permiso> {
    return this.http.post<Permiso>(`${environment.apiUrl}/permisos/${id}/rechazar-direccion`, { comentario });
  }
}
