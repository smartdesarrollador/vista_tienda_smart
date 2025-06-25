import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import {
  Distrito,
  DistritoListResponse,
  DistritoSimpleListResponse,
  DistritoResponse,
  EstadisticasDistritoResponse,
  CreateDistritoRequest,
  UpdateDistritoRequest,
  DistritoFilters,
  DistritoPorProvinciaRequest,
  DistritoPorProvinciaResponse,
  DistritosDisponiblesDeliveryResponse,
  BuscarPorCoordenadasRequest,
  BuscarPorCoordenadasResponse,
  EstadisticasDistritoRequest,
} from '../models/distrito.interface';

@Injectable({
  providedIn: 'root',
})
export class DistritoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/vista/distritos`;
  private readonly publicApiUrl = `${environment.apiUrl}/ubicacion/distritos`;

  // Estado reactivo para la lista de distritos
  private distritosSubject = new BehaviorSubject<Distrito[]>([]);
  public distritos$ = this.distritosSubject.asObservable();

  // Estado reactivo para el distrito seleccionado
  private distritoSeleccionadoSubject = new BehaviorSubject<Distrito | null>(
    null
  );
  public distritoSeleccionado$ =
    this.distritoSeleccionadoSubject.asObservable();

  // Estado de carga
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  // Cache para estadísticas
  private estadisticasSubject = new BehaviorSubject<any>(null);
  public estadisticas$ = this.estadisticasSubject.asObservable();

  /**
   * Helper para construir parámetros HTTP
   */
  private buildHttpParams(filters: Record<string, any>): HttpParams {
    let params = new HttpParams();

    Object.keys(filters).forEach((key) => {
      const value = filters[key];
      if (
        value !== undefined &&
        value !== null &&
        value !== '' &&
        value !== false
      ) {
        params = params.set(key, value.toString());
      }
    });

    return params;
  }

  /**
   * Obtiene la lista de distritos con filtros opcionales
   */
  getDistritos(
    filters?: DistritoFilters
  ): Observable<DistritoListResponse | DistritoSimpleListResponse> {
    this.loadingSubject.next(true);

    const params = filters ? this.buildHttpParams(filters) : new HttpParams();

    return this.http
      .get<DistritoListResponse | DistritoSimpleListResponse>(this.apiUrl, {
        params,
      })
      .pipe(
        tap((response) => {
          this.distritosSubject.next(response.data);
          this.loadingSubject.next(false);
        })
      );
  }

  /**
   * Obtiene un distrito por ID
   */
  getDistrito(
    id: number,
    filters?: Partial<DistritoFilters>
  ): Observable<DistritoResponse> {
    this.loadingSubject.next(true);

    const params = filters ? this.buildHttpParams(filters) : new HttpParams();

    return this.http
      .get<DistritoResponse>(`${this.apiUrl}/${id}`, { params })
      .pipe(
        tap((response) => {
          this.distritoSeleccionadoSubject.next(response.data);
          this.loadingSubject.next(false);
        })
      );
  }

  /**
   * Crea un nuevo distrito
   */
  createDistrito(data: CreateDistritoRequest): Observable<DistritoResponse> {
    this.loadingSubject.next(true);

    return this.http.post<DistritoResponse>(this.apiUrl, data).pipe(
      tap((response) => {
        if (response.data) {
          const currentDistritos = this.distritosSubject.value;
          this.distritosSubject.next([...currentDistritos, response.data]);
        }
        this.loadingSubject.next(false);
      })
    );
  }

  /**
   * Actualiza un distrito existente
   */
  updateDistrito(
    id: number,
    data: UpdateDistritoRequest
  ): Observable<DistritoResponse> {
    this.loadingSubject.next(true);

    return this.http.put<DistritoResponse>(`${this.apiUrl}/${id}`, data).pipe(
      tap((response) => {
        if (response.data) {
          const currentDistritos = this.distritosSubject.value;
          const updatedDistritos = currentDistritos.map((dist) =>
            dist.id === id ? response.data : dist
          );
          this.distritosSubject.next(updatedDistritos);

          // Actualizar distrito seleccionado si es el mismo
          if (this.distritoSeleccionadoSubject.value?.id === id) {
            this.distritoSeleccionadoSubject.next(response.data);
          }
        }
        this.loadingSubject.next(false);
      })
    );
  }

  /**
   * Elimina un distrito
   */
  deleteDistrito(id: number): Observable<void> {
    this.loadingSubject.next(true);

    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const currentDistritos = this.distritosSubject.value;
        const filteredDistritos = currentDistritos.filter(
          (dist) => dist.id !== id
        );
        this.distritosSubject.next(filteredDistritos);

        // Limpiar distrito seleccionado si es el que se eliminó
        if (this.distritoSeleccionadoSubject.value?.id === id) {
          this.distritoSeleccionadoSubject.next(null);
        }

        this.loadingSubject.next(false);
      })
    );
  }

  /**
   * Activa/Desactiva un distrito
   */
  toggleStatus(id: number): Observable<DistritoResponse> {
    return this.http
      .post<DistritoResponse>(`${this.apiUrl}/${id}/toggle-status`, {})
      .pipe(
        tap((response) => {
          if (response.data) {
            const currentDistritos = this.distritosSubject.value;
            const updatedDistritos = currentDistritos.map((dist) =>
              dist.id === id ? response.data : dist
            );
            this.distritosSubject.next(updatedDistritos);

            // Actualizar distrito seleccionado si es el mismo
            if (this.distritoSeleccionadoSubject.value?.id === id) {
              this.distritoSeleccionadoSubject.next(response.data);
            }
          }
        })
      );
  }

  /**
   * Activa/Desactiva disponibilidad de delivery
   */
  toggleDelivery(id: number): Observable<DistritoResponse> {
    return this.http
      .post<DistritoResponse>(`${this.apiUrl}/${id}/toggle-delivery`, {})
      .pipe(
        tap((response) => {
          if (response.data) {
            const currentDistritos = this.distritosSubject.value;
            const updatedDistritos = currentDistritos.map((dist) =>
              dist.id === id ? response.data : dist
            );
            this.distritosSubject.next(updatedDistritos);

            // Actualizar distrito seleccionado si es el mismo
            if (this.distritoSeleccionadoSubject.value?.id === id) {
              this.distritoSeleccionadoSubject.next(response.data);
            }
          }
        })
      );
  }

  /**
   * Obtiene distritos por provincia
   */
  getDistritosPorProvincia(
    provinciaId: number,
    request?: DistritoPorProvinciaRequest
  ): Observable<DistritoPorProvinciaResponse> {
    const params = request ? this.buildHttpParams(request) : new HttpParams();

    return this.http.get<DistritoPorProvinciaResponse>(
      `${this.apiUrl}/provincia/${provinciaId}`,
      { params }
    );
  }

  /**
   * Obtiene distritos disponibles para delivery
   */
  getDistritosDisponiblesDelivery(
    filters?: Partial<DistritoFilters>
  ): Observable<DistritosDisponiblesDeliveryResponse> {
    let params = new HttpParams();

    if (filters) {
      Object.keys(filters).forEach((key) => {
        const value = filters[key as keyof DistritoFilters];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<DistritosDisponiblesDeliveryResponse>(
      `${this.apiUrl}/delivery/disponibles`,
      { params }
    );
  }

  /**
   * Busca distritos por coordenadas
   */
  buscarPorCoordenadas(
    request: BuscarPorCoordenadasRequest
  ): Observable<BuscarPorCoordenadasResponse> {
    return this.http.post<BuscarPorCoordenadasResponse>(
      `${this.apiUrl}/buscar/coordenadas`,
      request
    );
  }

  /**
   * Obtiene estadísticas generales de distritos
   */
  getEstadisticas(
    request?: EstadisticasDistritoRequest
  ): Observable<EstadisticasDistritoResponse> {
    const params = request ? this.buildHttpParams(request) : new HttpParams();

    return this.http
      .get<EstadisticasDistritoResponse>(
        `${this.apiUrl}/estadisticas/completas`,
        { params }
      )
      .pipe(
        tap((response) => {
          this.estadisticasSubject.next(response.estadisticas);
        })
      );
  }

  /**
   * Métodos públicos (sin autenticación)
   */

  /**
   * Obtiene distritos públicos
   */
  getDistritosPublicos(
    filters?: Partial<DistritoFilters>
  ): Observable<DistritoListResponse | DistritoSimpleListResponse> {
    let params = new HttpParams();

    if (filters) {
      Object.keys(filters).forEach((key) => {
        const value = filters[key as keyof DistritoFilters];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<DistritoListResponse | DistritoSimpleListResponse>(
      this.publicApiUrl,
      { params }
    );
  }

  /**
   * Obtiene un distrito público por ID
   */
  getDistritoPublico(id: number): Observable<DistritoResponse> {
    return this.http.get<DistritoResponse>(`${this.publicApiUrl}/${id}`);
  }

  /**
   * Obtiene distritos públicos por provincia
   */
  getDistritosPublicosPorProvincia(
    provinciaId: number
  ): Observable<DistritoPorProvinciaResponse> {
    return this.http.get<DistritoPorProvinciaResponse>(
      `${this.publicApiUrl}/provincia/${provinciaId}`
    );
  }

  /**
   * Obtiene distritos públicos disponibles para delivery
   */
  getDistritosPublicosDisponiblesDelivery(): Observable<DistritosDisponiblesDeliveryResponse> {
    return this.http.get<DistritosDisponiblesDeliveryResponse>(
      `${this.publicApiUrl}/delivery/disponibles`
    );
  }

  /**
   * Busca distritos públicos por coordenadas
   */
  buscarDistritosPublicosPorCoordenadas(
    request: BuscarPorCoordenadasRequest
  ): Observable<BuscarPorCoordenadasResponse> {
    return this.http.post<BuscarPorCoordenadasResponse>(
      `${this.publicApiUrl}/buscar/coordenadas`,
      request
    );
  }

  /**
   * Obtiene estadísticas públicas
   */
  getEstadisticasPublicas(): Observable<EstadisticasDistritoResponse> {
    return this.http.get<EstadisticasDistritoResponse>(
      `${this.publicApiUrl}/estadisticas/generales`
    );
  }

  /**
   * Métodos de utilidad para el estado reactivo
   */

  /**
   * Establece el distrito seleccionado
   */
  setDistritoSeleccionado(distrito: Distrito | null): void {
    this.distritoSeleccionadoSubject.next(distrito);
  }

  /**
   * Limpia el estado del servicio
   */
  clearState(): void {
    this.distritosSubject.next([]);
    this.distritoSeleccionadoSubject.next(null);
    this.estadisticasSubject.next(null);
    this.loadingSubject.next(false);
  }

  /**
   * Refresca la lista de distritos
   */
  refreshDistritos(
    filters?: DistritoFilters
  ): Observable<DistritoListResponse | DistritoSimpleListResponse> {
    return this.getDistritos(filters);
  }

  /**
   * Busca distritos por término de búsqueda
   */
  searchDistritos(
    searchTerm: string,
    additionalFilters?: Partial<DistritoFilters>
  ): Observable<DistritoListResponse | DistritoSimpleListResponse> {
    const filters: DistritoFilters = {
      search: searchTerm,
      ...additionalFilters,
    };

    return this.getDistritos(filters);
  }

  /**
   * Obtiene distritos activos únicamente
   */
  getDistritosActivos(
    additionalFilters?: Partial<DistritoFilters>
  ): Observable<DistritoListResponse | DistritoSimpleListResponse> {
    const filters: DistritoFilters = {
      activo: true,
      ...additionalFilters,
    };

    return this.getDistritos(filters);
  }

  /**
   * Obtiene distritos con delivery disponible
   */
  getDistritosConDelivery(
    additionalFilters?: Partial<DistritoFilters>
  ): Observable<DistritoListResponse | DistritoSimpleListResponse> {
    const filters: DistritoFilters = {
      disponible_delivery: true,
      ...additionalFilters,
    };

    return this.getDistritos(filters);
  }

  /**
   * Obtiene distritos por provincia específica
   */
  getDistritosPorProvinciaEspecifica(
    provinciaId: number,
    additionalFilters?: Partial<DistritoFilters>
  ): Observable<DistritoListResponse | DistritoSimpleListResponse> {
    const filters: DistritoFilters = {
      provincia_id: provinciaId,
      ...additionalFilters,
    };

    return this.getDistritos(filters);
  }

  /**
   * Obtiene distritos por departamento específico
   */
  getDistritosPorDepartamento(
    departamentoId: number,
    additionalFilters?: Partial<DistritoFilters>
  ): Observable<DistritoListResponse | DistritoSimpleListResponse> {
    const filters: DistritoFilters = {
      departamento_id: departamentoId,
      ...additionalFilters,
    };

    return this.getDistritos(filters);
  }

  /**
   * Obtiene distritos con coordenadas
   */
  getDistritosConCoordenadas(
    additionalFilters?: Partial<DistritoFilters>
  ): Observable<DistritoListResponse | DistritoSimpleListResponse> {
    const filters: DistritoFilters = {
      con_coordenadas: true,
      ...additionalFilters,
    };

    return this.getDistritos(filters);
  }

  /**
   * Obtiene distritos con sus provincias
   */
  getDistritosConProvincias(
    additionalFilters?: Partial<DistritoFilters>
  ): Observable<DistritoListResponse | DistritoSimpleListResponse> {
    const filters: DistritoFilters = {
      with_provincia: true,
      ...additionalFilters,
    };

    return this.getDistritos(filters);
  }

  /**
   * Obtiene distritos completos (con provincia y departamento)
   */
  getDistritosCompletos(
    additionalFilters?: Partial<DistritoFilters>
  ): Observable<DistritoListResponse | DistritoSimpleListResponse> {
    const filters: DistritoFilters = {
      with_provincia: true,
      with_departamento: true,
      ...additionalFilters,
    };

    return this.getDistritos(filters);
  }

  /**
   * Obtiene distritos con zonas de reparto
   */
  getDistritosConZonasReparto(
    additionalFilters?: Partial<DistritoFilters>
  ): Observable<DistritoListResponse | DistritoSimpleListResponse> {
    const filters: DistritoFilters = {
      with_zonas_reparto: true,
      ...additionalFilters,
    };

    return this.getDistritos(filters);
  }

  /**
   * Obtiene distritos por país
   */
  getDistritosPorPais(
    pais: string,
    additionalFilters?: Partial<DistritoFilters>
  ): Observable<DistritoListResponse | DistritoSimpleListResponse> {
    const filters: DistritoFilters = {
      pais: pais,
      ...additionalFilters,
    };

    return this.getDistritos(filters);
  }

  /**
   * Valida si un distrito puede ser eliminado
   */
  canDeleteDistrito(distrito: Distrito): boolean {
    // Un distrito puede eliminarse si no tiene zonas de reparto asociadas
    return !distrito.zonas_reparto || distrito.zonas_reparto.length === 0;
  }

  /**
   * Valida si un distrito puede ser activado
   */
  canActivateDistrito(distrito: Distrito): boolean {
    // Un distrito puede activarse si la provincia y departamento están activos
    if (!distrito.provincia) return false;

    const provinciaActiva = (distrito.provincia as any).activo !== false;
    const departamentoActivo =
      (distrito.provincia.departamento as any)?.activo !== false;

    return provinciaActiva && departamentoActivo;
  }

  /**
   * Valida si el delivery puede ser activado
   */
  canActivateDelivery(distrito: Distrito): boolean {
    return distrito.activo;
  }

  /**
   * Formatea el código INEI para mostrar
   */
  formatCodigoInei(codigoInei: string | null): string {
    return codigoInei || 'No asignado';
  }

  /**
   * Formatea el código postal para mostrar
   */
  formatCodigoPostal(codigoPostal: string | null): string {
    return codigoPostal || 'No asignado';
  }

  /**
   * Obtiene el texto de estado del distrito
   */
  getStatusText(distrito: Distrito): string {
    return distrito.activo ? 'Activo' : 'Inactivo';
  }

  /**
   * Obtiene el color de estado del distrito
   */
  getStatusColor(distrito: Distrito): string {
    return distrito.activo
      ? 'text-green-600 bg-green-100'
      : 'text-red-600 bg-red-100';
  }

  /**
   * Obtiene el texto de delivery del distrito
   */
  getDeliveryText(distrito: Distrito): string {
    return distrito.disponible_delivery ? 'Disponible' : 'No disponible';
  }

  /**
   * Obtiene el color de delivery del distrito
   */
  getDeliveryColor(distrito: Distrito): string {
    return distrito.disponible_delivery
      ? 'text-blue-600 bg-blue-100'
      : 'text-gray-600 bg-gray-100';
  }

  /**
   * Obtiene el nombre completo del distrito con código
   */
  getDisplayName(distrito: Distrito): string {
    return `${distrito.nombre} (${distrito.codigo})`;
  }

  /**
   * Obtiene el nombre completo con provincia y departamento
   */
  getFullName(distrito: Distrito): string {
    if (distrito.provincia) {
      const provincia = distrito.provincia.nombre;
      const departamento = distrito.provincia.departamento?.nombre;

      if (departamento) {
        return `${distrito.nombre}, ${provincia}, ${departamento}`;
      }
      return `${distrito.nombre}, ${provincia}`;
    }
    return distrito.nombre;
  }

  /**
   * Obtiene la ubicación completa del distrito
   */
  getUbicacionCompleta(distrito: Distrito): string {
    if (distrito.ubicacion_completa) {
      return distrito.ubicacion_completa;
    }

    const parts = [
      distrito.nombre,
      distrito.provincia?.nombre,
      distrito.provincia?.departamento?.nombre,
      'Perú',
    ].filter(Boolean);

    return parts.join(', ');
  }

  /**
   * Verifica si el distrito tiene coordenadas
   */
  hasCoordinates(distrito: Distrito): boolean {
    return distrito.latitud !== null && distrito.longitud !== null;
  }

  /**
   * Obtiene la visualización de coordenadas
   */
  getCoordinatesDisplay(distrito: Distrito): string {
    if (!this.hasCoordinates(distrito)) {
      return 'Sin coordenadas';
    }
    return `${distrito.latitud}, ${distrito.longitud}`;
  }

  /**
   * Obtiene estadísticas resumidas de un distrito
   */
  getEstadisticasResumidas(distrito: Distrito): string {
    if (!distrito.estadisticas.zonas_reparto_activas) return 'Sin zonas';

    return `${distrito.estadisticas.zonas_reparto_activas} zonas activas`;
  }

  /**
   * Obtiene el código completo con provincia y departamento
   */
  getCodigoCompleto(distrito: Distrito): string {
    if (distrito.provincia) {
      const provinciaCode = distrito.provincia.codigo;
      const departamentoCode = distrito.provincia.departamento?.codigo;

      if (departamentoCode) {
        return `${departamentoCode}-${provinciaCode}-${distrito.codigo}`;
      }
      return `${provinciaCode}-${distrito.codigo}`;
    }
    return distrito.codigo;
  }

  /**
   * Valida el formato del código de distrito
   */
  isValidCodigo(codigo: string): boolean {
    // Código debe ser de 2-10 caracteres, solo letras y números
    const codigoRegex = /^[A-Z0-9]{2,10}$/;
    return codigoRegex.test(codigo.toUpperCase());
  }

  /**
   * Valida el formato del código INEI
   */
  isValidCodigoInei(codigoInei: string): boolean {
    // Código INEI debe ser numérico de 2-10 dígitos
    const ineiRegex = /^\d{2,10}$/;
    return ineiRegex.test(codigoInei);
  }

  /**
   * Valida el formato del código postal
   */
  isValidCodigoPostal(codigoPostal: string): boolean {
    // Código postal puede ser alfanumérico de 3-10 caracteres
    const postalRegex = /^[A-Z0-9]{3,10}$/;
    return postalRegex.test(codigoPostal.toUpperCase());
  }

  /**
   * Valida coordenadas
   */
  isValidCoordinates(latitud: number | null, longitud: number | null): boolean {
    if (latitud === null && longitud === null) return true; // Ambas nulas es válido
    if (latitud === null || longitud === null) return false; // Solo una nula es inválido

    return (
      latitud >= -90 && latitud <= 90 && longitud >= -180 && longitud <= 180
    );
  }

  /**
   * Genera un código automático basado en el nombre
   */
  generateCodigo(nombre: string): string {
    return nombre
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^A-Z0-9]/g, '') // Solo letras y números
      .substring(0, 3); // Máximo 3 caracteres
  }

  /**
   * Calcula la distancia entre dos puntos
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Encuentra distritos cercanos a una ubicación
   */
  findNearestDistritos(
    distritos: Distrito[],
    targetLat: number,
    targetLon: number,
    maxDistance: number = 10
  ): Distrito[] {
    return distritos
      .filter((distrito) => this.hasCoordinates(distrito))
      .map((distrito) => ({
        ...distrito,
        distancia_km: this.calculateDistance(
          targetLat,
          targetLon,
          distrito.latitud!,
          distrito.longitud!
        ),
      }))
      .filter((distrito) => distrito.distancia_km! <= maxDistance)
      .sort((a, b) => a.distancia_km! - b.distancia_km!);
  }

  /**
   * Obtiene la lista de provincias únicas de los distritos
   */
  getProvinciasUnicas(): Observable<any[]> {
    return this.distritos$.pipe(
      map((distritos) => {
        const provincias = distritos
          .filter((d) => d.provincia)
          .map((d) => d.provincia!);

        // Eliminar duplicados por ID
        const uniqueProvincias = provincias.filter(
          (prov, index, self) =>
            index === self.findIndex((p) => p.id === prov.id)
        );

        return uniqueProvincias.sort((a, b) =>
          a.nombre.localeCompare(b.nombre)
        );
      })
    );
  }

  /**
   * Obtiene la lista de departamentos únicos de los distritos
   */
  getDepartamentosUnicos(): Observable<any[]> {
    return this.distritos$.pipe(
      map((distritos) => {
        const departamentos = distritos
          .filter((d) => d.provincia?.departamento)
          .map((d) => d.provincia!.departamento!);

        // Eliminar duplicados por ID
        const uniqueDepartamentos = departamentos.filter(
          (dept, index, self) =>
            index === self.findIndex((d) => d.id === dept.id)
        );

        return uniqueDepartamentos.sort((a, b) =>
          a.nombre.localeCompare(b.nombre)
        );
      })
    );
  }

  /**
   * Filtra distritos por múltiples criterios
   */
  filterDistritos(
    distritos: Distrito[],
    filters: {
      search?: string;
      provincia_id?: number;
      departamento_id?: number;
      activo?: boolean;
      disponible_delivery?: boolean;
      con_coordenadas?: boolean;
    }
  ): Distrito[] {
    return distritos.filter((distrito) => {
      // Filtro por búsqueda
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          distrito.nombre.toLowerCase().includes(searchLower) ||
          distrito.codigo.toLowerCase().includes(searchLower) ||
          (distrito.codigo_inei &&
            distrito.codigo_inei.toLowerCase().includes(searchLower)) ||
          (distrito.codigo_postal &&
            distrito.codigo_postal.toLowerCase().includes(searchLower)) ||
          (distrito.provincia &&
            distrito.provincia.nombre.toLowerCase().includes(searchLower)) ||
          (distrito.provincia?.departamento &&
            distrito.provincia.departamento.nombre
              .toLowerCase()
              .includes(searchLower));

        if (!matchesSearch) return false;
      }

      // Filtro por provincia
      if (
        filters.provincia_id &&
        distrito.provincia_id !== filters.provincia_id
      ) {
        return false;
      }

      // Filtro por departamento
      if (
        filters.departamento_id &&
        distrito.provincia?.departamento?.id !== filters.departamento_id
      ) {
        return false;
      }

      // Filtro por estado
      if (filters.activo !== undefined && distrito.activo !== filters.activo) {
        return false;
      }

      // Filtro por delivery
      if (
        filters.disponible_delivery !== undefined &&
        distrito.disponible_delivery !== filters.disponible_delivery
      ) {
        return false;
      }

      // Filtro por coordenadas
      if (filters.con_coordenadas !== undefined) {
        const tieneCoords = this.hasCoordinates(distrito);
        if (filters.con_coordenadas !== tieneCoords) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Ordena distritos por campo específico
   */
  sortDistritos(
    distritos: Distrito[],
    sortBy: string,
    sortDirection: 'asc' | 'desc' = 'asc'
  ): Distrito[] {
    return [...distritos].sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (sortBy) {
        case 'nombre':
          valueA = a.nombre;
          valueB = b.nombre;
          break;
        case 'codigo':
          valueA = a.codigo;
          valueB = b.codigo;
          break;
        case 'provincia':
          valueA = a.provincia?.nombre || '';
          valueB = b.provincia?.nombre || '';
          break;
        case 'departamento':
          valueA = a.provincia?.departamento?.nombre || '';
          valueB = b.provincia?.departamento?.nombre || '';
          break;
        case 'activo':
          valueA = a.activo;
          valueB = b.activo;
          break;
        case 'disponible_delivery':
          valueA = a.disponible_delivery;
          valueB = b.disponible_delivery;
          break;
        case 'created_at':
          valueA = new Date(a.created_at);
          valueB = new Date(b.created_at);
          break;
        default:
          valueA = a.nombre;
          valueB = b.nombre;
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
   * Agrupa distritos por provincia
   */
  groupDistritosByProvincia(distritos: Distrito[]): Record<string, Distrito[]> {
    return distritos.reduce((groups, distrito) => {
      const provinciaKey = distrito.provincia
        ? `${distrito.provincia.id}-${distrito.provincia.nombre}`
        : 'sin-provincia';

      if (!groups[provinciaKey]) {
        groups[provinciaKey] = [];
      }

      groups[provinciaKey].push(distrito);
      return groups;
    }, {} as Record<string, Distrito[]>);
  }

  /**
   * Agrupa distritos por departamento
   */
  groupDistritosByDepartamento(
    distritos: Distrito[]
  ): Record<string, Distrito[]> {
    return distritos.reduce((groups, distrito) => {
      const departamentoKey = distrito.provincia?.departamento
        ? `${distrito.provincia.departamento.id}-${distrito.provincia.departamento.nombre}`
        : 'sin-departamento';

      if (!groups[departamentoKey]) {
        groups[departamentoKey] = [];
      }

      groups[departamentoKey].push(distrito);
      return groups;
    }, {} as Record<string, Distrito[]>);
  }

  /**
   * Obtiene distritos por estado
   */
  getDistritosByEstado(distritos: Distrito[], activo: boolean): Distrito[] {
    return distritos.filter((distrito) => distrito.activo === activo);
  }

  /**
   * Obtiene distritos con delivery
   */
  getDistritosWithDelivery(distritos: Distrito[]): Distrito[] {
    return distritos.filter((distrito) => distrito.disponible_delivery);
  }

  /**
   * Obtiene distritos con coordenadas
   */
  getDistritosWithCoordinates(distritos: Distrito[]): Distrito[] {
    return distritos.filter((distrito) => this.hasCoordinates(distrito));
  }

  /**
   * Obtiene distritos con zonas de reparto
   */
  getDistritosWithZonasReparto(distritos: Distrito[]): Distrito[] {
    return distritos.filter(
      (distrito) =>
        (distrito.zonas_reparto && distrito.zonas_reparto.length > 0) ||
        (distrito.estadisticas.zonas_reparto_activas &&
          distrito.estadisticas.zonas_reparto_activas > 0)
    );
  }

  /**
   * Valida si un distrito puede cambiar de provincia
   */
  canChangeProvincia(
    distrito: Distrito,
    nuevaProvinciaActiva: boolean,
    nuevoDepartamentoActivo: boolean
  ): boolean {
    return nuevaProvinciaActiva && nuevoDepartamentoActivo;
  }

  /**
   * Obtiene el texto de validación para activar distrito
   */
  getActivationValidationMessage(distrito: Distrito): string | null {
    if (!distrito.provincia) {
      return 'Provincia no disponible';
    }

    if ((distrito.provincia as any).activo === false) {
      return 'La provincia está inactiva';
    }

    if ((distrito.provincia.departamento as any)?.activo === false) {
      return 'El departamento está inactivo';
    }

    return null;
  }

  /**
   * Obtiene el texto de validación para eliminar distrito
   */
  getDeletionValidationMessage(distrito: Distrito): string | null {
    if (distrito.zonas_reparto && distrito.zonas_reparto.length > 0) {
      return `Tiene ${distrito.zonas_reparto.length} zona(s) de reparto asociada(s)`;
    }

    if (
      distrito.estadisticas.zonas_reparto_activas &&
      distrito.estadisticas.zonas_reparto_activas > 0
    ) {
      return `Tiene ${distrito.estadisticas.zonas_reparto_activas} zona(s) de reparto activa(s)`;
    }

    return null;
  }

  /**
   * Obtiene el texto de validación para activar delivery
   */
  getDeliveryActivationValidationMessage(distrito: Distrito): string | null {
    if (!distrito.activo) {
      return 'El distrito debe estar activo';
    }

    return null;
  }

  /**
   * Formatea la distancia para mostrar
   */
  formatDistanceDisplay(distanceKm: number): string {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m`;
    }
    return `${distanceKm.toFixed(1)}km`;
  }

  /**
   * Obtiene el icono del distrito
   */
  getDistritoIcon(distrito: Distrito): string {
    if (!distrito.activo) return 'map-pin-off';
    if (distrito.disponible_delivery) return 'truck';
    return 'map-pin';
  }

  /**
   * Obtiene el color del icono del distrito
   */
  getDistritoIconColor(distrito: Distrito): string {
    if (!distrito.activo) return 'text-gray-400';
    if (distrito.disponible_delivery) return 'text-blue-600';
    return 'text-green-600';
  }
}
