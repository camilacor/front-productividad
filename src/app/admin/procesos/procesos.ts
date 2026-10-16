import { Component, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MetaProceso } from '../../core/models/meta-proceso.model';
import { Proceso } from '../../core/models/proceso.model';
import { ProcesoService } from '../../core/services/proceso.service';

/**
 * Configuración de procesos y su meta mensual — "muy importante sobre facturación": acá se
 * configura el ritmo esperado por hora y la cantidad de facturas esperada (cumplimiento) por
 * proceso. La productividad REAL y las horas extra necesarias según esa productividad son datos
 * en vivo, no algo que se configure — se ven en Facturas → Productividad (ver hint abajo).
 */
@Component({
  selector: 'app-procesos',
  imports: [ReactiveFormsModule],
  templateUrl: './procesos.html',
  styleUrl: './procesos.scss',
})
export class Procesos {
  private readonly procesoService = inject(ProcesoService);
  private readonly fb = inject(FormBuilder);

  readonly procesos = signal<Proceso[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly procesoExpandidoId = signal<number | null>(null);
  private readonly metasPorProceso = signal<Record<number, MetaProceso[]>>({});

  readonly formCrear = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
  });

  readonly filas = this.fb.array<FormGroup>([]);

  readonly formMeta = this.fb.nonNullable.group({
    anio: [new Date().getFullYear(), [Validators.required, Validators.min(2000)]],
    mes: [new Date().getMonth() + 1, [Validators.required, Validators.min(1), Validators.max(12)]],
    metaDiariaPorPersona: [0, [Validators.required, Validators.min(0)]],
    diasHabiles: [0, [Validators.required, Validators.min(0)]],
    horasLaboralesDia: [8, [Validators.required, Validators.min(1)]],
  });

  constructor() {
    this.cargarProcesos();
  }

  fila(i: number): FormGroup {
    return this.filas.at(i) as FormGroup;
  }

  metasDe(procesoId: number): MetaProceso[] {
    return this.metasPorProceso()[procesoId] ?? [];
  }

  crear(): void {
    if (this.formCrear.invalid) {
      this.formCrear.markAllAsTouched();
      return;
    }
    this.cargando.set(true);
    this.error.set(null);
    this.procesoService.crear({ nombre: this.formCrear.getRawValue().nombre, activo: true }).subscribe({
      next: () => {
        this.formCrear.reset({ nombre: '' });
        this.cargarProcesos();
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'No se pudo crear el proceso.');
        this.cargando.set(false);
      },
    });
  }

  guardar(i: number): void {
    const proceso = this.procesos()[i];
    this.error.set(null);
    this.procesoService.actualizar(proceso.id, this.fila(i).getRawValue()).subscribe({
      next: () => this.cargarProcesos(),
      error: (err) => this.error.set(err.error?.message ?? 'No se pudo actualizar el proceso.'),
    });
  }

  toggleMeta(procesoId: number): void {
    if (this.procesoExpandidoId() === procesoId) {
      this.procesoExpandidoId.set(null);
      return;
    }
    this.procesoExpandidoId.set(procesoId);
    this.error.set(null);
    this.formMeta.reset({
      anio: new Date().getFullYear(),
      mes: new Date().getMonth() + 1,
      metaDiariaPorPersona: 0,
      diasHabiles: 0,
      horasLaboralesDia: 8,
    });
    this.cargarMetas(procesoId);
  }

  guardarMeta(): void {
    const procesoId = this.procesoExpandidoId();
    if (procesoId === null) {
      return;
    }
    if (this.formMeta.invalid) {
      this.formMeta.markAllAsTouched();
      return;
    }
    this.error.set(null);
    this.procesoService.definirMeta(procesoId, this.formMeta.getRawValue()).subscribe({
      next: () => this.cargarMetas(procesoId),
      error: (err) => this.error.set(err.error?.message ?? 'No se pudo guardar la meta.'),
    });
  }

  private cargarMetas(procesoId: number): void {
    this.procesoService.listarMetas(procesoId).subscribe((metas) => {
      this.metasPorProceso.update((actual) => ({ ...actual, [procesoId]: metas }));
    });
  }

  private cargarProcesos(): void {
    this.procesoService.listar().subscribe((lista) => {
      this.procesos.set(lista);
      this.filas.clear();
      for (const p of lista) {
        this.filas.push(
          this.fb.group({
            nombre: [p.nombre, Validators.required],
            activo: [p.activo],
          }),
        );
      }
    });
  }
}
