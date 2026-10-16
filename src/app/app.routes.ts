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
        // SUPERVISOR es de solo lectura: no inicia/finaliza casos, solo ve Productividad.
        canActivate: [roleGuard('EMPLEADO', 'JEFE_INMEDIATO', 'DIRECCION', 'ADMIN')],
        loadComponent: () => import('./facturas/casos/casos').then((m) => m.Casos),
      },
      {
        path: 'facturas/productividad',
        loadComponent: () => import('./facturas/productividad/productividad').then((m) => m.Productividad),
      },
      {
        path: 'permisos',
        canActivate: [roleGuard('EMPLEADO', 'JEFE_INMEDIATO', 'DIRECCION', 'ADMIN')],
        loadComponent: () => import('./permisos/permisos').then((m) => m.Permisos),
      },
      { path: 'admin', pathMatch: 'full', redirectTo: 'admin/usuarios' },
      {
        path: 'admin/usuarios',
        canActivate: [roleGuard('ADMIN')],
        loadComponent: () => import('./admin/usuarios/usuarios').then((m) => m.Usuarios),
      },
      {
        path: 'admin/equipos',
        canActivate: [roleGuard('ADMIN')],
        loadComponent: () => import('./admin/equipos/equipos').then((m) => m.Equipos),
      },
      {
        path: 'admin/procesos',
        canActivate: [roleGuard('ADMIN')],
        loadComponent: () => import('./admin/procesos/procesos').then((m) => m.Procesos),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
