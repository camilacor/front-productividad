import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Rol, Usuario } from '../models/usuario.model';

export interface CrearUsuarioRequest {
  nombre: string;
  email: string;
  password: string;
  rol: Rol;
  equipoId: number | null;
}

export interface ActualizarUsuarioRequest {
  nombre: string;
  rol: Rol;
  activo: boolean;
  equipoId: number | null;
}

/** Espeja com.productividad.usuario.UsuarioController del backend — solo ADMIN. */
@Injectable({ providedIn: 'root' })
export class UsuarioAdminService {
  private readonly http = inject(HttpClient);

  listar(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${environment.apiUrl}/usuarios`);
  }

  crear(request: CrearUsuarioRequest): Observable<Usuario> {
    return this.http.post<Usuario>(`${environment.apiUrl}/usuarios`, request);
  }

  actualizar(id: number, request: ActualizarUsuarioRequest): Observable<Usuario> {
    return this.http.put<Usuario>(`${environment.apiUrl}/usuarios/${id}`, request);
  }

  cambiarPassword(id: number, nuevaPassword: string): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/usuarios/${id}/password`, { nuevaPassword });
  }
}
