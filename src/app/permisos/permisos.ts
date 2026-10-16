import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { environment } from '../../environments/environment';
import { AuthService } from '../core/services/auth.service';
import { PermisoService } from '../core/services/permiso.service';
import { ESTADO_PERMISO_LABEL, EstadoPermiso, Permiso } from '../core/models/permiso.model';

/** Solicitud de permisos y aprobación en dos pasos (jefe inmediato → Dirección) — ver docs/producto.md. */
@Component({
  selector: 'app-permisos',
  imports: [ReactiveFormsModule],
  templateUrl: './permisos.html',
  styleUrl: './permisos.scss',
})
export class Permisos {
  private readonly authService = inject(AuthService);
  private readonly permisoService = inject(PermisoService);
  private readonly fb = inject(FormBuilder);

  readonly usuario = this.authService.usuario;
  readonly esJefe = computed(() => this.usuario()?.rol === 'JEFE_INMEDIATO');
  readonly esDireccion = computed(() => this.usuario()?.rol === 'DIRECCION');
  readonly puedeExportar = computed(() => {
    const rol = this.usuario()?.rol;
    return rol === 'ADMIN' || rol === 'DIRECCION';
  });
  // Navegación de página completa (no XHR): el cookie JWT (SameSite=Lax) viaja igual, y así nos
  // ahorramos lidiar con blobs/CORS solo para descargar un archivo.
  readonly exportarUrl = `${environment.apiUrl}/permisos/exportar`;

  readonly misSolicitudes = signal<Permiso[]>([]);
  readonly pendientesJefe = signal<Permiso[]>([]);
  readonly pendientesDireccion = signal<Permiso[]>([]);
  private readonly comentarios = signal<Record<number, string>>({});

  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    fechaInicio: ['', Validators.required],
    fechaFin: ['', Validators.required],
    pagado: [true],
    motivo: [''],
  });

  constructor() {
    this.cargarMisSolicitudes();
    if (this.esJefe()) {
      this.cargarPendientesJefe();
    }
    if (this.esDireccion()) {
      this.cargarPendientesDireccion();
    }
  }

  solicitar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.cargando.set(true);
    this.error.set(null);
    const { fechaInicio, fechaFin, pagado, motivo } = this.form.getRawValue();

    this.permisoService.solicitar({ fechaInicio, fechaFin, pagado, motivo }).subscribe({
      next: () => {
        this.form.reset({ fechaInicio: '', fechaFin: '', pagado: true, motivo: '' });
        this.cargarMisSolicitudes();
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'No se pudo solicitar el permiso.');
        this.cargando.set(false);
      },
    });
  }

  estadoLabel(estado: EstadoPermiso): string {
    return ESTADO_PERMISO_LABEL[estado];
  }

  comentario(id: number): string {
    return this.comentarios()[id] ?? '';
  }

  onComentarioChange(id: number, event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.comentarios.update((actual) => ({ ...actual, [id]: valor }));
  }

  aprobarJefe(id: number): void {
    this.error.set(null);
    this.permisoService.aprobarJefe(id, this.comentario(id)).subscribe({
      next: () => this.cargarPendientesJefe(),
      error: (err) => this.error.set(err.error?.message ?? 'No se pudo aprobar.'),
    });
  }

  rechazarJefe(id: number): void {
    this.error.set(null);
    this.permisoService.rechazarJefe(id, this.comentario(id)).subscribe({
      next: () => this.cargarPendientesJefe(),
      error: (err) => this.error.set(err.error?.message ?? 'No se pudo rechazar.'),
    });
  }

  aprobarDireccion(id: number): void {
    this.error.set(null);
    this.permisoService.aprobarDireccion(id, this.comentario(id)).subscribe({
      next: () => this.cargarPendientesDireccion(),
      error: (err) => this.error.set(err.error?.message ?? 'No se pudo aprobar.'),
    });
  }

  rechazarDireccion(id: number): void {
    this.error.set(null);
    this.permisoService.rechazarDireccion(id, this.comentario(id)).subscribe({
      next: () => this.cargarPendientesDireccion(),
      error: (err) => this.error.set(err.error?.message ?? 'No se pudo rechazar.'),
    });
  }

  private cargarMisSolicitudes(): void {
    this.permisoService.misSolicitudes().subscribe((lista) => this.misSolicitudes.set(lista));
  }

  private cargarPendientesJefe(): void {
    this.permisoService.pendientesParaJefe().subscribe((lista) => this.pendientesJefe.set(lista));
  }

  private cargarPendientesDireccion(): void {
    this.permisoService.pendientesParaDireccion().subscribe((lista) => this.pendientesDireccion.set(lista));
  }
}
