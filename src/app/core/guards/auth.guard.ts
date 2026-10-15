import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Exige sesión iniciada — esta plataforma no tiene vistas públicas, así que se usa en toda ruta
 * que no sea /login. Asume que `me()` ya corrió (vía el inicializador en app.config.ts) antes de
 * navegar, por eso lee el signal `usuario` en vez de volver a pegarle al backend.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.usuario() ? true : router.createUrlTree(['/login']);
};
