import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import {
  ZonaReparto,
  ZonaRepartoListResponse,
  ZonaRepartoResponse,
  ZonaRepartoEstadisticasResponse,
  CreateZonaRepartoRequest,
  UpdateZonaRepartoRequest,
  ZonaRepartoFilters,
  CalcularCostoEnvioRequest,
  CalcularCostoEnvioResponse,
  VerificarDisponibilidadRequest,
  VerificarDisponibilidadResponse,
  DistritoZona,
  ApiResponse,
} from '../models/zona-reparto.interface';

@Injectable({
  providedIn: 'root',
})
export class ZonaRepartoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/vista/zonas-reparto`;
  private readonly publicApiUrl = `${environment.apiUrl}/zonas-reparto`;

  // Estado reactivo para la lista de zonas
  private zonasSubject = new BehaviorSubject<ZonaReparto[]>([]);
  public zonas$ = this.zonasSubject.asObservable();

  // Estado reactivo para la zona seleccionada
  private zonaSeleccionadaSubject = new BehaviorSubject<ZonaReparto | null>(
    null
  );
  public zonaSeleccionada$ = this.zonaSeleccionadaSubject.asObservable();

  // Estado de carga
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  /**
   * Obtiene la lista de zonas de reparto con filtros opcionales
   */
  getZonasReparto(
    filters?: ZonaRepartoFilters
  ): Observable<ZonaRepartoListResponse> {
    this.loadingSubject.next(true);

    let params = new HttpParams();

    if (filters) {
      Object.keys(filters).forEach((key) => {
        const value = filters[key as keyof ZonaRepartoFilters];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<ZonaRepartoListResponse>(this.apiUrl, { params }).pipe(
      tap((response) => {
        this.zonasSubject.next(response.data);
        this.loadingSubject.next(false);
      })
    );
  }

  /**
   * Obtiene una zona de reparto por ID
   */
  getZonaReparto(
    id: number,
    filters?: Partial<ZonaRepartoFilters>
  ): Observable<ZonaRepartoResponse> {
    this.loadingSubject.next(true);

    let params = new HttpParams();

    if (filters) {
      Object.keys(filters).forEach((key) => {
        const value = filters[key as keyof ZonaRepartoFilters];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http
      .get<ZonaRepartoResponse>(`${this.apiUrl}/${id}`, { params })
      .pipe(
        tap((response) => {
          this.zonaSeleccionadaSubject.next(response.data);
          this.loadingSubject.next(false);
        })
      );
  }

  /**
   * Crea una nueva zona de reparto
   */
  createZonaReparto(
    data: CreateZonaRepartoRequest
  ): Observable<ApiResponse<ZonaReparto>> {
    this.loadingSubject.next(true);

    return this.http.post<ApiResponse<ZonaReparto>>(this.apiUrl, data).pipe(
      tap((response) => {
        if (response.data) {
          const currentZonas = this.zonasSubject.value;
          this.zonasSubject.next([...currentZonas, response.data]);
        }
        this.loadingSubject.next(false);
      })
    );
  }

  /**
   * Actualiza una zona de reparto existente
   */
  updateZonaReparto(
    id: number,
    data: UpdateZonaRepartoRequest
  ): Observable<ApiResponse<ZonaReparto>> {
    this.loadingSubject.next(true);

    return this.http
      .put<ApiResponse<ZonaReparto>>(`${this.apiUrl}/${id}`, data)
      .pipe(
        tap((response) => {
          if (response.data) {
            const currentZonas = this.zonasSubject.value;
            const updatedZonas = currentZonas.map((zona) =>
              zona.id === id ? response.data! : zona
            );
            this.zonasSubject.next(updatedZonas);

            // Actualizar zona seleccionada si es la misma
            if (this.zonaSeleccionadaSubject.value?.id === id) {
              this.zonaSeleccionadaSubject.next(response.data);
            }
          }
          this.loadingSubject.next(false);
        })
      );
  }

  /**
   * Elimina una zona de reparto
   */
  deleteZonaReparto(id: number): Observable<ApiResponse> {
    this.loadingSubject.next(true);

    return this.http.delete<ApiResponse>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const currentZonas = this.zonasSubject.value;
        const filteredZonas = currentZonas.filter((zona) => zona.id !== id);
        this.zonasSubject.next(filteredZonas);

        // Limpiar zona seleccionada si es la que se eliminó
        if (this.zonaSeleccionadaSubject.value?.id === id) {
          this.zonaSeleccionadaSubject.next(null);
        }

        this.loadingSubject.next(false);
      })
    );
  }

  /**
   * Activa/Desactiva una zona de reparto
   */
  toggleStatus(id: number): Observable<ApiResponse<ZonaReparto>> {
    return this.http
      .post<ApiResponse<ZonaReparto>>(`${this.apiUrl}/${id}/toggle-status`, {})
      .pipe(
        tap((response) => {
          if (response.data) {
            const currentZonas = this.zonasSubject.value;
            const updatedZonas = currentZonas.map((zona) =>
              zona.id === id ? response.data! : zona
            );
            this.zonasSubject.next(updatedZonas);

            // Actualizar zona seleccionada si es la misma
            if (this.zonaSeleccionadaSubject.value?.id === id) {
              this.zonaSeleccionadaSubject.next(response.data);
            }
          }
        })
      );
  }

  /**
   * Obtiene los distritos disponibles para asignar a zonas
   */
  getDistritosDisponibles(): Observable<DistritoZona[]> {
    return this.http
      .get<{ data: DistritoZona[] }>(`${this.apiUrl}/distritos/disponibles`)
      .pipe(map((response) => response.data));
  }

  /**
   * Obtiene estadísticas detalladas de una zona
   */
  getEstadisticas(id: number): Observable<ZonaRepartoEstadisticasResponse> {
    return this.http.get<ZonaRepartoEstadisticasResponse>(
      `${this.apiUrl}/${id}/estadisticas`
    );
  }

  /**
   * Obtiene los horarios de una zona (método público)
   */
  getHorarios(id: number): Observable<any[]> {
    return this.http
      .get<{ data: any[] }>(`${this.publicApiUrl}/${id}/horarios`)
      .pipe(map((response) => response.data));
  }

  /**
   * Calcula el costo de envío para una dirección específica
   */
  calcularCostoEnvio(
    id: number,
    data: CalcularCostoEnvioRequest
  ): Observable<CalcularCostoEnvioResponse> {
    return this.http.post<CalcularCostoEnvioResponse>(
      `${this.publicApiUrl}/${id}/calcular-costo`,
      data
    );
  }

  /**
   * Verifica la disponibilidad en un horario específico
   */
  verificarDisponibilidad(
    id: number,
    data: VerificarDisponibilidadRequest
  ): Observable<VerificarDisponibilidadResponse> {
    return this.http.post<VerificarDisponibilidadResponse>(
      `${this.publicApiUrl}/${id}/verificar-disponibilidad`,
      data
    );
  }

  /**
   * Obtiene zonas de reparto públicas (sin autenticación)
   */
  getZonasPublicas(
    filters?: Partial<ZonaRepartoFilters>
  ): Observable<ZonaRepartoListResponse> {
    let params = new HttpParams();

    if (filters) {
      Object.keys(filters).forEach((key) => {
        const value = filters[key as keyof ZonaRepartoFilters];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<ZonaRepartoListResponse>(this.publicApiUrl, {
      params,
    });
  }

  /**
   * Obtiene una zona pública por ID
   */
  getZonaPublica(id: number): Observable<ZonaRepartoResponse> {
    return this.http.get<ZonaRepartoResponse>(`${this.publicApiUrl}/${id}`);
  }

  /**
   * Métodos de utilidad para el estado reactivo
   */

  /**
   * Establece la zona seleccionada
   */
  setZonaSeleccionada(zona: ZonaReparto | null): void {
    this.zonaSeleccionadaSubject.next(zona);
  }

  /**
   * Limpia el estado del servicio
   */
  clearState(): void {
    this.zonasSubject.next([]);
    this.zonaSeleccionadaSubject.next(null);
    this.loadingSubject.next(false);
  }

  /**
   * Refresca la lista de zonas
   */
  refreshZonas(
    filters?: ZonaRepartoFilters
  ): Observable<ZonaRepartoListResponse> {
    return this.getZonasReparto(filters);
  }

  /**
   * Busca zonas por término de búsqueda
   */
  searchZonas(
    searchTerm: string,
    additionalFilters?: Partial<ZonaRepartoFilters>
  ): Observable<ZonaRepartoListResponse> {
    const filters: ZonaRepartoFilters = {
      search: searchTerm,
      ...additionalFilters,
    };

    return this.getZonasReparto(filters);
  }

  /**
   * Obtiene zonas activas únicamente
   */
  getZonasActivas(
    additionalFilters?: Partial<ZonaRepartoFilters>
  ): Observable<ZonaRepartoListResponse> {
    const filters: ZonaRepartoFilters = {
      activo: true,
      ...additionalFilters,
    };

    return this.getZonasReparto(filters);
  }

  /**
   * Obtiene zonas disponibles 24 horas
   */
  getZonas24h(
    additionalFilters?: Partial<ZonaRepartoFilters>
  ): Observable<ZonaRepartoListResponse> {
    const filters: ZonaRepartoFilters = {
      disponible_24h: true,
      ...additionalFilters,
    };

    return this.getZonasReparto(filters);
  }

  /**
   * Valida si una zona puede ser eliminada
   */
  canDeleteZona(zona: ZonaReparto): boolean {
    // Lógica de validación basada en las reglas de negocio
    // Por ejemplo, no se puede eliminar si tiene pedidos asociados
    return zona.estadisticas.total_distritos === 0;
  }

  /**
   * Formatea las coordenadas para mostrar
   */
  formatCoordenadas(coordenadas: string | null): string {
    if (!coordenadas) return 'No definidas';

    const [lat, lng] = coordenadas.split(',');
    return `${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`;
  }

  /**
   * Calcula el color de estado basado en la zona
   */
  getStatusColor(zona: ZonaReparto): string {
    if (!zona.activo) return 'text-red-600';
    if (zona.disponible_24h) return 'text-green-600';
    return 'text-blue-600';
  }

  /**
   * Obtiene el texto de estado de la zona
   */
  getStatusText(zona: ZonaReparto): string {
    if (!zona.activo) return 'Inactiva';
    if (zona.disponible_24h) return 'Activa 24h';
    return 'Activa';
  }
}
