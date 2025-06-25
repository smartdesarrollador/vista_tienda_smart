import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  Observable,
  BehaviorSubject,
  tap,
  catchError,
  throwError,
  map,
} from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Categoria,
  CategoriaResponse,
  CategoriaTreeResponse,
  CategoriaSingleResponse,
  CategoriaFormData,
  CategoriaUpdateOrderData,
  CategoriaFilters,
  CategoriaTreeNode,
  CategoriaStats,
} from '../models/categoria.model';

@Injectable({
  providedIn: 'root',
})
export class CategoriasService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.urlDominioApi}/api`;
  private readonly adminApiUrl = `${environment.urlDominioApi}/api/admin`;

  // Estados reactivos
  private categoriasSubject = new BehaviorSubject<Categoria[]>([]);
  private categoriaTreeSubject = new BehaviorSubject<CategoriaTreeNode[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private totalCategoriasSubject = new BehaviorSubject<number>(0);

  // Observables públicos
  public readonly categorias$ = this.categoriasSubject.asObservable();
  public readonly categoriaTree$ = this.categoriaTreeSubject.asObservable();
  public readonly loading$ = this.loadingSubject.asObservable();
  public readonly totalCategorias$ = this.totalCategoriasSubject.asObservable();

  /**
   * 🌐 MÉTODOS PÚBLICOS (Sin autenticación requerida)
   */

  /**
   * Obtener todas las categorías con filtros y paginación
   */
  getCategorias(filters?: CategoriaFilters): Observable<CategoriaResponse> {
    this.loadingSubject.next(true);

    let params = new HttpParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http
      .get<CategoriaResponse>(`${this.apiUrl}/categorias`, { params })
      .pipe(
        tap((response) => {
          this.categoriasSubject.next(response.data);
          this.totalCategoriasSubject.next(response.meta.total);
          this.loadingSubject.next(false);
        }),
        catchError((error) => {
          this.loadingSubject.next(false);
          return this.handleError(error);
        })
      );
  }

  /**
   * Obtener estructura jerárquica de categorías (árbol)
   */
  getCategoriaTree(): Observable<CategoriaTreeResponse> {
    return this.http
      .get<CategoriaTreeResponse>(`${this.apiUrl}/categorias/tree`)
      .pipe(
        tap((response) => {
          this.categoriaTreeSubject.next(response.data);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Obtener solo categorías principales (sin padre)
   */
  getCategoriasPrincipales(): Observable<CategoriaResponse> {
    return this.http
      .get<CategoriaResponse>(`${this.apiUrl}/categorias/principales`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtener categoría por ID
   */
  getCategoriaById(id: number): Observable<CategoriaSingleResponse> {
    return this.http
      .get<CategoriaSingleResponse>(`${this.apiUrl}/categorias/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtener categoría por slug
   */
  getCategoriaBySlug(slug: string): Observable<CategoriaSingleResponse> {
    return this.http
      .get<CategoriaSingleResponse>(`${this.apiUrl}/categorias/slug/${slug}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * 🔐 MÉTODOS PROTEGIDOS (Requieren autenticación de admin)
   */

  /**
   * Crear nueva categoría
   */
  createCategoria(
    data: CategoriaFormData
  ): Observable<CategoriaSingleResponse> {
    this.loadingSubject.next(true);

    return this.http
      .post<CategoriaSingleResponse>(`${this.adminApiUrl}/categorias`, data)
      .pipe(
        tap(() => {
          this.loadingSubject.next(false);
          // Actualizar listas después de crear
          this.refreshData();
        }),
        catchError((error) => {
          this.loadingSubject.next(false);
          return this.handleError(error);
        })
      );
  }

  /**
   * Actualizar categoría existente
   */
  updateCategoria(
    id: number,
    data: CategoriaFormData
  ): Observable<CategoriaSingleResponse> {
    this.loadingSubject.next(true);

    return this.http
      .put<CategoriaSingleResponse>(
        `${this.adminApiUrl}/categorias/${id}`,
        data
      )
      .pipe(
        tap(() => {
          this.loadingSubject.next(false);
          // Actualizar listas después de editar
          this.refreshData();
        }),
        catchError((error) => {
          this.loadingSubject.next(false);
          return this.handleError(error);
        })
      );
  }

  /**
   * Eliminar categoría
   */
  deleteCategoria(id: number): Observable<{ message: string }> {
    this.loadingSubject.next(true);

    return this.http
      .delete<{ message: string }>(`${this.adminApiUrl}/categorias/${id}`)
      .pipe(
        tap(() => {
          this.loadingSubject.next(false);
          // Actualizar listas después de eliminar
          this.refreshData();
        }),
        catchError((error) => {
          this.loadingSubject.next(false);
          return this.handleError(error);
        })
      );
  }

  /**
   * Actualizar orden de categorías
   */
  updateCategoriaOrder(
    data: CategoriaUpdateOrderData
  ): Observable<{ message: string }> {
    this.loadingSubject.next(true);

    return this.http
      .put<{ message: string }>(
        `${this.adminApiUrl}/categorias/order/update`,
        data
      )
      .pipe(
        tap(() => {
          this.loadingSubject.next(false);
          // Actualizar listas después de reordenar
          this.refreshData();
        }),
        catchError((error) => {
          this.loadingSubject.next(false);
          return this.handleError(error);
        })
      );
  }

  /**
   * 📊 MÉTODOS DE UTILIDAD
   */

  /**
   * Obtener estadísticas de categorías
   */
  getCategoriaStats(): Observable<CategoriaStats> {
    return this.http
      .get<CategoriaStats>(`${this.adminApiUrl}/categorias/stats`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Buscar categorías por término
   */
  searchCategorias(term: string, limit: number = 10): Observable<Categoria[]> {
    const params = new HttpParams()
      .set('search', term)
      .set('per_page', limit.toString());

    return this.http
      .get<CategoriaResponse>(`${this.apiUrl}/categorias`, { params })
      .pipe(
        map((response) => response.data),
        catchError(this.handleError)
      );
  }

  /**
   * Verificar si una categoría tiene productos asociados
   */
  checkCategoriaHasProducts(
    id: number
  ): Observable<{ has_products: boolean; products_count: number }> {
    return this.http
      .get<{ has_products: boolean; products_count: number }>(
        `${this.adminApiUrl}/categorias/${id}/check-products`
      )
      .pipe(catchError(this.handleError));
  }

  /**
   * Verificar si una categoría tiene subcategorías
   */
  checkCategoriaHasSubcategorias(
    id: number
  ): Observable<{ has_subcategorias: boolean; subcategorias_count: number }> {
    return this.http
      .get<{ has_subcategorias: boolean; subcategorias_count: number }>(
        `${this.adminApiUrl}/categorias/${id}/check-subcategorias`
      )
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtener categorías para selector (dropdown)
   */
  getCategoriasForSelect(): Observable<
    { id: number; nombre: string; nivel: number }[]
  > {
    return this.http
      .get<{ id: number; nombre: string; nivel: number }[]>(
        `${this.apiUrl}/categorias/for-select`
      )
      .pipe(catchError(this.handleError));
  }

  /**
   * 🔄 MÉTODOS DE GESTIÓN DE ESTADO
   */

  /**
   * Refrescar datos desde el servidor
   */
  refreshData(): void {
    this.getCategorias().subscribe();
    this.getCategoriaTree().subscribe();
  }

  /**
   * Limpiar cache/estado local
   */
  clearCache(): void {
    this.categoriasSubject.next([]);
    this.categoriaTreeSubject.next([]);
    this.totalCategoriasSubject.next(0);
  }

  /**
   * Obtener valor actual de categorías sin suscripción
   */
  getCurrentCategorias(): Categoria[] {
    return this.categoriasSubject.getValue();
  }

  /**
   * Obtener valor actual del árbol sin suscripción
   */
  getCurrentTree(): CategoriaTreeNode[] {
    return this.categoriaTreeSubject.getValue();
  }

  /**
   * 🛡️ MÉTODOS DE VALIDACIÓN Y UTILIDADES
   */

  /**
   * Validar si el nombre de categoría está disponible
   */
  validateNombreDisponible(
    nombre: string,
    excludeId?: number
  ): Observable<{ available: boolean }> {
    let params = new HttpParams().set('nombre', nombre);
    if (excludeId) {
      params = params.set('exclude_id', excludeId.toString());
    }

    return this.http
      .get<{ available: boolean }>(
        `${this.adminApiUrl}/categorias/validate-nombre`,
        { params }
      )
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtener breadcrumb de una categoría
   */
  getBreadcrumb(
    categoriaId: number
  ): Observable<{ id: number; nombre: string; slug: string }[]> {
    return this.http
      .get<{ id: number; nombre: string; slug: string }[]>(
        `${this.apiUrl}/categorias/${categoriaId}/breadcrumb`
      )
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtener ruta completa de categoría
   */
  getFullPath(categoriaId: number): string {
    const tree = this.getCurrentTree();
    return this.findCategoryPath(tree, categoriaId, []);
  }

  /**
   * Buscar ruta de categoría en el árbol
   */
  private findCategoryPath(
    nodes: CategoriaTreeNode[],
    targetId: number,
    currentPath: string[]
  ): string {
    for (const node of nodes) {
      const newPath = [...currentPath, node.nombre];

      if (node.id === targetId) {
        return newPath.join(' > ');
      }

      if (node.subcategorias && node.subcategorias.length > 0) {
        const result = this.findCategoryPath(
          node.subcategorias,
          targetId,
          newPath
        );
        if (result) {
          return result;
        }
      }
    }
    return '';
  }

  /**
   * 🚨 MANEJO DE ERRORES
   */
  private handleError = (error: any): Observable<never> => {
    console.error('CategoriasService Error:', error);

    let errorMessage = 'Ha ocurrido un error inesperado';

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  };
}
