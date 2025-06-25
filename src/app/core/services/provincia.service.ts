import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import {
  Provincia,
  ProvinciaListResponse,
  ProvinciaSimpleListResponse,
  ProvinciaResponse,
  EstadisticasProvinciaResponse,
  CreateProvinciaRequest,
  UpdateProvinciaRequest,
  ProvinciaFilters,
  ProvinciaPorDepartamentoRequest,
  ProvinciaPorDepartamentoResponse,
  EstadisticasProvinciaRequest,
} from '../models/provincia.interface';

@Injectable({
  providedIn: 'root',
})
export class ProvinciaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/vista/provincias`;
  private readonly publicApiUrl = `${environment.apiUrl}/ubicacion/provincias`;

  // Estado reactivo para la lista de provincias
  private provinciasSubject = new BehaviorSubject<Provincia[]>([]);
  public provincias$ = this.provinciasSubject.asObservable();

  // Estado reactivo para la provincia seleccionada
  private provinciaSeleccionadaSubject = new BehaviorSubject<Provincia | null>(
    null
  );
  public provinciaSeleccionada$ =
    this.provinciaSeleccionadaSubject.asObservable();

  // Estado de carga
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  // Cache para estadísticas
  private estadisticasSubject = new BehaviorSubject<any>(null);
  public estadisticas$ = this.estadisticasSubject.asObservable();

  /**
   * Obtiene la lista de provincias con filtros opcionales
   */
  getProvincias(
    filters?: ProvinciaFilters
  ): Observable<ProvinciaListResponse | ProvinciaSimpleListResponse> {
    this.loadingSubject.next(true);

    let params = new HttpParams();

    if (filters) {
      Object.keys(filters).forEach((key) => {
        const value = filters[key as keyof ProvinciaFilters];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http
      .get<ProvinciaListResponse | ProvinciaSimpleListResponse>(this.apiUrl, {
        params,
      })
      .pipe(
        tap((response) => {
          this.provinciasSubject.next(response.data);
          this.loadingSubject.next(false);
        })
      );
  }

  /**
   * Obtiene una provincia por ID
   */
  getProvincia(
    id: number,
    filters?: Partial<ProvinciaFilters>
  ): Observable<ProvinciaResponse> {
    this.loadingSubject.next(true);

    let params = new HttpParams();

    if (filters) {
      Object.keys(filters).forEach((key) => {
        const value = filters[key as keyof ProvinciaFilters];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http
      .get<ProvinciaResponse>(`${this.apiUrl}/${id}`, { params })
      .pipe(
        tap((response) => {
          this.provinciaSeleccionadaSubject.next(response.data);
          this.loadingSubject.next(false);
        })
      );
  }

  /**
   * Crea una nueva provincia
   */
  createProvincia(data: CreateProvinciaRequest): Observable<ProvinciaResponse> {
    this.loadingSubject.next(true);

    return this.http.post<ProvinciaResponse>(this.apiUrl, data).pipe(
      tap((response) => {
        if (response.data) {
          const currentProvincias = this.provinciasSubject.value;
          this.provinciasSubject.next([...currentProvincias, response.data]);
        }
        this.loadingSubject.next(false);
      })
    );
  }

  /**
   * Actualiza una provincia existente
   */
  updateProvincia(
    id: number,
    data: UpdateProvinciaRequest
  ): Observable<ProvinciaResponse> {
    this.loadingSubject.next(true);

    return this.http.put<ProvinciaResponse>(`${this.apiUrl}/${id}`, data).pipe(
      tap((response) => {
        if (response.data) {
          const currentProvincias = this.provinciasSubject.value;
          const updatedProvincias = currentProvincias.map((prov) =>
            prov.id === id ? response.data : prov
          );
          this.provinciasSubject.next(updatedProvincias);

          // Actualizar provincia seleccionada si es la misma
          if (this.provinciaSeleccionadaSubject.value?.id === id) {
            this.provinciaSeleccionadaSubject.next(response.data);
          }
        }
        this.loadingSubject.next(false);
      })
    );
  }

  /**
   * Elimina una provincia
   */
  deleteProvincia(id: number): Observable<void> {
    this.loadingSubject.next(true);

    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const currentProvincias = this.provinciasSubject.value;
        const filteredProvincias = currentProvincias.filter(
          (prov) => prov.id !== id
        );
        this.provinciasSubject.next(filteredProvincias);

        // Limpiar provincia seleccionada si es la que se eliminó
        if (this.provinciaSeleccionadaSubject.value?.id === id) {
          this.provinciaSeleccionadaSubject.next(null);
        }

        this.loadingSubject.next(false);
      })
    );
  }

  /**
   * Activa/Desactiva una provincia
   */
  toggleStatus(id: number): Observable<ProvinciaResponse> {
    return this.http
      .post<ProvinciaResponse>(`${this.apiUrl}/${id}/toggle-status`, {})
      .pipe(
        tap((response) => {
          if (response.data) {
            const currentProvincias = this.provinciasSubject.value;
            const updatedProvincias = currentProvincias.map((prov) =>
              prov.id === id ? response.data : prov
            );
            this.provinciasSubject.next(updatedProvincias);

            // Actualizar provincia seleccionada si es la misma
            if (this.provinciaSeleccionadaSubject.value?.id === id) {
              this.provinciaSeleccionadaSubject.next(response.data);
            }
          }
        })
      );
  }

  /**
   * Obtiene provincias por departamento
   */
  getProvinciasPorDepartamento(
    departamentoId: number,
    request?: ProvinciaPorDepartamentoRequest
  ): Observable<ProvinciaPorDepartamentoResponse> {
    let params = new HttpParams();

    if (request) {
      Object.keys(request).forEach((key) => {
        const value = request[key as keyof ProvinciaPorDepartamentoRequest];
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<ProvinciaPorDepartamentoResponse>(
      `${this.apiUrl}/departamento/${departamentoId}`,
      { params }
    );
  }

  /**
   * Obtiene estadísticas generales de provincias
   */
  getEstadisticas(
    request?: EstadisticasProvinciaRequest
  ): Observable<EstadisticasProvinciaResponse> {
    let params = new HttpParams();

    if (request) {
      Object.keys(request).forEach((key) => {
        const value = request[key as keyof EstadisticasProvinciaRequest];
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http
      .get<EstadisticasProvinciaResponse>(
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
   * Obtiene provincias públicas
   */
  getProvinciasPublicas(
    filters?: Partial<ProvinciaFilters>
  ): Observable<ProvinciaListResponse | ProvinciaSimpleListResponse> {
    let params = new HttpParams();

    if (filters) {
      Object.keys(filters).forEach((key) => {
        const value = filters[key as keyof ProvinciaFilters];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<ProvinciaListResponse | ProvinciaSimpleListResponse>(
      this.publicApiUrl,
      { params }
    );
  }

  /**
   * Obtiene una provincia pública por ID
   */
  getProvinciaPublica(id: number): Observable<ProvinciaResponse> {
    return this.http.get<ProvinciaResponse>(`${this.publicApiUrl}/${id}`);
  }

  /**
   * Obtiene provincias públicas por departamento
   */
  getProvinciasPublicasPorDepartamento(
    departamentoId: number
  ): Observable<ProvinciaPorDepartamentoResponse> {
    return this.http.get<ProvinciaPorDepartamentoResponse>(
      `${this.publicApiUrl}/departamento/${departamentoId}`
    );
  }

  /**
   * Obtiene estadísticas públicas
   */
  getEstadisticasPublicas(): Observable<EstadisticasProvinciaResponse> {
    return this.http.get<EstadisticasProvinciaResponse>(
      `${this.publicApiUrl}/estadisticas/generales`
    );
  }

  /**
   * Métodos de utilidad para el estado reactivo
   */

  /**
   * Establece la provincia seleccionada
   */
  setProvinciaSeleccionada(provincia: Provincia | null): void {
    this.provinciaSeleccionadaSubject.next(provincia);
  }

  /**
   * Limpia el estado del servicio
   */
  clearState(): void {
    this.provinciasSubject.next([]);
    this.provinciaSeleccionadaSubject.next(null);
    this.estadisticasSubject.next(null);
    this.loadingSubject.next(false);
  }

  /**
   * Refresca la lista de provincias
   */
  refreshProvincias(
    filters?: ProvinciaFilters
  ): Observable<ProvinciaListResponse | ProvinciaSimpleListResponse> {
    return this.getProvincias(filters);
  }

  /**
   * Busca provincias por término de búsqueda
   */
  searchProvincias(
    searchTerm: string,
    additionalFilters?: Partial<ProvinciaFilters>
  ): Observable<ProvinciaListResponse | ProvinciaSimpleListResponse> {
    const filters: ProvinciaFilters = {
      search: searchTerm,
      ...additionalFilters,
    };

    return this.getProvincias(filters);
  }

  /**
   * Obtiene provincias activas únicamente
   */
  getProvinciasActivas(
    additionalFilters?: Partial<ProvinciaFilters>
  ): Observable<ProvinciaListResponse | ProvinciaSimpleListResponse> {
    const filters: ProvinciaFilters = {
      activo: true,
      ...additionalFilters,
    };

    return this.getProvincias(filters);
  }

  /**
   * Obtiene provincias por departamento específico
   */
  getProvinciasPorDepartamentoEspecifico(
    departamentoId: number,
    additionalFilters?: Partial<ProvinciaFilters>
  ): Observable<ProvinciaListResponse | ProvinciaSimpleListResponse> {
    const filters: ProvinciaFilters = {
      departamento_id: departamentoId,
      ...additionalFilters,
    };

    return this.getProvincias(filters);
  }

  /**
   * Obtiene provincias con sus departamentos
   */
  getProvinciasConDepartamentos(
    additionalFilters?: Partial<ProvinciaFilters>
  ): Observable<ProvinciaListResponse | ProvinciaSimpleListResponse> {
    const filters: ProvinciaFilters = {
      with_departamento: true,
      ...additionalFilters,
    };

    return this.getProvincias(filters);
  }

  /**
   * Obtiene provincias con departamentos y distritos
   */
  getProvinciasCompletas(
    additionalFilters?: Partial<ProvinciaFilters>
  ): Observable<ProvinciaListResponse | ProvinciaSimpleListResponse> {
    const filters: ProvinciaFilters = {
      with_departamento: true,
      with_distritos: true,
      ...additionalFilters,
    };

    return this.getProvincias(filters);
  }

  /**
   * Obtiene provincias por país
   */
  getProvinciasPorPais(
    pais: string,
    additionalFilters?: Partial<ProvinciaFilters>
  ): Observable<ProvinciaListResponse | ProvinciaSimpleListResponse> {
    const filters: ProvinciaFilters = {
      pais: pais,
      ...additionalFilters,
    };

    return this.getProvincias(filters);
  }

  /**
   * Valida si una provincia puede ser eliminada
   */
  canDeleteProvincia(provincia: Provincia): boolean {
    // Una provincia puede eliminarse si no tiene distritos asociados
    return !provincia.distritos || provincia.distritos.length === 0;
  }

  /**
   * Valida si una provincia puede ser activada
   */
  canActivateProvincia(provincia: Provincia): boolean {
    // Una provincia puede activarse si el departamento está activo
    return provincia.departamento
      ? provincia.departamento.activo ?? false
      : true;
  }

  /**
   * Formatea el código INEI para mostrar
   */
  formatCodigoInei(codigoInei: string | null): string {
    return codigoInei || 'No asignado';
  }

  /**
   * Obtiene el texto de estado de la provincia
   */
  getStatusText(provincia: Provincia): string {
    return provincia.activo ? 'Activa' : 'Inactiva';
  }

  /**
   * Obtiene el color de estado de la provincia
   */
  getStatusColor(provincia: Provincia): string {
    return provincia.activo
      ? 'text-green-600 bg-green-100'
      : 'text-red-600 bg-red-100';
  }

  /**
   * Obtiene el nombre completo de la provincia con código
   */
  getDisplayName(provincia: Provincia): string {
    return `${provincia.nombre} (${provincia.codigo})`;
  }

  /**
   * Obtiene el nombre completo con departamento
   */
  getFullName(provincia: Provincia): string {
    if (provincia.departamento) {
      return `${provincia.nombre}, ${provincia.departamento.nombre}`;
    }
    return provincia.nombre;
  }

  /**
   * Obtiene estadísticas resumidas de una provincia
   */
  getEstadisticasResumidas(provincia: Provincia): string {
    if (!provincia.estadisticas.total_distritos) return 'Sin distritos';

    const total = provincia.estadisticas.total_distritos;
    const activos = provincia.estadisticas.distritos_activos || 0;
    const conDelivery = provincia.estadisticas.distritos_con_delivery || 0;

    return `${activos}/${total} activos, ${conDelivery} con delivery`;
  }

  /**
   * Obtiene el código completo con departamento
   */
  getCodigoCompleto(provincia: Provincia): string {
    if (provincia.departamento) {
      return `${provincia.departamento.codigo}-${provincia.codigo}`;
    }
    return provincia.codigo;
  }

  /**
   * Valida el formato del código de provincia
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
   * Obtiene la lista de departamentos únicos de las provincias
   */
  getDepartamentosUnicos(): Observable<any[]> {
    return this.provincias$.pipe(
      map((provincias) => {
        const departamentos = provincias
          .filter((p) => p.departamento)
          .map((p) => p.departamento!);

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
   * Filtra provincias por múltiples criterios
   */
  filterProvincias(
    provincias: Provincia[],
    filters: {
      search?: string;
      departamento_id?: number;
      activo?: boolean;
    }
  ): Provincia[] {
    return provincias.filter((provincia) => {
      // Filtro por búsqueda
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          provincia.nombre.toLowerCase().includes(searchLower) ||
          provincia.codigo.toLowerCase().includes(searchLower) ||
          (provincia.codigo_inei &&
            provincia.codigo_inei.toLowerCase().includes(searchLower)) ||
          (provincia.departamento &&
            provincia.departamento.nombre.toLowerCase().includes(searchLower));

        if (!matchesSearch) return false;
      }

      // Filtro por departamento
      if (
        filters.departamento_id &&
        provincia.departamento_id !== filters.departamento_id
      ) {
        return false;
      }

      // Filtro por estado
      if (filters.activo !== undefined && provincia.activo !== filters.activo) {
        return false;
      }

      return true;
    });
  }

  /**
   * Ordena provincias por campo específico
   */
  sortProvincias(
    provincias: Provincia[],
    sortBy: string,
    sortDirection: 'asc' | 'desc' = 'asc'
  ): Provincia[] {
    return [...provincias].sort((a, b) => {
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
        case 'departamento':
          valueA = a.departamento?.nombre || '';
          valueB = b.departamento?.nombre || '';
          break;
        case 'activo':
          valueA = a.activo;
          valueB = b.activo;
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
   * Agrupa provincias por departamento
   */
  groupProvinciasByDepartamento(
    provincias: Provincia[]
  ): Record<string, Provincia[]> {
    return provincias.reduce((groups, provincia) => {
      const departamentoNombre =
        provincia.departamento?.nombre || 'Sin departamento';

      if (!groups[departamentoNombre]) {
        groups[departamentoNombre] = [];
      }

      groups[departamentoNombre].push(provincia);
      return groups;
    }, {} as Record<string, Provincia[]>);
  }

  /**
   * Obtiene provincias con distritos
   */
  getProvinciasConDistritos(provincias: Provincia[]): Provincia[] {
    return provincias.filter(
      (provincia) =>
        (provincia.distritos && provincia.distritos.length > 0) ||
        (provincia.estadisticas.total_distritos &&
          provincia.estadisticas.total_distritos > 0)
    );
  }

  /**
   * Obtiene provincias con delivery disponible
   */
  getProvinciasConDelivery(provincias: Provincia[]): Provincia[] {
    return provincias.filter(
      (provincia) =>
        provincia.estadisticas.distritos_con_delivery &&
        provincia.estadisticas.distritos_con_delivery > 0
    );
  }

  /**
   * Valida si una provincia puede cambiar de departamento
   */
  canChangeDepartamento(
    provincia: Provincia,
    nuevoDepartamentoActivo: boolean
  ): boolean {
    return nuevoDepartamentoActivo;
  }

  /**
   * Obtiene el texto de validación para activar provincia
   */
  getActivationValidationMessage(provincia: Provincia): string | null {
    if (!provincia.departamento) {
      return 'Departamento no disponible';
    }

    if (!provincia.departamento.activo) {
      return 'El departamento está inactivo';
    }

    return null;
  }

  /**
   * Obtiene el texto de validación para eliminar provincia
   */
  getDeletionValidationMessage(provincia: Provincia): string | null {
    if (provincia.distritos && provincia.distritos.length > 0) {
      return `Tiene ${provincia.distritos.length} distrito(s) asociado(s)`;
    }

    if (
      provincia.estadisticas.total_distritos &&
      provincia.estadisticas.total_distritos > 0
    ) {
      return `Tiene ${provincia.estadisticas.total_distritos} distrito(s) asociado(s)`;
    }

    return null;
  }
}
