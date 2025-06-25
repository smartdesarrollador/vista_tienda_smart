import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  Observable,
  BehaviorSubject,
  tap,
  catchError,
  throwError,
  map,
  shareReplay,
  EMPTY,
} from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  DashboardUsuario,
  DashboardResponse,
  PedidosUsuarioResponse,
  FavoritosUsuarioResponse,
  DireccionesUsuarioResponse,
  NotificacionesUsuarioResponse,
  HistorialResponse,
  CreditoResponse,
  SimpleResponse,
  FiltrosPedidosUsuario,
  FiltrosFavoritosUsuario,
  FiltrosHistorial,
  FiltrosNotificaciones,
  EstadisticasUsuario,
  InformacionCredito,
  MetricasHistorial,
  EstadisticasFavoritos,
} from '../models/cuenta-usuario.interface';
import { Pedido } from '../models/pedido.interface';
import { Favorito } from '../models/favorito.interface';
import { Direccion } from '../models/direccion.interface';
import { Notificacion } from '../models/notificacion.interface';

/**
 * 🏠 Servicio de Cuenta de Usuario
 *
 * Gestiona todas las operaciones relacionadas con la cuenta del usuario cliente,
 * incluyendo dashboard, pedidos, favoritos, direcciones, notificaciones e historial.
 *
 * Características:
 * - Gestión de estado reactivo con signals
 * - Cache inteligente de datos
 * - Manejo de errores centralizado
 * - Optimización de peticiones HTTP
 * - Soporte para filtros y paginación
 */
