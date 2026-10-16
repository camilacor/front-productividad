import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./auth/login/login').then((m) => m.Login) },
  // No hay vistas públicas: todo lo que no sea /login exige sesión.
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/layout').then((m) => m.Layout),
    children: [
      { path: '', loadComponent: () => import('./dashboard/dashboard').then((m) => m.Dashboard) },
      {
        path: 'facturas',
        loadComponent: () => import('./facturas/facturas-shell').then((m) => m.FacturasShell),
        children: [
          { path: '', loadComponent: () => import('./facturas/casos/casos').then((m) => m.Casos) },
          {
            path: 'productividad',
            loadComponent: () => import('./facturas/productividad/productividad').then((m) => m.Productividad),
          },
        ],
      },
      { path: 'permisos', loadComponent: () => import('./permisos/permisos').then((m) => m.Permisos) },
      {
        path: 'admin',
        canActivate: [roleGuard('ADMIN')],
        loadComponent: () => import('./admin/admin').then((m) => m.Admin),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
