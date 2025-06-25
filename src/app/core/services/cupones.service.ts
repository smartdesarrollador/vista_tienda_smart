import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpParams,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import {
  Cupon,
  CuponFormData,
  PaginatedResponse,
  ApiResponse,
  TipoCupon,
} from '../models/cupon.model';

export interface CuponFilters {
  page?: number;
  per_page?: number;
  codigo?: string;
  tipo?: TipoCupon | '';
  activo?: boolean | null;
  estado_vigencia?:
    | 'vigente'
    | 'no_vigente'
    | 'proximo'
    | 'usado_completamente'
    | '';
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
}

@Injectable({
  providedIn: 'root',
})
export class CuponesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/vista/cupones`;

  getCupones(filters: CuponFilters = {}): Observable<PaginatedResponse<Cupon>> {
    let params = new HttpParams();
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.per_page)
      params = params.set('per_page', filters.per_page.toString());
    if (filters.codigo) params = params.set('codigo', filters.codigo);
    if (filters.tipo) params = params.set('tipo', filters.tipo);
    if (filters.activo !== undefined && filters.activo !== null) {
      params = params.set('activo', filters.activo.toString());
    }
    if (filters.estado_vigencia)
      params = params.set('estado_vigencia', filters.estado_vigencia);
    if (filters.sort_by) params = params.set('sort_by', filters.sort_by);
    if (filters.sort_direction)
      params = params.set('sort_direction', filters.sort_direction);

    return this.http
      .get<PaginatedResponse<Cupon>>(this.apiUrl, { params })
      .pipe(catchError(this.handleError));
  }

  getCuponById(id: number): Observable<ApiResponse<Cupon>> {
    return this.http
      .get<ApiResponse<Cupon>>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  createCupon(data: CuponFormData): Observable<ApiResponse<Cupon>> {
    return this.http
      .post<ApiResponse<Cupon>>(this.apiUrl, data)
      .pipe(catchError(this.handleError));
  }

  updateCupon(
    id: number,
    data: Partial<CuponFormData> // Partial para permitir actualizaciones parciales
  ): Observable<ApiResponse<Cupon>> {
    return this.http
      .put<ApiResponse<Cupon>>(`${this.apiUrl}/${id}`, data)
      .pipe(catchError(this.handleError));
  }

  deleteCupon(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  validateCodigoDisponible(
    codigo: string,
    excludeId?: number
  ): Observable<{ available: boolean }> {
    let params = new HttpParams().set('codigo', codigo);
    if (excludeId) {
      params = params.set('exclude_id', excludeId.toString());
    }
    // Asumimos un endpoint de validación. Si no existe en el backend, habrá que crearlo.
    return this.http
      .get<{ available: boolean }>(`${this.apiUrl}/validate-codigo`, { params })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Ocurrió un error en CuponesService:', error);
    let errorMessage = 'Ocurrió un error desconocido procesando su solicitud.';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente o de red
      errorMessage = `Error: ${error.error.message}`;
    } else if (error.status === 422 && error.error && error.error.errors) {
      // Errores de validación de Laravel (específicamente con la estructura de `errors`)
      const laravelErrors = error.error.errors;
      const messages = Object.keys(laravelErrors)
        .map((key) => `${laravelErrors[key].join(' ')}`)
        .join('; ');
      errorMessage = `Error de validación: ${messages}`;
    } else if (error.error && error.error.message) {
      // Otros errores del backend con un campo `message` en el cuerpo del error
      errorMessage = error.error.message;
    } else if (error.status === 0) {
      errorMessage =
        'No se pudo conectar con el servidor. Verifique su conexión a internet e inténtelo de nuevo.';
    } else {
      // Otros tipos de errores del servidor
      errorMessage = `Error ${error.status}: ${error.statusText}. Por favor, contacte a soporte si el problema persiste.`;
    }
    return throwError(() => new Error(errorMessage));
  }
}
