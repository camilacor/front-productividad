import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

/** Landing provisorio post-login — se reemplaza cuando exista el primer módulo real. */
@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
})
export class Home {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly usuario = this.authService.usuario;

  logout(): void {
    this.authService.logout().subscribe(() => this.router.navigateByUrl('/login'));
  }
}
