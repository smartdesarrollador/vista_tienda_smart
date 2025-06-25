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
  shareReplay,
  debounceTime,
} from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  PreguntaFrecuente,
  CategoriaFaq,
  CategoriaFaqInfo,
  PreguntasFrecuentesResponse,
  PreguntaFrecuenteResponse,
  CategoriasFaqResponse,
  PreguntasPorCategoriaResponse,
  BusquedaFaqRequest,
  BusquedaFaqResponse,
  MarcarUtilRequest,
  MarcarUtilResponse,
  SugerirPreguntaRequest,
  SugerirPreguntaResponse,
  EstadisticasFaq,
  EstadisticasFaqResponse,
  FiltrosFaq,
  NavegacionFaq,
  ConfiguracionServicioFaq,
  EventoFaq,
  AnalisisPregunta,
  MetricasFaqResponse,
  ValidacionSugerencia,
  BusquedaInteligenteResponse,
  CacheFaq,
  NotificacionesFaqResponse,
  ExportacionFaq,
  ExportacionFaqResponse,
  ConfiguracionEmpresaFaqResponse,
  FeedbackFaq,
  FeedbackFaqResponse,
  RecomendacionesFaqResponse,
  AnalyticsFaqResponse,
  FaqResponse,
  UtilFaq,
} from '../models/preguntas-frecuentes.interface';

