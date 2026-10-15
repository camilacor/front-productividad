import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { interval } from 'rxjs';
import { CasoFactura, RendimientoProceso, TipoGeneracion } from '../core/models/caso-factura.model';
import { Proceso } from '../core/models/proceso.model';
import { FacturaService } from '../core/services/factura.service';
import { ProcesoService } from '../core/services/proceso.service';

type Periodo = 'dia' | 'semana' | 'mes';

@Component({
  selector: 'app-facturas',
  imports: [ReactiveFormsModule, DecimalPipe],
  templateUrl: './facturas.html',
  styleUrl: './facturas.scss',
})
export class Facturas {
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
    numeroFactura: ['', Validators.required],
    procesoId: this.fb.control<number | null>(null, Validators.required),
    tipoGeneracion: this.fb.nonNullable.control<TipoGeneracion>('MANUAL', Validators.required),
  });

  readonly periodo = signal<Periodo>('dia');
  readonly procesoRendimientoId = signal<number | null>(null);
  readonly rendimiento = signal<RendimientoProceso | null>(null);
  readonly cargandoRendimiento = signal(false);
  readonly errorRendimiento = signal<string | null>(null);

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

  onProcesoRendimientoChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.procesoRendimientoId.set(value ? Number(value) : null);
  }

  consultarRendimiento(): void {
    const procesoId = this.procesoRendimientoId();
    if (!procesoId) {
      this.errorRendimiento.set('Seleccione un proceso primero.');
      return;
    }
    this.errorRendimiento.set(null);
    this.cargandoRendimiento.set(true);
    const { desde, hasta } = this.rangoPeriodo(this.periodo());

    this.facturaService.rendimiento(procesoId, desde, hasta).subscribe({
      next: (resultado) => {
        this.rendimiento.set(resultado);
        this.cargandoRendimiento.set(false);
      },
      error: (err) => {
        this.errorRendimiento.set(err.error?.message ?? 'No se pudo consultar el rendimiento.');
        this.cargandoRendimiento.set(false);
      },
    });
  }

  private rangoPeriodo(periodo: Periodo): { desde: string; hasta: string } {
    const hasta = new Date();
    const desde = new Date(hasta);

    if (periodo === 'dia') {
      desde.setHours(0, 0, 0, 0);
    } else if (periodo === 'semana') {
      const diaSemanaLunesIndex0 = (desde.getDay() + 6) % 7;
      desde.setDate(desde.getDate() - diaSemanaLunesIndex0);
      desde.setHours(0, 0, 0, 0);
    } else {
      desde.setDate(1);
      desde.setHours(0, 0, 0, 0);
    }

    return { desde: desde.toISOString(), hasta: hasta.toISOString() };
  }

  private formatearDuracion(totalSegundos: number): string {
    const minutos = Math.floor(totalSegundos / 60);
    const segundos = totalSegundos % 60;
    return `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
  }
}
