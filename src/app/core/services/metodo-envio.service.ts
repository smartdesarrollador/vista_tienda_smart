import {
  Injectable,
  signal,
  computed,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import {
  map,
  catchError,
  tap,
  debounceTime,
  shareReplay,
} from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  MetodoEnvioCompleto,
  MetodoEnvioDetallado,
  MetodosEnvioRequest,
  MetodosEnvioResponse,
  MetodoEnvioDetalladoResponse,
  CalcularCostoEnvioRequest,
  CalcularCostoEnvioResponse,
  ZonasCoberturaResponse,
  ZonaCobertura,
  CompararMetodosRequest,
  CompararMetodosResponse,
  ComparacionMetodo,
  ValidarDisponibilidadRequest,
  ValidarDisponibilidadResponse,
  CalcularTiempoRequest,
  CalcularTiempoResponse,
  EventoMetodoEnvio,
  ConfiguracionServicioEnvio,
  FiltrosMetodoEnvio,
  CacheCalculoEnvio,
  EstadisticasMetodosEnvioResponse,
  InformacionEmpresaEnvioResponse,
  MetodoEnvioResponse,
  TiempoEstimado,
  ZonaEntrega,
  TipoEntrega,
} from '../models/metodo-envio.interface';

@Injectable({
  providedIn: 'root',
})
export class MetodoEnvioService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly API_URL = `${environment.apiUrl}/metodos-envio`;
  private readonly CACHE_KEY = 'metodos_envio_cache';
  private readonly CACHE_CALCULOS_KEY = 'calculos_envio_cache';

  // Opciones HTTP
  private get httpOptions() {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Accept: 'application/json',
      }),
    };
  }

  // Configuración del servicio
  private readonly configuracion: ConfiguracionServicioEnvio = {
    cache_duracion_minutos: 30,
    reintentos_calculo: 3,
    timeout_segundos: 30,
    auto_seleccionar_mas_barato: false,
    auto_seleccionar_mas_rapido: false,
    mostrar_solo_disponibles: true,
  };

  // Signals para estado reactivo
  private readonly _metodosEnvio = signal<MetodoEnvioCompleto[]>([]);
  private readonly _metodosDisponibles = signal<MetodoEnvioCompleto[]>([]);
  private readonly _metodoSeleccionado = signal<MetodoEnvioCompleto | null>(
    null
  );
  private readonly _zonasCobertura = signal<Record<string, ZonaCobertura>>({});
  private readonly _cargando = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _ultimoCalculo = signal<CalcularCostoEnvioResponse | null>(
    null
  );

  // Cache de cálculos
  private readonly cacheCalculos = new Map<string, CacheCalculoEnvio>();

  // Subject para eventos
  private readonly eventosMetodoEnvio$ =
    new BehaviorSubject<EventoMetodoEnvio | null>(null);

  // Computed signals públicos
  readonly metodosEnvio = this._metodosEnvio.asReadonly();
  readonly metodosDisponibles = this._metodosDisponibles.asReadonly();
  readonly metodoSeleccionado = this._metodoSeleccionado.asReadonly();
  readonly zonasCobertura = this._zonasCobertura.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly error = this._error.asReadonly();
  readonly ultimoCalculo = this._ultimoCalculo.asReadonly();

  readonly metodosActivos = computed(() =>
    this._metodosEnvio().filter((metodo) => metodo.activo)
  );

  readonly metodoMasRapido = computed(() => {
    const metodos = this._metodosDisponibles();
    return metodos.reduce((rapido, actual) =>
      actual.tiempo_entrega_min < rapido.tiempo_entrega_min ? actual : rapido
    );
  });

  readonly metodoMasEconomico = computed(() => {
    const metodos = this._metodosDisponibles();
    return metodos.reduce((economico, actual) =>
      actual.costo_base < economico.costo_base ? actual : economico
    );
  });

  readonly hayMetodosDisponibles = computed(
    () => this._metodosDisponibles().length > 0
  );

  readonly resumenMetodos = computed(() => ({
    total: this._metodosEnvio().length,
    activos: this.metodosActivos().length,
    disponibles: this._metodosDisponibles().length,
    seleccionado: this._metodoSeleccionado()?.nombre,
  }));

  constructor() {
    // Cargar datos iniciales
    if (this.isBrowser) {
      this.cargarDesdeCache();
      this.obtenerMetodosEnvio().subscribe();
      this.obtenerZonasCobertura().subscribe();

      // Limpiar cache periódicamente
      setInterval(() => {
        this.limpiarCacheExpirado();
      }, 60000); // Cada minuto
    }
  }

  // Métodos públicos principales

  /**
   * Obtener todos los métodos de envío
   */
  obtenerMetodosEnvio(
    request?: MetodosEnvioRequest
  ): Observable<MetodosEnvioResponse> {
    this._cargando.set(true);
    this._error.set(null);

    let params = new HttpParams();
    if (request?.solo_activos) {
      params = params.set('solo_activos', 'true');
    }

    return this.http
      .get<MetodosEnvioResponse>(this.API_URL, {
        ...this.httpOptions,
        params,
      })
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            this._metodosEnvio.set(response.data);
            this.guardarEnCache('metodos', response.data);
          }
        }),
        catchError((error) => {
          this._error.set('Error al obtener métodos de envío');
          return this.manejarErrorOffline('metodos');
        }),
        tap(() => this._cargando.set(false)),
        shareReplay(1)
      );
  }

  /**
   * Obtener información detallada de un método de envío
   */
  obtenerMetodoDetallado(id: number): Observable<MetodoEnvioDetalladoResponse> {
    this._cargando.set(true);

    return this.http
      .get<MetodoEnvioDetalladoResponse>(
        `${this.API_URL}/${id}`,
        this.httpOptions
      )
      .pipe(
        catchError((error) => {
          this._error.set('Error al obtener detalles del método de envío');
          throw error;
        }),
        tap(() => this._cargando.set(false))
      );
  }

  /**
   * Calcular costo de envío
   */
  calcularCostoEnvio(
    request: CalcularCostoEnvioRequest
  ): Observable<CalcularCostoEnvioResponse> {
    // Verificar cache primero
    const cacheKey = this.generarCacheKey(request);
    const calculoCache = this.obtenerDeCache(cacheKey);

    if (calculoCache && !this.esCacheExpirado(calculoCache)) {
      return of(calculoCache.resultado).pipe(
        tap((response) => {
          this._ultimoCalculo.set(response);
          this.emitirEvento({
            tipo: 'costo_calculado',
            data: { ...response, desde_cache: true },
            timestamp: new Date(),
          });
        })
      );
    }

    this._cargando.set(true);

    return this.http
      .post<CalcularCostoEnvioResponse>(
        `${this.API_URL}/calcular-costo`,
        request,
        this.httpOptions
      )
      .pipe(
        tap((response) => {
          if (response.success) {
            this._ultimoCalculo.set(response);
            this.guardarCalculoEnCache(cacheKey, request, response);

            this.emitirEvento({
              tipo: 'costo_calculado',
              data: response,
              timestamp: new Date(),
            });
          }
        }),
        catchError((error) => {
          this._error.set('Error al calcular costo de envío');
          throw error;
        }),
        tap(() => this._cargando.set(false))
      );
  }

  /**
   * Obtener zonas de cobertura
   */
  obtenerZonasCobertura(): Observable<ZonasCoberturaResponse> {
    return this.http
      .get<ZonasCoberturaResponse>(
        `${this.API_URL}/zonas/cobertura`,
        this.httpOptions
      )
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            this._zonasCobertura.set(response.data);
            this.guardarEnCache('zonas', response.data);
          }
        }),
        catchError((error) => {
          this._error.set('Error al obtener zonas de cobertura');
          return this.manejarErrorOffline('zonas');
        }),
        shareReplay(1)
      );
  }

  /**
   * Comparar múltiples métodos de envío
   */
  compararMetodos(
    request: CompararMetodosRequest
  ): Observable<CompararMetodosResponse> {
    this._cargando.set(true);

    // Si no se especifican métodos, usar todos los disponibles
    const metodosIds =
      request.metodos_ids || this._metodosEnvio().map((m) => m.id);

    const comparaciones$ = metodosIds.map((metodoId) =>
      this.calcularCostoEnvio({
        metodo_envio_id: metodoId,
        distrito: request.distrito,
        provincia: request.provincia,
        departamento: request.departamento,
        peso_total: request.peso_total,
        subtotal: request.subtotal,
      }).pipe(
        map((response) => {
          const metodo = this._metodosEnvio().find((m) => m.id === metodoId);
          if (!metodo || !response.success) return null;

          return {
            metodo,
            costo: response.data.costo,
            tiempo_estimado: response.data.tiempo_estimado,
            disponible: response.data.disponible,
            envio_gratis: response.data.envio_gratis,
            puntuacion_velocidad: this.calcularPuntuacionVelocidad(
              response.data.tiempo_estimado
            ),
            puntuacion_precio: this.calcularPuntuacionPrecio(
              response.data.costo
            ),
            recomendado: false, // Se calculará después
          } as ComparacionMetodo;
        }),
        catchError(() => of(null))
      )
    );

    return new Observable<CompararMetodosResponse>((subscriber) => {
      Promise.all(comparaciones$.map((obs) => obs.toPromise()))
        .then((comparaciones) => {
          const comparacionesValidas = comparaciones.filter(
            (c) => c !== null
          ) as ComparacionMetodo[];

          if (comparacionesValidas.length === 0) {
            subscriber.error(
              new Error('No hay métodos disponibles para comparar')
            );
            return;
          }

          // Calcular recomendado (balance entre precio y velocidad)
          comparacionesValidas.forEach((comp) => {
            comp.recomendado =
              comp.puntuacion_velocidad + comp.puntuacion_precio >= 8;
          });

          const mejorPrecio = comparacionesValidas.reduce((mejor, actual) =>
            actual.costo < mejor.costo ? actual : mejor
          );

          const masRapido = comparacionesValidas.reduce((rapido, actual) =>
            actual.tiempo_estimado.min < rapido.tiempo_estimado.min
              ? actual
              : rapido
          );

          const recomendado =
            comparacionesValidas.find((c) => c.recomendado) || mejorPrecio;

          const response: CompararMetodosResponse = {
            success: true,
            data: {
              comparaciones: comparacionesValidas.sort(
                (a, b) =>
                  b.puntuacion_velocidad +
                  b.puntuacion_precio -
                  a.puntuacion_velocidad -
                  a.puntuacion_precio
              ),
              mejor_precio: mejorPrecio,
              mas_rapido: masRapido,
              recomendado,
            },
          };

          subscriber.next(response);
          subscriber.complete();
        })
        .catch((error) => subscriber.error(error))
        .finally(() => this._cargando.set(false));
    });
  }

  /**
   * Validar disponibilidad de un método en una ubicación
   */
  validarDisponibilidad(
    request: ValidarDisponibilidadRequest
  ): Observable<ValidarDisponibilidadResponse> {
    return this.calcularCostoEnvio({
      metodo_envio_id: request.metodo_envio_id,
      distrito: request.distrito,
      provincia: request.provincia,
      departamento: request.departamento,
      peso_total: request.peso_total || 1,
      subtotal: request.subtotal || 0,
    }).pipe(
      map((response) => {
        const disponible = response.success && response.data.disponible;
        let alternativas: MetodoEnvioCompleto[] = [];

        if (!disponible) {
          // Buscar métodos alternativos disponibles
          alternativas = this._metodosEnvio().filter(
            (metodo) => metodo.id !== request.metodo_envio_id && metodo.activo
          );
        }

        return {
          success: true,
          data: {
            disponible,
            motivo: disponible
              ? undefined
              : response.data?.mensaje || 'No disponible en esta ubicación',
            alternativas,
          },
        } as ValidarDisponibilidadResponse;
      }),
      catchError(() => {
        return of({
          success: false,
          data: {
            disponible: false,
            motivo: 'Error al verificar disponibilidad',
            alternativas: [],
          },
        } as ValidarDisponibilidadResponse);
      })
    );
  }

  // Métodos de selección y filtrado

  /**
   * Seleccionar método de envío
   */
  seleccionarMetodo(metodo: MetodoEnvioCompleto): void {
    this._metodoSeleccionado.set(metodo);
    this.emitirEvento({
      tipo: 'metodo_seleccionado',
      data: metodo,
      timestamp: new Date(),
    });
  }

  /**
   * Limpiar selección
   */
  limpiarSeleccion(): void {
    this._metodoSeleccionado.set(null);
  }

  /**
   * Filtrar métodos disponibles
   */
  filtrarMetodos(filtros: FiltrosMetodoEnvio): MetodoEnvioCompleto[] {
    let metodos = this._metodosEnvio();

    if (filtros.solo_activos) {
      metodos = metodos.filter((m) => m.activo);
    }

    if (filtros.costo_maximo) {
      metodos = metodos.filter((m) => m.costo_base <= filtros.costo_maximo!);
    }

    if (filtros.tiempo_maximo_dias) {
      metodos = metodos.filter(
        (m) => m.tiempo_entrega_max <= filtros.tiempo_maximo_dias!
      );
    }

    this._metodosDisponibles.set(metodos);
    return metodos;
  }

  /**
   * Obtener métodos por zona
   */
  obtenerMetodosPorZona(zona: ZonaEntrega): MetodoEnvioCompleto[] {
    const zonasCobertura = this._zonasCobertura();
    const metodosIds: number[] = [];

    Object.values(zonasCobertura).forEach((zonaCobertura) => {
      if (this.perteneceAZona(zonaCobertura, zona)) {
        metodosIds.push(...zonaCobertura.metodos_disponibles);
      }
    });

    return this._metodosEnvio().filter(
      (metodo) => metodosIds.includes(metodo.id) && metodo.activo
    );
  }

  // Métodos de utilidad

  /**
   * Obtener información de empresa
   */
  obtenerInformacionEmpresa(): Observable<InformacionEmpresaEnvioResponse> {
    return this.http
      .get<InformacionEmpresaEnvioResponse>(
        `${this.API_URL}/empresa`,
        this.httpOptions
      )
      .pipe(
        catchError((error) => {
          this._error.set('Error al obtener información de empresa');
          throw error;
        })
      );
  }

  /**
   * Limpiar cache de métodos de envío
   */
  limpiarCache(): void {
    this.cacheCalculos.clear();
    if (this.isBrowser) {
      localStorage.removeItem(this.CACHE_KEY);
      localStorage.removeItem(this.CACHE_CALCULOS_KEY);
    }
  }

  // Métodos privados

  /**
   * Generar key para cache de cálculos
   */
  private generarCacheKey(request: CalcularCostoEnvioRequest): string {
    return `${request.metodo_envio_id}_${request.distrito}_${request.provincia}_${request.departamento}_${request.peso_total}_${request.subtotal}`;
  }

  /**
   * Guardar cálculo en cache
   */
  private guardarCalculoEnCache(
    key: string,
    request: CalcularCostoEnvioRequest,
    response: CalcularCostoEnvioResponse
  ): void {
    const cache: CacheCalculoEnvio = {
      key,
      metodo_envio_id: request.metodo_envio_id,
      ubicacion: `${request.distrito}, ${request.provincia}, ${request.departamento}`,
      peso: request.peso_total,
      subtotal: request.subtotal,
      resultado: response,
      timestamp: Date.now(),
      expira_en:
        Date.now() + this.configuracion.cache_duracion_minutos * 60 * 1000,
    };

    this.cacheCalculos.set(key, cache);
    this.guardarCacheEnStorage();
  }

  /**
   * Obtener cálculo del cache
   */
  private obtenerDeCache(key: string): CacheCalculoEnvio | null {
    return this.cacheCalculos.get(key) || null;
  }

  /**
   * Verificar si cache está expirado
   */
  private esCacheExpirado(cache: CacheCalculoEnvio): boolean {
    return Date.now() > cache.expira_en;
  }

  /**
   * Limpiar cache expirado
   */
  private limpiarCacheExpirado(): void {
    const ahora = Date.now();
    for (const [key, cache] of this.cacheCalculos.entries()) {
      if (ahora > cache.expira_en) {
        this.cacheCalculos.delete(key);
      }
    }
    this.guardarCacheEnStorage();
  }

  /**
   * Calcular puntuación de velocidad (1-5)
   */
  private calcularPuntuacionVelocidad(tiempo: TiempoEstimado): number {
    const promedio = (tiempo.min + tiempo.max) / 2;
    if (promedio <= 1) return 5;
    if (promedio <= 2) return 4;
    if (promedio <= 3) return 3;
    if (promedio <= 5) return 2;
    return 1;
  }

  /**
   * Calcular puntuación de precio (1-5)
   */
  private calcularPuntuacionPrecio(costo: number): number {
    if (costo === 0) return 5;
    if (costo <= 10) return 4;
    if (costo <= 20) return 3;
    if (costo <= 30) return 2;
    return 1;
  }

  /**
   * Verificar si zona pertenece a tipo de zona
   */
  private perteneceAZona(zona: ZonaCobertura, tipoZona: ZonaEntrega): boolean {
    switch (tipoZona) {
      case 'lima_metropolitana':
        return zona.nombre === 'Lima Metropolitana';
      case 'lima_provincias':
        return zona.nombre === 'Lima Provincias';
      case 'principales_ciudades':
        return zona.nombre === 'Principales Ciudades';
      case 'nacional':
        return zona.nombre === 'Nacional';
      default:
        return false;
    }
  }

  /**
   * Cargar datos desde cache
   */
  private cargarDesdeCache(): void {
    try {
      const cacheData = localStorage.getItem(this.CACHE_KEY);
      if (cacheData) {
        const cache = JSON.parse(cacheData);
        if (cache.metodos) this._metodosEnvio.set(cache.metodos);
        if (cache.zonas) this._zonasCobertura.set(cache.zonas);
      }

      const cacheCalculos = localStorage.getItem(this.CACHE_CALCULOS_KEY);
      if (cacheCalculos) {
        const calculos = JSON.parse(cacheCalculos);
        Object.entries(calculos).forEach(([key, value]) => {
          this.cacheCalculos.set(key, value as CacheCalculoEnvio);
        });
      }
    } catch (error) {
      console.warn('Error al cargar cache de métodos de envío:', error);
    }
  }

  /**
   * Guardar en cache
   */
  private guardarEnCache(tipo: string, data: any): void {
    if (!this.isBrowser) return;

    try {
      let cache = {};
      const existingCache = localStorage.getItem(this.CACHE_KEY);
      if (existingCache) {
        cache = JSON.parse(existingCache);
      }

      (cache as any)[tipo] = data;
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.warn('Error al guardar cache:', error);
    }
  }

  /**
   * Guardar cache de cálculos en storage
   */
  private guardarCacheEnStorage(): void {
    if (!this.isBrowser) return;

    try {
      const cacheObj = Object.fromEntries(this.cacheCalculos);
      localStorage.setItem(this.CACHE_CALCULOS_KEY, JSON.stringify(cacheObj));
    } catch (error) {
      console.warn('Error al guardar cache de cálculos:', error);
    }
  }

  /**
   * Manejar errores offline
   */
  private manejarErrorOffline(tipo: string): Observable<any> {
    // Intentar cargar desde cache
    const cacheData = localStorage.getItem(this.CACHE_KEY);
    if (cacheData) {
      try {
        const cache = JSON.parse(cacheData);
        if (cache[tipo]) {
          return of({
            success: true,
            data: cache[tipo],
          });
        }
      } catch (error) {
        console.warn('Error al cargar desde cache offline:', error);
      }
    }

    return throwError(() => new Error('No hay datos disponibles offline'));
  }

  /**
   * Emitir evento
   */
  private emitirEvento(evento: EventoMetodoEnvio): void {
    this.eventosMetodoEnvio$.next(evento);
  }

  // Getters públicos

  /**
   * Obtener stream de eventos
   */
  get eventos$(): Observable<EventoMetodoEnvio | null> {
    return this.eventosMetodoEnvio$.asObservable();
  }

  /**
   * Obtener configuración actual
   */
  get configuracionActual(): ConfiguracionServicioEnvio {
    return { ...this.configuracion };
  }
}