@Injectable({
  providedIn: 'root',
})
export class PreguntasFrecuentesService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly API_URL = `${environment.apiUrl}/faq`;
  private readonly CACHE_KEY = 'preguntas_frecuentes_cache';

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
  private readonly configuracion: ConfiguracionServicioFaq = {
    cache_duracion_minutos: 60, // FAQ cambian poco, cache más largo
    resultados_por_pagina: 10,
    max_resultados_busqueda: 50,
    auto_cargar_categorias: true,
    mostrar_popularidad: true,
    permitir_sugerencias: true,
    validar_duplicados: true,
  };

  // Signals para estado reactivo
  private readonly _preguntasFrecuentes = signal<PreguntaFrecuente[]>([]);
  private readonly _categorias = signal<CategoriaFaqInfo[]>([]);
  private readonly _preguntaActual = signal<PreguntaFrecuente | null>(null);
  private readonly _categoriaActual = signal<CategoriaFaq | null>(null);
  private readonly _terminoBusqueda = signal<string>('');
  private readonly _resultadosBusqueda = signal<PreguntaFrecuente[]>([]);
  private readonly _estadisticas = signal<EstadisticasFaq | null>(null);
  private readonly _navegacion = signal<NavegacionFaq>({
    pagina: 1,
    resultados_por_pagina: this.configuracion.resultados_por_pagina,
    total_resultados: 0,
  });
  private readonly _cargando = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _ultimaSugerencia = signal<SugerirPreguntaResponse | null>(
    null
  );

  // Cache de datos
  private readonly cache = new Map<string, CacheFaq>();

  // Subject para eventos
  private readonly eventosFaq$ = new BehaviorSubject<EventoFaq | null>(null);

  // Computed signals públicos
  readonly preguntasFrecuentes = this._preguntasFrecuentes.asReadonly();
  readonly categorias = this._categorias.asReadonly();
  readonly preguntaActual = this._preguntaActual.asReadonly();
  readonly categoriaActual = this._categoriaActual.asReadonly();
  readonly terminoBusqueda = this._terminoBusqueda.asReadonly();
  readonly resultadosBusqueda = this._resultadosBusqueda.asReadonly();
  readonly estadisticas = this._estadisticas.asReadonly();
  readonly navegacion = this._navegacion.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly error = this._error.asReadonly();
  readonly ultimaSugerencia = this._ultimaSugerencia.asReadonly();

  readonly preguntasPorCategoria = computed(() => {
    const preguntas = this._preguntasFrecuentes();
    const agrupadas: Record<CategoriaFaq, PreguntaFrecuente[]> = {
      pedidos: [],
      envios: [],
      pagos: [],
      productos: [],
      cuenta: [],
      soporte: [],
    };

    preguntas.forEach((pregunta) => {
      if (agrupadas[pregunta.categoria]) {
        agrupadas[pregunta.categoria].push(pregunta);
      }
    });

    return agrupadas;
  });

  readonly preguntasPopulares = computed(() => {
    const preguntas = this._preguntasFrecuentes();
    return preguntas
      .filter((p) => p.popularidad >= 80)
      .sort((a, b) => b.popularidad - a.popularidad)
      .slice(0, 5);
  });

  readonly categoriaInfo = computed(() => {
    const categoriaActual = this._categoriaActual();
    const categorias = this._categorias();
    return categorias.find((c) => c.id === categoriaActual) || null;
  });

  readonly preguntasFiltradas = computed(() => {
    let preguntas = this._preguntasFrecuentes();
    const categoria = this._categoriaActual();
    const termino = this._terminoBusqueda();

    if (categoria) {
      preguntas = preguntas.filter((p) => p.categoria === categoria);
    }

    if (termino.trim()) {
      const terminoLower = termino.toLowerCase();
      preguntas = preguntas.filter(
        (p) =>
          p.pregunta.toLowerCase().includes(terminoLower) ||
          p.respuesta.toLowerCase().includes(terminoLower) ||
          p.palabras_clave.toLowerCase().includes(terminoLower)
      );
    }

    return preguntas;
  });

  readonly resumenEstadisticas = computed(() => {
    const stats = this._estadisticas();
    const preguntas = this._preguntasFrecuentes();
    const categorias = this._categorias();

    return {
      total_preguntas: preguntas.length,
      total_categorias: categorias.length,
      popularidad_promedio:
        preguntas.reduce((sum, p) => sum + p.popularidad, 0) /
          preguntas.length || 0,
      categoria_con_mas_preguntas: stats
        ? Object.entries(stats.por_categoria).sort(
            ([, a], [, b]) => b - a
          )[0]?.[0]
        : null,
      ultima_actualizacion: stats?.actualizacion || 'No disponible',
    };
  });

  readonly hayResultados = computed(
    () => this._resultadosBusqueda().length > 0
  );

  readonly puedeCargarMas = computed(() => {
    const nav = this._navegacion();
    return nav.pagina * nav.resultados_por_pagina < nav.total_resultados;
  });

  // Utilidades del servicio
  readonly utilFaq: UtilFaq = {
    destacarTexto: (texto: string, termino: string) =>
      this.destacarTexto(texto, termino),
    calcularRelevancia: (pregunta: PreguntaFrecuente, termino: string) =>
      this.calcularRelevancia(pregunta, termino),
    formatearRespuesta: (respuesta: string) =>
      this.formatearRespuesta(respuesta),
    extraerPalabrasClave: (texto: string) => this.extraerPalabrasClave(texto),
    detectarIdioma: (texto: string) => this.detectarIdioma(texto),
    validarEmail: (email: string) => this.validarEmail(email),
    limpiarTexto: (texto: string) => this.limpiarTexto(texto),
    calcularTiempoLectura: (texto: string) => this.calcularTiempoLectura(texto),
  };

  constructor() {
    // Cargar datos iniciales
    if (this.isBrowser) {
      this.cargarDesdeCache();
      this.inicializar();

      // Limpiar cache periódicamente
      setInterval(() => {
        this.limpiarCacheExpirado();
      }, 60000); // Cada minuto
    }
  }

  // Métodos públicos principales

  /**
   * Obtener todas las preguntas frecuentes
   */
  obtenerPreguntasFrecuentes(
    filtros?: FiltrosFaq
  ): Observable<PreguntasFrecuentesResponse> {
    // Verificar cache primero
    const cacheKey = this.generarCacheKey('preguntas', filtros);
    const preguntasCache = this.obtenerDeCache(cacheKey);

    if (preguntasCache && !this.esCacheExpirado(preguntasCache)) {
      return of({
        success: true,
        data: preguntasCache.datos as PreguntaFrecuente[],
      }).pipe(
        tap((response) => {
          this._preguntasFrecuentes.set(response.data);
          this.aplicarFiltros(filtros);
        })
      );
    }

    this._cargando.set(true);
    this._error.set(null);

    let params = new HttpParams();
    if (filtros?.categoria) {
      params = params.set('categoria', filtros.categoria);
    }
    if (filtros?.buscar) {
      params = params.set('buscar', filtros.buscar);
    }

    return this.http
      .get<PreguntasFrecuentesResponse>(this.API_URL, {
        ...this.httpOptions,
        params,
      })
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            this._preguntasFrecuentes.set(response.data);
            this.guardarEnCache(cacheKey, response.data, 'preguntas', filtros);
            this.aplicarFiltros(filtros);

            this.emitirEvento({
              tipo: 'preguntas_cargadas',
              data: { total: response.data.length, filtros },
              timestamp: new Date(),
            });
          }
        }),
        catchError((error) => {
          this._error.set('Error al obtener preguntas frecuentes');
          return this.manejarErrorOffline(cacheKey);
        }),
        tap(() => this._cargando.set(false)),
        shareReplay(1)
      );
  }

  /**
   * Obtener pregunta específica por ID
   */
  obtenerPregunta(id: number): Observable<PreguntaFrecuenteResponse> {
    this._cargando.set(true);

    return this.http
      .get<PreguntaFrecuenteResponse>(`${this.API_URL}/${id}`, this.httpOptions)
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            this._preguntaActual.set(response.data);

            this.emitirEvento({
              tipo: 'pregunta_vista',
              data: response.data,
              timestamp: new Date(),
            });
          }
        }),
        catchError((error) => {
          this._error.set('Error al obtener pregunta');
          throw error;
        }),
        tap(() => this._cargando.set(false))
      );
  }

  /**
   * Obtener categorías de FAQ
   */
  obtenerCategorias(): Observable<CategoriasFaqResponse> {
    const cacheKey = 'categorias';
    const categoriasCache = this.obtenerDeCache(cacheKey);

    if (categoriasCache && !this.esCacheExpirado(categoriasCache)) {
      return of({
        success: true,
        data: categoriasCache.datos as CategoriaFaqInfo[],
      }).pipe(
        tap((response) => {
          this._categorias.set(response.data);
        })
      );
    }

    return this.http
      .get<CategoriasFaqResponse>(
        `${this.API_URL}/categorias`,
        this.httpOptions
      )
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            this._categorias.set(response.data);
            this.guardarEnCache(cacheKey, response.data, 'categorias');
          }
        }),
        catchError((error) => {
          this._error.set('Error al obtener categorías');
          return this.manejarErrorOffline(cacheKey);
        }),
        shareReplay(1)
      );
  }

  /**
   * Obtener preguntas por categoría
   */
  obtenerPreguntasPorCategoria(
    categoria: CategoriaFaq
  ): Observable<PreguntasPorCategoriaResponse> {
    this._cargando.set(true);
    this._categoriaActual.set(categoria);

    return this.http
      .get<PreguntasPorCategoriaResponse>(
        `${this.API_URL}/categoria/${categoria}`,
        this.httpOptions
      )
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            // Actualizar lista completa manteniendo otras categorías
            const preguntasActuales = this._preguntasFrecuentes();
            const preguntasSinCategoria = preguntasActuales.filter(
              (p) => p.categoria !== categoria
            );
            const preguntasActualizadas = [
              ...preguntasSinCategoria,
              ...response.data,
            ];
            this._preguntasFrecuentes.set(preguntasActualizadas);

            this.emitirEvento({
              tipo: 'categoria_cambiada',
              data: { categoria, total: response.data.length },
              timestamp: new Date(),
            });
          }
        }),
        catchError((error) => {
          this._error.set('Error al obtener preguntas de la categoría');
          throw error;
        }),
        tap(() => this._cargando.set(false))
      );
  }

  /**
   * Buscar preguntas frecuentes
   */
  buscarPreguntasFrecuentes(
    request: BusquedaFaqRequest
  ): Observable<BusquedaFaqResponse> {
    this._cargando.set(true);
    this._terminoBusqueda.set(request.q);

    let params = new HttpParams().set('q', request.q);

    return this.http
      .get<BusquedaFaqResponse>(`${this.API_URL}/buscar`, {
        ...this.httpOptions,
        params,
      })
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            this._resultadosBusqueda.set(response.data.resultados);

            // Actualizar navegación
            const nav = this._navegacion();
            this._navegacion.set({
              ...nav,
              total_resultados: response.data.total,
              termino_busqueda: response.data.termino_busqueda,
            });

            this.emitirEvento({
              tipo: 'busqueda_realizada',
              data: {
                termino: request.q,
                total_resultados: response.data.total,
              },
              timestamp: new Date(),
            });
          }
        }),
        catchError((error) => {
          this._error.set('Error al buscar preguntas frecuentes');
          throw error;
        }),
        tap(() => this._cargando.set(false))
      );
  }

  /**
   * Marcar pregunta como útil
   */
  marcarPreguntaUtil(
    id: number,
    util: boolean
  ): Observable<MarcarUtilResponse> {
    const request: MarcarUtilRequest = { util };

    return this.http
      .post<MarcarUtilResponse>(
        `${this.API_URL}/${id}/marcar-util`,
        request,
        this.httpOptions
      )
      .pipe(
        tap((response) => {
          if (response.success) {
            this.emitirEvento({
              tipo: 'pregunta_marcada_util',
              data: { pregunta_id: id, util },
              timestamp: new Date(),
            });
          }
        }),
        catchError((error) => {
          this._error.set('Error al marcar pregunta como útil');
          throw error;
        })
      );
  }

  /**
   * Sugerir nueva pregunta
   */
  sugerirPregunta(
    request: SugerirPreguntaRequest
  ): Observable<SugerirPreguntaResponse> {
    this._cargando.set(true);

    // Validar antes de enviar si está habilitado
    if (this.configuracion.validar_duplicados) {
      const validacion = this.validarSugerencia(request);
      if (validacion.es_duplicada) {
        const response: SugerirPreguntaResponse = {
          success: false,
          message: 'Esta pregunta ya existe o es muy similar a una existente',
          errors: {
            pregunta: ['Pregunta duplicada'],
          },
        };
        this._cargando.set(false);
        return of(response);
      }
    }

    return this.http
      .post<SugerirPreguntaResponse>(
        `${this.API_URL}/sugerir-pregunta`,
        request,
        this.httpOptions
      )
      .pipe(
        tap((response) => {
          if (response.success) {
            this._ultimaSugerencia.set(response);

            this.emitirEvento({
              tipo: 'pregunta_sugerida',
              data: { request, ticket_id: response.data?.ticket_id },
              timestamp: new Date(),
            });
          }
        }),
        catchError((error) => {
          this._error.set('Error al sugerir pregunta');
          throw error;
        }),
        tap(() => this._cargando.set(false))
      );
  }

  /**
   * Obtener estadísticas de FAQ
   */
  obtenerEstadisticas(): Observable<EstadisticasFaqResponse> {
    const cacheKey = 'estadisticas';
    const estadisticasCache = this.obtenerDeCache(cacheKey);

    if (estadisticasCache && !this.esCacheExpirado(estadisticasCache)) {
      return of({
        success: true,
        data: estadisticasCache.datos as EstadisticasFaq,
      }).pipe(
        tap((response) => {
          this._estadisticas.set(response.data);
        })
      );
    }

    return this.http
      .get<EstadisticasFaqResponse>(
        `${this.API_URL}/estadisticas`,
        this.httpOptions
      )
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            this._estadisticas.set(response.data);
            this.guardarEnCache(cacheKey, response.data, 'estadisticas');
          }
        }),
        catchError((error) => {
          this._error.set('Error al obtener estadísticas');
          return this.manejarErrorOffline(cacheKey);
        }),
        shareReplay(1)
      );
  }

  // Métodos de navegación y filtrado

  /**
   * Cambiar a categoría específica
   */
  cambiarCategoria(categoria: CategoriaFaq | null): void {
    this._categoriaActual.set(categoria);
    if (categoria) {
      this.obtenerPreguntasPorCategoria(categoria).subscribe();
    }
  }

  /**
   * Limpiar filtros de búsqueda
   */
  limpiarBusqueda(): void {
    this._terminoBusqueda.set('');
    this._resultadosBusqueda.set([]);
    this._categoriaActual.set(null);

    const nav = this._navegacion();
    this._navegacion.set({
      ...nav,
      termino_busqueda: undefined,
      categoria_actual: undefined,
      pagina: 1,
      total_resultados: this._preguntasFrecuentes().length,
    });
  }

  /**
   * Buscar preguntas similares
   */
  buscarPreguntasSimilares(preguntaId: number): PreguntaFrecuente[] {
    const preguntaActual = this._preguntasFrecuentes().find(
      (p) => p.id === preguntaId
    );
    if (!preguntaActual) return [];

    const todasLasPreguntas = this._preguntasFrecuentes();
    const palabrasClaveActual = preguntaActual.palabras_clave
      .toLowerCase()
      .split(' ');

    return todasLasPreguntas
      .filter(
        (p) => p.id !== preguntaId && p.categoria === preguntaActual.categoria
      )
      .map((p) => ({
        ...p,
        relevancia: this.calcularSimilitud(
          palabrasClaveActual,
          p.palabras_clave.toLowerCase().split(' ')
        ),
      }))
      .filter((p: any) => p.relevancia > 0.3)
      .sort((a: any, b: any) => b.relevancia - a.relevancia)
      .slice(0, 3);
  }

  /**
   * Obtener recomendaciones basadas en historial
   */
  obtenerRecomendaciones(): PreguntaFrecuente[] {
    const categoriaActual = this._categoriaActual();
    const preguntasPopulares = this.preguntasPopulares();

    if (categoriaActual) {
      const preguntasCategoria = this._preguntasFrecuentes()
        .filter((p) => p.categoria === categoriaActual)
        .sort((a, b) => b.popularidad - a.popularidad)
        .slice(0, 3);
      return preguntasCategoria;
    }

    return preguntasPopulares;
  }

  // Métodos privados de utilidad

  /**
   * Aplicar filtros a las preguntas
   */
  private aplicarFiltros(filtros?: FiltrosFaq): void {
    if (filtros?.categoria) {
      this._categoriaActual.set(filtros.categoria);
    }
    if (filtros?.buscar) {
      this._terminoBusqueda.set(filtros.buscar);
    }
  }

  /**
   * Validar sugerencia de pregunta
   */
  private validarSugerencia(
    request: SugerirPreguntaRequest
  ): ValidacionSugerencia {
    const preguntas = this._preguntasFrecuentes();
    const preguntaLower = request.pregunta.toLowerCase();

    // Buscar preguntas similares
    const similares = preguntas.filter((p) => {
      const similaridad = this.calcularSimilitudTexto(
        preguntaLower,
        p.pregunta.toLowerCase()
      );
      return similaridad > 0.7; // 70% de similitud
    });

    return {
      pregunta_valida: request.pregunta.trim().length >= 10,
      email_valido: !request.email || this.validarEmail(request.email),
      categoria_valida: [
        'pedidos',
        'envios',
        'pagos',
        'productos',
        'cuenta',
        'soporte',
      ].includes(request.categoria),
      es_duplicada: similares.length > 0,
      preguntas_similares: similares,
      puntuacion_calidad: this.calcularCalidadPregunta(request.pregunta),
      sugerencias_mejora: this.obtenerSugerenciasMejora(request.pregunta),
    };
  }

  /**
   * Calcular calidad de pregunta
   */
  private calcularCalidadPregunta(pregunta: string): number {
    let puntuacion = 0;

    // Longitud adecuada
    if (pregunta.length >= 10 && pregunta.length <= 200) puntuacion += 25;

    // Contiene signos de interrogación
    if (pregunta.includes('?')) puntuacion += 15;

    // No tiene errores ortográficos obvios (simplificado)
    if (!/\d{3,}/.test(pregunta)) puntuacion += 20;

    // Usa palabras clave relevantes
    const palabrasRelevantes = [
      'cómo',
      'qué',
      'cuándo',
      'dónde',
      'por qué',
      'puedo',
      'necesito',
    ];
    if (
      palabrasRelevantes.some((palabra) =>
        pregunta.toLowerCase().includes(palabra)
      )
    ) {
      puntuacion += 25;
    }

    // Gramática básica
    if (pregunta[0] === pregunta[0].toUpperCase()) puntuacion += 15;

    return Math.min(puntuacion, 100);
  }

  /**
   * Obtener sugerencias de mejora
   */
  private obtenerSugerenciasMejora(pregunta: string): string[] {
    const sugerencias: string[] = [];

    if (pregunta.length < 10) {
      sugerencias.push('La pregunta es muy corta. Intenta ser más específico.');
    }

    if (!pregunta.includes('?')) {
      sugerencias.push(
        'Agrega signos de interrogación para clarificar que es una pregunta.'
      );
    }

    if (pregunta.length > 200) {
      sugerencias.push('La pregunta es muy larga. Intenta ser más conciso.');
    }

    if (pregunta === pregunta.toLowerCase()) {
      sugerencias.push('Usa mayúsculas al inicio de la pregunta.');
    }

    return sugerencias;
  }

  /**
   * Calcular similitud entre textos
   */
  private calcularSimilitudTexto(texto1: string, texto2: string): number {
    const palabras1 = texto1.split(' ').filter((p) => p.length > 3);
    const palabras2 = texto2.split(' ').filter((p) => p.length > 3);

    if (palabras1.length === 0 || palabras2.length === 0) return 0;

    const interseccion = palabras1.filter((p) => palabras2.includes(p)).length;
    const union = new Set([...palabras1, ...palabras2]).size;

    return interseccion / union;
  }

  /**
   * Calcular similitud entre arrays de palabras
   */
  private calcularSimilitud(palabras1: string[], palabras2: string[]): number {
    const set1 = new Set(palabras1);
    const set2 = new Set(palabras2);
    const interseccion = new Set([...set1].filter((x) => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return interseccion.size / union.size;
  }

  // Métodos de utilidad públicos implementados

  /**
   * Destacar texto en búsquedas
   */
  private destacarTexto(texto: string, termino: string): string {
    if (!termino.trim()) return texto;

    const regex = new RegExp(`(${termino})`, 'gi');
    return texto.replace(regex, '<mark>$1</mark>');
  }

  /**
   * Calcular relevancia de pregunta para término de búsqueda
   */
  private calcularRelevancia(
    pregunta: PreguntaFrecuente,
    termino: string
  ): number {
    const terminoLower = termino.toLowerCase();
    let puntuacion = 0;

    // Coincidencia en título (más peso)
    if (pregunta.pregunta.toLowerCase().includes(terminoLower)) {
      puntuacion += 50;
    }

    // Coincidencia en respuesta
    if (pregunta.respuesta.toLowerCase().includes(terminoLower)) {
      puntuacion += 30;
    }

    // Coincidencia en palabras clave
    if (pregunta.palabras_clave.toLowerCase().includes(terminoLower)) {
      puntuacion += 20;
    }

    // Bonus por popularidad
    puntuacion += pregunta.popularidad * 0.1;

    return Math.min(puntuacion, 100);
  }

  /**
   * Formatear respuesta para mostrar
   */
  private formatearRespuesta(respuesta: string): string {
    return respuesta
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  }

  /**
   * Extraer palabras clave de texto
   */
  private extraerPalabrasClave(texto: string): string[] {
    const palabrasComunes = [
      'el',
      'la',
      'de',
      'que',
      'y',
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
      'al',
      'como',
      'las',
      'pero',
      'sus',
      'ha',
      'me',
      'si',
      'sin',
      'sobre',
      'este',
      'ya',
      'entre',
      'cuando',
      'todo',
      'esta',
      'ser',
      'dos',
      'también',
      'fue',
      'había',
      'era',
      'muy',
      'años',
      'hasta',
      'desde',
      'está',
      'mi',
      'porque',
      'qué',
      'han',
      'yo',
      'hay',
      'vez',
      'puede',
      'todos',
      'así',
      'nos',
      'ni',
      'parte',
      'tiene',
      'él',
      'uno',
      'donde',
      'bien',
      'tiempo',
      'mismo',
      'ese',
      'ahora',
      'cada',
    ];

    return texto
      .toLowerCase()
      .split(/\s+/)
      .filter(
        (palabra) => palabra.length > 3 && !palabrasComunes.includes(palabra)
      )
      .slice(0, 10); // Máximo 10 palabras clave
  }

  /**
   * Detectar idioma del texto
   */
  private detectarIdioma(texto: string): string {
    const palabrasEspanol = [
      'el',
      'la',
      'de',
      'que',
      'y',
      'en',
      'un',
      'es',
      'se',
      'no',
      'cómo',
      'qué',
      'cuándo',
      'dónde',
      'por',
      'para',
    ];
    const palabras = texto.toLowerCase().split(/\s+/);
    const coincidencias = palabras.filter((palabra) =>
      palabrasEspanol.includes(palabra)
    ).length;

    return coincidencias > palabras.length * 0.2 ? 'es' : 'unknown';
  }

  /**
   * Validar email
   */
  private validarEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * Limpiar texto
   */
  private limpiarTexto(texto: string): string {
    return texto
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\-.,!?¿¡]/g, '');
  }

  /**
   * Calcular tiempo de lectura
   */
  private calcularTiempoLectura(texto: string): number {
    const palabrasPorMinuto = 200; // Promedio de lectura
    const palabras = texto.split(/\s+/).length;
    return Math.ceil(palabras / palabrasPorMinuto);
  }

  // Métodos de cache y storage

  /**
   * Generar key para cache
   */
  private generarCacheKey(tipo: string, filtros?: FiltrosFaq): string {
    let key = `faq_${tipo}`;
    if (filtros) {
      if (filtros.categoria) key += `_cat_${filtros.categoria}`;
      if (filtros.buscar) key += `_search_${filtros.buscar.substring(0, 10)}`;
    }
    return key;
  }

  /**
   * Guardar en cache
   */
  private guardarEnCache(
    key: string,
    datos: any,
    tipo: CacheFaq['tipo'],
    filtros?: FiltrosFaq
  ): void {
    if (!this.isBrowser) return;

    try {
      const cache: CacheFaq = {
        key,
        datos,
        timestamp: Date.now(),
        expira_en:
          Date.now() + this.configuracion.cache_duracion_minutos * 60 * 1000,
        tipo,
        metadatos: filtros
          ? {
              categoria: filtros.categoria,
              termino_busqueda: filtros.buscar,
              filtros,
            }
          : undefined,
      };

      this.cache.set(key, cache);
      this.guardarCacheEnStorage();
    } catch (error) {
      console.warn('Error al guardar cache de FAQ:', error);
    }
  }

  /**
   * Obtener del cache
   */
  private obtenerDeCache(key: string): CacheFaq | null {
    return this.cache.get(key) || null;
  }

  /**
   * Verificar si cache está expirado
   */
  private esCacheExpirado(cache: CacheFaq): boolean {
    return Date.now() > cache.expira_en;
  }

  /**
   * Limpiar cache expirado
   */
  private limpiarCacheExpirado(): void {
    const ahora = Date.now();
    for (const [key, cache] of this.cache.entries()) {
      if (ahora > cache.expira_en) {
        this.cache.delete(key);
      }
    }
    this.guardarCacheEnStorage();
  }

  /**
   * Cargar desde cache
   */
  private cargarDesdeCache(): void {
    try {
      const cacheData = localStorage.getItem(this.CACHE_KEY);
      if (cacheData) {
        const cacheObj = JSON.parse(cacheData);
        Object.entries(cacheObj).forEach(([key, value]) => {
          this.cache.set(key, value as CacheFaq);
        });
      }
    } catch (error) {
      console.warn('Error al cargar cache de FAQ:', error);
    }
  }

  /**
   * Guardar cache en storage
   */
  private guardarCacheEnStorage(): void {
    if (!this.isBrowser) return;

    try {
      const cacheObj = Object.fromEntries(this.cache);
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheObj));
    } catch (error) {
      console.warn('Error al guardar cache de FAQ:', error);
    }
  }

  /**
   * Manejar errores offline
   */
  private manejarErrorOffline(tipo: string): Observable<any> {
    const cache = this.obtenerDeCache(tipo);
    if (cache) {
      return of({
        success: true,
        data: cache.datos,
      });
    }

    return throwError(() => new Error('No hay datos disponibles offline'));
  }

  /**
   * Emitir evento
   */
  private emitirEvento(evento: EventoFaq): void {
    this.eventosFaq$.next(evento);
  }

  /**
   * Inicializar datos
   */
  private inicializar(): void {
    // Cargar datos básicos
    if (this.configuracion.auto_cargar_categorias) {
      this.obtenerCategorias().subscribe();
    }

    this.obtenerPreguntasFrecuentes().subscribe();
    this.obtenerEstadisticas().subscribe();
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
  }

  /**
   * Obtener pregunta por ID de la lista cargada
   */
  obtenerPreguntaPorId(id: number): PreguntaFrecuente | null {
    return this._preguntasFrecuentes().find((p) => p.id === id) || null;
  }

  /**
   * Navegar a siguiente página
   */
  siguientePagina(): void {
    const nav = this._navegacion();
    if (this.puedeCargarMas()) {
      this._navegacion.set({
        ...nav,
        pagina: nav.pagina + 1,
      });
    }
  }

  /**
   * Navegar a página anterior
   */
  paginaAnterior(): void {
    const nav = this._navegacion();
    if (nav.pagina > 1) {
      this._navegacion.set({
        ...nav,
        pagina: nav.pagina - 1,
      });
    }
  }

  // Getters públicos

  /**
   * Obtener stream de eventos
   */
  get eventos$(): Observable<EventoFaq | null> {
    return this.eventosFaq$.asObservable();
  }

  /**
   * Obtener configuración actual
   */
  get configuracionActual(): ConfiguracionServicioFaq {
    return { ...this.configuracion };
  }
}
