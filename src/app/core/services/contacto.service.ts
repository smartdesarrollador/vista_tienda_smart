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
import { map, catchError, tap, shareReplay, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  EnviarMensajeRequest,
  EnviarMensajeResponse,
  InformacionEmpresa,
  InformacionEmpresaResponse,
  TipoConsultaInfo,
  TiposConsultaResponse,
  FaqContacto,
  FaqContactoResponse,
  EstadoServicio,
  EstadoServicioResponse,
  TipoConsulta,
  CategoriaFaqContacto,
  FiltrosFaqContacto,
  ConfiguracionServicioContacto,
  EventoContacto,
  ValidacionFormularioContacto,
  SugerenciasMensajesResponse,
  HistorialMensajesResponse,
  ContactosEmergenciaResponse,
  CacheContacto,
  NotificacionesContactoResponse,
  PreferenciasContactoResponse,
  SolicitarCallbackRequest,
  SolicitarCallbackResponse,
  EvaluacionSatisfaccion,
  EvaluacionSatisfaccionResponse,
  SeguimientoTicketResponse,
  UbicacionesResponse,
  ContactoResponse,
  DatosRemitente,
  ArchivoAdjunto,
  LimitesContactoResponse,
  DisponibilidadTiempoRealResponse,
  MetricasServicioContactoResponse,
  UtilValidacionContacto,
  EstadisticasContactoResponse,
  CanalContacto,
} from '../models/contacto.interface';

