import {
  Injectable,
  signal,
  computed,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of, timer } from 'rxjs';
import {
  map,
  catchError,
  tap,
  shareReplay,
  debounceTime,
  switchMap,
  distinctUntilChanged,
} from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  TipoOrdenamiento,
  BusquedaGeneralRequest,
  BusquedaGeneralResponse,
  BusquedaAvanzadaRequest,
  BusquedaAvanzadaResponse,
  AutocompletadoRequest,
  AutocompletadoResponse,
  TerminosPopularesResponse,
  FiltrosDisponiblesResponse,
  EstadisticasBusquedaResponse,
  ProductoBusqueda,
  SugerenciaBusqueda,
  ConfiguracionServicioBusqueda,
  EventoBusqueda,
  ElementoHistorial,
  HistorialBusquedas,
  FiltroAplicado,
  GrupoFiltros,
  EstadoBusqueda,
  MetricasBusquedaResponse,
  SugerenciasInteligentesResponse,
  AnalisisConsultaResponse,
  PreferenciasBusqueda,
  PersonalizacionBusqueda,
  CacheBusqueda,
  NotificacionesBusquedaResponse,
  ExportacionBusquedasResponse,
  ConfiguracionEmpresaBusquedaResponse,
  PruebasABBusquedaResponse,
  TendenciasBusquedaResponse,
  ComparacionProductosResponse,
  BusquedaResponse,
  UtilBusqueda,
} from '../models/busqueda.interface';

