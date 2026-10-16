import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RendimientoPorEmpleado, RendimientoProceso } from '../../core/models/caso-factura.model';
import { Proceso } from '../../core/models/proceso.model';
import { AuthService } from '../../core/services/auth.service';
import { FacturaService } from '../../core/services/factura.service';
import { ProcesoService } from '../../core/services/proceso.service';

type Periodo = 'dia' | 'semana' | 'mes';

/** Consulta de rendimiento por proceso — separado de Facturas (iniciar/finalizar), ver app.routes. */
@Component({
  selector: 'app-productividad',
  imports: [DecimalPipe],
  templateUrl: './productividad.html',
  styleUrl: './productividad.scss',
})
export class Productividad {
  private readonly procesoService = inject(ProcesoService);
  private readonly facturaService = inject(FacturaService);
  private readonly authService = inject(AuthService);

  readonly procesos = signal<Proceso[]>([]);
  readonly periodo = signal<Periodo>('dia');
  readonly procesoSeleccionadoId = signal<number | null>(null);
  readonly rendimiento = signal<RendimientoProceso | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  // La "visual de todos los empleados" — el backend ya la restringe a roles != EMPLEADO, acá solo
  // evitamos pedirla (y mostrar una sección vacía) para alguien que de entrada no la puede ver.
  readonly puedeVerPorEmpleado = computed(() => this.authService.usuario()?.rol !== 'EMPLEADO');
  readonly rendimientoPorEmpleado = signal<RendimientoPorEmpleado | null>(null);

  constructor() {
    this.procesoService.listar().subscribe((procesos) => this.procesos.set(procesos));
  }

  onProcesoChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.procesoSeleccionadoId.set(value ? Number(value) : null);
  }

  exportarUrl(): string | null {
    const procesoId = this.procesoSeleccionadoId();
    return procesoId ? this.facturaService.exportarRendimientoUrl(procesoId) : null;
  }

  consultar(): void {
    const procesoId = this.procesoSeleccionadoId();
    if (!procesoId) {
      this.error.set('Seleccione un proceso primero.');
      return;
    }
    this.error.set(null);
    this.cargando.set(true);
    const { desde, hasta } = this.rangoPeriodo(this.periodo());

    this.facturaService.rendimiento(procesoId, desde, hasta).subscribe({
      next: (resultado) => {
        this.rendimiento.set(resultado);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'No se pudo consultar el rendimiento.');
        this.cargando.set(false);
      },
    });

    if (this.puedeVerPorEmpleado()) {
      this.facturaService.rendimientoPorEmpleado(procesoId, desde, hasta).subscribe({
        next: (resultado) => this.rendimientoPorEmpleado.set(resultado),
        error: () => this.rendimientoPorEmpleado.set(null),
      });
    }
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
}
