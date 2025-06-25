import { inject, Injectable } from '@angular/core';
import {
  HttpClient,
  HttpParams,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import {
  Atributo,
  AtributoFormData,
  PaginatedResponse,
  TipoAtributo,
  ApiResponse,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class AtributosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/vista/atributos`; // Ruta base para atributos en admin

  /**
   * Obtiene una lista paginada de atributos, con opciones de filtrado.
   * @param page Número de página.
   * @param perPage Cantidad de elementos por página.
   * @param nombre Filtro por nombre de atributo.
   * @param tipo Filtro por tipo de atributo.
   * @param filtrable Filtro por si es filtrable.
   * @param visible Filtro por si es visible.
   * @returns Observable con la respuesta paginada de atributos.
   */
  getAtributos(
    page: number = 1,
    perPage: number = 10,
    nombre?: string,
    tipo?: TipoAtributo,
    filtrable?: boolean,
    visible?: boolean
  ): Observable<PaginatedResponse<Atributo>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    if (nombre) {
      params = params.set('nombre', nombre);
    }
    if (tipo) {
      params = params.set('tipo', tipo);
    }
    if (filtrable !== undefined) {
      params = params.set('filtrable', filtrable.toString());
    }
    if (visible !== undefined) {
      params = params.set('visible', visible.toString());
    }

    return this.http
      .get<PaginatedResponse<Atributo>>(this.apiUrl, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtiene un atributo específico por su ID.
   * @param id El ID del atributo.
   * @returns Observable con la respuesta de la API que contiene el atributo.
   */
  getAtributoById(id: number): Observable<ApiResponse<Atributo>> {
    return this.http
      .get<ApiResponse<Atributo>>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Crea un nuevo atributo.
   * @param atributoData Los datos del atributo a crear.
   * @returns Observable con la respuesta de la API que contiene el atributo creado.
   */
  createAtributo(
    atributoData: AtributoFormData
  ): Observable<ApiResponse<Atributo>> {
    return this.http
      .post<ApiResponse<Atributo>>(this.apiUrl, atributoData)
      .pipe(catchError(this.handleError));
  }

  /**
   * Actualiza un atributo existente.
   * @param id El ID del atributo a actualizar.
   * @param atributoData Los datos actualizados del atributo.
   * @returns Observable con la respuesta de la API que contiene el atributo actualizado.
   */
  updateAtributo(
    id: number,
    atributoData: Partial<AtributoFormData>
  ): Observable<ApiResponse<Atributo>> {
    return this.http
      .put<ApiResponse<Atributo>>(`${this.apiUrl}/${id}`, atributoData)
      .pipe(catchError(this.handleError));
  }

  /**
   * Elimina un atributo por su ID.
   * @param id El ID del atributo a eliminar.
   * @returns Observable vacío si la eliminación es exitosa.
   */
  deleteAtributo(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  validateNombreDisponible(
    nombre: string,
    excludeId?: number
  ): Observable<{ available: boolean }> {
    let params = new HttpParams().set('nombre', nombre);
    if (excludeId) {
      params = params.set('exclude_id', excludeId.toString());
    }
    // Asumiendo que el endpoint de validación está en la misma ruta base de atributos
    return this.http
      .get<{ available: boolean }>(`${this.apiUrl}/validate-nombre`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Manejador de errores centralizado para las peticiones HTTP.
   * @param error El error HTTP.
   * @returns Observable que emite el error.
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Ocurrió un error en AtributosService:', error);
    let errorMessage = 'Ocurrió un error desconocido.';
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else if (error.status === 422 && error.error.errors) {
      // Errores de validación de Laravel
      const laravelErrors = error.error.errors;
      const messages = Object.keys(laravelErrors)
        .map((key) => `${laravelErrors[key].join(' ')}`)
        .join(' ');
      errorMessage = `Error de validación: ${messages}`;
    } else if (error.error && error.error.message) {
      // Otros errores del backend con mensaje
      errorMessage = error.error.message;
    } else {
      // Error del servidor sin un mensaje específico
      errorMessage = `Error del servidor: ${error.status}. ${error.message}`;
    }
    return throwError(() => new Error(errorMessage));
  }
}