@Injectable({
  providedIn: 'root',
})
export class BusquedaService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly API_URL = `${environment.apiUrl}/busqueda`;
  private readonly CACHE_KEY = 'busqueda_cache';
  private readonly HISTORIAL_KEY = 'busqueda_historial';

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
  private readonly configuracion: ConfiguracionServicioBusqueda = {
    cache_duracion_minutos: 15, // Búsquedas cambian frecuentemente
    autocompletado_debounce_ms: 300,
    max_sugerencias: 10,
    min_caracteres_busqueda: 2,
    max_resultados_autocompletado: 8,
    guardar_historial: true,
    max_historial_items: 50,
    filtros_inteligentes: true,
    busqueda_fuzzy: true,
  };

  // Signals para estado reactivo
  private readonly _ultimaBusqueda = signal<BusquedaGeneralResponse | null>(
    null
  );
  private readonly _ultimaBusquedaAvanzada =
    signal<BusquedaAvanzadaResponse | null>(null);
  private readonly _autocompletado = signal<AutocompletadoResponse | null>(
    null
  );
  private readonly _terminosPopulares = signal<string[]>([]);
  private readonly _filtrosDisponibles = signal<any>(null);
  private readonly _estadisticas = signal<any>(null);
  private readonly _historial = signal<HistorialBusquedas>({
    items: [],
    total: 0,
    terminos_frecuentes: [],
    ultima_actualizacion: new Date().toISOString(),
  });
  private readonly _preferencias = signal<PreferenciasBusqueda>({
    categorias_favoritas: [],
    marcas_favoritas: [],
    rango_precio_preferido: { min: 0, max: 10000 },
    ordenamiento_preferido: 'relevancia',
    filtros_automaticos: true,
    sugerencias_personalizadas: true,
    historial_limitado: false,
  });
  private readonly _notificaciones = signal<any[]>([]);
  private readonly _cargando = signal<boolean>(false);
  private readonly _cargandoAutocompletado = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _terminoActual = signal<string>('');
  private readonly _filtrosActivos = signal<FiltroAplicado[]>([]);
  private readonly _ordenamientoActual = signal<TipoOrdenamiento>('relevancia');

  // Cache y almacenamiento
  private readonly cache = new Map<string, CacheBusqueda>();

  // Subject para autocompletado con debounce
  private readonly terminoBusqueda$ = new BehaviorSubject<string>('');

  // Subject para eventos
  private readonly eventosBusqueda$ =
    new BehaviorSubject<EventoBusqueda | null>(null);

  // Computed signals públicos
  readonly ultimaBusqueda = this._ultimaBusqueda.asReadonly();
  readonly ultimaBusquedaAvanzada = this._ultimaBusquedaAvanzada.asReadonly();
  readonly autocompletado = this._autocompletado.asReadonly();
  readonly terminosPopulares = this._terminosPopulares.asReadonly();
  readonly filtrosDisponibles = this._filtrosDisponibles.asReadonly();
  readonly estadisticas = this._estadisticas.asReadonly();
  readonly historial = this._historial.asReadonly();
  readonly preferencias = this._preferencias.asReadonly();
  readonly notificaciones = this._notificaciones.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly cargandoAutocompletado = this._cargandoAutocompletado.asReadonly();
  readonly error = this._error.asReadonly();
  readonly terminoActual = this._terminoActual.asReadonly();
  readonly filtrosActivos = this._filtrosActivos.asReadonly();
  readonly ordenamientoActual = this._ordenamientoActual.asReadonly();

  readonly productos = computed(() => {
    const busqueda = this._ultimaBusqueda();
    const avanzada = this._ultimaBusquedaAvanzada();
    return busqueda?.data?.productos || avanzada?.data?.productos || [];
  });

  readonly totalResultados = computed(() => {
    const busqueda = this._ultimaBusqueda();
    const avanzada = this._ultimaBusquedaAvanzada();
    return (
      busqueda?.data?.total_resultados || avanzada?.data?.total_resultados || 0
    );
  });

  readonly paginacion = computed(() => {
    const busqueda = this._ultimaBusqueda();
    const avanzada = this._ultimaBusquedaAvanzada();
    return busqueda?.data?.pagination || avanzada?.data?.pagination || null;
  });

  readonly tieneResultados = computed(() => {
    return this.totalResultados() > 0;
  });

  readonly sugerencias = computed(() => {
    const busqueda = this._ultimaBusqueda();
    return busqueda?.data?.sugerencias || [];
  });

  readonly estadoBusqueda = computed((): EstadoBusqueda => {
    const busqueda = this._ultimaBusqueda();
    const avanzada = this._ultimaBusquedaAvanzada();
    const productos = this.productos();
    const paginacion = this.paginacion();

    return {
      termino_actual: this._terminoActual(),
      filtros_aplicados: {}, // Se llenarían con los filtros aplicados
      resultados_total: this.totalResultados(),
      productos_cargados: productos,
      pagina_actual: paginacion?.current_page || 1,
      ordenamiento_actual: this._ordenamientoActual(),
      cargando: this._cargando(),
      tiene_mas_resultados: paginacion
        ? paginacion.current_page < paginacion.last_page
        : false,
      ultima_busqueda: busqueda?.data?.tiempo_busqueda || '',
    };
  });

  readonly terminosFrecuentes = computed(() => {
    const historial = this._historial();
    return historial.terminos_frecuentes.slice(0, 10);
  });

  readonly hayFiltrosActivos = computed(() => {
    return this._filtrosActivos().length > 0;
  });

  readonly resumenBusqueda = computed(() => {
    const termino = this._terminoActual();
    const total = this.totalResultados();
    const filtros = this._filtrosActivos();
    const tiempo = this.estadoBusqueda().ultima_busqueda;

    return {
      termino,
      total_resultados: total,
      filtros_activos: filtros.length,
      tiempo_busqueda: tiempo,
      tiene_resultados: total > 0,
    };
  });

  // Utilidades del servicio
  readonly utilBusqueda: UtilBusqueda = {
    limpiarTermino: (termino: string) => this.limpiarTermino(termino),
    validarTermino: (termino: string) => this.validarTermino(termino),
    generarSlug: (texto: string) => this.generarSlug(texto),
    destacarTermino: (texto: string, termino: string) =>
      this.destacarTermino(texto, termino),
    calcularRelevancia: (producto: ProductoBusqueda, termino: string) =>
      this.calcularRelevancia(producto, termino),
    extraerPalabrasClave: (texto: string) => this.extraerPalabrasClave(texto),
    detectarIntencion: (termino: string) => this.detectarIntencion(termino),
    corregirOrtografia: (termino: string) => this.corregirOrtografia(termino),
    calcularSimilitud: (texto1: string, texto2: string) =>
      this.calcularSimilitud(texto1, texto2),
    filtrarPalabrasClave: (palabras: string[]) =>
      this.filtrarPalabrasClave(palabras),
    formatearPrecio: (precio: number) => this.formatearPrecio(precio),
    generarHashBusqueda: (request: any) => this.generarHashBusqueda(request),
  };

  constructor() {
    if (this.isBrowser) {
      this.cargarDesdeStorage();
      this.inicializar();
      this.configurarAutocompletado();

      // Limpiar cache periódicamente
      setInterval(() => {
        this.limpiarCacheExpirado();
      }, 60000); // Cada minuto
    }
  }

  // Métodos principales

  /**
   * Realizar búsqueda general
   */
  buscar(request: BusquedaGeneralRequest): Observable<BusquedaGeneralResponse> {
    this._cargando.set(true);
    this._error.set(null);

    // Validar y limpiar término de búsqueda
    const terminoLimpio = this.limpiarTermino(request.q);
    if (!this.validarTermino(terminoLimpio)) {
      const response: BusquedaGeneralResponse = {
        success: false,
        message: 'Término de búsqueda inválido',
        data: {
          productos: [],
          pagination: { current_page: 1, last_page: 1, per_page: 12, total: 0 },
          termino_busqueda: terminoLimpio,
          total_resultados: 0,
          sugerencias: [],
          tiempo_busqueda: '0ms',
        },
      };
      this._cargando.set(false);
      return of(response);
    }

    const requestLimpio = { ...request, q: terminoLimpio };
    this._terminoActual.set(terminoLimpio);

    // Verificar cache
    const cacheKey = this.generarHashBusqueda(requestLimpio);
    const busquedaCache = this.obtenerDeCache(cacheKey);

    if (busquedaCache && !this.esCacheExpirado(busquedaCache)) {
      return of(busquedaCache.datos as BusquedaGeneralResponse).pipe(
        tap((response) => {
          this._ultimaBusqueda.set(response);
          this.actualizarHistorial(requestLimpio, response);
        })
      );
    }

    // Construir parámetros
    let params = new HttpParams();
    Object.entries(requestLimpio).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params = params.set(key, value.toString());
      }
    });

    return this.http
      .get<BusquedaGeneralResponse>(`${this.API_URL}`, {
        ...this.httpOptions,
        params,
      })
      .pipe(
        tap((response) => {
          if (response.success) {
            this._ultimaBusqueda.set(response);
            this.guardarEnCache(cacheKey, response, 'busqueda', {
              termino: terminoLimpio,
            });
            this.actualizarHistorial(requestLimpio, response);

            this.emitirEvento({
              tipo: 'busqueda_realizada',
              data: {
                termino: terminoLimpio,
                resultados: response.data.total_resultados,
                tiempo: response.data.tiempo_busqueda,
              },
              timestamp: new Date(),
            });
          }
        }),
        catchError((error) => {
          this._error.set('Error al realizar la búsqueda');
          return this.manejarErrorOffline(cacheKey);
        }),
        tap(() => this._cargando.set(false)),
        shareReplay(1)
      );
  }

  /**
   * Realizar búsqueda avanzada
   */
  busquedaAvanzada(
    request: BusquedaAvanzadaRequest
  ): Observable<BusquedaAvanzadaResponse> {
    this._cargando.set(true);
    this._error.set(null);

    // Limpiar término si existe
    if (request.termino) {
      request.termino = this.limpiarTermino(request.termino);
      this._terminoActual.set(request.termino);
    }

    const cacheKey = this.generarHashBusqueda(request);
    const busquedaCache = this.obtenerDeCache(cacheKey);

    if (busquedaCache && !this.esCacheExpirado(busquedaCache)) {
      return of(busquedaCache.datos as BusquedaAvanzadaResponse).pipe(
        tap((response) => {
          this._ultimaBusquedaAvanzada.set(response);
          this.actualizarFiltrosAplicados(request);
        })
      );
    }

    return this.http
      .post<BusquedaAvanzadaResponse>(
        `${this.API_URL}/avanzada`,
        request,
        this.httpOptions
      )
      .pipe(
        tap((response) => {
          if (response.success) {
            this._ultimaBusquedaAvanzada.set(response);
            this.guardarEnCache(cacheKey, response, 'busqueda', {
              termino: request.termino,
              filtros: request,
            });
            this.actualizarFiltrosAplicados(request);

            this.emitirEvento({
              tipo: 'busqueda_realizada',
              data: {
                tipo: 'avanzada',
                termino: request.termino,
                filtros: Object.keys(request).filter(
                  (k) =>
                    request[k as keyof BusquedaAvanzadaRequest] !== undefined
                ).length,
                resultados: response.data.total_resultados,
              },
              timestamp: new Date(),
            });
          }
        }),
        catchError((error) => {
          this._error.set('Error al realizar la búsqueda avanzada');
          return this.manejarErrorOffline(cacheKey);
        }),
        tap(() => this._cargando.set(false)),
        shareReplay(1)
      );
  }

  /**
   * Autocompletado de búsqueda
   */
  autocompletar(termino: string): void {
    this.terminoBusqueda$.next(termino);
  }

  /**
   * Obtener términos populares
   */
  obtenerTerminosPopulares(): Observable<TerminosPopularesResponse> {
    const cacheKey = 'terminos_populares';
    const terminosCache = this.obtenerDeCache(cacheKey);

    if (terminosCache && !this.esCacheExpirado(terminosCache)) {
      return of(terminosCache.datos as TerminosPopularesResponse).pipe(
        tap((response) => {
          if (response.success) {
            this._terminosPopulares.set(
              response.data.map((t) => t.termino).slice(0, 10)
            );
          }
        })
      );
    }

    return this.http
      .get<TerminosPopularesResponse>(
        `${this.API_URL}/terminos-populares`,
        this.httpOptions
      )
      .pipe(
        tap((response) => {
          if (response.success) {
            this._terminosPopulares.set(
              response.data.map((t) => t.termino).slice(0, 10)
            );
            this.guardarEnCache(cacheKey, response, 'terminos');
          }
        }),
        catchError((error) => {
          this._error.set('Error al obtener términos populares');
          return this.manejarErrorOffline(cacheKey);
        }),
        shareReplay(1)
      );
  }

  /**
   * Obtener filtros disponibles
   */
  obtenerFiltrosDisponibles(): Observable<FiltrosDisponiblesResponse> {
    const cacheKey = 'filtros_disponibles';
    const filtrosCache = this.obtenerDeCache(cacheKey);

    if (filtrosCache && !this.esCacheExpirado(filtrosCache)) {
      return of(filtrosCache.datos as FiltrosDisponiblesResponse).pipe(
        tap((response) => {
          this._filtrosDisponibles.set(response.data);
        })
      );
    }

    return this.http
      .get<FiltrosDisponiblesResponse>(
        `${this.API_URL}/filtros-disponibles`,
        this.httpOptions
      )
      .pipe(
        tap((response) => {
          if (response.success) {
            this._filtrosDisponibles.set(response.data);
            this.guardarEnCache(cacheKey, response, 'filtros');
          }
        }),
        catchError((error) => {
          this._error.set('Error al obtener filtros disponibles');
          return this.manejarErrorOffline(cacheKey);
        }),
        shareReplay(1)
      );
  }

  /**
   * Obtener estadísticas de búsqueda
   */
  obtenerEstadisticas(): Observable<EstadisticasBusquedaResponse> {
    const cacheKey = 'estadisticas_busqueda';
    const estadisticasCache = this.obtenerDeCache(cacheKey);

    if (estadisticasCache && !this.esCacheExpirado(estadisticasCache)) {
      return of(estadisticasCache.datos as EstadisticasBusquedaResponse).pipe(
        tap((response) => {
          this._estadisticas.set(response.data);
        })
      );
    }

    return this.http
      .get<EstadisticasBusquedaResponse>(
        `${this.API_URL}/estadisticas`,
        this.httpOptions
      )
      .pipe(
        tap((response) => {
          if (response.success) {
            this._estadisticas.set(response.data);
            this.guardarEnCache(cacheKey, response, 'estadisticas');
          }
        }),
        catchError((error) => {
          this._error.set('Error al obtener estadísticas');
          return this.manejarErrorOffline(cacheKey);
        }),
        shareReplay(1)
      );
  }

  // Métodos de gestión de filtros

  /**
   * Aplicar filtro
   */
  aplicarFiltro(filtro: FiltroAplicado): void {
    const filtrosActuales = this._filtrosActivos();
    const filtroExistente = filtrosActuales.find(
      (f) => f.campo === filtro.campo
    );

    let nuevosFiltros: FiltroAplicado[];
    if (filtroExistente) {
      nuevosFiltros = filtrosActuales.map((f) =>
        f.campo === filtro.campo ? { ...filtro, activo: true } : f
      );
    } else {
      nuevosFiltros = [...filtrosActuales, { ...filtro, activo: true }];
    }

    this._filtrosActivos.set(nuevosFiltros);
    this.emitirEvento({
      tipo: 'filtro_aplicado',
      data: { filtro, total_filtros: nuevosFiltros.length },
      timestamp: new Date(),
    });
  }

  /**
   * Remover filtro
   */
  removerFiltro(campo: string): void {
    const filtrosActuales = this._filtrosActivos();
    const nuevosFiltros = filtrosActuales.filter((f) => f.campo !== campo);
    this._filtrosActivos.set(nuevosFiltros);

    this.emitirEvento({
      tipo: 'filtro_aplicado',
      data: { filtro_removido: campo, total_filtros: nuevosFiltros.length },
      timestamp: new Date(),
    });
  }

  /**
   * Limpiar todos los filtros
   */
  limpiarFiltros(): void {
    this._filtrosActivos.set([]);
    this.emitirEvento({
      tipo: 'filtro_aplicado',
      data: { accion: 'limpiar_todos' },
      timestamp: new Date(),
    });
  }

  /**
   * Cambiar ordenamiento
   */
  cambiarOrdenamiento(ordenamiento: TipoOrdenamiento): void {
    this._ordenamientoActual.set(ordenamiento);
    this.emitirEvento({
      tipo: 'ordenamiento_cambiado',
      data: { nuevo_ordenamiento: ordenamiento },
      timestamp: new Date(),
    });
  }

  // Métodos de historial

  /**
   * Obtener historial de búsquedas
   */
  obtenerHistorial(): HistorialBusquedas {
    return this._historial();
  }

  /**
   * Limpiar historial
   */
  limpiarHistorial(): void {
    const historialVacio: HistorialBusquedas = {
      items: [],
      total: 0,
      terminos_frecuentes: [],
      ultima_actualizacion: new Date().toISOString(),
    };
    this._historial.set(historialVacio);
    this.guardarHistorialEnStorage();

    this.emitirEvento({
      tipo: 'historial_actualizado',
      data: { accion: 'limpiar' },
      timestamp: new Date(),
    });
  }

  /**
   * Remover elemento del historial
   */
  removerDeHistorial(id: string): void {
    const historial = this._historial();
    const nuevosItems = historial.items.filter((item) => item.id !== id);
    const nuevoHistorial: HistorialBusquedas = {
      ...historial,
      items: nuevosItems,
      total: nuevosItems.length,
      ultima_actualizacion: new Date().toISOString(),
    };
    this._historial.set(nuevoHistorial);
    this.guardarHistorialEnStorage();
  }

  // Métodos de utilidad implementados

  private limpiarTermino(termino: string): string {
    return termino
      .trim()
      .toLowerCase()
      .replace(/[^\w\sáéíóúñü]/gi, '')
      .replace(/\s+/g, ' ');
  }

  private validarTermino(termino: string): boolean {
    return (
      termino.length >= this.configuracion.min_caracteres_busqueda &&
      termino.length <= 100 &&
      !/^\s*$/.test(termino)
    );
  }

  private generarSlug(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private destacarTermino(texto: string, termino: string): string {
    const regex = new RegExp(`(${termino})`, 'gi');
    return texto.replace(regex, '<mark>$1</mark>');
  }

  private calcularRelevancia(
    producto: ProductoBusqueda,
    termino: string
  ): number {
    let puntuacion = 0;
    const terminoLower = termino.toLowerCase();

    // Coincidencia exacta en nombre (peso alto)
    if (producto.nombre.toLowerCase().includes(terminoLower)) {
      puntuacion += 50;
    }

    // Coincidencia en marca
    if (producto.marca.toLowerCase().includes(terminoLower)) {
      puntuacion += 30;
    }

    // Coincidencia en descripción
    if (producto.descripcion?.toLowerCase().includes(terminoLower)) {
      puntuacion += 20;
    }

    // Boost por calificación
    if (producto.comentarios_avg_calificacion) {
      puntuacion += producto.comentarios_avg_calificacion * 2;
    }

    return puntuacion;
  }

  private extraerPalabrasClave(texto: string): string[] {
    return texto
      .toLowerCase()
      .split(/\s+/)
      .filter((palabra) => palabra.length > 2)
      .slice(0, 10);
  }

  private detectarIntencion(termino: string): string {
    const terminoLower = termino.toLowerCase();

    if (terminoLower.includes('precio') || terminoLower.includes('barato')) {
      return 'precio';
    }
    if (terminoLower.includes('comparar') || terminoLower.includes('vs')) {
      return 'comparacion';
    }
    if (terminoLower.includes('marca')) {
      return 'marca';
    }
    if (terminoLower.includes('categoria')) {
      return 'categoria';
    }
    return 'producto';
  }

  private corregirOrtografia(termino: string): string {
    // Implementación básica de corrección ortográfica
    const correcciones: Record<string, string> = {
      telefono: 'teléfono',
      computadora: 'computadora',
      audifono: 'audífono',
      camara: 'cámara',
    };

    let corregido = termino;
    Object.entries(correcciones).forEach(([error, correccion]) => {
      corregido = corregido.replace(new RegExp(error, 'gi'), correccion);
    });

    return corregido;
  }

  private calcularSimilitud(texto1: string, texto2: string): number {
    // Implementación simple de similitud basada en distancia de Levenshtein
    const a = texto1.toLowerCase();
    const b = texto2.toLowerCase();

    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = Array(b.length + 1)
      .fill(null)
      .map(() => Array(a.length + 1).fill(null));

    for (let i = 0; i <= a.length; i += 1) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= b.length; j += 1) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= b.length; j += 1) {
      for (let i = 1; i <= a.length; i += 1) {
        const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    const distancia = matrix[b.length][a.length];
    const maxLength = Math.max(a.length, b.length);
    return ((maxLength - distancia) / maxLength) * 100;
  }

  private filtrarPalabrasClave(palabras: string[]): string[] {
    const stopWords = [
      'el',
      'la',
      'de',
      'que',
      'y',
      'a',
      'en',
      'un',
      'es',
      'se',
      'no',
      'te',
      'lo',
      'le',
      'da',
      'su',
      'por',
      'son',
      'con',
      'para',
      'del',
    ];
    return palabras.filter((palabra) => !stopWords.includes(palabra));
  }

  private formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(precio);
  }

  private generarHashBusqueda(request: any): string {
    const str = JSON.stringify(request);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Métodos de cache y storage

  private guardarEnCache(
    key: string,
    datos: any,
    tipo: CacheBusqueda['tipo'],
    metadatos?: any
  ): void {
    if (!this.isBrowser) return;

    try {
      const cache: CacheBusqueda = {
        key,
        datos,
        timestamp: Date.now(),
        expira_en:
          Date.now() + this.configuracion.cache_duracion_minutos * 60 * 1000,
        tipo,
        metadatos,
      };

      this.cache.set(key, cache);
      this.guardarCacheEnStorage();
    } catch (error) {
      console.warn('Error al guardar cache de búsqueda:', error);
    }
  }

  private obtenerDeCache(key: string): CacheBusqueda | null {
    return this.cache.get(key) || null;
  }

  private esCacheExpirado(cache: CacheBusqueda): boolean {
    return Date.now() > cache.expira_en;
  }

  private limpiarCacheExpirado(): void {
    const ahora = Date.now();
    for (const [key, cache] of this.cache.entries()) {
      if (ahora > cache.expira_en) {
        this.cache.delete(key);
      }
    }
    this.guardarCacheEnStorage();
  }

  private cargarDesdeStorage(): void {
    try {
      // Cargar cache
      const cacheData = localStorage.getItem(this.CACHE_KEY);
      if (cacheData) {
        const cacheObj = JSON.parse(cacheData);
        Object.entries(cacheObj).forEach(([key, value]) => {
          this.cache.set(key, value as CacheBusqueda);
        });
      }

      // Cargar historial
      const historialData = localStorage.getItem(this.HISTORIAL_KEY);
      if (historialData) {
        const historial = JSON.parse(historialData);
        this._historial.set(historial);
      }
    } catch (error) {
      console.warn('Error al cargar datos de storage:', error);
    }
  }

  private guardarCacheEnStorage(): void {
    if (!this.isBrowser) return;

    try {
      const cacheObj = Object.fromEntries(this.cache);
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheObj));
    } catch (error) {
      console.warn('Error al guardar cache:', error);
    }
  }

  private guardarHistorialEnStorage(): void {
    if (!this.isBrowser) return;

    try {
      const historial = this._historial();
      localStorage.setItem(this.HISTORIAL_KEY, JSON.stringify(historial));
    } catch (error) {
      console.warn('Error al guardar historial:', error);
    }
  }

  private manejarErrorOffline(tipo: string): Observable<any> {
    const cache = this.obtenerDeCache(tipo);
    if (cache) {
      return of(cache.datos);
    }
    return throwError(() => new Error('No hay datos disponibles offline'));
  }

  private emitirEvento(evento: EventoBusqueda): void {
    this.eventosBusqueda$.next(evento);
  }

  private configurarAutocompletado(): void {
    // Configurar stream de autocompletado con debounce
    this.terminoBusqueda$
      .pipe(
        debounceTime(this.configuracion.autocompletado_debounce_ms),
        distinctUntilChanged(),
        switchMap((termino) => {
          if (
            termino.length < this.configuracion.min_caracteres_busqueda ||
            !this.validarTermino(termino)
          ) {
            return of(null);
          }

          this._cargandoAutocompletado.set(true);

          // Verificar cache
          const cacheKey = `autocompletado_${termino}`;
          const autocompletadoCache = this.obtenerDeCache(cacheKey);

          if (
            autocompletadoCache &&
            !this.esCacheExpirado(autocompletadoCache)
          ) {
            return of(autocompletadoCache.datos as AutocompletadoResponse);
          }

          // Hacer petición
          let params = new HttpParams().set('q', termino);

          return this.http
            .get<AutocompletadoResponse>(`${this.API_URL}/autocompletar`, {
              ...this.httpOptions,
              params,
            })
            .pipe(
              tap((response) => {
                if (response.success) {
                  this.guardarEnCache(cacheKey, response, 'autocompletado', {
                    termino,
                  });
                }
              }),
              catchError(() => {
                const fallback: AutocompletadoResponse = {
                  success: true,
                  data: {
                    productos: [],
                    categorias: [],
                    marcas: [],
                    busquedas_populares: this._terminosPopulares().slice(0, 3),
                    termino,
                  },
                };
                return of(fallback);
              })
            );
        })
      )
      .subscribe((response) => {
        this._cargandoAutocompletado.set(false);
        if (response) {
          this._autocompletado.set(response);
          this.emitirEvento({
            tipo: 'autocompletado_usado',
            data: {
              termino: response.data.termino,
              resultados: {
                productos: response.data.productos.length,
                categorias: response.data.categorias.length,
                marcas: response.data.marcas.length,
              },
            },
            timestamp: new Date(),
          });
        }
      });
  }

  private actualizarHistorial(
    request: BusquedaGeneralRequest,
    response: BusquedaGeneralResponse
  ): void {
    if (!this.configuracion.guardar_historial) return;

    const historial = this._historial();
    const nuevoElemento: ElementoHistorial = {
      id: Date.now().toString(),
      termino: request.q,
      resultados_total: response.data.total_resultados,
      fecha: new Date().toISOString(),
      tiempo_busqueda: parseFloat(
        response.data.tiempo_busqueda.replace('ms', '')
      ),
    };

    // Evitar duplicados recientes
    const items = historial.items.filter(
      (item) =>
        item.termino !== request.q ||
        Date.now() - new Date(item.fecha).getTime() > 60000
    );

    // Agregar nuevo elemento al inicio
    items.unshift(nuevoElemento);

    // Mantener solo los últimos N elementos
    const itemsLimitados = items.slice(
      0,
      this.configuracion.max_historial_items
    );

    // Calcular términos frecuentes
    const conteoTerminos = new Map<string, number>();
    itemsLimitados.forEach((item) => {
      const count = conteoTerminos.get(item.termino) || 0;
      conteoTerminos.set(item.termino, count + 1);
    });

    const terminosFrecuentes = Array.from(conteoTerminos.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([termino]) => termino);

    const nuevoHistorial: HistorialBusquedas = {
      items: itemsLimitados,
      total: itemsLimitados.length,
      terminos_frecuentes: terminosFrecuentes,
      ultima_actualizacion: new Date().toISOString(),
    };

    this._historial.set(nuevoHistorial);
    this.guardarHistorialEnStorage();

    this.emitirEvento({
      tipo: 'historial_actualizado',
      data: { nuevo_elemento: nuevoElemento },
      timestamp: new Date(),
    });
  }

  private actualizarFiltrosAplicados(request: BusquedaAvanzadaRequest): void {
    const filtros: FiltroAplicado[] = [];

    if (request.categorias?.length) {
      filtros.push({
        tipo: 'categoria',
        campo: 'categorias',
        valor: request.categorias,
        label: `Categorías (${request.categorias.length})`,
        activo: true,
      });
    }

    if (request.marcas?.length) {
      filtros.push({
        tipo: 'marca',
        campo: 'marcas',
        valor: request.marcas,
        label: `Marcas (${request.marcas.length})`,
        activo: true,
      });
    }

    if (request.precio_min !== undefined || request.precio_max !== undefined) {
      const label = `Precio: ${
        request.precio_min ? this.formatearPrecio(request.precio_min) : 'Min'
      } - ${
        request.precio_max ? this.formatearPrecio(request.precio_max) : 'Max'
      }`;
      filtros.push({
        tipo: 'precio',
        campo: 'precio',
        valor: { min: request.precio_min, max: request.precio_max },
        label,
        activo: true,
      });
    }

    if (request.con_descuento) {
      filtros.push({
        tipo: 'descuento',
        campo: 'con_descuento',
        valor: true,
        label: 'Con descuento',
        activo: true,
      });
    }

    if (request.en_stock) {
      filtros.push({
        tipo: 'stock',
        campo: 'en_stock',
        valor: true,
        label: 'En stock',
        activo: true,
      });
    }

    if (request.calificacion_min) {
      filtros.push({
        tipo: 'calificacion',
        campo: 'calificacion_min',
        valor: request.calificacion_min,
        label: `Calificación mín: ${request.calificacion_min}⭐`,
        activo: true,
      });
    }

    this._filtrosActivos.set(filtros);
  }

  private inicializar(): void {
    // Cargar datos iniciales
    this.obtenerTerminosPopulares().subscribe();
    this.obtenerFiltrosDisponibles().subscribe();
  }

  // Métodos públicos adicionales

  /**
   * Limpiar cache
   */
  limpiarCache(): void {
    this.cache.clear();
    if (this.isBrowser) {
      localStorage.removeItem(this.CACHE_KEY);
    }
    this.emitirEvento({
      tipo: 'cache_actualizado',
      data: { accion: 'limpiar' },
      timestamp: new Date(),
    });
  }

  /**
   * Repetir última búsqueda
   */
  repetirUltimaBusqueda(): Observable<BusquedaGeneralResponse> | null {
    const historial = this._historial();
    if (historial.items.length === 0) return null;

    const ultima = historial.items[0];
    const request: BusquedaGeneralRequest = {
      q: ultima.termino,
      // Aquí se podrían agregar los filtros si estuvieran guardados
    };

    return this.buscar(request);
  }

  /**
   * Obtener stream de eventos
   */
  get eventos$(): Observable<EventoBusqueda | null> {
    return this.eventosBusqueda$.asObservable();
  }

  /**
   * Obtener configuración actual
   */
  get configuracionActual(): ConfiguracionServicioBusqueda {
    return { ...this.configuracion };
  }

  /**
   * Actualizar preferencias
   */
  actualizarPreferencias(preferencias: Partial<PreferenciasBusqueda>): void {
    const preferenciaActuales = this._preferencias();
    const nuevasPreferencias = { ...preferenciaActuales, ...preferencias };
    this._preferencias.set(nuevasPreferencias);

    if (this.isBrowser) {
      localStorage.setItem(
        'busqueda_preferencias',
        JSON.stringify(nuevasPreferencias)
      );
    }
  }

  /**
   * Buscar producto por ID
   */
  buscarProductoPorId(id: number): ProductoBusqueda | null {
    const productos = this.productos();
    return productos.find((p) => p.id === id) || null;
  }

  /**
   * Obtener productos relacionados
   */
  obtenerProductosRelacionados(
    productoId: number
  ): Observable<ProductoBusqueda[]> {
    const producto = this.buscarProductoPorId(productoId);
    if (!producto) return of([]);

    // Búsqueda por marca o categoría similar
    const request: BusquedaAvanzadaRequest = {
      marcas: [producto.marca],
      page: 1,
      per_page: 6,
    };

    return this.busquedaAvanzada(request).pipe(
      map((response) =>
        response.success
          ? response.data.productos.filter((p) => p.id !== productoId)
          : []
      )
    );
  }
}
