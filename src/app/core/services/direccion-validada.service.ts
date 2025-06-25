import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import {
  DireccionValidada,
  DireccionValidadaResponse,
  DireccionValidadaListResponse,
  CreateDireccionValidadaRequest,
  UpdateDireccionValidadaRequest,
  ValidarDireccionRequest,
  ValidarDireccionResponse,
  RevalidarDireccionesRequest,
  RevalidarDireccionesResponse,
  DireccionValidadaFilters,
  EstadisticasDireccionValidada,
  EstadoCobertura,
  ESTADOS_VALIDACION,
  formatearDistancia,
  formatearTiempoEntrega,
  obtenerTextoEstado,
  obtenerColorEstado,
} from '../models/direccion-validada.interface';

@Injectable({
  providedIn: 'root',
})
export class DireccionValidadaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/vista/direcciones-validadas`;
  private readonly publicApiUrl = `${environment.apiUrl}/direcciones-validadas`;

  // Signals para estado reactivo
  private readonly direccionesValidadasSignal = signal<DireccionValidada[]>([]);
  private readonly direccionSeleccionadaSignal =
    signal<DireccionValidada | null>(null);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly estadisticasSignal =
    signal<EstadisticasDireccionValidada | null>(null);
  private readonly filtrosSignal = signal<DireccionValidadaFilters>({});

  // Computed signals para datos derivados
  readonly direccionesValidadas = this.direccionesValidadasSignal.asReadonly();
  readonly direccionSeleccionada =
    this.direccionSeleccionadaSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly estadisticas = this.estadisticasSignal.asReadonly();
  readonly filtros = this.filtrosSignal.asReadonly();

  // Computed signals para filtros y estadísticas
  readonly direccionesEnCobertura = computed(() =>
    this.direccionesValidadas().filter((d) => d.en_zona_cobertura)
  );

  readonly direccionesFueraCobertura = computed(() =>
    this.direccionesValidadas().filter((d) => !d.en_zona_cobertura)
  );

  readonly direccionesConCoordenadas = computed(() =>
    this.direccionesValidadas().filter((d) => d.coordenadas !== null)
  );

  readonly direccionesSinCoordenadas = computed(() =>
    this.direccionesValidadas().filter((d) => d.coordenadas === null)
  );

  readonly totalDirecciones = computed(
    () => this.direccionesValidadas().length
  );

  readonly porcentajeCobertura = computed(() => {
    const total = this.totalDirecciones();
    if (total === 0) return 0;
    return Math.round((this.direccionesEnCobertura().length / total) * 100);
  });

  readonly costoPromedioEnvio = computed(() => {
    const direccionesConCosto = this.direccionesEnCobertura().filter(
      (d) => d.costo_envio_calculado !== null
    );

    if (direccionesConCosto.length === 0) return 0;

    const suma = direccionesConCosto.reduce(
      (acc, d) => acc + (d.costo_envio_calculado || 0),
      0
    );
    return Math.round((suma / direccionesConCosto.length) * 100) / 100;
  });

  readonly distanciaPromedio = computed(() => {
    const direccionesConDistancia = this.direccionesEnCobertura().filter(
      (d) => d.distancia_tienda_km !== null
    );

    if (direccionesConDistancia.length === 0) return 0;

    const suma = direccionesConDistancia.reduce(
      (acc, d) => acc + (d.distancia_tienda_km || 0),
      0
    );
    return Math.round((suma / direccionesConDistancia.length) * 100) / 100;
  });

  // Estado reactivo para compatibilidad con observables
  private direccionesSubject = new BehaviorSubject<DireccionValidada[]>([]);
  public direcciones$ = this.direccionesSubject.asObservable();

  private direccionSeleccionadaSubject =
    new BehaviorSubject<DireccionValidada | null>(null);
  public direccionSeleccionada$ =
    this.direccionSeleccionadaSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  /**
   * Obtiene la lista de direcciones validadas con filtros opcionales
   */
  getDireccionesValidadas(
    filters?: DireccionValidadaFilters
  ): Observable<DireccionValidadaListResponse> {
    this.setLoading(true);

    const params = this.buildHttpParams(filters);

    return this.http
      .get<DireccionValidadaListResponse>(this.apiUrl, { params })
      .pipe(
        tap((response) => {
          this.updateDirecciones(response.data);
          this.setLoading(false);
          if (filters) {
            this.filtrosSignal.set(filters);
          }
        }),
        catchError((error) => {
          this.setLoading(false);
          throw error;
        })
      );
  }

  /**
   * Obtiene una dirección validada por ID
   */
  getDireccionValidada(
    id: number,
    filters?: Partial<DireccionValidadaFilters>
  ): Observable<DireccionValidadaResponse> {
    this.setLoading(true);

    const params = this.buildHttpParams(filters);

    return this.http
      .get<DireccionValidadaResponse>(`${this.apiUrl}/${id}`, { params })
      .pipe(
        tap((response) => {
          this.setDireccionSeleccionada(response.data);
          this.setLoading(false);
        }),
        catchError((error) => {
          this.setLoading(false);
          throw error;
        })
      );
  }

  /**
   * Crea una nueva dirección validada
   */
  createDireccionValidada(
    data: CreateDireccionValidadaRequest
  ): Observable<DireccionValidadaResponse> {
    this.setLoading(true);

    return this.http.post<DireccionValidadaResponse>(this.apiUrl, data).pipe(
      tap((response) => {
        if (response.data) {
          const currentDirecciones = this.direccionesValidadasSignal();
          this.direccionesValidadasSignal.set([
            ...currentDirecciones,
            response.data,
          ]);
          this.updateSubjects();
        }
        this.setLoading(false);
      }),
      catchError((error) => {
        this.setLoading(false);
        throw error;
      })
    );
  }

  /**
   * Actualiza una dirección validada existente
   */
  updateDireccionValidada(
    id: number,
    data: UpdateDireccionValidadaRequest
  ): Observable<DireccionValidadaResponse> {
    this.setLoading(true);

    return this.http
      .put<DireccionValidadaResponse>(`${this.apiUrl}/${id}`, data)
      .pipe(
        tap((response) => {
          if (response.data) {
            const currentDirecciones = this.direccionesValidadasSignal();
            const updatedDirecciones = currentDirecciones.map((dir) =>
              dir.id === id ? response.data : dir
            );
            this.direccionesValidadasSignal.set(updatedDirecciones);

            // Actualizar dirección seleccionada si es la misma
            if (this.direccionSeleccionadaSignal()?.id === id) {
              this.setDireccionSeleccionada(response.data);
            }

            this.updateSubjects();
          }
          this.setLoading(false);
        }),
        catchError((error) => {
          this.setLoading(false);
          throw error;
        })
      );
  }

  /**
   * Elimina una dirección validada
   */
  deleteDireccionValidada(id: number): Observable<void> {
    this.setLoading(true);

    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const currentDirecciones = this.direccionesValidadasSignal();
        const filteredDirecciones = currentDirecciones.filter(
          (dir) => dir.id !== id
        );
        this.direccionesValidadasSignal.set(filteredDirecciones);

        // Limpiar dirección seleccionada si es la que se eliminó
        if (this.direccionSeleccionadaSignal()?.id === id) {
          this.setDireccionSeleccionada(null);
        }

        this.updateSubjects();
        this.setLoading(false);
      }),
      catchError((error) => {
        this.setLoading(false);
        throw error;
      })
    );
  }

  /**
   * Valida una dirección específica
   */
  validarDireccion(
    data: ValidarDireccionRequest
  ): Observable<ValidarDireccionResponse> {
    this.setLoading(true);

    return this.http
      .post<ValidarDireccionResponse>(`${this.publicApiUrl}/validar`, data)
      .pipe(
        tap((response) => {
          if (response.data) {
            // Actualizar o agregar la dirección validada
            const currentDirecciones = this.direccionesValidadasSignal();
            const existingIndex = currentDirecciones.findIndex(
              (d) => d.direccion_id === data.direccion_id
            );

            if (existingIndex >= 0) {
              const updatedDirecciones = [...currentDirecciones];
              updatedDirecciones[existingIndex] = response.data;
              this.direccionesValidadasSignal.set(updatedDirecciones);
            } else {
              this.direccionesValidadasSignal.set([
                ...currentDirecciones,
                response.data,
              ]);
            }

            this.updateSubjects();
          }
          this.setLoading(false);
        }),
        catchError((error) => {
          this.setLoading(false);
          throw error;
        })
      );
  }

  /**
   * Revalida direcciones existentes
   */
  revalidarDirecciones(
    data: RevalidarDireccionesRequest
  ): Observable<RevalidarDireccionesResponse> {
    this.setLoading(true);

    return this.http
      .post<RevalidarDireccionesResponse>(`${this.apiUrl}/revalidar`, data)
      .pipe(
        tap(() => {
          // Refrescar la lista después de revalidar
          this.refreshDirecciones();
          this.setLoading(false);
        }),
        catchError((error) => {
          this.setLoading(false);
          throw error;
        })
      );
  }

  /**
   * Obtiene estadísticas de direcciones validadas
   */
  getEstadisticas(): Observable<EstadisticasDireccionValidada> {
    return this.http
      .get<EstadisticasDireccionValidada>(`${this.publicApiUrl}/estadisticas`)
      .pipe(
        tap((estadisticas) => {
          this.estadisticasSignal.set(estadisticas);
        })
      );
  }

  /**
   * Métodos de utilidad para el estado reactivo
   */

  /**
   * Establece la dirección seleccionada
   */
  setDireccionSeleccionada(direccion: DireccionValidada | null): void {
    this.direccionSeleccionadaSignal.set(direccion);
    this.direccionSeleccionadaSubject.next(direccion);
  }

  /**
   * Limpia el estado del servicio
   */
  clearState(): void {
    this.direccionesValidadasSignal.set([]);
    this.direccionSeleccionadaSignal.set(null);
    this.estadisticasSignal.set(null);
    this.filtrosSignal.set({});
    this.setLoading(false);

    // Limpiar subjects
    this.direccionesSubject.next([]);
    this.direccionSeleccionadaSubject.next(null);
    this.loadingSubject.next(false);
  }

  /**
   * Refresca la lista de direcciones validadas
   */
  refreshDirecciones(
    filters?: DireccionValidadaFilters
  ): Observable<DireccionValidadaListResponse> {
    return this.getDireccionesValidadas(filters || this.filtrosSignal());
  }

  /**
   * Busca direcciones validadas por término de búsqueda
   */
  searchDireccionesValidadas(
    searchTerm: string,
    additionalFilters?: Partial<DireccionValidadaFilters>
  ): Observable<DireccionValidadaListResponse> {
    const filters: DireccionValidadaFilters = {
      search: searchTerm,
      ...additionalFilters,
    };

    return this.getDireccionesValidadas(filters);
  }

  /**
   * Obtiene direcciones por estado de cobertura
   */
  getDireccionesPorCobertura(
    estadoCobertura: EstadoCobertura,
    additionalFilters?: Partial<DireccionValidadaFilters>
  ): Observable<DireccionValidadaListResponse> {
    const filters: DireccionValidadaFilters = {
      ...additionalFilters,
    };

    if (estadoCobertura === 'en_cobertura') {
      filters.en_zona_cobertura = true;
    } else if (estadoCobertura === 'fuera_cobertura') {
      filters.en_zona_cobertura = false;
    }

    return this.getDireccionesValidadas(filters);
  }

  /**
   * Obtiene direcciones por zona de reparto
   */
  getDireccionesPorZona(
    zonaRepartoId: number,
    additionalFilters?: Partial<DireccionValidadaFilters>
  ): Observable<DireccionValidadaListResponse> {
    const filters: DireccionValidadaFilters = {
      zona_reparto_id: zonaRepartoId,
      ...additionalFilters,
    };

    return this.getDireccionesValidadas(filters);
  }

  /**
   * Obtiene direcciones con relaciones incluidas
   */
  getDireccionesCompletas(
    additionalFilters?: Partial<DireccionValidadaFilters>
  ): Observable<DireccionValidadaListResponse> {
    const filters: DireccionValidadaFilters = {
      with_direccion: true,
      with_zona: true,
      ...additionalFilters,
    };

    return this.getDireccionesValidadas(filters);
  }

  /**
   * Obtiene direcciones validadas en un rango de fechas
   */
  getDireccionesPorFechas(
    fechaDesde: string,
    fechaHasta: string,
    additionalFilters?: Partial<DireccionValidadaFilters>
  ): Observable<DireccionValidadaListResponse> {
    const filters: DireccionValidadaFilters = {
      fecha_desde: fechaDesde,
      fecha_hasta: fechaHasta,
      ...additionalFilters,
    };

    return this.getDireccionesValidadas(filters);
  }

  /**
   * Métodos de utilidad para validación y formateo
   */

  /**
   * Valida si una dirección puede ser eliminada
   */
  canDeleteDireccionValidada(direccion: DireccionValidada): boolean {
    // Una dirección validada puede eliminarse si no tiene pedidos asociados
    // Esta lógica se maneja en el backend, aquí solo validamos condiciones básicas
    return true;
  }

  /**
   * Obtiene el texto de estado de la dirección
   */
  getStatusText(direccion: DireccionValidada): string {
    return obtenerTextoEstado(direccion.estado_validacion);
  }

  /**
   * Obtiene el color de estado de la dirección
   */
  getStatusColor(direccion: DireccionValidada): string {
    return obtenerColorEstado(direccion.estado_validacion);
  }

  /**
   * Formatea la distancia para mostrar
   */
  formatDistancia(distanciaKm: number | null): string {
    return formatearDistancia(distanciaKm);
  }

  /**
   * Formatea el tiempo de entrega para mostrar
   */
  formatTiempoEntrega(minutos: number | null): string {
    return formatearTiempoEntrega(minutos);
  }

  /**
   * Obtiene el nombre de la zona de reparto
   */
  getZonaRepartoNombre(direccion: DireccionValidada): string {
    return direccion.zona_reparto?.nombre || 'Sin zona asignada';
  }

  /**
   * Obtiene información resumida de la dirección
   */
  getDireccionResumen(direccion: DireccionValidada): string {
    if (direccion.direccion) {
      return `${direccion.direccion.direccion}, ${direccion.direccion.distrito}`;
    }
    return `Dirección ID: ${direccion.direccion_id}`;
  }

  /**
   * Verifica si una dirección tiene coordenadas válidas
   */
  tieneCoordenadasValidas(direccion: DireccionValidada): boolean {
    return (
      direccion.coordenadas !== null &&
      direccion.coordenadas.lat !== 0 &&
      direccion.coordenadas.lng !== 0
    );
  }

  /**
   * Verifica si una dirección está en zona de cobertura
   */
  estaEnCobertura(direccion: DireccionValidada): boolean {
    return direccion.en_zona_cobertura;
  }

  /**
   * Obtiene el costo de envío formateado
   */
  getCostoEnvioFormateado(direccion: DireccionValidada): string {
    if (!direccion.costo_envio_calculado) {
      return 'No calculado';
    }
    return `S/ ${direccion.costo_envio_calculado.toFixed(2)}`;
  }

  /**
   * Filtra direcciones por múltiples criterios
   */
  filterDirecciones(
    direcciones: DireccionValidada[],
    filters: {
      search?: string;
      zona_reparto_id?: number;
      en_zona_cobertura?: boolean;
    }
  ): DireccionValidada[] {
    return direcciones.filter((direccion) => {
      // Filtro por búsqueda
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          direccion.observaciones_validacion
            ?.toLowerCase()
            .includes(searchLower) ||
          direccion.zona_reparto?.nombre.toLowerCase().includes(searchLower) ||
          direccion.direccion?.direccion.toLowerCase().includes(searchLower) ||
          direccion.direccion?.distrito.toLowerCase().includes(searchLower);

        if (!matchesSearch) return false;
      }

      // Filtro por zona de reparto
      if (
        filters.zona_reparto_id &&
        direccion.zona_reparto_id !== filters.zona_reparto_id
      ) {
        return false;
      }

      // Filtro por estado de cobertura
      if (
        filters.en_zona_cobertura !== undefined &&
        direccion.en_zona_cobertura !== filters.en_zona_cobertura
      ) {
        return false;
      }

      return true;
    });
  }

  /**
   * Ordena direcciones por campo específico
   */
  sortDirecciones(
    direcciones: DireccionValidada[],
    sortBy: string,
    sortDirection: 'asc' | 'desc' = 'asc'
  ): DireccionValidada[] {
    return [...direcciones].sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (sortBy) {
        case 'fecha_ultima_validacion':
          valueA = new Date(a.fecha_ultima_validacion);
          valueB = new Date(b.fecha_ultima_validacion);
          break;
        case 'distancia_tienda_km':
          valueA = a.distancia_tienda_km || 0;
          valueB = b.distancia_tienda_km || 0;
          break;
        case 'costo_envio_calculado':
          valueA = a.costo_envio_calculado || 0;
          valueB = b.costo_envio_calculado || 0;
          break;
        case 'en_zona_cobertura':
          valueA = a.en_zona_cobertura;
          valueB = b.en_zona_cobertura;
          break;
        case 'zona_reparto':
          valueA = a.zona_reparto?.nombre || '';
          valueB = b.zona_reparto?.nombre || '';
          break;
        default:
          valueA = a.fecha_ultima_validacion;
          valueB = b.fecha_ultima_validacion;
      }

      if (valueA < valueB) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  /**
   * Agrupa direcciones por zona de reparto
   */
  groupDireccionesByZona(
    direcciones: DireccionValidada[]
  ): Record<string, DireccionValidada[]> {
    return direcciones.reduce((groups, direccion) => {
      const zonaNombre = direccion.zona_reparto?.nombre || 'Sin zona asignada';

      if (!groups[zonaNombre]) {
        groups[zonaNombre] = [];
      }

      groups[zonaNombre].push(direccion);
      return groups;
    }, {} as Record<string, DireccionValidada[]>);
  }

  /**
   * Obtiene direcciones que requieren revalidación
   */
  getDireccionesParaRevalidar(
    direcciones: DireccionValidada[]
  ): DireccionValidada[] {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 30); // 30 días atrás

    return direcciones.filter((direccion) => {
      const fechaValidacion = new Date(direccion.fecha_ultima_validacion);
      return fechaValidacion < fechaLimite;
    });
  }

  /**
   * Métodos privados de apoyo
   */
  private buildHttpParams(filters?: any): HttpParams {
    let params = new HttpParams();

    if (filters) {
      Object.keys(filters).forEach((key) => {
        const value = filters[key];
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return params;
  }

  private setLoading(loading: boolean): void {
    this.loadingSignal.set(loading);
    this.loadingSubject.next(loading);
  }

  private updateDirecciones(direcciones: DireccionValidada[]): void {
    this.direccionesValidadasSignal.set(direcciones);
    this.direccionesSubject.next(direcciones);
  }

  private updateSubjects(): void {
    this.direccionesSubject.next(this.direccionesValidadasSignal());
    this.direccionSeleccionadaSubject.next(this.direccionSeleccionadaSignal());
  }
}
