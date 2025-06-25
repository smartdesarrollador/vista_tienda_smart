import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import {
  Departamento,
  DepartamentoListResponse,
  DepartamentoSimpleListResponse,
  DepartamentoResponse,
  EstadisticasDepartamentoResponse,
  CreateDepartamentoRequest,
  UpdateDepartamentoRequest,
  DepartamentoFilters,
  DepartamentoPorPaisRequest,
  DepartamentoPorPaisResponse,
  ApiResponse,
  DepartamentoErrorResponse,
} from '../models/departamento.interface';

@Injectable({
  providedIn: 'root',
})
export class DepartamentoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/vista/departamentos`;
  private readonly publicApiUrl = `${environment.apiUrl}/ubicacion/departamentos`;

  // Estado reactivo para la lista de departamentos
  private departamentosSubject = new BehaviorSubject<Departamento[]>([]);
  public departamentos$ = this.departamentosSubject.asObservable();

  // Estado reactivo para el departamento seleccionado
  private departamentoSeleccionadoSubject =
    new BehaviorSubject<Departamento | null>(null);
  public departamentoSeleccionado$ =
    this.departamentoSeleccionadoSubject.asObservable();

  // Estado de carga
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  // Cache para estadísticas
  private estadisticasSubject = new BehaviorSubject<any>(null);
  public estadisticas$ = this.estadisticasSubject.asObservable();

  /**
   * Obtiene la lista de departamentos con filtros opcionales
   */
  getDepartamentos(
    filters?: DepartamentoFilters
  ): Observable<DepartamentoListResponse | DepartamentoSimpleListResponse> {
    this.loadingSubject.next(true);

    let params = new HttpParams();

    if (filters) {
      Object.keys(filters).forEach((key) => {
        const value = filters[key as keyof DepartamentoFilters];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http
      .get<DepartamentoListResponse | DepartamentoSimpleListResponse>(
        this.apiUrl,
        { params }
      )
      .pipe(
        tap((response) => {
          this.departamentosSubject.next(response.data);
          this.loadingSubject.next(false);
        })
      );
  }

  /**
   * Obtiene un departamento por ID
   */
  getDepartamento(
    id: number,
    filters?: Partial<DepartamentoFilters>
  ): Observable<DepartamentoResponse> {
    this.loadingSubject.next(true);

    let params = new HttpParams();

    if (filters) {
      Object.keys(filters).forEach((key) => {
        const value = filters[key as keyof DepartamentoFilters];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http
      .get<DepartamentoResponse>(`${this.apiUrl}/${id}`, { params })
      .pipe(
        tap((response) => {
          this.departamentoSeleccionadoSubject.next(response.data);
          this.loadingSubject.next(false);
        })
      );
  }

  /**
   * Crea un nuevo departamento
   */
  createDepartamento(
    data: CreateDepartamentoRequest
  ): Observable<DepartamentoResponse> {
    this.loadingSubject.next(true);

    return this.http.post<DepartamentoResponse>(this.apiUrl, data).pipe(
      tap((response) => {
        if (response.data) {
          const currentDepartamentos = this.departamentosSubject.value;
          this.departamentosSubject.next([
            ...currentDepartamentos,
            response.data,
          ]);
        }
        this.loadingSubject.next(false);
      })
    );
  }

  /**
   * Actualiza un departamento existente
   */
  updateDepartamento(
    id: number,
    data: UpdateDepartamentoRequest
  ): Observable<DepartamentoResponse> {
    this.loadingSubject.next(true);

    return this.http
      .put<DepartamentoResponse>(`${this.apiUrl}/${id}`, data)
      .pipe(
        tap((response) => {
          if (response.data) {
            const currentDepartamentos = this.departamentosSubject.value;
            const updatedDepartamentos = currentDepartamentos.map((dept) =>
              dept.id === id ? response.data : dept
            );
            this.departamentosSubject.next(updatedDepartamentos);

            // Actualizar departamento seleccionado si es el mismo
            if (this.departamentoSeleccionadoSubject.value?.id === id) {
              this.departamentoSeleccionadoSubject.next(response.data);
            }
          }
          this.loadingSubject.next(false);
        })
      );
  }

  /**
   * Elimina un departamento
   */
  deleteDepartamento(id: number): Observable<void> {
    this.loadingSubject.next(true);

    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const currentDepartamentos = this.departamentosSubject.value;
        const filteredDepartamentos = currentDepartamentos.filter(
          (dept) => dept.id !== id
        );
        this.departamentosSubject.next(filteredDepartamentos);

        // Limpiar departamento seleccionado si es el que se eliminó
        if (this.departamentoSeleccionadoSubject.value?.id === id) {
          this.departamentoSeleccionadoSubject.next(null);
        }

        this.loadingSubject.next(false);
      })
    );
  }

  /**
   * Activa/Desactiva un departamento
   */
  toggleStatus(id: number): Observable<DepartamentoResponse> {
    return this.http
      .post<DepartamentoResponse>(`${this.apiUrl}/${id}/toggle-status`, {})
      .pipe(
        tap((response) => {
          if (response.data) {
            const currentDepartamentos = this.departamentosSubject.value;
            const updatedDepartamentos = currentDepartamentos.map((dept) =>
              dept.id === id ? response.data : dept
            );
            this.departamentosSubject.next(updatedDepartamentos);

            // Actualizar departamento seleccionado si es el mismo
            if (this.departamentoSeleccionadoSubject.value?.id === id) {
              this.departamentoSeleccionadoSubject.next(response.data);
            }
          }
        })
      );
  }

  /**
   * Obtiene departamentos por país
   */
  getDepartamentosPorPais(
    request: DepartamentoPorPaisRequest
  ): Observable<DepartamentoPorPaisResponse> {
    let params = new HttpParams();

    Object.keys(request).forEach((key) => {
      const value = request[key as keyof DepartamentoPorPaisRequest];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<DepartamentoPorPaisResponse>(
      `${this.apiUrl}/pais/${request.pais}`,
      { params }
    );
  }

  /**
   * Obtiene estadísticas generales de departamentos
   */
  getEstadisticas(): Observable<EstadisticasDepartamentoResponse> {
    return this.http
      .get<EstadisticasDepartamentoResponse>(
        `${this.apiUrl}/estadisticas/completas`
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
   * Obtiene departamentos públicos
   */
  getDepartamentosPublicos(
    filters?: Partial<DepartamentoFilters>
  ): Observable<DepartamentoListResponse | DepartamentoSimpleListResponse> {
    let params = new HttpParams();

    if (filters) {
      Object.keys(filters).forEach((key) => {
        const value = filters[key as keyof DepartamentoFilters];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<
      DepartamentoListResponse | DepartamentoSimpleListResponse
    >(this.publicApiUrl, { params });
  }

  /**
   * Obtiene un departamento público por ID
   */
  getDepartamentoPublico(id: number): Observable<DepartamentoResponse> {
    return this.http.get<DepartamentoResponse>(`${this.publicApiUrl}/${id}`);
  }

  /**
   * Obtiene departamentos públicos por país
   */
  getDepartamentosPublicosPorPais(
    pais: string
  ): Observable<DepartamentoPorPaisResponse> {
    return this.http.get<DepartamentoPorPaisResponse>(
      `${this.publicApiUrl}/pais/${pais}`
    );
  }

  /**
   * Obtiene estadísticas públicas
   */
  getEstadisticasPublicas(): Observable<EstadisticasDepartamentoResponse> {
    return this.http.get<EstadisticasDepartamentoResponse>(
      `${this.publicApiUrl}/estadisticas/generales`
    );
  }

  /**
   * Métodos de utilidad para el estado reactivo
   */

  /**
   * Establece el departamento seleccionado
   */
  setDepartamentoSeleccionado(departamento: Departamento | null): void {
    this.departamentoSeleccionadoSubject.next(departamento);
  }

  /**
   * Limpia el estado del servicio
   */
  clearState(): void {
    this.departamentosSubject.next([]);
    this.departamentoSeleccionadoSubject.next(null);
    this.estadisticasSubject.next(null);
    this.loadingSubject.next(false);
  }

  /**
   * Refresca la lista de departamentos
   */
  refreshDepartamentos(
    filters?: DepartamentoFilters
  ): Observable<DepartamentoListResponse | DepartamentoSimpleListResponse> {
    return this.getDepartamentos(filters);
  }

  /**
   * Busca departamentos por término de búsqueda
   */
  searchDepartamentos(
    searchTerm: string,
    additionalFilters?: Partial<DepartamentoFilters>
  ): Observable<DepartamentoListResponse | DepartamentoSimpleListResponse> {
    const filters: DepartamentoFilters = {
      search: searchTerm,
      ...additionalFilters,
    };

    return this.getDepartamentos(filters);
  }

  /**
   * Obtiene departamentos activos únicamente
   */
  getDepartamentosActivos(
    additionalFilters?: Partial<DepartamentoFilters>
  ): Observable<DepartamentoListResponse | DepartamentoSimpleListResponse> {
    const filters: DepartamentoFilters = {
      activo: true,
      ...additionalFilters,
    };

    return this.getDepartamentos(filters);
  }

  /**
   * Obtiene departamentos por país específico
   */
  getDepartamentosPorPaisEspecifico(
    pais: string,
    additionalFilters?: Partial<DepartamentoFilters>
  ): Observable<DepartamentoListResponse | DepartamentoSimpleListResponse> {
    const filters: DepartamentoFilters = {
      pais: pais,
      ...additionalFilters,
    };

    return this.getDepartamentos(filters);
  }

  /**
   * Obtiene departamentos con sus provincias
   */
  getDepartamentosConProvincias(
    additionalFilters?: Partial<DepartamentoFilters>
  ): Observable<DepartamentoListResponse | DepartamentoSimpleListResponse> {
    const filters: DepartamentoFilters = {
      with_provincias: true,
      ...additionalFilters,
    };

    return this.getDepartamentos(filters);
  }

  /**
   * Obtiene departamentos con provincias y distritos
   */
  getDepartamentosCompletos(
    additionalFilters?: Partial<DepartamentoFilters>
  ): Observable<DepartamentoListResponse | DepartamentoSimpleListResponse> {
    const filters: DepartamentoFilters = {
      with_provincias: true,
      with_distritos: true,
      ...additionalFilters,
    };

    return this.getDepartamentos(filters);
  }

  /**
   * Valida si un departamento puede ser eliminado
   */
  canDeleteDepartamento(departamento: Departamento): boolean {
    // Un departamento puede eliminarse si no tiene provincias asociadas
    return !departamento.provincias || departamento.provincias.length === 0;
  }

  /**
   * Formatea el código INEI para mostrar
   */
  formatCodigoInei(codigoInei: string | null): string {
    return codigoInei || 'No asignado';
  }

  /**
   * Obtiene el texto de estado del departamento
   */
  getStatusText(departamento: Departamento): string {
    return departamento.activo ? 'Activo' : 'Inactivo';
  }

  /**
   * Obtiene el color de estado del departamento
   */
  getStatusColor(departamento: Departamento): string {
    return departamento.activo
      ? 'text-green-600 bg-green-100'
      : 'text-red-600 bg-red-100';
  }

  /**
   * Obtiene el nombre completo del departamento con código
   */
  getDisplayName(departamento: Departamento): string {
    return `${departamento.nombre} (${departamento.codigo})`;
  }

  /**
   * Obtiene estadísticas resumidas de un departamento
   */
  getEstadisticasResumidas(departamento: Departamento): string {
    if (!departamento.provincias) return 'Sin datos';

    const totalProvincias = departamento.provincias.length;
    const provinciasActivas = departamento.provincias.filter(
      (p) => p.activo
    ).length;

    return `${provinciasActivas}/${totalProvincias} provincias activas`;
  }

  /**
   * Valida el formato del código de departamento
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
    // Código INEI debe ser numérico de 2 dígitos
    const ineiRegex = /^\d{2}$/;
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
   * Obtiene la lista de países únicos de los departamentos
   */
  getPaisesUnicos(): Observable<string[]> {
    return this.departamentos$.pipe(
      map((departamentos) => {
        const paises = departamentos.map((d) => d.pais);
        return [...new Set(paises)].sort();
      })
    );
  }

  /**
   * Filtra departamentos por múltiples criterios
   */
  filterDepartamentos(
    departamentos: Departamento[],
    filters: {
      search?: string;
      pais?: string;
      activo?: boolean;
    }
  ): Departamento[] {
    return departamentos.filter((departamento) => {
      // Filtro por búsqueda
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          departamento.nombre.toLowerCase().includes(searchLower) ||
          departamento.codigo.toLowerCase().includes(searchLower) ||
          (departamento.codigo_inei &&
            departamento.codigo_inei.toLowerCase().includes(searchLower));

        if (!matchesSearch) return false;
      }

      // Filtro por país
      if (filters.pais && departamento.pais !== filters.pais) {
        return false;
      }

      // Filtro por estado
      if (
        filters.activo !== undefined &&
        departamento.activo !== filters.activo
      ) {
        return false;
      }

      return true;
    });
  }

  /**
   * Ordena departamentos por campo específico
   */
  sortDepartamentos(
    departamentos: Departamento[],
    sortBy: string,
    sortDirection: 'asc' | 'desc' = 'asc'
  ): Departamento[] {
    return [...departamentos].sort((a, b) => {
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
        case 'pais':
          valueA = a.pais;
          valueB = b.pais;
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
}
