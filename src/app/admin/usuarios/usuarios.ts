import { Component, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Equipo } from '../../core/models/equipo.model';
import { Rol, Usuario } from '../../core/models/usuario.model';
import { EquipoService } from '../../core/services/equipo.service';
import { UsuarioAdminService } from '../../core/services/usuario-admin.service';

const ROLES: Rol[] = ['EMPLEADO', 'JEFE_INMEDIATO', 'DIRECCION', 'ADMIN'];

/** Alta y gestión de usuarios — solo ADMIN (ver role.guard y app.routes). */
@Component({
  selector: 'app-usuarios',
  imports: [ReactiveFormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss',
})
export class Usuarios {
  private readonly usuarioService = inject(UsuarioAdminService);
  private readonly equipoService = inject(EquipoService);
  private readonly fb = inject(FormBuilder);

  readonly roles = ROLES;
  readonly equipos = signal<Equipo[]>([]);
  readonly usuarios = signal<Usuario[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  private readonly nuevasPasswords = signal<Record<number, string>>({});

  readonly formCrear = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rol: this.fb.nonNullable.control<Rol>('EMPLEADO', Validators.required),
    equipoId: this.fb.control<number | null>(null),
  });

  // Una fila editable por usuario — se reconstruye cada vez que se recarga la lista.
  readonly filas = this.fb.array<FormGroup>([]);

  constructor() {
    this.equipoService.listar().subscribe((lista) => this.equipos.set(lista));
    this.cargarUsuarios();
  }

  fila(i: number): FormGroup {
    return this.filas.at(i) as FormGroup;
  }

  passwordPara(usuarioId: number): string {
    return this.nuevasPasswords()[usuarioId] ?? '';
  }

  onPasswordChange(usuarioId: number, event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.nuevasPasswords.update((actual) => ({ ...actual, [usuarioId]: valor }));
  }

  crear(): void {
    if (this.formCrear.invalid) {
      this.formCrear.markAllAsTouched();
      return;
    }
    this.cargando.set(true);
    this.error.set(null);
    this.usuarioService.crear(this.formCrear.getRawValue()).subscribe({
      next: () => {
        this.formCrear.reset({ nombre: '', email: '', password: '', rol: 'EMPLEADO', equipoId: null });
        this.cargarUsuarios();
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'No se pudo crear el usuario.');
        this.cargando.set(false);
      },
    });
  }

  guardar(i: number): void {
    const usuario = this.usuarios()[i];
    this.error.set(null);
    this.usuarioService.actualizar(usuario.id, this.fila(i).getRawValue()).subscribe({
      next: () => this.cargarUsuarios(),
      error: (err) => this.error.set(err.error?.message ?? 'No se pudo actualizar el usuario.'),
    });
  }

  cambiarPassword(usuarioId: number): void {
    const nueva = this.passwordPara(usuarioId);
    if (!nueva || nueva.length < 6) {
      this.error.set('La contraseña nueva debe tener al menos 6 caracteres.');
      return;
    }
    this.error.set(null);
    this.usuarioService.cambiarPassword(usuarioId, nueva).subscribe({
      next: () => this.nuevasPasswords.update((actual) => ({ ...actual, [usuarioId]: '' })),
      error: (err) => this.error.set(err.error?.message ?? 'No se pudo cambiar la contraseña.'),
    });
  }

  private cargarUsuarios(): void {
    this.usuarioService.listar().subscribe((lista) => {
      this.usuarios.set(lista);
      this.filas.clear();
      for (const u of lista) {
        this.filas.push(
          this.fb.group({
            nombre: [u.nombre, Validators.required],
            rol: this.fb.nonNullable.control<Rol>(u.rol, Validators.required),
            activo: [u.activo],
            equipoId: [u.equipoId],
          }),
        );
      }
    });
  }
}
