import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Usuario } from '../models/usuario.model';

/**
 * Espeja los endpoints de `com.productividad.auth.AuthController` (ver docs/seguridad.md del
 * backend). El JWT nunca llega aquí — vive en una cookie HttpOnly que el navegador maneja solo;
 * este servicio únicamente guarda el `Usuario` que el backend devuelve en el body.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly usuarioActual = signal<Usuario | null>(null);
  /** Usuario autenticado, o `null` si no hay sesión. Se actualiza tras login/logout/me(). */
  readonly usuario = this.usuarioActual.asReadonly();

  /**
   * "Calienta" la cookie `XSRF-TOKEN` (ver `credentialsInterceptor` y el guard de CSRF del
   * backend). Llamar una vez al arrancar la app, antes de cualquier POST/PUT/PATCH/DELETE.
   */
  warmCsrf(): Observable<void> {
    return this.http.get<void>(`${environment.apiUrl}/auth/csrf`);
  }

  login(email: string, password: string): Observable<Usuario> {
    return this.http
      .post<Usuario>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(tap((usuario) => this.usuarioActual.set(usuario)));
  }

  logout(): Observable<void> {
    return this.http
      .post<void>(`${environment.apiUrl}/auth/logout`, {})
      .pipe(tap(() => this.usuarioActual.set(null)));
  }

  /** Restaura la sesión (p. ej. al recargar la página) leyendo el usuario autenticado actual. */
  me(): Observable<Usuario> {
    return this.http
      .get<Usuario>(`${environment.apiUrl}/auth/me`)
      .pipe(tap((usuario) => this.usuarioActual.set(usuario)));
  }
}
