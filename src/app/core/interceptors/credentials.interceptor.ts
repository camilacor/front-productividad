import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/**
 * El backend vive en otro origen (distinto puerto) y la auth depende de una cookie HttpOnly
 * (ver docs/seguridad.md del backend) — sin `withCredentials: true` el navegador ni manda la
 * cookie de sesión en el request, ni guarda el `Set-Cookie` de la respuesta de /login. Angular
 * no tiene un `provideHttpClient` para esto por default; se fuerza acá para todas las llamadas al
 * backend, así cada servicio no tiene que acordarse de ponerlo.
 */
export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }
  return next(req.clone({ withCredentials: true }));
};
