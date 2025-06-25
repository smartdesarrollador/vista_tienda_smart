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
} from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  TipoInteres,
  FrecuenciaNewsletter,
  FormatoNewsletter,
  MotivoDesuscripcion,
  SuscribirseNewsletterRequest,
  SuscribirseNewsletterResponse,
  ConfirmarSuscripcionResponse,
  DesuscribirseNewsletterRequest,
  DesuscribirseNewsletterResponse,
  PreferenciasNewsletter,
  PreferenciasNewsletterResponse,
  ActualizarPreferenciasRequest,
  ActualizarPreferenciasResponse,
  TipoInteresInfo,
  TiposInteresesResponse,
  EstadisticasNewsletter,
  EstadisticasNewsletterResponse,
  ConfiguracionServicioNewsletter,
  EventoNewsletter,
  ValidacionSuscripcion,
  HistorialSuscripcion,
  HistorialSuscripcionResponse,
  CacheNewsletter,
  NotificacionNewsletter,
  NotificacionesNewsletterResponse,
  ConfiguracionEmpresaNewsletter,
  ConfiguracionEmpresaNewsletterResponse,
  EstadoServicioNewsletter,
  EstadoServicioNewsletterResponse,
  NewsletterResponse,
  UtilNewsletter,
} from '../models/newsletter.interface';