@Injectable({
  providedIn: 'root',
})
export class CuentaUsuarioService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.urlDominioApi}/api/cuenta-usuario`;

  // 🚦 Estados reactivos con signals
  private readonly dashboardSignal = signal<DashboardUsuario | null>(null);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly estadisticasSignal = signal<EstadisticasUsuario | null>(
    null
  );
  private readonly creditoSignal = signal<InformacionCredito | null>(null);

  // 📊 Estados tradicionales para compatibilidad
  private dashboardSubject = new BehaviorSubject<DashboardUsuario | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  private estadisticasSubject = new BehaviorSubject<EstadisticasUsuario | null>(
    null
  );
  private notificacionesNoLeidasSubject = new BehaviorSubject<number>(0);

  // 🔄 Observables públicos
  public readonly dashboard$ = this.dashboardSubject.asObservable();
  public readonly loading$ = this.loadingSubject.asObservable();
  public readonly error$ = this.errorSubject.asObservable();
  public readonly estadisticas$ = this.estadisticasSubject.asObservable();
  public readonly notificacionesNoLeidas$ =
    this.notificacionesNoLeidasSubject.asObservable();

  // 📡 Signals públicos (solo lectura)
  public readonly dashboardData = this.dashboardSignal.asReadonly();
  public readonly isLoading = this.loadingSignal.asReadonly();
  public readonly errorMessage = this.errorSignal.asReadonly();
  public readonly estadisticasData = this.estadisticasSignal.asReadonly();
  public readonly creditoData = this.creditoSignal.asReadonly();

  // 💾 Cache de datos
  private readonly cacheConfig = {
    dashboard: { ttl: 5 * 60 * 1000, data: null as any, timestamp: 0 }, // 5 minutos
    credito: { ttl: 10 * 60 * 1000, data: null as any, timestamp: 0 }, // 10 minutos
    direcciones: { ttl: 15 * 60 * 1000, data: null as any, timestamp: 0 }, // 15 minutos
  };

  /**
   * 🏠 DASHBOARD DEL USUARIO
   */

  /**
   * Obtener dashboard completo del usuario
   */
  getDashboard(forceRefresh: boolean = false): Observable<DashboardResponse> {
    // Verificar cache
    if (!forceRefresh && this.isCacheValid('dashboard')) {
      return new Observable((observer) => {
        observer.next(this.cacheConfig.dashboard.data);
        observer.complete();
      });
    }

    this.setLoading(true);
    this.clearError();

    return this.http.get<DashboardResponse>(`${this.apiUrl}/dashboard`).pipe(
      tap((response) => {
        if (response.status === 'success') {
          this.updateDashboardState(response.data);
          this.updateCache('dashboard', response);
        }
        this.setLoading(false);
      }),
      catchError((error) => {
        this.setLoading(false);
        return this.handleError(error);
      }),
      shareReplay(1)
    );
  }

  /**
   * 📦 GESTIÓN DE PEDIDOS
   */

  /**
   * Obtener pedidos del usuario con filtros
   */
  getPedidos(
    filtros?: FiltrosPedidosUsuario
  ): Observable<PedidosUsuarioResponse> {
    let params = this.buildHttpParams(filtros);

    return this.http
      .get<PedidosUsuarioResponse>(`${this.apiUrl}/pedidos`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtener detalle de un pedido específico
   */
  getPedidoDetalle(pedidoId: number): Observable<{
    success: boolean;
    message: string;
    data: { pedido: Pedido };
  }> {
    this.setLoading(true);

    return this.http
      .get<{ success: boolean; message: string; data: { pedido: Pedido } }>(
        `${this.apiUrl}/pedidos/${pedidoId}`
      )
      .pipe(
        tap(() => this.setLoading(false)),
        catchError((error) => {
          this.setLoading(false);
          return this.handleError(error);
        })
      );
  }

  /**
   * ❤️ GESTIÓN DE FAVORITOS
   */

  /**
   * Obtener favoritos del usuario con filtros
   */
  getFavoritos(
    filtros?: FiltrosFavoritosUsuario
  ): Observable<FavoritosUsuarioResponse> {
    let params = this.buildHttpParams(filtros);

    return this.http
      .get<FavoritosUsuarioResponse>(`${this.apiUrl}/favoritos`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtener categorías disponibles en favoritos
   */
  getCategoriasFavoritos(): Observable<{ success: boolean; data: any[] }> {
    return this.http
      .get<{ success: boolean; data: any[] }>(
        `${this.apiUrl}/favoritos/categorias`
      )
      .pipe(catchError(this.handleError));
  }

  /**
   * Toggle favorito (agregar/quitar)
   */
  toggleFavorito(
    productoId: number
  ): Observable<{ success: boolean; message: string }> {
    return this.http
      .post<{ success: boolean; message: string }>(
        `${this.apiUrl}/favoritos/toggle`,
        {
          producto_id: productoId,
        }
      )
      .pipe(catchError(this.handleError));
  }

  /**
   * 📍 GESTIÓN DE DIRECCIONES
   */

  /**
   * Obtener departamentos
   */
  getDepartamentos(): Observable<{ success: boolean; data: any[] }> {
    return this.http
      .get<{ success: boolean; data: any[] }>(
        `${environment.urlDominioApi}/api/ubicacion/departamentos`
      )
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtener provincias por departamento
   */
  getProvincias(
    departamentoId: number
  ): Observable<{ success: boolean; data: any[] }> {
    return this.http
      .get<{ success: boolean; data: any[] }>(
        `${environment.urlDominioApi}/api/ubicacion/provincias/departamento/${departamentoId}`
      )
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtener distritos por provincia
   */
  getDistritos(
    provinciaId: number
  ): Observable<{ success: boolean; data: any[] }> {
    return this.http
      .get<{ success: boolean; data: any[] }>(
        `${environment.urlDominioApi}/api/ubicacion/distritos/provincia/${provinciaId}`
      )
      .pipe(catchError(this.handleError));
  }

  /**
   * Crear dirección
   */
  crearDireccion(data: any): Observable<{ success: boolean; message: string }> {
    return this.http
      .post<{ success: boolean; message: string }>(
        `${this.apiUrl}/direcciones`,
        data
      )
      .pipe(catchError(this.handleError));
  }

  /**
   * Actualizar dirección
   */
  actualizarDireccion(
    id: number,
    data: any
  ): Observable<{ success: boolean; message: string }> {
    return this.http
      .put<{ success: boolean; message: string }>(
        `${this.apiUrl}/direcciones/${id}`,
        data
      )
      .pipe(catchError(this.handleError));
  }

  /**
   * Establecer dirección predeterminada
   */
  establecerDireccionPredeterminada(
    id: number
  ): Observable<{ success: boolean; message: string }> {
    return this.http
      .put<{ success: boolean; message: string }>(
        `${this.apiUrl}/direcciones/${id}/predeterminada`,
        {}
      )
      .pipe(catchError(this.handleError));
  }

  /**
   * Eliminar dirección
   */
  eliminarDireccion(
    id: number
  ): Observable<{ success: boolean; message: string }> {
    return this.http
      .delete<{ success: boolean; message: string }>(
        `${this.apiUrl}/direcciones/${id}`
      )
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtener direcciones del usuario
   */
  getDirecciones(
    forceRefresh: boolean = false
  ): Observable<DireccionesUsuarioResponse> {
    // Verificar cache
    if (!forceRefresh && this.isCacheValid('direcciones')) {
      return new Observable((observer) => {
        observer.next(this.cacheConfig.direcciones.data);
        observer.complete();
      });
    }

    this.setLoading(true);

    return this.http
      .get<DireccionesUsuarioResponse>(`${this.apiUrl}/direcciones`)
      .pipe(
        tap((response) => {
          if (response.status === 'success') {
            this.updateCache('direcciones', response);
          }
          this.setLoading(false);
        }),
        catchError((error) => {
          this.setLoading(false);
          return this.handleError(error);
        }),
        shareReplay(1)
      );
  }

  /**
   * 📜 HISTORIAL DE COMPRAS
   */

  /**
   * Obtener historial de compras con métricas
   */
  getHistorial(filtros?: FiltrosHistorial): Observable<HistorialResponse> {
    this.setLoading(true);

    let params = this.buildHttpParams(filtros);

    return this.http
      .get<HistorialResponse>(`${this.apiUrl}/historial`, { params })
      .pipe(
        tap(() => this.setLoading(false)),
        catchError((error) => {
          this.setLoading(false);
          return this.handleError(error);
        })
      );
  }

  /**
   * 🔔 GESTIÓN DE NOTIFICACIONES
   */

  /**
   * Obtener notificaciones del usuario
   */
  getNotificaciones(
    filtros?: FiltrosNotificaciones
  ): Observable<NotificacionesUsuarioResponse> {
    this.setLoading(true);

    let params = this.buildHttpParams(filtros);

    return this.http
      .get<NotificacionesUsuarioResponse>(`${this.apiUrl}/notificaciones`, {
        params,
      })
      .pipe(
        tap((response) => {
          if (response.status === 'success') {
            this.notificacionesNoLeidasSubject.next(response.data.no_leidas);
          }
          this.setLoading(false);
        }),
        catchError((error) => {
          this.setLoading(false);
          return this.handleError(error);
        })
      );
  }

  /**
   * Marcar notificación como leída
   */
  marcarNotificacionLeida(notificacionId: number): Observable<SimpleResponse> {
    return this.http
      .put<SimpleResponse>(
        `${this.apiUrl}/notificaciones/${notificacionId}/marcar-leida`,
        {}
      )
      .pipe(
        tap((response) => {
          if (response.success) {
            // Decrementar contador de no leídas
            const actualNoLeidas = this.notificacionesNoLeidasSubject.value;
            this.notificacionesNoLeidasSubject.next(
              Math.max(0, actualNoLeidas - 1)
            );

            // Invalidar cache del dashboard para actualizar
            this.invalidateCache('dashboard');
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  marcarTodasNotificacionesLeidas(): Observable<SimpleResponse> {
    return this.http
      .put<SimpleResponse>(
        `${this.apiUrl}/notificaciones/marcar-todas-leidas`,
        {}
      )
      .pipe(
        tap((response) => {
          if (response.success) {
            // Resetear contador de no leídas
            this.notificacionesNoLeidasSubject.next(0);

            // Invalidar cache del dashboard
            this.invalidateCache('dashboard');
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * 💳 INFORMACIÓN DE CRÉDITO
   */

  /**
   * Obtener información completa de crédito
   */
  getInformacionCredito(
    forceRefresh: boolean = false
  ): Observable<CreditoResponse> {
    // Verificar cache
    if (!forceRefresh && this.isCacheValid('credito')) {
      return new Observable((observer) => {
        observer.next(this.cacheConfig.credito.data);
        observer.complete();
      });
    }

    this.setLoading(true);

    return this.http.get<CreditoResponse>(`${this.apiUrl}/credito`).pipe(
      tap((response) => {
        if (response.status === 'success') {
          this.creditoSignal.set(response.data);
          this.updateCache('credito', response);
        }
        this.setLoading(false);
      }),
      catchError((error) => {
        this.setLoading(false);
        return this.handleError(error);
      }),
      shareReplay(1)
    );
  }

  /**
   * 🔄 MÉTODOS DE UTILIDAD Y CACHE
   */

  /**
   * Refrescar todos los datos importantes
   */
  refreshAllData(): Observable<any> {
    this.clearAllCache();

    return this.getDashboard(true).pipe(
      tap(() => {
        // Opcionalmente cargar otros datos críticos
        this.getInformacionCredito(true).subscribe();
        this.getDirecciones(true).subscribe();
      })
    );
  }

  /**
   * Limpiar cache específico
   */
  invalidateCache(key: 'dashboard' | 'credito' | 'direcciones'): void {
    if (this.cacheConfig[key]) {
      this.cacheConfig[key].timestamp = 0;
      this.cacheConfig[key].data = null;
    }
  }

  /**
   * Limpiar todo el cache
   */
  clearAllCache(): void {
    Object.keys(this.cacheConfig).forEach((key) => {
      this.invalidateCache(key as any);
    });
  }

  /**
   * Obtener contador actual de notificaciones no leídas
   */
  getNotificacionesNoLeidasCount(): Observable<number> {
    return this.notificacionesNoLeidas$;
  }

  /**
   * 📊 MÉTODOS PARA OBTENER DATOS ESPECÍFICOS
   */

  /**
   * Obtener solo las estadísticas del usuario
   */
  getEstadisticas(): Observable<EstadisticasUsuario | null> {
    return this.estadisticas$;
  }

  /**
   * Obtener dashboard actual del cache o signal
   */
  getCurrentDashboard(): DashboardUsuario | null {
    return this.dashboardSignal() || this.dashboardSubject.value;
  }

  /**
   * Obtener información de crédito actual
   */
  getCurrentCredito(): InformacionCredito | null {
    return this.creditoSignal();
  }

  /**
   * Obtener perfil del usuario
   */
  getPerfilUsuario(): Observable<{
    status: string;
    message: string;
    data: { usuario: any; preferencias: any };
  }> {
    return this.http
      .get<{
        status: string;
        message: string;
        data: { usuario: any; preferencias: any };
      }>(`${this.apiUrl}/perfil`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Actualizar perfil del usuario
   */
  actualizarPerfil(data: any): Observable<{
    status: string;
    message: string;
    data?: any;
  }> {
    return this.http
      .put<{
        status: string;
        message: string;
        data?: any;
      }>(`${this.apiUrl}/perfil`, data)
      .pipe(catchError(this.handleError));
  }

  /**
   * Cambiar contraseña
   */
  cambiarPassword(data: any): Observable<{
    status: string;
    message: string;
    data?: any;
  }> {
    return this.http
      .put<{
        status: string;
        message: string;
        data?: any;
      }>(`${this.apiUrl}/cambiar-password`, data)
      .pipe(catchError(this.handleError));
  }

  /**
   * 🛠️ MÉTODOS PRIVADOS Y UTILIDADES
   */

  /**
   * Construir parámetros HTTP desde filtros
   */
  private buildHttpParams(filtros?: any): HttpParams {
    let params = new HttpParams();

    if (filtros) {
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return params;
  }

  /**
   * Verificar si el cache es válido
   */
  private isCacheValid(key: 'dashboard' | 'credito' | 'direcciones'): boolean {
    const cache = this.cacheConfig[key];
    if (!cache.data || !cache.timestamp) return false;

    return Date.now() - cache.timestamp < cache.ttl;
  }

  /**
   * Actualizar cache
   */
  private updateCache(
    key: 'dashboard' | 'credito' | 'direcciones',
    data: any
  ): void {
    this.cacheConfig[key].data = data;
    this.cacheConfig[key].timestamp = Date.now();
  }

  /**
   * Actualizar estado del dashboard
   */
  private updateDashboardState(dashboard: DashboardUsuario): void {
    this.dashboardSignal.set(dashboard);
    this.dashboardSubject.next(dashboard);
    this.estadisticasSignal.set(dashboard.estadisticas);
    this.estadisticasSubject.next(dashboard.estadisticas);
    this.notificacionesNoLeidasSubject.next(
      dashboard.estadisticas.notificaciones_no_leidas
    );
  }

  /**
   * Gestionar estado de loading
   */
  private setLoading(loading: boolean): void {
    this.loadingSignal.set(loading);
    this.loadingSubject.next(loading);
  }

  /**
   * Limpiar error
   */
  private clearError(): void {
    this.errorSignal.set(null);
    this.errorSubject.next(null);
  }

  /**
   * Gestionar errores centralizadamente
   */
  private handleError = (error: any): Observable<never> => {
    console.error('❌ Error en CuentaUsuarioService:', error);

    let errorMessage = 'Ha ocurrido un error inesperado';

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    // Gestión específica por código de error
    switch (error.status) {
      case 401:
        errorMessage =
          'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
        break;
      case 403:
        errorMessage = 'No tienes permisos para acceder a esta información.';
        break;
      case 404:
        errorMessage = 'La información solicitada no fue encontrada.';
        break;
      case 422:
        errorMessage = 'Los datos enviados no son válidos.';
        break;
      case 429:
        errorMessage = 'Demasiadas solicitudes. Por favor, intenta más tarde.';
        break;
      case 500:
        errorMessage =
          'Error interno del servidor. Por favor, intenta más tarde.';
        break;
    }

    this.errorSignal.set(errorMessage);
    this.errorSubject.next(errorMessage);

    return throwError(() => new Error(errorMessage));
  };

  /**
   * 🧹 LIMPIEZA AL DESTRUIR EL SERVICIO
   */
  ngOnDestroy(): void {
    this.dashboardSubject.complete();
    this.loadingSubject.complete();
    this.errorSubject.complete();
    this.estadisticasSubject.complete();
    this.notificacionesNoLeidasSubject.complete();
    this.clearAllCache();
  }
}
