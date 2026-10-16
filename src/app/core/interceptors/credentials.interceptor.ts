import { DOCUMENT } from '@angular/common';
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';

const NOMBRE_COOKIE_XSRF = 'XSRF-TOKEN';
const NOMBRE_HEADER_XSRF = 'X-XSRF-TOKEN';
const METODOS_MUTANTES = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * El backend vive en otro origen (distinto puerto) y la auth depende de una cookie HttpOnly
 * (ver docs/seguridad.md del backend) — sin `withCredentials: true` el navegador ni manda la
 * cookie de sesión en el request, ni guarda el `Set-Cookie` de la respuesta de /login. Angular
 * no tiene un `provideHttpClient` para esto por default; se fuerza acá para todas las llamadas al
 * backend, así cada servicio no tiene que acordarse de ponerlo.
 *
 * También se adjunta acá el header CSRF a mano: el interceptor que trae Angular
 * (`withXsrfConfiguration`) solo lo adjunta en URLs *relativas* (las trata como mismo origen); como
 * `environment.apiUrl` es una URL absoluta a otro origen a propósito, Angular nunca manda el
 * header y el backend rechaza cualquier POST/PUT/PATCH/DELETE con 403 "No autorizado" — excepto
 * /login, que está exceptuado de CSRF en el backend.
 */
export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  let request = req.clone({ withCredentials: true });

  if (METODOS_MUTANTES.has(req.method) && !request.headers.has(NOMBRE_HEADER_XSRF)) {
    const token = leerCookie(inject(DOCUMENT), NOMBRE_COOKIE_XSRF);
    if (token) {
      request = request.clone({ headers: request.headers.set(NOMBRE_HEADER_XSRF, token) });
    }
  }

  return next(request);
};

function leerCookie(document: Document, nombre: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${nombre}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}
