import { Component } from '@angular/core';

interface AdminSection {
  label: string;
  description: string;
}

/** Áreas de configuración de ADMIN descritas en docs/producto.md del backend — ninguna tiene backend todavía. */
const SECTIONS: AdminSection[] = [
  { label: 'Usuarios y roles', description: 'Alta de personas, asignación de rol y equipo.' },
  { label: 'Procesos', description: 'Procesos de facturación configurables, con rendimiento aislado entre sí.' },
  { label: 'Metas mensuales', description: 'Meta de productividad configurable mes a mes, por proceso.' },
];

/** Solo accesible para rol ADMIN — ver role.guard.ts y app.routes.ts. */
@Component({
  selector: 'app-admin',
  imports: [],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class Admin {
  readonly sections = SECTIONS;
}
