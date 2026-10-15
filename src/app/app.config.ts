import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
  withXsrfConfiguration,
} from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { routes } from './app.routes';
import { credentialsInterceptor } from './core/interceptors/credentials.interceptor';
import { AuthService } from './core/services/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(
      withFetch(),
      withInterceptors([credentialsInterceptor]),
      // Nombres explícitos aunque coinciden con los defaults de Angular: son justo los que
      // espera CookieCsrfTokenRepository.withHttpOnlyFalse() del backend (ver docs/seguridad.md).
      withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' }),
    ),
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