@Injectable({
  providedIn: 'root',
})
export class NewsletterService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly API_URL = `${environment.apiUrl}/newsletter`;
  private readonly CACHE_KEY = 'newsletter_cache';

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
  private readonly configuracion: ConfiguracionServicioNewsletter = {
    cache_duracion_minutos: 30, // Newsletter cambia moderadamente
    timeout_segundos: 10,
    reintentos_suscripcion: 3,
    validar_email_tiempo_real: true,
    permitir_suscripcion_anonima: true,
    requerir_confirmacion: true,
    max_intentos_confirmacion: 3,
    tiempo_expiracion_token_horas: 24,
  };

  // Signals para estado reactivo
  private readonly _suscripcionActual =
    signal<SuscribirseNewsletterResponse | null>(null);
  private readonly _preferenciasActuales =
    signal<PreferenciasNewsletter | null>(null);
  private readonly _tiposIntereses = signal<TipoInteresInfo[]>([]);
  private readonly _estadisticas = signal<EstadisticasNewsletter | null>(null);
  private readonly _configuracionEmpresa =
    signal<ConfiguracionEmpresaNewsletter | null>(null);
  private readonly _estadoServicio = signal<EstadoServicioNewsletter | null>(
    null
  );
  private readonly _notificaciones = signal<NotificacionNewsletter[]>([]);
  private readonly _cargando = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _emailActual = signal<string>('');
  private readonly _tokenActual = signal<string>('');

  // Cache de datos
  private readonly cache = new Map<string, CacheNewsletter>();

  // Subject para eventos
  private readonly eventosNewsletter$ =
    new BehaviorSubject<EventoNewsletter | null>(null);

  // Computed signals públicos
  readonly suscripcionActual = this._suscripcionActual.asReadonly();
  readonly preferenciasActuales = this._preferenciasActuales.asReadonly();
  readonly tiposIntereses = this._tiposIntereses.asReadonly();
  readonly estadisticas = this._estadisticas.asReadonly();
  readonly configuracionEmpresa = this._configuracionEmpresa.asReadonly();
  readonly estadoServicio = this._estadoServicio.asReadonly();
  readonly notificaciones = this._notificaciones.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly error = this._error.asReadonly();
  readonly emailActual = this._emailActual.asReadonly();
  readonly tokenActual = this._tokenActual.asReadonly();

  readonly estaSuscrito = computed(() => {
    const preferencias = this._preferenciasActuales();
    return preferencias ? preferencias.activo : false;
  });

  readonly interesesSeleccionados = computed(() => {
    const preferencias = this._preferenciasActuales();
    return preferencias ? preferencias.intereses : [];
  });

  readonly frecuenciaActual = computed(() => {
    const preferencias = this._preferenciasActuales();
    return preferencias ? preferencias.frecuencia : 'semanal';
  });

  readonly resumenEstadisticas = computed(() => {
    const stats = this._estadisticas();
    if (!stats) return null;

    const totalIntereses = Object.values(stats.por_intereses).reduce(
      (sum, count) => sum + count,
      0
    );
    const interesPopular = Object.entries(stats.por_intereses).sort(
      ([, a], [, b]) => b - a
    )[0];

    return {
      suscriptores_totales: stats.total_suscriptores,
      suscriptores_activos: stats.suscriptores_activos,
      tasa_activacion:
        (stats.suscriptores_activos / stats.total_suscriptores) * 100,
      tasa_apertura: stats.tasa_apertura,
      tasa_clicks: stats.tasa_clicks,
      crecimiento: stats.crecimiento_mensual,
      interes_mas_popular: interesPopular ? interesPopular[0] : null,
      total_campanas: stats.ultimas_campanas.length,
    };
  });

  readonly tiposInteresesMap = computed(() => {
    const tipos = this._tiposIntereses();
    const map = new Map<TipoInteres, TipoInteresInfo>();
    tipos.forEach((tipo) => {
      map.set(tipo.id, tipo);
    });
    return map;
  });

  readonly notificacionesPendientes = computed(() => {
    const notificaciones = this._notificaciones();
    return notificaciones.filter((n) => !n.leida && n.accion_requerida);
  });

  readonly servicioDisponible = computed(() => {
    const estado = this._estadoServicio();
    return estado ? estado.envios_activos && !estado.procesando_cola : true;
  });

  // Utilidades del servicio
  readonly utilNewsletter: UtilNewsletter = {
    validarEmail: (email: string) => this.validarEmail(email),
    validarNombre: (nombre: string) => this.validarNombre(nombre),
    limpiarEmail: (email: string) => this.limpiarEmail(email),
    formatearFecha: (fecha: string) => this.formatearFecha(fecha),
    calcularTasaApertura: (aperturas: number, enviados: number) =>
      this.calcularTasaApertura(aperturas, enviados),
    calcularTasaClick: (clicks: number, aperturas: number) =>
      this.calcularTasaClick(clicks, aperturas),
    generarTokenConfirmacion: () => this.generarTokenConfirmacion(),
    validarToken: (token: string) => this.validarToken(token),
    calcularPuntuacionEngagement: (historial: HistorialSuscripcion) =>
      this.calcularPuntuacionEngagement(historial),
    determinarMejorHoraEnvio: (timezone: string) =>
      this.determinarMejorHoraEnvio(timezone),
    segmentarAudiencia: (criterios: any) => this.segmentarAudiencia(criterios),
    personalizarContenido: (template: string, datos: any) =>
      this.personalizarContenido(template, datos),
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
   * Suscribirse al newsletter
   */
  suscribirse(
    request: SuscribirseNewsletterRequest
  ): Observable<SuscribirseNewsletterResponse> {
    this._cargando.set(true);
    this._error.set(null);

    // Validar formulario antes de enviar
    const validacion = this.validarFormularioSuscripcion(request);
    if (!validacion.formulario_completo) {
      const response: SuscribirseNewsletterResponse = {
        success: false,
        message: 'Formulario incompleto o inválido',
        errors: this.obtenerErroresValidacion(validacion),
      };
      this._cargando.set(false);
      return of(response);
    }

    // Limpiar email
    const requestLimpio = {
      ...request,
      email: this.limpiarEmail(request.email),
    };

    return this.http
      .post<SuscribirseNewsletterResponse>(
        `${this.API_URL}/suscribirse`,
        requestLimpio,
        this.httpOptions
      )
      .pipe(
        tap((response) => {
          if (response.success) {
            this._suscripcionActual.set(response);
            this._emailActual.set(requestLimpio.email);

            if (response.data?.token_confirmacion) {
              this._tokenActual.set(response.data.token_confirmacion);
            }

            // Invalidar cache de preferencias
            this.invalidarCache('preferencias');

            this.emitirEvento({
              tipo: 'suscripcion_iniciada',
              data: {
                email: requestLimpio.email,
                token: response.data?.token_confirmacion,
              },
              timestamp: new Date(),
            });
          }
        }),
        catchError((error) => {
          this._error.set('Error al suscribirse al newsletter');
          return this.manejarErrorSuscripcion(error);
        }),
        tap(() => this._cargando.set(false))
      );
  }

  /**
   * Confirmar suscripción
   */
  confirmarSuscripcion(
    token: string
  ): Observable<ConfirmarSuscripcionResponse> {
    this._cargando.set(true);

    if (!this.validarToken(token)) {
      const response: ConfirmarSuscripcionResponse = {
        success: false,
        message: 'Token de confirmación inválido',
      };
      this._cargando.set(false);
      return of(response);
    }

    return this.http
      .get<ConfirmarSuscripcionResponse>(
        `${this.API_URL}/confirmar/${token}`,
        this.httpOptions
      )
      .pipe(
        tap((response) => {
          if (response.success) {
            // Limpiar datos temporales
            this._tokenActual.set('');

            // Invalidar cache
            this.invalidarCache('preferencias');
            this.invalidarCache('estadisticas');

            this.emitirEvento({
              tipo: 'suscripcion_confirmada',
              data: { token },
              timestamp: new Date(),
            });
          }
        }),
        catchError((error) => {
          this._error.set('Error al confirmar suscripción');
          throw error;
        }),
        tap(() => this._cargando.set(false))
      );
  }

  /**
   * Desuscribirse del newsletter
   */
  desuscribirse(
    request: DesuscribirseNewsletterRequest
  ): Observable<DesuscribirseNewsletterResponse> {
    this._cargando.set(true);

    const requestLimpio = {
      ...request,
      email: this.limpiarEmail(request.email),
    };

    return this.http
      .post<DesuscribirseNewsletterResponse>(
        `${this.API_URL}/desuscribirse`,
        requestLimpio,
        this.httpOptions
      )
      .pipe(
        tap((response) => {
          if (response.success) {
            // Limpiar estado local
            this._preferenciasActuales.set(null);
            this._suscripcionActual.set(null);

            // Invalidar cache
            this.invalidarCache('preferencias');
            this.invalidarCache('estadisticas');

            this.emitirEvento({
              tipo: 'desuscripcion_realizada',
              data: { email: requestLimpio.email, motivo: request.motivo },
              timestamp: new Date(),
            });
          }
        }),
        catchError((error) => {
          this._error.set('Error al desuscribirse del newsletter');
          throw error;
        }),
        tap(() => this._cargando.set(false))
      );
  }

  /**
   * Obtener preferencias del usuario
   */
  obtenerPreferencias(
    email: string
  ): Observable<PreferenciasNewsletterResponse> {
    const emailLimpio = this.limpiarEmail(email);
    const cacheKey = `preferencias_${emailLimpio}`;
    const preferenciasCache = this.obtenerDeCache(cacheKey);

    if (preferenciasCache && !this.esCacheExpirado(preferenciasCache)) {
      return of({
        success: true,
        data: preferenciasCache.datos as PreferenciasNewsletter,
      }).pipe(
        tap((response) => {
          this._preferenciasActuales.set(response.data);
          this._emailActual.set(emailLimpio);
        })
      );
    }

    this._cargando.set(true);

    return this.http
      .get<PreferenciasNewsletterResponse>(
        `${this.API_URL}/preferencias/${encodeURIComponent(emailLimpio)}`,
        this.httpOptions
      )
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            this._preferenciasActuales.set(response.data);
            this._emailActual.set(emailLimpio);
            this.guardarEnCache(cacheKey, response.data, 'preferencias', {
              email: emailLimpio,
            });
          }
        }),
        catchError((error) => {
          this._error.set('Error al obtener preferencias');
          return this.manejarErrorOffline(cacheKey);
        }),
        tap(() => this._cargando.set(false)),
        shareReplay(1)
      );
  }

  /**
   * Actualizar preferencias del usuario
   */
  actualizarPreferencias(
    request: ActualizarPreferenciasRequest
  ): Observable<ActualizarPreferenciasResponse> {
    this._cargando.set(true);

    const requestLimpio = {
      ...request,
      email: this.limpiarEmail(request.email),
    };

    return this.http
      .put<ActualizarPreferenciasResponse>(
        `${this.API_URL}/preferencias`,
        requestLimpio,
        this.httpOptions
      )
      .pipe(
        tap((response) => {
          if (response.success) {
            // Actualizar preferencias locales
            const preferenciasActualizadas: PreferenciasNewsletter = {
              email: requestLimpio.email,
              nombre:
                requestLimpio.nombre ||
                this._preferenciasActuales()?.nombre ||
                '',
              frecuencia: requestLimpio.frecuencia,
              intereses: requestLimpio.intereses || [],
              formato: requestLimpio.formato,
              activo: true,
              fecha_suscripcion:
                this._preferenciasActuales()?.fecha_suscripcion ||
                new Date().toISOString(),
            };

            this._preferenciasActuales.set(preferenciasActualizadas);

            // Invalidar cache
            this.invalidarCache(`preferencias_${requestLimpio.email}`);

            this.emitirEvento({
              tipo: 'preferencias_actualizadas',
              data: {
                email: requestLimpio.email,
                preferencias: preferenciasActualizadas,
              },
              timestamp: new Date(),
            });
          }
        }),
        catchError((error) => {
          this._error.set('Error al actualizar preferencias');
          throw error;
        }),
        tap(() => this._cargando.set(false))
      );
  }

  /**
   * Obtener tipos de intereses disponibles
   */
  obtenerTiposIntereses(): Observable<TiposInteresesResponse> {
    const cacheKey = 'tipos_intereses';
    const tiposCache = this.obtenerDeCache(cacheKey);

    if (tiposCache && !this.esCacheExpirado(tiposCache)) {
      return of({
        success: true,
        data: tiposCache.datos as TipoInteresInfo[],
      }).pipe(
        tap((response) => {
          this._tiposIntereses.set(response.data);
        })
      );
    }

    return this.http
      .get<TiposInteresesResponse>(
        `${this.API_URL}/tipos-intereses`,
        this.httpOptions
      )
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            this._tiposIntereses.set(response.data);
            this.guardarEnCache(cacheKey, response.data, 'intereses');

            this.emitirEvento({
              tipo: 'intereses_cargados',
              data: { total: response.data.length },
              timestamp: new Date(),
            });
          }
        }),
        catchError((error) => {
          this._error.set('Error al obtener tipos de intereses');
          return this.manejarErrorOffline(cacheKey);
        }),
        shareReplay(1)
      );
  }

  /**
   * Obtener estadísticas del newsletter
   */
  obtenerEstadisticas(): Observable<EstadisticasNewsletterResponse> {
    const cacheKey = 'estadisticas';
    const estadisticasCache = this.obtenerDeCache(cacheKey);

    if (estadisticasCache && !this.esCacheExpirado(estadisticasCache)) {
      return of({
        success: true,
        data: estadisticasCache.datos as EstadisticasNewsletter,
      }).pipe(
        tap((response) => {
          this._estadisticas.set(response.data);
        })
      );
    }

    return this.http
      .get<EstadisticasNewsletterResponse>(
        `${this.API_URL}/estadisticas`,
        this.httpOptions
      )
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            this._estadisticas.set(response.data);
            this.guardarEnCache(cacheKey, response.data, 'estadisticas');

            this.emitirEvento({
              tipo: 'estadisticas_cargadas',
              data: response.data,
              timestamp: new Date(),
            });
          }
        }),
        catchError((error) => {
          this._error.set('Error al obtener estadísticas');
          return this.manejarErrorOffline(cacheKey);
        }),
        shareReplay(1)
      );
  }

  // Métodos de validación

  /**
   * Validar formulario de suscripción
   */
  validarFormularioSuscripcion(
    request: SuscribirseNewsletterRequest
  ): ValidacionSuscripcion {
    const validacion: ValidacionSuscripcion = {
      email_valido: this.validarEmail(request.email),
      nombre_valido: !request.nombre || this.validarNombre(request.nombre),
      intereses_validos: !request.intereses || request.intereses.length <= 6,
      politicas_aceptadas: request.acepta_politicas,
      ya_suscrito: false, // Se validará en el servidor
      formulario_completo: false,
      puntuacion_validez: 0,
    };

    // Calcular si formulario está completo
    validacion.formulario_completo =
      validacion.email_valido &&
      validacion.nombre_valido &&
      validacion.intereses_validos &&
      validacion.politicas_aceptadas;

    // Calcular puntuación
    let puntuacion = 0;
    if (validacion.email_valido) puntuacion += 40;
    if (validacion.nombre_valido) puntuacion += 20;
    if (validacion.intereses_validos) puntuacion += 20;
    if (validacion.politicas_aceptadas) puntuacion += 20;

    validacion.puntuacion_validez = puntuacion;

    return validacion;
  }

  /**
   * Obtener errores de validación
   */
  private obtenerErroresValidacion(
    validacion: ValidacionSuscripcion
  ): Record<string, string[]> {
    const errores: Record<string, string[]> = {};

    if (!validacion.email_valido) {
      errores['email'] = ['Email no tiene un formato válido'];
    }
    if (!validacion.nombre_valido) {
      errores['nombre'] = ['Nombre debe tener al menos 2 caracteres'];
    }
    if (!validacion.intereses_validos) {
      errores['intereses'] = ['Máximo 6 intereses permitidos'];
    }
    if (!validacion.politicas_aceptadas) {
      errores['acepta_politicas'] = [
        'Debe aceptar las políticas de privacidad',
      ];
    }

    return errores;
  }

  // Métodos de utilidad públicos implementados

  /**
   * Validar email
   */
  private validarEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email.trim());
  }

  /**
   * Validar nombre
   */
  private validarNombre(nombre: string): boolean {
    return (
      nombre.trim().length >= 2 &&
      /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre.trim())
    );
  }

  /**
   * Limpiar email
   */
  private limpiarEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  /**
   * Formatear fecha
   */
  private formatearFecha(fecha: string): string {
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return fecha;
    }
  }

  /**
   * Calcular tasa de apertura
   */
  private calcularTasaApertura(aperturas: number, enviados: number): number {
    if (enviados === 0) return 0;
    return Math.round((aperturas / enviados) * 100 * 100) / 100;
  }

  /**
   * Calcular tasa de clicks
   */
  private calcularTasaClick(clicks: number, aperturas: number): number {
    if (aperturas === 0) return 0;
    return Math.round((clicks / aperturas) * 100 * 100) / 100;
  }

  /**
   * Generar token de confirmación
   */
  private generarTokenConfirmacion(): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 64; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Validar token
   */
  private validarToken(token: string): boolean {
    return /^[A-Za-z0-9]{64}$/.test(token);
  }

  /**
   * Calcular puntuación de engagement
   */
  private calcularPuntuacionEngagement(
    historial: HistorialSuscripcion
  ): number {
    let puntuacion = 0;

    // Puntuación por actividad
    if (historial.activo) puntuacion += 30;

    // Puntuación por interacción
    if (historial.campanas_recibidas > 0) {
      const tasaApertura =
        (historial.campanas_abiertas / historial.campanas_recibidas) * 100;
      puntuacion += Math.min(tasaApertura * 0.4, 40);
    }

    // Puntuación por clicks
    if (historial.campanas_abiertas > 0) {
      const tasaClick =
        (historial.links_clickeados / historial.campanas_abiertas) * 100;
      puntuacion += Math.min(tasaClick * 0.3, 30);
    }

    return Math.min(Math.round(puntuacion), 100);
  }

  /**
   * Determinar mejor hora de envío
   */
  private determinarMejorHoraEnvio(timezone: string): string {
    // Algoritmo simplificado basado en zona horaria
    const zonaHora = new Date().toLocaleString('en-US', { timeZone: timezone });
    const hora = new Date(zonaHora).getHours();

    // Horarios óptimos según estudios
    if (hora >= 6 && hora <= 10) return '09:00';
    if (hora >= 10 && hora <= 14) return '13:00';
    if (hora >= 14 && hora <= 18) return '16:00';
    return '19:00';
  }

  /**
   * Segmentar audiencia
   */
  private segmentarAudiencia(criterios: any): string[] {
    // Implementación simplificada de segmentación
    const segmentos: string[] = [];

    if (criterios.intereses?.includes('tecnologia')) {
      segmentos.push('tech-enthusiasts');
    }
    if (criterios.intereses?.includes('ofertas')) {
      segmentos.push('deal-seekers');
    }
    if (criterios.frecuencia === 'diaria') {
      segmentos.push('high-engagement');
    }
    if (criterios.actividad_minima && criterios.actividad_minima > 80) {
      segmentos.push('super-users');
    }

    return segmentos;
  }

  /**
   * Personalizar contenido
   */
  private personalizarContenido(template: string, datos: any): string {
    let contenido = template;

    // Reemplazar variables básicas
    contenido = contenido.replace(/\{\{nombre\}\}/g, datos.nombre || 'Usuario');
    contenido = contenido.replace(/\{\{email\}\}/g, datos.email || '');

    // Reemplazar intereses
    if (datos.intereses && Array.isArray(datos.intereses)) {
      const interesesTexto = datos.intereses.join(', ');
      contenido = contenido.replace(/\{\{intereses\}\}/g, interesesTexto);
    }

    return contenido;
  }

  // Métodos de cache y storage

  /**
   * Generar key para cache
   */
  private generarCacheKey(tipo: string, metadatos?: any): string {
    let key = `newsletter_${tipo}`;
    if (metadatos?.email) {
      key += `_${metadatos.email.replace('@', '_at_')}`;
    }
    return key;
  }

  /**
   * Guardar en cache
   */
  private guardarEnCache(
    key: string,
    datos: any,
    tipo: CacheNewsletter['tipo'],
    metadatos?: any
  ): void {
    if (!this.isBrowser) return;

    try {
      const cache: CacheNewsletter = {
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
      console.warn('Error al guardar cache de Newsletter:', error);
    }
  }

  /**
   * Obtener del cache
   */
  private obtenerDeCache(key: string): CacheNewsletter | null {
    return this.cache.get(key) || null;
  }

  /**
   * Verificar si cache está expirado
   */
  private esCacheExpirado(cache: CacheNewsletter): boolean {
    return Date.now() > cache.expira_en;
  }

  /**
   * Invalidar cache específico
   */
  private invalidarCache(key: string): void {
    this.cache.delete(key);
    this.guardarCacheEnStorage();
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
          this.cache.set(key, value as CacheNewsletter);
        });
      }
    } catch (error) {
      console.warn('Error al cargar cache de Newsletter:', error);
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
      console.warn('Error al guardar cache de Newsletter:', error);
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
   * Manejar error de suscripción
   */
  private manejarErrorSuscripcion(
    error: any
  ): Observable<SuscribirseNewsletterResponse> {
    if (error.status === 422 && error.error?.errors) {
      return of({
        success: false,
        message: error.error.message || 'Error de validación',
        errors: error.error.errors,
      });
    }

    return throwError(() => error);
  }

  /**
   * Emitir evento
   */
  private emitirEvento(evento: EventoNewsletter): void {
    this.eventosNewsletter$.next(evento);
  }

  /**
   * Inicializar datos
   */
  private inicializar(): void {
    // Cargar tipos de intereses al inicio
    this.obtenerTiposIntereses().subscribe();

    // Cargar estadísticas si están disponibles
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
   * Verificar si email está suscrito
   */
  verificarSuscripcion(email: string): Observable<boolean> {
    return this.obtenerPreferencias(email).pipe(
      map((response) => response.success && response.data?.activo),
      catchError(() => of(false))
    );
  }

  /**
   * Cambiar email de suscripción
   */
  cambiarEmail(
    emailActual: string,
    emailNuevo: string
  ): Observable<ActualizarPreferenciasResponse> {
    const preferenciasActuales = this._preferenciasActuales();

    if (!preferenciasActuales) {
      return throwError(() => new Error('No hay preferencias cargadas'));
    }

    const request: ActualizarPreferenciasRequest = {
      email: this.limpiarEmail(emailNuevo),
      nombre: preferenciasActuales.nombre,
      frecuencia: preferenciasActuales.frecuencia,
      intereses: preferenciasActuales.intereses,
      formato: preferenciasActuales.formato,
    };

    return this.actualizarPreferencias(request);
  }

  /**
   * Obtener recomendaciones de intereses
   */
  obtenerRecomendacionesIntereses(
    interesesActuales: TipoInteres[]
  ): TipoInteresInfo[] {
    const todosLosIntereses = this._tiposIntereses();
    const estadisticas = this._estadisticas();

    if (!estadisticas) return [];

    // Filtrar intereses no seleccionados
    const interesesDisponibles = todosLosIntereses.filter(
      (interes) => !interesesActuales.includes(interes.id)
    );

    // Ordenar por popularidad
    return interesesDisponibles
      .sort((a, b) => {
        const countA = estadisticas.por_intereses[a.id] || 0;
        const countB = estadisticas.por_intereses[b.id] || 0;
        return countB - countA;
      })
      .slice(0, 3); // Top 3 recomendaciones
  }

  // Getters públicos

  /**
   * Obtener stream de eventos
   */
  get eventos$(): Observable<EventoNewsletter | null> {
    return this.eventosNewsletter$.asObservable();
  }

  /**
   * Obtener configuración actual
   */
  get configuracionActual(): ConfiguracionServicioNewsletter {
    return { ...this.configuracion };
  }
}
