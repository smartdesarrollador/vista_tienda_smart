import { Injectable, inject, signal } from '@angular/core';
import {
  HttpClient,
  HttpParams,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, tap, catchError } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import {
  ValorAtributo,
  CreateValorAtributoRequest,
  UpdateValorAtributoRequest,
  BulkCreateValorAtributoRequest,
  BulkCreateValorAtributoResponse,
  ValorAtributoFilters,
  PaginatedValorAtributoResponse,
  ValorAtributoStatistics,
  ApiResponse,
  ApiErrorResponse,
} from '../models/valor-atributo.interface';

@Injectable({
  providedIn: 'root',
})
export class ValorAtributoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/vista/valores-atributo`;

  // Signals para estado reactivo
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly valoresAtributoSignal = signal<ValorAtributo[]>([]);

  // BehaviorSubjects para datos complejos
  private readonly paginationSubject = new BehaviorSubject<
    PaginatedValorAtributoResponse['meta'] | null
  >(null);
  private readonly filtersSubject = new BehaviorSubject<ValorAtributoFilters>(
    {}
  );

  // Getters públicos para acceso a signals
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly valoresAtributo = this.valoresAtributoSignal.asReadonly();
  readonly pagination$ = this.paginationSubject.asObservable();
  readonly filters$ = this.filtersSubject.asObservable();

  /**
   * Obtiene la lista paginada de valores de atributo con filtros
   */
  getValoresAtributo(
    filters: ValorAtributoFilters = {}
  ): Observable<PaginatedValorAtributoResponse> {
    this.setLoading(true);
    this.clearError();

    let params = this.buildHttpParams(filters);

    return this.http
      .get<PaginatedValorAtributoResponse>(this.baseUrl, { params })
      .pipe(
        tap((response) => {
          this.valoresAtributoSignal.set(response.data);
          this.paginationSubject.next(response.meta);
          this.filtersSubject.next(filters);
        }),
        catchError((error) => this.handleError(error)),
        tap(() => this.setLoading(false))
      );
  }

  /**
   * Obtiene un valor de atributo específico por ID
   */
  getValorAtributoById(id: number): Observable<ApiResponse<ValorAtributo>> {
    this.setLoading(true);
    this.clearError();

    return this.http
      .get<ApiResponse<ValorAtributo>>(`${this.baseUrl}/${id}`)
      .pipe(
        catchError((error) => this.handleError(error)),
        tap(() => this.setLoading(false))
      );
  }

  /**
   * Obtiene valores de atributo por atributo específico
   */
  getValoresByAtributo(
    atributoId: number
  ): Observable<ApiResponse<ValorAtributo[]>> {
    this.setLoading(true);
    this.clearError();

    return this.http
      .get<ApiResponse<ValorAtributo[]>>(
        `${this.baseUrl}/atributo/${atributoId}`
      )
      .pipe(
        catchError((error) => this.handleError(error)),
        tap(() => this.setLoading(false))
      );
  }

  /**
   * Crea un nuevo valor de atributo
   */
  createValorAtributo(
    data: CreateValorAtributoRequest
  ): Observable<ApiResponse<ValorAtributo>> {
    this.setLoading(true);
    this.clearError();

    const formData = this.buildFormData(data);

    return this.http
      .post<ApiResponse<ValorAtributo>>(this.baseUrl, formData)
      .pipe(
        tap((response) => {
          // Actualizar lista local agregando el nuevo valor
          const currentValues = this.valoresAtributoSignal();
          this.valoresAtributoSignal.set([...currentValues, response.data]);
        }),
        catchError((error) => this.handleError(error)),
        tap(() => this.setLoading(false))
      );
  }

  /**
   * Actualiza un valor de atributo existente
   */
  updateValorAtributo(
    id: number,
    data: UpdateValorAtributoRequest
  ): Observable<ApiResponse<ValorAtributo>> {
    this.setLoading(true);
    this.clearError();

    const formData = this.buildFormData(data);
    // Laravel requiere _method para simular PUT en FormData
    formData.append('_method', 'PUT');

    return this.http
      .post<ApiResponse<ValorAtributo>>(`${this.baseUrl}/${id}`, formData)
      .pipe(
        tap((response) => {
          // Actualizar lista local reemplazando el valor actualizado
          const currentValues = this.valoresAtributoSignal();
          const updatedValues = currentValues.map((valor) =>
            valor.id === id ? response.data : valor
          );
          this.valoresAtributoSignal.set(updatedValues);
        }),
        catchError((error) => this.handleError(error)),
        tap(() => this.setLoading(false))
      );
  }

  /**
   * Elimina un valor de atributo
   */
  deleteValorAtributo(id: number): Observable<void> {
    this.setLoading(true);
    this.clearError();

    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        // Remover de lista local
        const currentValues = this.valoresAtributoSignal();
        const filteredValues = currentValues.filter((valor) => valor.id !== id);
        this.valoresAtributoSignal.set(filteredValues);
      }),
      catchError((error) => this.handleError(error)),
      tap(() => this.setLoading(false))
    );
  }

  /**
   * Crea múltiples valores de atributo de forma masiva
   */
  bulkCreateValoresAtributo(
    atributoId: number,
    data: BulkCreateValorAtributoRequest
  ): Observable<BulkCreateValorAtributoResponse> {
    this.setLoading(true);
    this.clearError();

    return this.http
      .post<BulkCreateValorAtributoResponse>(
        `${this.baseUrl}/atributo/${atributoId}/bulk`,
        data
      )
      .pipe(
        tap((response) => {
          // Agregar valores creados exitosamente a la lista local
          if (response.creados.length > 0) {
            const currentValues = this.valoresAtributoSignal();
            this.valoresAtributoSignal.set([
              ...currentValues,
              ...response.creados,
            ]);
          }
        }),
        catchError((error) => this.handleError(error)),
        tap(() => this.setLoading(false))
      );
  }

  /**
   * Elimina solo la imagen de un valor de atributo
   */
  removeImagenValorAtributo(
    id: number
  ): Observable<ApiResponse<ValorAtributo>> {
    this.setLoading(true);
    this.clearError();

    return this.http
      .delete<ApiResponse<ValorAtributo>>(`${this.baseUrl}/${id}/imagen`)
      .pipe(
        tap((response) => {
          // Actualizar lista local
          const currentValues = this.valoresAtributoSignal();
          const updatedValues = currentValues.map((valor) =>
            valor.id === id ? response.data : valor
          );
          this.valoresAtributoSignal.set(updatedValues);
        }),
        catchError((error) => this.handleError(error)),
        tap(() => this.setLoading(false))
      );
  }

  /**
   * Obtiene estadísticas de valores de atributo
   */
  getStatistics(): Observable<ApiResponse<ValorAtributoStatistics>> {
    this.setLoading(true);
    this.clearError();

    return this.http
      .get<ApiResponse<ValorAtributoStatistics>>(`${this.baseUrl}/statistics`)
      .pipe(
        catchError((error) => this.handleError(error)),
        tap(() => this.setLoading(false))
      );
  }

  /**
   * Construye HttpParams desde filtros
   */
  private buildHttpParams(filters: ValorAtributoFilters): HttpParams {
    let params = new HttpParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return params;
  }

  /**
   * Construye FormData para requests con archivos
   */
  private buildFormData(
    data: CreateValorAtributoRequest | UpdateValorAtributoRequest
  ): FormData {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    return formData;
  }

  /**
   * Maneja errores HTTP de forma centralizada
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Error desconocido';

    if (error.error instanceof ErrorEvent) {
      // Error del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del servidor
      const apiError = error.error as ApiErrorResponse;

      if (apiError?.message) {
        errorMessage = apiError.message;
      } else if (apiError?.errors) {
        // Manejar errores de validación
        const validationErrors = Object.values(apiError.errors).flat();
        errorMessage = validationErrors.join(', ');
      } else {
        errorMessage = `Error ${error.status}: ${error.statusText}`;
      }
    }

    this.setError(errorMessage);
    console.error('Error en ValorAtributoService:', error);

    return throwError(() => new Error(errorMessage));
  }

  /**
   * Establece el estado de carga
   */
  private setLoading(loading: boolean): void {
    this.loadingSignal.set(loading);
  }

  /**
   * Establece un error
   */
  private setError(error: string): void {
    this.errorSignal.set(error);
  }

  /**
   * Limpia el error actual
   */
  private clearError(): void {
    this.errorSignal.set(null);
  }

  /**
   * Limpia todos los estados
   */
  clearState(): void {
    this.valoresAtributoSignal.set([]);
    this.paginationSubject.next(null);
    this.filtersSubject.next({});
    this.clearError();
    this.setLoading(false);
  }

  /**
   * Refresca la lista actual con los filtros actuales
   */
  refresh(): Observable<PaginatedValorAtributoResponse> {
    const currentFilters = this.filtersSubject.value;
    return this.getValoresAtributo(currentFilters);
  }

  /**
   * Obtiene la URL completa de una imagen
   */
  getImageUrl(imagePath: string | null): string | null {
    if (!imagePath) return null;
    return `${environment.urlDominioApi}/storage/${imagePath}`;
  }

  /**
   * Valida si un código de color es hexadecimal válido
   */
  isValidHexColor(color: string): boolean {
    return /^#[0-9A-F]{6}$/i.test(color);
  }

  /**
   * Formatea un código de color agregando # si no lo tiene
   */
  formatColorCode(color: string): string {
    if (!color) return '';
    return color.startsWith('#') ? color : `#${color}`;
  }
}
