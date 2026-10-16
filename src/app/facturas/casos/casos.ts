import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CasoFactura } from '../../core/models/caso-factura.model';
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
  // true hasta que se confirma si hay o no un caso en curso — evita mostrar el formulario un
  // instante antes de que la respuesta de enCurso() llegue (se nota sobre todo al volver de la
  // pestaña Productividad, que recrea este componente).
  readonly cargandoInicial = signal(true);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  // Reloj en vivo del caso en curso. Nada de toSignal(interval(...)) acá: con setInterval directo
  // sobre un signal no hay ninguna duda de que cada tick dispare change detection (toSignal sobre
  // un Observable de rxjs quedó, en la práctica, sin actualizar la vista mientras el componente
  // seguía montado).
  private readonly ahora = signal(Date.now());

  readonly tiempoTranscurrido = computed(() => {
    const caso = this.enCurso();
    if (!caso) {
      return '00:00';
    }
    const segundos = Math.floor((this.ahora() - new Date(caso.horaInicio).getTime()) / 1000);
    return this.formatearDuracion(Math.max(0, segundos));
  });

  readonly form = this.fb.nonNullable.group({
    // Validators.required por sí solo no rechaza un valor de solo espacios — Validators.pattern
    // con \S exige al menos un caracter que no sea espacio.
    numeroFactura: ['', [Validators.required, Validators.pattern(/\S/)]],
    procesoId: this.fb.control<number | null>(null, Validators.required),
  });

  constructor() {
    const intervalId = setInterval(() => this.ahora.set(Date.now()), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(intervalId));

    this.procesoService.listar().subscribe((procesos) => this.procesos.set(procesos));
    this.facturaService.enCurso().subscribe({
      next: (caso) => {
        this.enCurso.set(caso);
        this.cargandoInicial.set(false);
      },
      error: () => this.cargandoInicial.set(false),
    });
  }

  iniciar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.cargando.set(true);
    this.error.set(null);
    const { numeroFactura, procesoId } = this.form.getRawValue();

    this.facturaService.iniciar({ numeroFactura, procesoId: procesoId! }).subscribe({
      next: (caso) => {
        this.enCurso.set(caso);
        this.form.reset({ numeroFactura: '', procesoId: null });
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
