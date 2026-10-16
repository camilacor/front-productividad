import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Empleado, RendimientoPorEmpleado, RendimientoProceso } from '../../core/models/caso-factura.model';
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

  // Rango de fechas propio para Consultar — si se completan ambas fechas, reemplazan los botones
  // Hoy/Esta semana/Este mes.
  readonly rangoDesde = signal<string | null>(null);
  readonly rangoHasta = signal<string | null>(null);

  // Filtro por empleado puntual: la lista sale de /facturas/empleados (todos los usuarios),
  // independiente del proceso consultado — así "todos los procesos" se puede combinar con un
  // empleado puntual sin que dependa de que esa persona haya salido en la última consulta.
  readonly empleadosDisponibles = signal<Empleado[]>([]);
  readonly empleadoSeleccionadoId = signal<number | null>(null);

  // Exportación: proceso puntual (o todos) y, opcionalmente, un rango de fechas propio en vez del
  // día/semana/mes fijo — ver FacturaController.exportarRendimientoPorEmpleado en el backend. El
  // filtro de empleado se comparte con la consulta en pantalla (empleadoSeleccionadoId).
  readonly exportarTodosProcesos = signal(false);
  readonly exportarDesde = signal<string | null>(null);
  readonly exportarHasta = signal<string | null>(null);

  readonly puedeExportar = computed(() => {
    const procesoElegido = this.exportarTodosProcesos() || this.procesoSeleccionadoId() !== null;
    const rangoValido =
      (!this.exportarDesde() && !this.exportarHasta()) || (!!this.exportarDesde() && !!this.exportarHasta());
    return procesoElegido && rangoValido;
  });

  constructor() {
    this.procesoService.listar().subscribe((procesos) => this.procesos.set(procesos));
    if (this.puedeVerPorEmpleado()) {
      this.facturaService.listarEmpleados().subscribe((empleados) => this.empleadosDisponibles.set(empleados));
    }
  }

  onProcesoChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.procesoSeleccionadoId.set(value ? Number(value) : null);
  }

  exportarUrl(): string {
    const procesoId = this.exportarTodosProcesos() ? null : this.procesoSeleccionadoId();
    return this.facturaService.exportarRendimientoUrl({
      procesoId,
      desde: this.exportarDesde(),
      hasta: this.exportarHasta(),
      usuarioId: this.empleadoSeleccionadoId(),
    });
  }

  onRangoDesdeChange(event: Event): void {
    this.rangoDesde.set((event.target as HTMLInputElement).value || null);
  }

  onRangoHastaChange(event: Event): void {
    this.rangoHasta.set((event.target as HTMLInputElement).value || null);
  }

  onEmpleadoChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.empleadoSeleccionadoId.set(value ? Number(value) : null);
  }

  onTodosProcesosChange(event: Event): void {
    this.exportarTodosProcesos.set((event.target as HTMLInputElement).checked);
  }

  onExportarDesdeChange(event: Event): void {
    this.exportarDesde.set((event.target as HTMLInputElement).value || null);
  }

  onExportarHastaChange(event: Event): void {
    this.exportarHasta.set((event.target as HTMLInputElement).value || null);
  }

  consultar(): void {
    const procesoId = this.procesoSeleccionadoId();
    if (!procesoId) {
      this.error.set('Seleccione un proceso primero.');
      return;
    }
    this.error.set(null);
    this.cargando.set(true);
    const { desde, hasta } = this.rangoConsulta();
    const usuarioId = this.empleadoSeleccionadoId();

    this.facturaService.rendimiento(procesoId, desde, hasta, usuarioId).subscribe({
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
      this.facturaService.rendimientoPorEmpleado(procesoId, desde, hasta, usuarioId).subscribe({
        next: (resultado) => this.rendimientoPorEmpleado.set(resultado),
        error: () => this.rendimientoPorEmpleado.set(null),
      });
    }
  }

  private rangoConsulta(): { desde: string; hasta: string } {
    const desde = this.rangoDesde();
    const hasta = this.rangoHasta();
    if (desde && hasta) {
      return {
        desde: new Date(`${desde}T00:00:00`).toISOString(),
        hasta: new Date(`${hasta}T23:59:59.999`).toISOString(),
      };
    }
    return this.rangoPeriodo(this.periodo());
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
