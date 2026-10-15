import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./auth/login/login').then((m) => m.Login) },
  // No hay vistas públicas: todo lo que no sea /login exige sesión.
  {
    path: '',
    pathMatch: 'full',
    canActivate: [authGuard],
    loadComponent: () => import('./home/home').then((m) => m.Home),
  },
  { path: '**', redirectTo: '' },
];
