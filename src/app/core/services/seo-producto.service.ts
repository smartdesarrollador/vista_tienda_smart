import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  BehaviorSubject,
  Observable,
  catchError,
  finalize,
  map,
  tap,
  throwError,
} from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  SeoProducto,
  CreateSeoProductoDto,
  UpdateSeoProductoDto,
  GenerarSeoAutomaticoDto,
  OptimizarMasivoDto,
  FiltrosSeoProducto,
  SeoProductoResponse,
  OptimizacionMasivaResponse,
  AnalisisSeoResponse,
  AnalisisSeo,
  EstadoOptimizacion,
  PrioridadRecomendacion,
  obtenerEstadoOptimizacion,
  calcularPuntuacionSeo,
  agruparPorEstadoOptimizacion,
  filtrarPorEstadoOptimizacion,
  buscarSeoProductos,
  obtenerEstadisticasSeo,
  ordenarPorPuntuacion,
  exportarSeoCSV,
} from '../models/seo-producto.interface';

@Injectable({
  providedIn: 'root',
})
export class SeoProductoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/seo-productos`;

  // Estados reactivos con signals
  private readonly _seoProductos = signal<SeoProducto[]>([]);
  private readonly _seoProductoActual = signal<SeoProducto | null>(null);
  private readonly _cargando = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _filtros = signal<FiltrosSeoProducto>({});
  private readonly _paginacion = signal<{
    total: number;
    per_page: number;
    current_page: number;
  }>({
    total: 0,
    per_page: 15,
    current_page: 1,
  });

  // Signals públicos de solo lectura
  readonly seoProductos = this._seoProductos.asReadonly();
  readonly seoProductoActual = this._seoProductoActual.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly error = this._error.asReadonly();
  readonly filtros = this._filtros.asReadonly();
  readonly paginacion = this._paginacion.asReadonly();

  // Compatibilidad con BehaviorSubjects para código existente
  private readonly _seoProductos$ = new BehaviorSubject<SeoProducto[]>([]);
  private readonly _seoProductoActual$ =
    new BehaviorSubject<SeoProducto | null>(null);
  private readonly _cargando$ = new BehaviorSubject<boolean>(false);
  private readonly _error$ = new BehaviorSubject<string | null>(null);

  readonly seoProductos$ = this._seoProductos$.asObservable();
  readonly seoProductoActual$ = this._seoProductoActual$.asObservable();
  readonly cargando$ = this._cargando$.asObservable();
  readonly error$ = this._error$.asObservable();

  // Computed signals para datos derivados
  readonly seoProductosFiltrados = computed(() => {
    const productos = this._seoProductos();
    const filtros = this._filtros();

    let resultado = [...productos];

    if (filtros.search) {
      resultado = buscarSeoProductos(resultado, filtros.search);
    }

    return resultado;
  });

  readonly seoProductosOptimizados = computed(() =>
    filtrarPorEstadoOptimizacion(this._seoProductos(), 'completo')
  );

  readonly seoProductosBasicos = computed(() =>
    filtrarPorEstadoOptimizacion(this._seoProductos(), 'basico')
  );

  readonly seoProductosParciales = computed(() =>
    filtrarPorEstadoOptimizacion(this._seoProductos(), 'parcial')
  );

  readonly seoProductosSinOptimizar = computed(() =>
    filtrarPorEstadoOptimizacion(this._seoProductos(), 'sin_optimizar')
  );

  readonly seoProductosAgrupados = computed(() =>
    agruparPorEstadoOptimizacion(this._seoProductos())
  );

  readonly seoProductosOrdenadosPorPuntuacion = computed(() =>
    ordenarPorPuntuacion(this._seoProductos(), 'desc')
  );

  readonly estadisticasGenerales = computed(() =>
    obtenerEstadisticasSeo(this._seoProductos())
  );

  readonly totalSeoProductos = computed(() => this._seoProductos().length);

  readonly hayDatos = computed(() => this._seoProductos().length > 0);

  readonly hayError = computed(() => !!this._error());

  readonly puedeCargarMas = computed(() => {
    const paginacion = this._paginacion();
    return paginacion.current_page * paginacion.per_page < paginacion.total;
  });

  readonly progresoPaginacion = computed(() => {
    const paginacion = this._paginacion();
    if (paginacion.total === 0) return 0;
    return Math.round(
      ((paginacion.current_page * paginacion.per_page) / paginacion.total) * 100
    );
  });

  readonly resumenOptimizacion = computed(() => {
    const stats = this.estadisticasGenerales();
    const total = stats.total;

    if (total === 0) return 'Sin datos';

    const porcentajeCompletos = Math.round((stats.completos / total) * 100);
    const porcentajeBasicos = Math.round((stats.basicos / total) * 100);

    return `${porcentajeCompletos}% completos, ${porcentajeBasicos}% básicos`;
  });

  readonly necesitanAtencion = computed(() => {
    const productos = this._seoProductos();
    return productos.filter((seo) => {
      const puntuacion = calcularPuntuacionSeo(seo);
      return puntuacion < 50 || seo.recomendaciones.length > 3;
    });
  });

  readonly mejoresPuntuaciones = computed(() => {
    const productos = this._seoProductos();
    return productos
      .filter((seo) => calcularPuntuacionSeo(seo) >= 80)
      .sort((a, b) => calcularPuntuacionSeo(b) - calcularPuntuacionSeo(a))
      .slice(0, 5);
  });

  constructor() {
    // Sincronizar signals con BehaviorSubjects
    this._seoProductos.set = ((value: SeoProducto[]) => {
      this._seoProductos.update(() => value);
      this._seoProductos$.next(value);
      return value;
    }) as any;

    this._seoProductoActual.set = ((value: SeoProducto | null) => {
      this._seoProductoActual.update(() => value);
      this._seoProductoActual$.next(value);
      return value;
    }) as any;

    this._cargando.set = ((value: boolean) => {
      this._cargando.update(() => value);
      this._cargando$.next(value);
      return value;
    }) as any;

    this._error.set = ((value: string | null) => {
      this._error.update(() => value);
      this._error$.next(value);
      return value;
    }) as any;
  }

  // Métodos CRUD principales
  obtenerSeoProductos(
    filtros: FiltrosSeoProducto = {}
  ): Observable<SeoProductoResponse> {
    this._cargando.set(true);
    this._error.set(null);

    let params = new HttpParams();

    if (filtros.producto_id)
      params = params.set('producto_id', filtros.producto_id.toString());
    if (filtros.search) params = params.set('search', filtros.search);
    if (filtros.sin_meta_title) params = params.set('sin_meta_title', 'true');
    if (filtros.sin_meta_description)
      params = params.set('sin_meta_description', 'true');
    if (filtros.optimizado !== undefined)
      params = params.set('optimizado', filtros.optimizado.toString());
    if (filtros.per_page)
      params = params.set('per_page', filtros.per_page.toString());
    if (filtros.page) params = params.set('page', filtros.page.toString());

    return this.http.get<SeoProductoResponse>(this.baseUrl, { params }).pipe(
      tap((response) => {
        this._seoProductos.set(response.data);
        this._paginacion.set(response.meta);
        this._filtros.set(filtros);
      }),
      catchError((error) => {
        this._error.set('Error al cargar configuraciones SEO');
        console.error('Error al obtener SEO productos:', error);
        return throwError(() => error);
      }),
      finalize(() => this._cargando.set(false))
    );
  }

  obtenerSeoProducto(id: number): Observable<SeoProducto> {
    this._cargando.set(true);
    this._error.set(null);

    return this.http.get<{ data: SeoProducto }>(`${this.baseUrl}/${id}`).pipe(
      map((response) => response.data),
      tap((seoProducto) => {
        this._seoProductoActual.set(seoProducto);
        this.actualizarSeoProductoEnLista(seoProducto);
      }),
      catchError((error) => {
        this._error.set('Error al cargar configuración SEO');
        console.error('Error al obtener SEO producto:', error);
        return throwError(() => error);
      }),
      finalize(() => this._cargando.set(false))
    );
  }

  crearSeoProducto(datos: CreateSeoProductoDto): Observable<SeoProducto> {
    this._cargando.set(true);
    this._error.set(null);

    const formData = this.crearFormData(datos);

    return this.http
      .post<{ data: SeoProducto; message: string }>(this.baseUrl, formData)
      .pipe(
        map((response) => response.data),
        tap((nuevoSeoProducto) => {
          this._seoProductos.update((productos) => [
            ...productos,
            nuevoSeoProducto,
          ]);
          this._seoProductoActual.set(nuevoSeoProducto);
        }),
        catchError((error) => {
          this._error.set('Error al crear configuración SEO');
          console.error('Error al crear SEO producto:', error);
          return throwError(() => error);
        }),
        finalize(() => this._cargando.set(false))
      );
  }

  actualizarSeoProducto(
    id: number,
    datos: UpdateSeoProductoDto
  ): Observable<SeoProducto> {
    this._cargando.set(true);
    this._error.set(null);

    const formData = this.crearFormData(datos);

    return this.http
      .put<{ data: SeoProducto; message: string }>(
        `${this.baseUrl}/${id}`,
        formData
      )
      .pipe(
        map((response) => response.data),
        tap((seoProductoActualizado) => {
          this._seoProductoActual.set(seoProductoActualizado);
          this.actualizarSeoProductoEnLista(seoProductoActualizado);
        }),
        catchError((error) => {
          this._error.set('Error al actualizar configuración SEO');
          console.error('Error al actualizar SEO producto:', error);
          return throwError(() => error);
        }),
        finalize(() => this._cargando.set(false))
      );
  }

  eliminarSeoProducto(id: number): Observable<void> {
    this._cargando.set(true);
    this._error.set(null);

    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`).pipe(
      map(() => void 0),
      tap(() => {
        this._seoProductos.update((productos) =>
          productos.filter((p) => p.id !== id)
        );
        if (this._seoProductoActual()?.id === id) {
          this._seoProductoActual.set(null);
        }
      }),
      catchError((error) => {
        this._error.set('Error al eliminar configuración SEO');
        console.error('Error al eliminar SEO producto:', error);
        return throwError(() => error);
      }),
      finalize(() => this._cargando.set(false))
    );
  }

  // Métodos especializados
  generarSeoAutomatico(
    datos: GenerarSeoAutomaticoDto
  ): Observable<SeoProducto> {
    this._cargando.set(true);
    this._error.set(null);

    return this.http
      .post<{ data: SeoProducto; message: string }>(
        `${this.baseUrl}/generar-automatico`,
        datos
      )
      .pipe(
        map((response) => response.data),
        tap((seoProductoGenerado) => {
          this._seoProductos.update((productos) => [
            ...productos,
            seoProductoGenerado,
          ]);
          this._seoProductoActual.set(seoProductoGenerado);
        }),
        catchError((error) => {
          this._error.set('Error al generar configuración SEO automática');
          console.error('Error al generar SEO automático:', error);
          return throwError(() => error);
        }),
        finalize(() => this._cargando.set(false))
      );
  }

  analizarSeo(id: number): Observable<AnalisisSeoResponse> {
    this._cargando.set(true);
    this._error.set(null);

    return this.http
      .get<AnalisisSeoResponse>(`${this.baseUrl}/${id}/analizar`)
      .pipe(
        tap((response) => {
          this._seoProductoActual.set(response.seo_producto);
          this.actualizarSeoProductoEnLista(response.seo_producto);
        }),
        catchError((error) => {
          this._error.set('Error al analizar configuración SEO');
          console.error('Error al analizar SEO:', error);
          return throwError(() => error);
        }),
        finalize(() => this._cargando.set(false))
      );
  }

  optimizarMasivo(
    datos: OptimizarMasivoDto
  ): Observable<OptimizacionMasivaResponse> {
    this._cargando.set(true);
    this._error.set(null);

    return this.http
      .post<OptimizacionMasivaResponse>(
        `${this.baseUrl}/optimizar-masivo`,
        datos
      )
      .pipe(
        tap(() => {
          // Recargar datos después de la optimización masiva
          this.obtenerSeoProductos(this._filtros()).subscribe();
        }),
        catchError((error) => {
          this._error.set('Error en la optimización masiva');
          console.error('Error en optimización masiva:', error);
          return throwError(() => error);
        }),
        finalize(() => this._cargando.set(false))
      );
  }

  // Métodos de conveniencia
  buscar(termino: string): void {
    this._filtros.update((filtros) => ({
      ...filtros,
      search: termino,
      page: 1,
    }));
    this.obtenerSeoProductos(this._filtros()).subscribe();
  }

  filtrarPorProducto(productoId: number): void {
    this._filtros.update((filtros) => ({
      ...filtros,
      producto_id: productoId,
      page: 1,
    }));
    this.obtenerSeoProductos(this._filtros()).subscribe();
  }

  filtrarPorEstado(optimizado: boolean): void {
    this._filtros.update((filtros) => ({ ...filtros, optimizado, page: 1 }));
    this.obtenerSeoProductos(this._filtros()).subscribe();
  }

  filtrarSinMetaTitle(): void {
    this._filtros.update((filtros) => ({
      ...filtros,
      sin_meta_title: true,
      page: 1,
    }));
    this.obtenerSeoProductos(this._filtros()).subscribe();
  }

  filtrarSinMetaDescription(): void {
    this._filtros.update((filtros) => ({
      ...filtros,
      sin_meta_description: true,
      page: 1,
    }));
    this.obtenerSeoProductos(this._filtros()).subscribe();
  }

  limpiarFiltros(): void {
    this._filtros.set({});
    this.obtenerSeoProductos().subscribe();
  }

  cambiarPagina(pagina: number): void {
    this._filtros.update((filtros) => ({ ...filtros, page: pagina }));
    this.obtenerSeoProductos(this._filtros()).subscribe();
  }

  cambiarTamanoPagina(tamaño: number): void {
    this._filtros.update((filtros) => ({
      ...filtros,
      per_page: tamaño,
      page: 1,
    }));
    this.obtenerSeoProductos(this._filtros()).subscribe();
  }

  // Métodos de análisis y estadísticas
  obtenerSeoProductosPorEstado(estado: EstadoOptimizacion): SeoProducto[] {
    return filtrarPorEstadoOptimizacion(this._seoProductos(), estado);
  }

  obtenerSeoProductosConBajaPuntuacion(umbral: number = 50): SeoProducto[] {
    return this._seoProductos().filter(
      (seo) => calcularPuntuacionSeo(seo) < umbral
    );
  }

  obtenerSeoProductosConAltaPuntuacion(umbral: number = 80): SeoProducto[] {
    return this._seoProductos().filter(
      (seo) => calcularPuntuacionSeo(seo) >= umbral
    );
  }

  obtenerRecomendacionesPrioritarias(): {
    seoProducto: SeoProducto;
    recomendaciones: string[];
  }[] {
    return this._seoProductos()
      .filter((seo) => seo.recomendaciones.length > 0)
      .map((seo) => ({
        seoProducto: seo,
        recomendaciones: seo.recomendaciones,
      }))
      .sort((a, b) => b.recomendaciones.length - a.recomendaciones.length);
  }

  // Métodos de exportación
  exportarCSV(): string {
    return exportarSeoCSV(this._seoProductos());
  }

  exportarCSVFiltrado(): string {
    return exportarSeoCSV(this.seoProductosFiltrados());
  }

  descargarCSV(nombre: string = 'seo-productos'): void {
    const csv = this.exportarCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${nombre}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // Métodos de utilidad
  limpiarError(): void {
    this._error.set(null);
  }

  limpiarSeoProductoActual(): void {
    this._seoProductoActual.set(null);
  }

  refrescar(): void {
    this.obtenerSeoProductos(this._filtros()).subscribe();
  }

  // Métodos privados
  private crearFormData(
    datos: CreateSeoProductoDto | UpdateSeoProductoDto
  ): FormData {
    const formData = new FormData();

    Object.entries(datos).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'og_image' && value instanceof File) {
          formData.append(key, value);
        } else if (key === 'schema_markup' && typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    return formData;
  }

  private actualizarSeoProductoEnLista(
    seoProductoActualizado: SeoProducto
  ): void {
    this._seoProductos.update((productos) =>
      productos.map((p) =>
        p.id === seoProductoActualizado.id ? seoProductoActualizado : p
      )
    );
  }

  // Métodos de validación
  validarDatos(datos: CreateSeoProductoDto | UpdateSeoProductoDto): {
    valido: boolean;
    errores: string[];
  } {
    const errores: string[] = [];

    if ('producto_id' in datos && !datos.producto_id) {
      errores.push('El ID del producto es requerido');
    }

    if (datos.meta_title) {
      const length = datos.meta_title.length;
      if (length < 30 || length > 60) {
        errores.push('El meta título debe tener entre 30 y 60 caracteres');
      }
    }

    if (datos.meta_description) {
      const length = datos.meta_description.length;
      if (length < 120 || length > 160) {
        errores.push(
          'La meta descripción debe tener entre 120 y 160 caracteres'
        );
      }
    }

    if (datos.og_title && datos.og_title.length > 60) {
      errores.push('El título OG debe tener máximo 60 caracteres');
    }

    if (datos.og_description && datos.og_description.length > 160) {
      errores.push('La descripción OG debe tener máximo 160 caracteres');
    }

    if (datos.schema_markup && typeof datos.schema_markup === 'string') {
      try {
        JSON.parse(datos.schema_markup);
      } catch {
        errores.push('El schema markup debe ser un JSON válido');
      }
    }

    return {
      valido: errores.length === 0,
      errores,
    };
  }

  // Métodos de optimización automática
  generarSeoParaProductos(
    productosIds: number[],
    sobrescribir: boolean = false
  ): Observable<OptimizacionMasivaResponse> {
    return this.optimizarMasivo({ productos_ids: productosIds, sobrescribir });
  }

  optimizarTodos(
    sobrescribir: boolean = false
  ): Observable<OptimizacionMasivaResponse> {
    const productosIds = this._seoProductos().map((seo) => seo.producto_id);
    return this.optimizarMasivo({ productos_ids: productosIds, sobrescribir });
  }

  optimizarSinConfigurar(): Observable<OptimizacionMasivaResponse> {
    const sinOptimizar = this.seoProductosSinOptimizar();
    const productosIds = sinOptimizar.map((seo) => seo.producto_id);
    return this.optimizarMasivo({
      productos_ids: productosIds,
      sobrescribir: false,
    });
  }
}