@Injectable({
  providedIn: 'root',
})
export class ContactoService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly API_URL = `${environment.apiUrl}/contacto`;
  private readonly CACHE_KEY = 'contacto_cache';

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
  private readonly configuracion: ConfiguracionServicioContacto = {
    cache_duracion_minutos: 30,
    timeout_segundos: 30,
    reintentos_envio: 3,
    validar_email_tiempo_real: false,
    mostrar_estado_servicios: true,
    actualizar_estado_automatico: true,
    intervalo_actualizacion_minutos: 5,
  };

  // Signals para estado reactivo
  private readonly _informacionEmpresa = signal<InformacionEmpresa | null>(
    null
  );
  private readonly _tiposConsulta = signal<TipoConsultaInfo[]>([]);
  private readonly _faqContacto = signal<FaqContacto[]>([]);
  private readonly _estadoServicios = signal<EstadoServicio | null>(null);
  private readonly _cargando = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _ultimoMensajeEnviado = signal<EnviarMensajeResponse | null>(
    null
  );
  private readonly _validacionFormulario =
    signal<ValidacionFormularioContacto | null>(null);
  private readonly _datosRemitente = signal<DatosRemitente>({});

  // Cache de datos
  private readonly cache = new Map<string, CacheContacto>();

  // Subject para eventos
  private readonly eventosContacto$ =
    new BehaviorSubject<EventoContacto | null>(null);

  // Timer para actualización automática del estado
  private timerActualizacion?: Observable<any>;

  // Computed signals públicos
  readonly informacionEmpresa = this._informacionEmpresa.asReadonly();
  readonly tiposConsulta = this._tiposConsulta.asReadonly();
  readonly faqContacto = this._faqContacto.asReadonly();
  readonly estadoServicios = this._estadoServicios.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly error = this._error.asReadonly();
  readonly ultimoMensajeEnviado = this._ultimoMensajeEnviado.asReadonly();
  readonly validacionFormulario = this._validacionFormulario.asReadonly();
  readonly datosRemitente = this._datosRemitente.asReadonly();

  readonly tiposConsultaPorPrioridad = computed(() => {
    const tipos = this._tiposConsulta();
    return {
      alta: tipos.filter((t) => t.prioridad === 'alta'),
      media: tipos.filter((t) => t.prioridad === 'media'),
      baja: tipos.filter((t) => t.prioridad === 'baja'),
    };
  });

  readonly faqPorCategoria = computed(() => {
    const faq = this._faqContacto();
    const categorias: Record<CategoriaFaqContacto, FaqContacto[]> = {
      horarios: [],
      tiempos_respuesta: [],
      tienda_fisica: [],
      whatsapp: [],
      reclamos: [],
      general: [],
    };

    faq.forEach((item) => {
      if (categorias[item.categoria]) {
        categorias[item.categoria].push(item);
      }
    });

    return categorias;
  });

  readonly serviciosDisponibles = computed(() => {
    const estado = this._estadoServicios();
    if (!estado) return [];

    return Object.entries(estado)
      .filter(([, canal]) => canal.disponible)
      .map(([nombre]) => nombre);
  });

  readonly serviciosNoDisponibles = computed(() => {
    const estado = this._estadoServicios();
    if (!estado) return [];

    return Object.entries(estado)
      .filter(([, canal]) => !canal.disponible)
      .map(([nombre, canal]) => ({
        nombre,
        mensaje: canal.mensaje,
        proximo_horario: canal.proximo_horario,
      }));
  });

  readonly formularioCompleto = computed(() => {
    const validacion = this._validacionFormulario();
    return validacion?.formulario_completo || false;
  });

  readonly resumenContacto = computed(() => ({
    empresa_cargada: !!this._informacionEmpresa(),
    tipos_consulta_disponibles: this._tiposConsulta().length,
    faq_items: this._faqContacto().length,
    servicios_activos: this.serviciosDisponibles().length,
    ultimo_mensaje: this._ultimoMensajeEnviado()?.data?.ticket_id,
  }));

  // Utilidades de validación
  readonly utilValidacion: UtilValidacionContacto = {
    validarEmail: (email: string) => this.validarEmail(email),
    validarTelefono: (telefono: string) => this.validarTelefono(telefono),
    validarNombre: (nombre: string) => this.validarNombre(nombre),
    limpiarTexto: (texto: string) => this.limpiarTexto(texto),
    detectarIdioma: (texto: string) => this.detectarIdioma(texto),
    contarPalabras: (texto: string) => this.contarPalabras(texto),
    validarArchivoAdjunto: (archivo: File) =>
      this.validarArchivoAdjunto(archivo),
    formatearTelefono: (telefono: string) => this.formatearTelefono(telefono),
  };

  constructor() {
    // Cargar datos iniciales
    if (this.isBrowser) {
      this.cargarDesdeCache();
      this.inicializar();

      // Configurar actualización automática del estado
      if (this.configuracion.actualizar_estado_automatico) {
        this.configurarActualizacionAutomatica();
      }

      // Limpiar cache periódicamente
      setInterval(() => {
        this.limpiarCacheExpirado();
      }, 60000); // Cada minuto
    }
  }

  // Métodos públicos principales

  /**
   * Enviar mensaje de contacto
   */
  enviarMensaje(
    request: EnviarMensajeRequest
  ): Observable<EnviarMensajeResponse> {
    this._cargando.set(true);
    this._error.set(null);

    // Validar formulario antes de enviar
    const validacion = this.validarFormularioCompleto(request);
    this._validacionFormulario.set(validacion);

    if (!validacion.formulario_completo) {
      const response: EnviarMensajeResponse = {
        success: false,
        message: 'Formulario incompleto o inválido',
        errors: this.obtenerErroresValidacion(validacion),
      };
      this._cargando.set(false);
      return of(response);
    }

    return this.http
      .post<EnviarMensajeResponse>(
        `${this.API_URL}/enviar-mensaje`,
        request,
        this.httpOptions
      )
      .pipe(
        tap((response) => {
          if (response.success) {
            this._ultimoMensajeEnviado.set(response);
            this.actualizarDatosRemitente(request);

            this.emitirEvento({
              tipo: 'mensaje_enviado',
              data: response,
              timestamp: new Date(),
            });
          } else {
            this.emitirEvento({
              tipo: 'error_envio',
              data: response.errors,
              timestamp: new Date(),
            });
          }
        }),
        catchError((error) => {
          this._error.set('Error al enviar mensaje de contacto');
          throw error;
        }),
        tap(() => this._cargando.set(false))
      );
  }

  /**
   * Obtener información de la empresa
   */
  obtenerInformacionEmpresa(): Observable<InformacionEmpresaResponse> {
    // Verificar cache primero
    const cacheKey = 'empresa';
    const empresaCache = this.obtenerDeCache(cacheKey);

    if (empresaCache && !this.esCacheExpirado(empresaCache)) {
      return of({
        success: true,
        data: empresaCache.datos as InformacionEmpresa,
      }).pipe(
        tap((response) => {
          this._informacionEmpresa.set(response.data);
        })
      );
    }

    this._cargando.set(true);

    return this.http
      .get<InformacionEmpresaResponse>(
        `${this.API_URL}/informacion-empresa`,
        this.httpOptions
      )
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            this._informacionEmpresa.set(response.data);
            this.guardarEnCache(cacheKey, response.data);

            this.emitirEvento({
              tipo: 'informacion_cargada',
              data: response.data,
              timestamp: new Date(),
            });
          }
        }),
        catchError((error) => {
          this._error.set('Error al obtener información de empresa');
          return this.manejarErrorOffline(cacheKey);
        }),
        tap(() => this._cargando.set(false)),
        shareReplay(1)
      );
  }

  /**
   * Obtener tipos de consulta disponibles
   */
  obtenerTiposConsulta(): Observable<TiposConsultaResponse> {
    const cacheKey = 'tipos_consulta';
    const tiposCache = this.obtenerDeCache(cacheKey);

    if (tiposCache && !this.esCacheExpirado(tiposCache)) {
      return of({
        success: true,
        data: tiposCache.datos as TipoConsultaInfo[],
      }).pipe(
        tap((response) => {
          this._tiposConsulta.set(response.data);
        })
      );
    }

    return this.http
      .get<TiposConsultaResponse>(
        `${this.API_URL}/tipos-consulta`,
        this.httpOptions
      )
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            this._tiposConsulta.set(response.data);
            this.guardarEnCache(cacheKey, response.data);
          }
        }),
        catchError((error) => {
          this._error.set('Error al obtener tipos de consulta');
          return this.manejarErrorOffline(cacheKey);
        }),
        shareReplay(1)
      );
  }

  /**
   * Obtener FAQ de contacto
   */
  obtenerFaqContacto(
    filtros?: FiltrosFaqContacto
  ): Observable<FaqContactoResponse> {
    const cacheKey = 'faq_contacto';
    let params = new HttpParams();

    if (filtros?.categoria) {
      params = params.set('categoria', filtros.categoria);
    }
    if (filtros?.busqueda) {
      params = params.set('busqueda', filtros.busqueda);
    }

    return this.http
      .get<FaqContactoResponse>(`${this.API_URL}/faq`, {
        ...this.httpOptions,
        params,
      })
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            this._faqContacto.set(response.data);
            if (!filtros) {
              this.guardarEnCache(cacheKey, response.data);
            }

            this.emitirEvento({
              tipo: 'faq_cargado',
              data: response.data,
              timestamp: new Date(),
            });
          }
        }),
        catchError((error) => {
          this._error.set('Error al obtener FAQ de contacto');
          return this.manejarErrorOffline(cacheKey);
        }),
        shareReplay(1)
      );
  }

  /**
   * Obtener estado actual de los servicios
   */
  obtenerEstadoServicios(): Observable<EstadoServicioResponse> {
    return this.http
      .get<EstadoServicioResponse>(
        `${this.API_URL}/estado-servicio`,
        this.httpOptions
      )
      .pipe(
        tap((response) => {
          if (response.success && response.data.servicios) {
            this._estadoServicios.set(response.data.servicios);

            this.emitirEvento({
              tipo: 'estado_actualizado',
              data: response.data,
              timestamp: new Date(),
            });
          }
        }),
        catchError((error) => {
          this._error.set('Error al obtener estado de servicios');
          throw error;
        })
      );
  }

  /**
   * Solicitar callback telefónico
   */
  solicitarCallback(
    request: SolicitarCallbackRequest
  ): Observable<SolicitarCallbackResponse> {
    this._cargando.set(true);

    return this.http
      .post<SolicitarCallbackResponse>(
        `${this.API_URL}/solicitar-callback`,
        request,
        this.httpOptions
      )
      .pipe(
        catchError((error) => {
          this._error.set('Error al solicitar callback');
          throw error;
        }),
        tap(() => this._cargando.set(false))
      );
  }

  /**
   * Obtener seguimiento de ticket
   */
  obtenerSeguimientoTicket(
    ticketId: string
  ): Observable<SeguimientoTicketResponse> {
    return this.http
      .get<SeguimientoTicketResponse>(
        `${this.API_URL}/seguimiento/${ticketId}`,
        this.httpOptions
      )
      .pipe(
        catchError((error) => {
          this._error.set('Error al obtener seguimiento del ticket');
          throw error;
        })
      );
  }

  /**
   * Evaluar satisfacción del servicio
   */
  evaluarSatisfaccion(
    evaluacion: EvaluacionSatisfaccion
  ): Observable<EvaluacionSatisfaccionResponse> {
    return this.http
      .post<EvaluacionSatisfaccionResponse>(
        `${this.API_URL}/evaluar-satisfaccion`,
        evaluacion,
        this.httpOptions
      )
      .pipe(
        catchError((error) => {
          this._error.set('Error al enviar evaluación');
          throw error;
        })
      );
  }

  // Métodos de utilidad y validación

  /**
   * Validar formulario completo
   */
  validarFormularioCompleto(
    request: EnviarMensajeRequest
  ): ValidacionFormularioContacto {
    const validacion: ValidacionFormularioContacto = {
      nombre_valido: this.validarNombre(request['nombre']),
      apellidos_valido: this.validarNombre(request['apellidos']),
      email_valido: this.validarEmail(request['email']),
      telefono_valido:
        !request['telefono'] || this.validarTelefono(request['telefono']),
      asunto_valido: request['asunto'].trim().length >= 5,
      mensaje_valido: request['mensaje'].trim().length >= 10,
      tipo_consulta_valido: !!request['tipo_consulta'],
      politicas_aceptadas: request['acepta_politicas'],
      formulario_completo: false,
      puntuacion_validez: 0,
    };

    // Calcular si formulario está completo
    const campos = Object.values(validacion);
    const camposValidos = campos.filter(Boolean).length;
    validacion.formulario_completo = camposValidos === campos.length - 1; // -1 por puntuacion_validez

    // Calcular puntuación
    validacion.puntuacion_validez = Math.round(
      (camposValidos / (campos.length - 1)) * 100
    );

    return validacion;
  }

  /**
   * Actualizar datos del remitente para autocompletar
   */
  actualizarDatosRemitente(datos: Partial<DatosRemitente>): void {
    const datosActuales = this._datosRemitente();
    this._datosRemitente.set({ ...datosActuales, ...datos });

    if (this.isBrowser) {
      localStorage.setItem(
        'contacto_datos_remitente',
        JSON.stringify(this._datosRemitente())
      );
    }
  }

  /**
   * Buscar en FAQ
   */
  buscarEnFaq(termino: string): FaqContacto[] {
    const faq = this._faqContacto();
    const terminoLower = termino.toLowerCase();

    return faq.filter(
      (item) =>
        item.pregunta.toLowerCase().includes(terminoLower) ||
        item.respuesta.toLowerCase().includes(terminoLower)
    );
  }

  /**
   * Obtener FAQ por categoría
   */
  obtenerFaqPorCategoria(categoria: CategoriaFaqContacto): FaqContacto[] {
    return this._faqContacto().filter((item) => item.categoria === categoria);
  }

  /**
   * Verificar disponibilidad de canal
   */
  verificarDisponibilidadCanal(canal: CanalContacto): boolean {
    const estado = this._estadoServicios();
    if (!estado) return false;

    const mapeoCanales: Record<CanalContacto, keyof EstadoServicio> = {
      email: 'email',
      telefono: 'telefono',
      whatsapp: 'whatsapp',
      tienda_fisica: 'tienda_fisica',
    };

    const canalEstado = estado[mapeoCanales[canal]];
    return canalEstado?.disponible || false;
  }

  // Métodos privados de validación

  /**
   * Validar email
   */
  private validarEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * Validar teléfono
   */
  private validarTelefono(telefono: string): boolean {
    const telefonoLimpio = telefono.replace(/\s+/g, '').replace(/[^\d+]/g, '');
    return telefonoLimpio.length >= 9 && telefonoLimpio.length <= 15;
  }

  /**
   * Validar nombre
   */
  private validarNombre(nombre: string): boolean {
    return nombre.trim().length >= 2 && /^[a-zA-ZÀ-ÿ\s]+$/.test(nombre);
  }

  /**
   * Limpiar texto
   */
  private limpiarTexto(texto: string): string {
    return texto.trim().replace(/\s+/g, ' ');
  }

  /**
   * Detectar idioma (simplificado)
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
      'le',
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
      'son',
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
      'sólo',
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
      'e',
      'vida',
      'otro',
      'después',
      'te',
      'otros',
      'aunque',
      'esa',
      'eso',
      'hace',
      'otra',
      'gobierno',
      'tan',
      'durante',
      'siempre',
      'día',
      'tanto',
      'ella',
      'tres',
      'sí',
      'dijo',
      'sido',
      'gran',
      'país',
      'según',
      'menos',
      'mundo',
      'año',
      'antes',
      'estado',
      'agua',
      'poco',
      'vez',
      'área',
      'bajo',
      'libre',
      'mismo',
      'trabajo',
    ];

    const palabras = texto.toLowerCase().split(/\s+/);
    const coincidencias = palabras.filter((palabra) =>
      palabrasEspanol.includes(palabra)
    ).length;

    return coincidencias > palabras.length * 0.3 ? 'es' : 'unknown';
  }

  /**
   * Contar palabras
   */
  private contarPalabras(texto: string): number {
    return texto
      .trim()
      .split(/\s+/)
      .filter((palabra) => palabra.length > 0).length;
  }

  /**
   * Validar archivo adjunto
   */
  private validarArchivoAdjunto(archivo: File): boolean {
    const tiposPermitidos = [
      'image/jpeg',
      'image/png',
      'application/pdf',
      'text/plain',
    ];
    const tamañoMaximo = 5 * 1024 * 1024; // 5MB

    return (
      tiposPermitidos.includes(archivo.type) && archivo.size <= tamañoMaximo
    );
  }

  /**
   * Formatear teléfono
   */
  private formatearTelefono(telefono: string): string {
    const telefonoLimpio = telefono.replace(/\D/g, '');

    if (telefonoLimpio.length === 9) {
      return telefonoLimpio.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
    }

    if (telefonoLimpio.length === 11 && telefonoLimpio.startsWith('51')) {
      return `+${telefonoLimpio.substring(0, 2)} ${telefonoLimpio.substring(
        2,
        5
      )} ${telefonoLimpio.substring(5, 8)} ${telefonoLimpio.substring(8)}`;
    }

    return telefono;
  }

  // Métodos de cache y storage

  /**
   * Generar key para cache
   */
  private generarCacheKey(tipo: string): string {
    return `contacto_${tipo}`;
  }

  /**
   * Guardar en cache
   */
  private guardarEnCache(tipo: string, datos: any): void {
    if (!this.isBrowser) return;

    try {
      const cache: CacheContacto = {
        key: tipo,
        datos,
        timestamp: Date.now(),
        expira_en:
          Date.now() + this.configuracion.cache_duracion_minutos * 60 * 1000,
        tipo: tipo as any,
      };

      this.cache.set(tipo, cache);
      this.guardarCacheEnStorage();
    } catch (error) {
      console.warn('Error al guardar cache de contacto:', error);
    }
  }

  /**
   * Obtener del cache
   */
  private obtenerDeCache(key: string): CacheContacto | null {
    return this.cache.get(key) || null;
  }

  /**
   * Verificar si cache está expirado
   */
  private esCacheExpirado(cache: CacheContacto): boolean {
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
          this.cache.set(key, value as CacheContacto);
        });
      }

      // Cargar datos del remitente
      const datosRemitente = localStorage.getItem('contacto_datos_remitente');
      if (datosRemitente) {
        this._datosRemitente.set(JSON.parse(datosRemitente));
      }
    } catch (error) {
      console.warn('Error al cargar cache de contacto:', error);
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
      console.warn('Error al guardar cache de contacto:', error);
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
  private emitirEvento(evento: EventoContacto): void {
    this.eventosContacto$.next(evento);
  }

  /**
   * Inicializar datos
   */
  private inicializar(): void {
    // Cargar datos básicos
    this.obtenerInformacionEmpresa().subscribe();
    this.obtenerTiposConsulta().subscribe();
    this.obtenerFaqContacto().subscribe();

    if (this.configuracion.mostrar_estado_servicios) {
      this.obtenerEstadoServicios().subscribe();
    }
  }

  /**
   * Configurar actualización automática
   */
  private configurarActualizacionAutomatica(): void {
    this.timerActualizacion = timer(
      0,
      this.configuracion.intervalo_actualizacion_minutos * 60 * 1000
    ).pipe(switchMap(() => this.obtenerEstadoServicios()));

    this.timerActualizacion.subscribe();
  }

  /**
   * Obtener errores de validación
   */
  private obtenerErroresValidacion(
    validacion: ValidacionFormularioContacto
  ): Record<string, string[]> {
    const errores: Record<string, string[]> = {};

    if (!validacion['nombre_valido']) {
      errores['nombre'] = [
        'Nombre debe tener al menos 2 caracteres y solo letras',
      ];
    }
    if (!validacion['apellidos_valido']) {
      errores['apellidos'] = [
        'Apellidos debe tener al menos 2 caracteres y solo letras',
      ];
    }
    if (!validacion['email_valido']) {
      errores['email'] = ['Email no tiene un formato válido'];
    }
    if (!validacion['telefono_valido']) {
      errores['telefono'] = ['Teléfono no tiene un formato válido'];
    }
    if (!validacion['asunto_valido']) {
      errores['asunto'] = ['Asunto debe tener al menos 5 caracteres'];
    }
    if (!validacion['mensaje_valido']) {
      errores['mensaje'] = ['Mensaje debe tener al menos 10 caracteres'];
    }
    if (!validacion['tipo_consulta_valido']) {
      errores['tipo_consulta'] = ['Debe seleccionar un tipo de consulta'];
    }
    if (!validacion['politicas_aceptadas']) {
      errores['acepta_politicas'] = [
        'Debe aceptar las políticas de privacidad',
      ];
    }

    return errores;
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
   * Limpiar datos del remitente
   */
  limpiarDatosRemitente(): void {
    this._datosRemitente.set({});
    if (this.isBrowser) {
      localStorage.removeItem('contacto_datos_remitente');
    }
  }

  // Getters públicos

  /**
   * Obtener stream de eventos
   */
  get eventos$(): Observable<EventoContacto | null> {
    return this.eventosContacto$.asObservable();
  }

  /**
   * Obtener configuración actual
   */
  get configuracionActual(): ConfiguracionServicioContacto {
    return { ...this.configuracion };
  }
}
