import { Component, computed, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Equipo } from '../../core/models/equipo.model';
import { Usuario } from '../../core/models/usuario.model';
import { EquipoService } from '../../core/services/equipo.service';
import { UsuarioAdminService } from '../../core/services/usuario-admin.service';

/** Alta y gestión de equipos — solo ADMIN. El jefeInmediato resuelve la jerarquía de Permisos. */
@Component({
  selector: 'app-equipos',
  imports: [ReactiveFormsModule],
  templateUrl: './equipos.html',
  styleUrl: './equipos.scss',
})
export class Equipos {
  private readonly equipoService = inject(EquipoService);
  private readonly usuarioService = inject(UsuarioAdminService);
  private readonly fb = inject(FormBuilder);

  readonly equipos = signal<Equipo[]>([]);
  readonly usuarios = signal<Usuario[]>([]);
  // El backend exige que el jefeInmediato de un equipo tenga rol JEFE_INMEDIATO — se filtra acá
  // para no dejar elegir a alguien que el backend va a rechazar con 409.
  readonly jefesDisponibles = computed(() => this.usuarios().filter((u) => u.rol === 'JEFE_INMEDIATO'));

  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly formCrear = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    jefeInmediatoId: this.fb.control<number | null>(null),
  });

  readonly filas = this.fb.array<FormGroup>([]);

  constructor() {
    this.usuarioService.listar().subscribe((lista) => this.usuarios.set(lista));
    this.cargarEquipos();
  }

  fila(i: number): FormGroup {
    return this.filas.at(i) as FormGroup;
  }

  crear(): void {
    if (this.formCrear.invalid) {
      this.formCrear.markAllAsTouched();
      return;
    }
    this.cargando.set(true);
    this.error.set(null);
    this.equipoService.crear(this.formCrear.getRawValue()).subscribe({
      next: () => {
        this.formCrear.reset({ nombre: '', jefeInmediatoId: null });
        this.cargarEquipos();
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'No se pudo crear el equipo.');
        this.cargando.set(false);
      },
    });
  }

  guardar(i: number): void {
    const equipo = this.equipos()[i];
    this.error.set(null);
    this.equipoService.actualizar(equipo.id, this.fila(i).getRawValue()).subscribe({
      next: () => this.cargarEquipos(),
      error: (err) => this.error.set(err.error?.message ?? 'No se pudo actualizar el equipo.'),
    });
  }

  private cargarEquipos(): void {
    this.equipoService.listar().subscribe((lista) => {
      this.equipos.set(lista);
      this.filas.clear();
      for (const e of lista) {
        this.filas.push(
          this.fb.group({
            nombre: [e.nombre, Validators.required],
            jefeInmediatoId: [e.jefeInmediatoId],
          }),
        );
      }
    });
  }
}
