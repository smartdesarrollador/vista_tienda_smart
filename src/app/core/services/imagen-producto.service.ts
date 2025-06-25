import { Injectable, inject, signal, computed } from '@angular/core';
import {
  HttpClient,
  HttpParams,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, map, tap, finalize } from 'rxjs/operators';

import {
  ImagenProducto,
  CreateImagenProductoRequest,
  UpdateImagenProductoRequest,
  ImagenProductoFilters,
  ImagenProductoListResponse,
  ImagenProductoResponse,
  ImagenProductoByProductoResponse,
  ImagenProductoByVariacionResponse,
  UpdateOrderRequest,
  ImagenProductoStatisticsResponse,
  ApiResponse,
  TipoImagen,
} from '../models/imagen-producto.interface';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ImagenProductoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/vista/imagenes-producto`;

  // Signals para estado reactivo
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _imagenes = signal<ImagenProducto[]>([]);
  private readonly _currentImagen = signal<ImagenProducto | null>(null);
  private readonly _statistics = signal<any>(null);

  // Signals públicos de solo lectura
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly imagenes = this._imagenes.asReadonly();
  readonly currentImagen = this._currentImagen.asReadonly();
  readonly statistics = this._statistics.asReadonly();

  // Computed signals
  readonly hasImagenes = computed(() => this._imagenes().length > 0);
  readonly imagenesCount = computed(() => this._imagenes().length);
  readonly principalImagenes = computed(() =>
    this._imagenes().filter((img) => img.principal)
  );

  // Subject para paginación
  private readonly paginationSubject = new BehaviorSubject<any>(null);
  readonly pagination$ = this.paginationSubject.asObservable();

  /**
   * Obtener lista de imágenes con filtros y paginación
   */
  getImagenes(
    filters?: ImagenProductoFilters
  ): Observable<ImagenProductoListResponse> {
    this._loading.set(true);
    this._error.set(null);

    let params = new HttpParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http
      .get<ImagenProductoListResponse>(this.baseUrl, { params })
      .pipe(
        tap((response) => {
          if (response.success) {
            this._imagenes.set(response.data);
            this.paginationSubject.next(response.pagination);
          }
        }),
        catchError(this.handleError.bind(this)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Obtener imagen específica por ID
   */
  getImagenById(id: number): Observable<ImagenProducto> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.get<ImagenProductoResponse>(`${this.baseUrl}/${id}`).pipe(
      map((response) => {
        if (response.success && response.data) {
          this._currentImagen.set(response.data);
          return response.data;
        }
        throw new Error(response.error || 'Error al obtener la imagen');
      }),
      catchError(this.handleError.bind(this)),
      finalize(() => this._loading.set(false))
    );
  }

  /**
   * Crear nueva imagen de producto
   */
  createImagen(
    request: CreateImagenProductoRequest
  ): Observable<ImagenProducto> {
    this._loading.set(true);
    this._error.set(null);

    const formData = this.buildFormData(request);

    return this.http.post<ImagenProductoResponse>(this.baseUrl, formData).pipe(
      map((response) => {
        if (response.success && response.data) {
          // Actualizar lista local
          const currentImagenes = this._imagenes();
          this._imagenes.set([...currentImagenes, response.data]);
          return response.data;
        }
        throw new Error(response.error || 'Error al crear la imagen');
      }),
      catchError(this.handleError.bind(this)),
      finalize(() => this._loading.set(false))
    );
  }

  /**
   * Actualizar imagen existente
   */
  updateImagen(
    id: number,
    request: UpdateImagenProductoRequest
  ): Observable<ImagenProducto> {
    this._loading.set(true);
    this._error.set(null);

    const formData = this.buildFormData(request, true);

    return this.http
      .post<ImagenProductoResponse>(`${this.baseUrl}/${id}`, formData)
      .pipe(
        map((response) => {
          if (response.success && response.data) {
            // Actualizar lista local
            const currentImagenes = this._imagenes();
            const updatedImagenes = currentImagenes.map((img) =>
              img.id === id ? response.data : img
            );
            this._imagenes.set(updatedImagenes);
            this._currentImagen.set(response.data);
            return response.data;
          }
          throw new Error(response.error || 'Error al actualizar la imagen');
        }),
        catchError(this.handleError.bind(this)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Eliminar imagen
   */
  deleteImagen(id: number): Observable<void> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.delete<ApiResponse>(`${this.baseUrl}/${id}`).pipe(
      map((response) => {
        if (response.success) {
          // Remover de lista local
          const currentImagenes = this._imagenes();
          const filteredImagenes = currentImagenes.filter(
            (img) => img.id !== id
          );
          this._imagenes.set(filteredImagenes);

          // Limpiar imagen actual si es la que se eliminó
          if (this._currentImagen()?.id === id) {
            this._currentImagen.set(null);
          }
          return;
        }
        throw new Error(response.error || 'Error al eliminar la imagen');
      }),
      catchError(this.handleError.bind(this)),
      finalize(() => this._loading.set(false))
    );
  }

  /**
   * Obtener imágenes por producto
   */
  getImagenesByProducto(
    productoId: number,
    filters?: { variacion_id?: number; tipo?: TipoImagen }
  ): Observable<ImagenProductoByProductoResponse> {
    this._loading.set(true);
    this._error.set(null);

    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http
      .get<ImagenProductoByProductoResponse>(
        `${this.baseUrl}/producto/${productoId}`,
        { params }
      )
      .pipe(
        tap((response) => {
          if (response.success) {
            this._imagenes.set(response.data);
          }
        }),
        catchError(this.handleError.bind(this)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Obtener imágenes por variación
   */
  getImagenesByVariacion(
    variacionId: number,
    filters?: { tipo?: TipoImagen }
  ): Observable<ImagenProductoByVariacionResponse> {
    this._loading.set(true);
    this._error.set(null);

    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http
      .get<ImagenProductoByVariacionResponse>(
        `${this.baseUrl}/variacion/${variacionId}`,
        { params }
      )
      .pipe(
        tap((response) => {
          if (response.success) {
            this._imagenes.set(response.data);
          }
        }),
        catchError(this.handleError.bind(this)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Actualizar orden de múltiples imágenes
   */
  updateOrder(request: UpdateOrderRequest): Observable<void> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .put<ApiResponse>(`${this.baseUrl}/update-order`, request)
      .pipe(
        map((response) => {
          if (response.success) {
            // Actualizar orden local
            const currentImagenes = this._imagenes();
            const updatedImagenes = currentImagenes.map((img) => {
              const orderUpdate = request.imagenes.find(
                (item) => item.id === img.id
              );
              return orderUpdate ? { ...img, orden: orderUpdate.orden } : img;
            });
            // Reordenar por orden
            updatedImagenes.sort((a, b) => a.orden - b.orden);
            this._imagenes.set(updatedImagenes);
            return;
          }
          throw new Error(response.error || 'Error al actualizar el orden');
        }),
        catchError(this.handleError.bind(this)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Marcar imagen como principal
   */
  setPrincipal(id: number): Observable<ImagenProducto> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .post<ImagenProductoResponse>(`${this.baseUrl}/${id}/set-principal`, {})
      .pipe(
        map((response) => {
          if (response.success && response.data) {
            // Actualizar lista local - desmarcar otras principales y marcar esta
            const currentImagenes = this._imagenes();
            const updatedImagenes = currentImagenes.map((img) => ({
              ...img,
              principal:
                img.id === id
                  ? true
                  : img.producto_id === response.data.producto_id &&
                    img.variacion_id === response.data.variacion_id
                  ? false
                  : img.principal,
            }));
            this._imagenes.set(updatedImagenes);
            this._currentImagen.set(response.data);
            return response.data;
          }
          throw new Error(response.error || 'Error al marcar como principal');
        }),
        catchError(this.handleError.bind(this)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Obtener estadísticas de imágenes
   */
  getStatistics(): Observable<any> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .get<ImagenProductoStatisticsResponse & { error?: string }>(
        `${this.baseUrl}/statistics`
      )
      .pipe(
        map((response) => {
          if (response.success && response.data) {
            this._statistics.set(response.data);
            return response.data;
          }
          throw new Error(response.error || 'Error al obtener estadísticas');
        }),
        catchError(this.handleError.bind(this)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Limpiar estado del servicio
   */
  clearState(): void {
    this._imagenes.set([]);
    this._currentImagen.set(null);
    this._error.set(null);
    this._statistics.set(null);
    this.paginationSubject.next(null);
  }

  /**
   * Limpiar solo errores
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Construir FormData para requests con archivos
   */
  private buildFormData(
    request: CreateImagenProductoRequest | UpdateImagenProductoRequest,
    isUpdate = false
  ): FormData {
    const formData = new FormData();

    // Agregar _method para Laravel si es actualización
    if (isUpdate) {
      formData.append('_method', 'PUT');
    }

    // Agregar archivo de imagen si existe
    if ('imagen' in request && request.imagen) {
      formData.append('imagen', request.imagen);
    }

    // Agregar otros campos
    Object.entries(request).forEach(([key, value]) => {
      if (key !== 'imagen' && value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });

    return formData;
  }

  /**
   * Manejo centralizado de errores
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ha ocurrido un error inesperado';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.error?.error) {
        errorMessage = error.error.error;
      } else {
        switch (error.status) {
          case 400:
            errorMessage = 'Solicitud inválida. Verifique los datos enviados.';
            break;
          case 401:
            errorMessage = 'No autorizado. Inicie sesión nuevamente.';
            break;
          case 403:
            errorMessage = 'No tiene permisos para realizar esta acción.';
            break;
          case 404:
            errorMessage = 'Imagen no encontrada.';
            break;
          case 422:
            errorMessage = 'Datos de validación incorrectos.';
            if (error.error?.errors) {
              const validationErrors = Object.values(error.error.errors).flat();
              errorMessage = validationErrors.join(', ');
            }
            break;
          case 500:
            errorMessage = 'Error interno del servidor. Intente nuevamente.';
            break;
          default:
            errorMessage = `Error ${error.status}: ${error.message}`;
        }
      }
    }

    this._error.set(errorMessage);
    console.error('ImagenProductoService Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
