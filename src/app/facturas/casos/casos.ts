import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { interval } from 'rxjs';
import { CasoFactura, TipoGeneracion } from '../../core/models/caso-factura.model';
import { Proceso } from '../../core/models/proceso.model';
import { FacturaService } from '../../core/services/factura.service';
import { ProcesoService } from '../../core/services/proceso.service';

/** Iniciar/finalizar un caso de factura — pestaña "Casos" dentro de Facturas (ver facturas-shell). */
@Component({
  selector: 'app-casos',
  imports: [ReactiveFormsModule],
  templateUrl: './casos.html',
  styleUrl: './casos.scss',
})
export class Casos {
  private readonly procesoService = inject(ProcesoService);
  private readonly facturaService = inject(FacturaService);
  private readonly fb = inject(FormBuilder);

  readonly procesos = signal<Proceso[]>([]);
  readonly procesosActivos = computed(() => this.procesos().filter((p) => p.activo));

  readonly enCurso = signal<CasoFactura | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  // Tick cada segundo solo para forzar el recálculo de tiempoTranscurrido — no se usa el valor en sí.
  private readonly tick = toSignal(interval(1000), { initialValue: 0 });
  readonly tiempoTranscurrido = computed(() => {
    this.tick();
    const caso = this.enCurso();
    if (!caso) {
      return '00:00';
    }
    const segundos = Math.floor((Date.now() - new Date(caso.horaInicio).getTime()) / 1000);
    return this.formatearDuracion(Math.max(0, segundos));
  });

  readonly form = this.fb.nonNullable.group({
    // Validators.required por sí solo no rechaza un valor de solo espacios — Validators.pattern
    // con \S exige al menos un caracter que no sea espacio.
    numeroFactura: ['', [Validators.required, Validators.pattern(/\S/)]],
    procesoId: this.fb.control<number | null>(null, Validators.required),
    tipoGeneracion: this.fb.nonNullable.control<TipoGeneracion>('MANUAL', Validators.required),
  });

  constructor() {
    this.procesoService.listar().subscribe((procesos) => this.procesos.set(procesos));
    this.facturaService.enCurso().subscribe((caso) => this.enCurso.set(caso));
  }

  iniciar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.cargando.set(true);
    this.error.set(null);
    const { numeroFactura, procesoId, tipoGeneracion } = this.form.getRawValue();

    this.facturaService.iniciar({ numeroFactura, procesoId: procesoId!, tipoGeneracion }).subscribe({
      next: (caso) => {
        this.enCurso.set(caso);
        this.form.reset({ numeroFactura: '', procesoId: null, tipoGeneracion: 'MANUAL' });
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'No se pudo iniciar el caso.');
        this.cargando.set(false);
      },
    });
  }

  finalizar(): void {
    const caso = this.enCurso();
    if (!caso) {
      return;
    }
    this.cargando.set(true);
    this.error.set(null);
    this.facturaService.finalizar(caso.id).subscribe({
      next: () => {
        this.enCurso.set(null);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'No se pudo finalizar el caso.');
        this.cargando.set(false);
      },
    });
  }

  private formatearDuracion(totalSegundos: number): string {
    const minutos = Math.floor(totalSegundos / 60);
    const segundos = totalSegundos % 60;
    return `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
  }
}
