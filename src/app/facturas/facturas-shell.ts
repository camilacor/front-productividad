import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

/** Contenedor de Facturas: título + pestañas (Casos / Productividad) + <router-outlet>. */
@Component({
  selector: 'app-facturas-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './facturas-shell.html',
  styleUrl: './facturas-shell.scss',
})
export class FacturasShell {}
