import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, tap, throwError, finalize } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  DetalleAdicional,
  CreateDetalleAdicionalDto,
  UpdateDetalleAdicionalDto,
  FiltrosDetalleAdicional,
  DetalleAdicionalResponse,
  DetallesAdicionalesResponse,
  EstadisticasDetalleAdicional,
  AdicionalesPorDetallePedido,
  DetallesPorAdicional,
  ResumenPedidoAdicionales,
  validarDetalleAdicional,
  calcularEstadisticas,
  agruparPorDetallePedido,
  agruparPorAdicional,
  agruparPorPedido,
  filtrarPorDetallePedido,
  filtrarPorAdicional,
  filtrarPorPedido,
  filtrarPorTipoAdicional,
  filtrarConObservaciones,
  filtrarConDiferenciaPrecio,
  filtrarPorRangoPrecio,
  ordenarPorPrecio,
  ordenarPorCantidad,
  ordenarPorSubtotal,
  buscarDetallesAdicionales,
  obtenerTotalValorAdicionales,
  obtenerTotalCantidadAdicionales,
  validarConsistenciaPrecios,
  generarResumenDetallePedido,
} from '../models/detalle-adicional.interface';

@Injectable({
  providedIn: 'root',
})
export class DetalleAdicionalService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/vista/detalle-adicionales`;

  // Estados reactivos con signals
  private readonly _detallesAdicionales = signal<DetalleAdicional[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _filtros = signal<FiltrosDetalleAdicional>({});
  private readonly _estadisticas = signal<EstadisticasDetalleAdicional | null>(
    null
  );

  // Signals computados para acceso público
  readonly detallesAdicionales = this._detallesAdicionales.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly filtros = this._filtros.asReadonly();
  readonly estadisticas = this._estadisticas.asReadonly();

  // Computed signals para análisis de datos
  readonly totalDetalles = computed(() => this._detallesAdicionales().length);
  readonly totalValor = computed(() =>
    obtenerTotalValorAdicionales(this._detallesAdicionales())
  );
  readonly totalCantidad = computed(() =>
    obtenerTotalCantidadAdicionales(this._detallesAdicionales())
  );
  readonly hasError = computed(() => this._error() !== null);
  readonly isEmpty = computed(() => this._detallesAdicionales().length === 0);

  // Agrupaciones computadas
  readonly detallesPorPedido = computed(() =>
    agruparPorDetallePedido(this._detallesAdicionales())
  );
  readonly detallesPorAdicional = computed(() =>
    agruparPorAdicional(this._detallesAdicionales())
  );
  readonly resumenPorPedido = computed(() =>
    agruparPorPedido(this._detallesAdicionales())
  );

  // Filtros computados
  readonly detallesConObservaciones = computed(() =>
    filtrarConObservaciones(this._detallesAdicionales())
  );
  readonly detallesConDiferenciaPrecio = computed(() =>
    filtrarConDiferenciaPrecio(this._detallesAdicionales())
  );

  // Validaciones computadas
  readonly detallesConErrores = computed(() =>
    validarConsistenciaPrecios(this._detallesAdicionales())
  );
  readonly tieneErroresConsistencia = computed(
    () => this.detallesConErrores().length > 0
  );

  /**
   * Obtiene la lista de detalles adicionales con filtros opcionales
   */
  obtenerDetallesAdicionales(
    filtros: FiltrosDetalleAdicional = {}
  ): Observable<DetallesAdicionalesResponse> {
    this._loading.set(true);
    this._error.set(null);
    this._filtros.set(filtros);

    let params = new HttpParams();

    // Aplicar filtros
    if (filtros.detalle_pedido_id) {
      params = params.set(
        'detalle_pedido_id',
        filtros.detalle_pedido_id.toString()
      );
    }
    if (filtros.adicional_id) {
      params = params.set('adicional_id', filtros.adicional_id.toString());
    }
    if (filtros.page) {
      params = params.set('page', filtros.page.toString());
    }
    if (filtros.per_page) {
      params = params.set('per_page', filtros.per_page.toString());
    }
    if (filtros.sort_by) {
      params = params.set('sort_by', filtros.sort_by);
    }
    if (filtros.sort_direction) {
      params = params.set('sort_direction', filtros.sort_direction);
    }

    return this.http
      .get<DetallesAdicionalesResponse>(this.apiUrl, { params })
      .pipe(
        tap((response) => {
          if (response.success) {
            this._detallesAdicionales.set(response.data);
            this._estadisticas.set(calcularEstadisticas(response.data));
          }
        }),
        catchError((error) => {
          this._error.set('Error al obtener detalles adicionales');
          console.error('Error al obtener detalles adicionales:', error);
          return throwError(() => error);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Obtiene un detalle adicional específico por ID
   */
  obtenerDetalleAdicional(id: number): Observable<DetalleAdicionalResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.get<DetalleAdicionalResponse>(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => {
        this._error.set('Error al obtener el detalle adicional');
        console.error('Error al obtener detalle adicional:', error);
        return throwError(() => error);
      }),
      finalize(() => this._loading.set(false))
    );
  }

  /**
   * Crea un nuevo detalle adicional
   */
  crearDetalleAdicional(
    data: CreateDetalleAdicionalDto
  ): Observable<DetalleAdicionalResponse> {
    // Validar datos antes de enviar
    const errores = validarDetalleAdicional(data);
    if (errores.length > 0) {
      this._error.set(errores.join(', '));
      return throwError(() => new Error(errores.join(', ')));
    }

    this._loading.set(true);
    this._error.set(null);

    return this.http.post<DetalleAdicionalResponse>(this.apiUrl, data).pipe(
      tap((response) => {
        if (response.success) {
          // Actualizar la lista local
          const detallesActuales = this._detallesAdicionales();
          this._detallesAdicionales.set([...detallesActuales, response.data]);
          this._estadisticas.set(
            calcularEstadisticas(this._detallesAdicionales())
          );
        }
      }),
      catchError((error) => {
        this._error.set('Error al crear el detalle adicional');
        console.error('Error al crear detalle adicional:', error);
        return throwError(() => error);
      }),
      finalize(() => this._loading.set(false))
    );
  }

  /**
   * Actualiza un detalle adicional existente
   */
  actualizarDetalleAdicional(
    id: number,
    data: UpdateDetalleAdicionalDto
  ): Observable<DetalleAdicionalResponse> {
    // Validar datos antes de enviar
    const errores = validarDetalleAdicional(data);
    if (errores.length > 0) {
      this._error.set(errores.join(', '));
      return throwError(() => new Error(errores.join(', ')));
    }

    this._loading.set(true);
    this._error.set(null);

    return this.http
      .put<DetalleAdicionalResponse>(`${this.apiUrl}/${id}`, data)
      .pipe(
        tap((response) => {
          if (response.success) {
            // Actualizar la lista local
            const detallesActuales = this._detallesAdicionales();
            const index = detallesActuales.findIndex((d) => d.id === id);
            if (index !== -1) {
              const detallesActualizados = [...detallesActuales];
              detallesActualizados[index] = response.data;
              this._detallesAdicionales.set(detallesActualizados);
              this._estadisticas.set(
                calcularEstadisticas(detallesActualizados)
              );
            }
          }
        }),
        catchError((error) => {
          this._error.set('Error al actualizar el detalle adicional');
          console.error('Error al actualizar detalle adicional:', error);
          return throwError(() => error);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Elimina un detalle adicional
   */
  eliminarDetalleAdicional(
    id: number
  ): Observable<{ success: boolean; message: string }> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`)
      .pipe(
        tap((response) => {
          if (response.success) {
            // Actualizar la lista local
            const detallesActuales = this._detallesAdicionales();
            const detallesFiltrados = detallesActuales.filter(
              (d) => d.id !== id
            );
            this._detallesAdicionales.set(detallesFiltrados);
            this._estadisticas.set(calcularEstadisticas(detallesFiltrados));
          }
        }),
        catchError((error) => {
          this._error.set('Error al eliminar el detalle adicional');
          console.error('Error al eliminar detalle adicional:', error);
          return throwError(() => error);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Obtiene detalles adicionales por detalle de pedido
   */
  obtenerPorDetallePedido(
    detallePedidoId: number
  ): Observable<DetallesAdicionalesResponse> {
    return this.obtenerDetallesAdicionales({
      detalle_pedido_id: detallePedidoId,
    });
  }

  /**
   * Obtiene detalles adicionales por adicional
   */
  obtenerPorAdicional(
    adicionalId: number
  ): Observable<DetallesAdicionalesResponse> {
    return this.obtenerDetallesAdicionales({ adicional_id: adicionalId });
  }

  /**
   * Filtra los detalles actuales por detalle de pedido
   */
  filtrarPorDetallePedidoLocal(detallePedidoId: number): DetalleAdicional[] {
    return filtrarPorDetallePedido(
      this._detallesAdicionales(),
      detallePedidoId
    );
  }

  /**
   * Filtra los detalles actuales por adicional
   */
  filtrarPorAdicionalLocal(adicionalId: number): DetalleAdicional[] {
    return filtrarPorAdicional(this._detallesAdicionales(), adicionalId);
  }

  /**
   * Filtra los detalles actuales por pedido
   */
  filtrarPorPedidoLocal(pedidoId: number): DetalleAdicional[] {
    return filtrarPorPedido(this._detallesAdicionales(), pedidoId);
  }

  /**
   * Filtra los detalles actuales por tipo de adicional
   */
  filtrarPorTipoAdicionalLocal(tipo: string): DetalleAdicional[] {
    return filtrarPorTipoAdicional(this._detallesAdicionales(), tipo);
  }

  /**
   * Filtra los detalles actuales por rango de precio
   */
  filtrarPorRangoPrecioLocal(min: number, max: number): DetalleAdicional[] {
    return filtrarPorRangoPrecio(this._detallesAdicionales(), min, max);
  }

  /**
   * Ordena los detalles actuales por precio
   */
  ordenarPorPrecioLocal(
    direccion: 'asc' | 'desc' = 'desc'
  ): DetalleAdicional[] {
    return ordenarPorPrecio(this._detallesAdicionales(), direccion);
  }

  /**
   * Ordena los detalles actuales por cantidad
   */
  ordenarPorCantidadLocal(
    direccion: 'asc' | 'desc' = 'desc'
  ): DetalleAdicional[] {
    return ordenarPorCantidad(this._detallesAdicionales(), direccion);
  }

  /**
   * Ordena los detalles actuales por subtotal
   */
  ordenarPorSubtotalLocal(
    direccion: 'asc' | 'desc' = 'desc'
  ): DetalleAdicional[] {
    return ordenarPorSubtotal(this._detallesAdicionales(), direccion);
  }

  /**
   * Busca detalles adicionales por término
   */
  buscarDetallesAdicionalesLocal(termino: string): DetalleAdicional[] {
    return buscarDetallesAdicionales(this._detallesAdicionales(), termino);
  }

  /**
   * Genera resumen de un detalle de pedido específico
   */
  generarResumenDetallePedidoLocal(detallePedidoId: number) {
    return generarResumenDetallePedido(
      this._detallesAdicionales(),
      detallePedidoId
    );
  }

  /**
   * Crea múltiples detalles adicionales
   */
  crearMultiplesDetallesAdicionales(
    detalles: CreateDetalleAdicionalDto[]
  ): Observable<DetalleAdicionalResponse[]> {
    this._loading.set(true);
    this._error.set(null);

    // Validar todos los detalles
    const erroresValidacion: string[] = [];
    detalles.forEach((detalle, index) => {
      const errores = validarDetalleAdicional(detalle);
      if (errores.length > 0) {
        erroresValidacion.push(`Detalle ${index + 1}: ${errores.join(', ')}`);
      }
    });

    if (erroresValidacion.length > 0) {
      this._error.set(erroresValidacion.join('; '));
      this._loading.set(false);
      return throwError(() => new Error(erroresValidacion.join('; ')));
    }

    // Crear todas las peticiones
    const peticiones = detalles.map((detalle) =>
      this.http.post<DetalleAdicionalResponse>(this.apiUrl, detalle)
    );

    return new Observable((observer) => {
      Promise.all(peticiones.map((p) => p.toPromise()))
        .then((responses) => {
          const responsesFiltradas = responses.filter(
            (r) => r?.success
          ) as DetalleAdicionalResponse[];

          if (responsesFiltradas.length > 0) {
            // Actualizar la lista local
            const detallesActuales = this._detallesAdicionales();
            const nuevosDetalles = responsesFiltradas.map((r) => r.data);
            this._detallesAdicionales.set([
              ...detallesActuales,
              ...nuevosDetalles,
            ]);
            this._estadisticas.set(
              calcularEstadisticas(this._detallesAdicionales())
            );
          }

          observer.next(responsesFiltradas);
          observer.complete();
        })
        .catch((error) => {
          this._error.set('Error al crear múltiples detalles adicionales');
          console.error('Error al crear múltiples detalles:', error);
          observer.error(error);
        })
        .finally(() => {
          this._loading.set(false);
        });
    });
  }

  /**
   * Elimina múltiples detalles adicionales
   */
  eliminarMultiplesDetallesAdicionales(
    ids: number[]
  ): Observable<{ success: boolean; message: string }[]> {
    this._loading.set(true);
    this._error.set(null);

    const peticiones = ids.map((id) =>
      this.http.delete<{ success: boolean; message: string }>(
        `${this.apiUrl}/${id}`
      )
    );

    return new Observable((observer) => {
      Promise.all(peticiones.map((p) => p.toPromise()))
        .then((responses) => {
          const responsesFiltradas = responses.filter((r) => r?.success) as {
            success: boolean;
            message: string;
          }[];

          if (responsesFiltradas.length > 0) {
            // Actualizar la lista local
            const detallesActuales = this._detallesAdicionales();
            const detallesFiltrados = detallesActuales.filter(
              (d) => !ids.includes(d.id)
            );
            this._detallesAdicionales.set(detallesFiltrados);
            this._estadisticas.set(calcularEstadisticas(detallesFiltrados));
          }

          observer.next(responsesFiltradas);
          observer.complete();
        })
        .catch((error) => {
          this._error.set('Error al eliminar múltiples detalles adicionales');
          console.error('Error al eliminar múltiples detalles:', error);
          observer.error(error);
        })
        .finally(() => {
          this._loading.set(false);
        });
    });
  }

  /**
   * Actualiza la cantidad de un detalle adicional
   */
  actualizarCantidad(
    id: number,
    cantidad: number
  ): Observable<DetalleAdicionalResponse> {
    return this.actualizarDetalleAdicional(id, { cantidad });
  }

  /**
   * Actualiza el precio unitario de un detalle adicional
   */
  actualizarPrecioUnitario(
    id: number,
    precioUnitario: number
  ): Observable<DetalleAdicionalResponse> {
    return this.actualizarDetalleAdicional(id, {
      precio_unitario: precioUnitario,
    });
  }

  /**
   * Actualiza las observaciones de un detalle adicional
   */
  actualizarObservaciones(
    id: number,
    observaciones: string
  ): Observable<DetalleAdicionalResponse> {
    return this.actualizarDetalleAdicional(id, { observaciones });
  }

  /**
   * Exporta los detalles adicionales a CSV
   */
  exportarCSV(filtros: FiltrosDetalleAdicional = {}): string {
    const detalles = this._detallesAdicionales();

    const headers = [
      'ID',
      'Detalle Pedido ID',
      'Adicional ID',
      'Adicional Nombre',
      'Cantidad',
      'Precio Unitario',
      'Subtotal',
      'Observaciones',
      'Fecha Creación',
    ];

    const rows = detalles.map((detalle) => [
      detalle.id.toString(),
      detalle.detalle_pedido_id.toString(),
      detalle.adicional_id.toString(),
      detalle.adicional?.nombre || '',
      detalle.cantidad.toString(),
      detalle.precio_unitario.toString(),
      detalle.subtotal.toString(),
      detalle.observaciones || '',
      detalle.created_at,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    return csvContent;
  }

  /**
   * Exporta los detalles adicionales a Excel (formato CSV compatible)
   */
  exportarExcel(filtros: FiltrosDetalleAdicional = {}): string {
    return this.exportarCSV(filtros);
  }

  /**
   * Limpia el estado del servicio
   */
  limpiarEstado(): void {
    this._detallesAdicionales.set([]);
    this._error.set(null);
    this._filtros.set({});
    this._estadisticas.set(null);
  }

  /**
   * Recarga los datos con los filtros actuales
   */
  recargar(): Observable<DetallesAdicionalesResponse> {
    return this.obtenerDetallesAdicionales(this._filtros());
  }
}
