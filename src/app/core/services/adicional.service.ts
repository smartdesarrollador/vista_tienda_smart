import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { map, catchError, tap, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Adicional,
  CreateAdicionalDto,
  UpdateAdicionalDto,
  FiltrosAdicional,
  AdicionalResponse,
  AdicionalesResponse,
  TipoAdicional,
  TIPOS_ADICIONAL,
  ALERGENOS_COMUNES,
  esAdicionalDisponible,
  obtenerAdicionalesPorTipo,
  calcularPrecioTotal,
  calcularTiempoPreparacionTotal,
} from '../models/adicional.interface';

@Injectable({
  providedIn: 'root',
})
export class AdicionalService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/vista/adicionales`;

  // Signals para estado reactivo
  private readonly adicionalesSignal = signal<Adicional[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly filtrosActualesSignal = signal<FiltrosAdicional>({});

  // Subjects para paginación y metadatos
  private readonly metaSubject = new BehaviorSubject<any>(null);
  private readonly filtrosSubject = new BehaviorSubject<FiltrosAdicional>({});

  // Computed signals
  readonly adicionales = this.adicionalesSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly filtrosActuales = this.filtrosActualesSignal.asReadonly();

  // Computed para estadísticas
  readonly totalAdicionales = computed(() => this.adicionales().length);
  readonly adicionalesActivos = computed(() =>
    this.adicionales().filter((adicional) => adicional.activo)
  );
  readonly adicionalesDisponibles = computed(() =>
    this.adicionales().filter((adicional) => esAdicionalDisponible(adicional))
  );
  readonly adicionalesPorTipo = computed(() => {
    const adicionales = this.adicionales();
    return TIPOS_ADICIONAL.reduce((acc, tipo) => {
      acc[tipo.value] = obtenerAdicionalesPorTipo(adicionales, tipo.value);
      return acc;
    }, {} as Record<TipoAdicional, Adicional[]>);
  });

  // Observables para compatibilidad
  readonly meta$ = this.metaSubject.asObservable();
  readonly filtros$ = this.filtrosSubject.asObservable();

  /**
   * Obtiene todos los adicionales con filtros opcionales
   */
  obtenerAdicionales(
    filtros: FiltrosAdicional = {}
  ): Observable<AdicionalesResponse> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.filtrosActualesSignal.set(filtros);
    this.filtrosSubject.next(filtros);

    let params = new HttpParams();

    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<AdicionalesResponse>(this.baseUrl, { params }).pipe(
      tap((response) => {
        if (response.success) {
          this.adicionalesSignal.set(response.data);
          this.metaSubject.next(response.meta);
        }
      }),
      catchError((error) => {
        this.errorSignal.set(this.manejarError(error));
        return throwError(() => error);
      }),
      finalize(() => this.loadingSignal.set(false))
    );
  }

  /**
   * Obtiene un adicional por ID
   */
  obtenerAdicional(id: number): Observable<AdicionalResponse> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.get<AdicionalResponse>(`${this.baseUrl}/${id}`).pipe(
      catchError((error) => {
        this.errorSignal.set(this.manejarError(error));
        return throwError(() => error);
      }),
      finalize(() => this.loadingSignal.set(false))
    );
  }

  /**
   * Crea un nuevo adicional
   */
  crearAdicional(adicional: CreateAdicionalDto): Observable<AdicionalResponse> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.post<AdicionalResponse>(this.baseUrl, adicional).pipe(
      tap((response) => {
        if (response.success) {
          const adicionalesActuales = this.adicionalesSignal();
          this.adicionalesSignal.set([...adicionalesActuales, response.data]);
        }
      }),
      catchError((error) => {
        this.errorSignal.set(this.manejarError(error));
        return throwError(() => error);
      }),
      finalize(() => this.loadingSignal.set(false))
    );
  }

  /**
   * Actualiza un adicional existente
   */
  actualizarAdicional(
    id: number,
    adicional: UpdateAdicionalDto
  ): Observable<AdicionalResponse> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http
      .put<AdicionalResponse>(`${this.baseUrl}/${id}`, adicional)
      .pipe(
        tap((response) => {
          if (response.success) {
            this.actualizarAdicionalEnLista(response.data);
          }
        }),
        catchError((error) => {
          this.errorSignal.set(this.manejarError(error));
          return throwError(() => error);
        }),
        finalize(() => this.loadingSignal.set(false))
      );
  }

  /**
   * Elimina un adicional
   */
  eliminarAdicional(id: number): Observable<any> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.delete(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        this.removerAdicionalDeLista(id);
      }),
      catchError((error) => {
        this.errorSignal.set(this.manejarError(error));
        return throwError(() => error);
      }),
      finalize(() => this.loadingSignal.set(false))
    );
  }

  /**
   * Métodos de filtrado específicos
   */
  obtenerAdicionalesPorTipo(
    tipo: TipoAdicional
  ): Observable<AdicionalesResponse> {
    return this.obtenerAdicionales({ tipo });
  }

  obtenerAdicionalesActivos(): Observable<AdicionalesResponse> {
    return this.obtenerAdicionales({ activo: true });
  }

  obtenerAdicionalesDisponibles(): Observable<AdicionalesResponse> {
    return this.obtenerAdicionales({ activo: true, disponible: true });
  }

  obtenerAdicionalesVegetarianos(): Observable<AdicionalesResponse> {
    return this.obtenerAdicionales({ vegetariano: true });
  }

  obtenerAdicionalesVeganos(): Observable<AdicionalesResponse> {
    return this.obtenerAdicionales({ vegano: true });
  }

  obtenerAdicionalesConStock(): Observable<AdicionalesResponse> {
    return this.obtenerAdicionales({ con_stock: true });
  }

  /**
   * Búsqueda de adicionales
   */
  buscarAdicionales(termino: string): Observable<AdicionalesResponse> {
    return this.obtenerAdicionales({ search: termino });
  }

  /**
   * Métodos de utilidad
   */
  calcularPrecioTotalAdicionales(
    adicionales: Adicional[],
    cantidades: { [key: number]: number }
  ): number {
    return calcularPrecioTotal(adicionales, cantidades);
  }

  calcularTiempoPreparacionTotalAdicionales(adicionales: Adicional[]): number {
    return calcularTiempoPreparacionTotal(adicionales);
  }

  validarAdicional(
    adicional: CreateAdicionalDto | UpdateAdicionalDto
  ): string[] {
    const errores: string[] = [];

    if (
      'nombre' in adicional &&
      (!adicional.nombre || adicional.nombre.trim().length < 2)
    ) {
      errores.push('El nombre debe tener al menos 2 caracteres');
    }

    if (
      'precio' in adicional &&
      (adicional.precio === undefined || adicional.precio < 0)
    ) {
      errores.push('El precio debe ser mayor o igual a 0');
    }

    if (
      'tipo' in adicional &&
      adicional.tipo &&
      !TIPOS_ADICIONAL.some((t) => t.value === adicional.tipo)
    ) {
      errores.push('El tipo de adicional no es válido');
    }

    if (
      'stock' in adicional &&
      adicional.stock !== undefined &&
      adicional.stock !== null &&
      adicional.stock < 0
    ) {
      errores.push('El stock no puede ser negativo');
    }

    if (
      'tiempo_preparacion' in adicional &&
      adicional.tiempo_preparacion !== undefined &&
      adicional.tiempo_preparacion !== null &&
      adicional.tiempo_preparacion < 0
    ) {
      errores.push('El tiempo de preparación no puede ser negativo');
    }

    if (
      'calorias' in adicional &&
      adicional.calorias !== undefined &&
      adicional.calorias !== null &&
      adicional.calorias < 0
    ) {
      errores.push('Las calorías no pueden ser negativas');
    }

    if ('alergenos' in adicional && adicional.alergenos) {
      const alergenosInvalidos = adicional.alergenos.filter(
        (alergeno) => !ALERGENOS_COMUNES.includes(alergeno.toLowerCase())
      );
      if (alergenosInvalidos.length > 0) {
        errores.push(
          `Alérgenos no reconocidos: ${alergenosInvalidos.join(', ')}`
        );
      }
    }

    return errores;
  }

  /**
   * Métodos de configuración
   */
  obtenerTiposDisponibles(): TipoAdicional[] {
    return TIPOS_ADICIONAL.map((tipo) => tipo.value);
  }

  obtenerAlergenosComunes(): string[] {
    return [...ALERGENOS_COMUNES];
  }

  obtenerOpcionesTipo() {
    return [...TIPOS_ADICIONAL];
  }

  /**
   * Exportación de datos
   */
  exportarAdicionales(formato: 'csv' | 'excel' = 'csv'): Observable<Blob> {
    const params = new HttpParams().set('formato', formato);

    return this.http
      .get(`${this.baseUrl}/exportar`, {
        params,
        responseType: 'blob',
      })
      .pipe(
        catchError((error) => {
          this.errorSignal.set(this.manejarError(error));
          return throwError(() => error);
        })
      );
  }

  /**
   * Estadísticas
   */
  obtenerEstadisticas(): Observable<any> {
    return this.http.get(`${this.baseUrl}/estadisticas`).pipe(
      catchError((error) => {
        this.errorSignal.set(this.manejarError(error));
        return throwError(() => error);
      })
    );
  }

  /**
   * Limpia el estado del servicio
   */
  limpiarEstado(): void {
    this.adicionalesSignal.set([]);
    this.errorSignal.set(null);
    this.filtrosActualesSignal.set({});
    this.metaSubject.next(null);
    this.filtrosSubject.next({});
  }

  /**
   * Refresca los datos
   */
  refrescar(): Observable<AdicionalesResponse> {
    const filtrosActuales = this.filtrosActuales();
    return this.obtenerAdicionales(filtrosActuales);
  }

  // Métodos privados
  private actualizarAdicionalEnLista(adicionalActualizado: Adicional): void {
    const adicionales = this.adicionalesSignal();
    const index = adicionales.findIndex(
      (a) => a.id === adicionalActualizado.id
    );

    if (index !== -1) {
      const nuevosAdicionales = [...adicionales];
      nuevosAdicionales[index] = adicionalActualizado;
      this.adicionalesSignal.set(nuevosAdicionales);
    }
  }

  private removerAdicionalDeLista(id: number): void {
    const adicionales = this.adicionalesSignal();
    const nuevosAdicionales = adicionales.filter((a) => a.id !== id);
    this.adicionalesSignal.set(nuevosAdicionales);
  }

  private manejarError(error: any): string {
    console.error('Error en AdicionalService:', error);

    if (error.error?.message) {
      return error.error.message;
    }

    if (error.message) {
      return error.message;
    }

    switch (error.status) {
      case 400:
        return 'Datos inválidos. Por favor, revise la información ingresada.';
      case 401:
        return 'No tiene permisos para realizar esta acción.';
      case 403:
        return 'Acceso denegado.';
      case 404:
        return 'Adicional no encontrado.';
      case 422:
        return 'Error de validación. Revise los datos ingresados.';
      case 500:
        return 'Error interno del servidor. Intente nuevamente más tarde.';
      default:
        return 'Ha ocurrido un error inesperado.';
    }
  }
}
