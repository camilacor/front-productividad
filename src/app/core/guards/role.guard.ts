import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Rol } from '../models/usuario.model';
import { AuthService } from '../services/auth.service';

/**
 * Protege una ruta por rol — espejo del `hasAnyRole(...)` que se usa en `SecurityConfig` del
 * backend. Asume que `me()` ya corrió (vía el inicializador en `app.config.ts`) antes de navegar,
 * así que lee el signal `usuario` en vez de volver a pegarle al backend.
 *
 * Uso: `{ path: 'permisos', canActivate: [roleGuard('JEFE_INMEDIATO', 'DIRECCION', 'ADMIN')], ... }`
 */
export function roleGuard(...rolesPermitidos: Rol[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const usuario = auth.usuario();

    if (!usuario) {
      return router.createUrlTree(['/login']);
    }
    if (!rolesPermitidos.includes(usuario.rol)) {
      return router.createUrlTree(['/']);
    }
    return true;
  };
}
