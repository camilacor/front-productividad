import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { Rol } from '../core/models/usuario.model';

interface MenuItem {
  label: string;
  path: string;
  /** Si se omite, el item es visible para cualquier rol autenticado. */
  roles?: Rol[];
  /** Si tiene hijos, el item se muestra como encabezado de grupo con un submenú debajo. */
  children?: MenuItem[];
}

const MENU_ITEMS: MenuItem[] = [
  { label: 'Inicio', path: '' },
  {
    label: 'Facturas',
    path: 'facturas',
    children: [
      { label: 'Casos', path: 'facturas' },
      { label: 'Productividad', path: 'facturas/productividad' },
    ],
  },
  { label: 'Permisos', path: 'permisos' },
  { label: 'Administración', path: 'admin', roles: ['ADMIN'] },
];

/** Shell de la app autenticada: topbar + menú lateral (con submenús) filtrado por rol + <router-outlet>. */
@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class Layout {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly usuario = this.authService.usuario;

  readonly menuItems = computed(() => {
    const rol = this.usuario()?.rol;
    const visible = (item: MenuItem) => !item.roles || (!!rol && item.roles.includes(rol));
    return MENU_ITEMS.filter(visible).map((item) => ({
      ...item,
      children: item.children?.filter(visible),
    }));
  });

  logout(): void {
    this.authService.logout().subscribe(() => this.router.navigateByUrl('/login'));
  }
}
