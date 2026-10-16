import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { routes } from './app.routes';
import { credentialsInterceptor } from './core/interceptors/credentials.interceptor';
import { AuthService } from './core/services/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // No hay zone.js como dependencia (ng new ya no lo agrega por default) — sin este provider
    // explícito, Angular no tiene ningún mecanismo garantizado para enterarse de que debe
    // re-renderizar tras un signal.set() que no se originó en un evento que Angular maneje
    // directamente (p. ej. un setInterval nativo, como el cronómetro de Casos).
    provideZonelessChangeDetection(),
    provideRouter(routes),
    // El soporte CSRF integrado de Angular (withXsrfConfiguration) solo adjunta el header en URLs
    // relativas — no sirve acá porque environment.apiUrl es absoluta (otro origen a propósito).
    // credentialsInterceptor hace ese trabajo a mano, ver sus comentarios.
    provideHttpClient(withFetch(), withInterceptors([credentialsInterceptor])),
    // Al arrancar la app: calienta la cookie CSRF y, si ya hay una sesión válida (cookie
    // access_token todavía vigente), restaura el usuario — necesario tras un refresh de página,
    // ya que el JWT no es legible desde JS.
    provideAppInitializer(() => {
      const authService = inject(AuthService);
      return firstValueFrom(authService.warmCsrf())
        .catch(() => undefined)
        .then(() => firstValueFrom(authService.me()).catch(() => undefined));
    }),
  ],
};
