// Interfaces comunes primero
export type { ApiResponse, ApiErrorResponse } from './common.interface';

// Paginación - Interfaces para componentes de paginación reutilizables
export type {
  PaginationConfig,
  PageChangeEvent,
  PageSizeChangeEvent,
} from './pagination.interface';

// Producto interfaces - Sistema de productos completo
export * from './producto.interface';

// Otros modelos básicos
export * from './configuracion.model';
// export * from './banner.model'; // Comentado temporalmente - archivo no encontrado
export * from './user.model';
export * from './auth.model';
export * from './atributo.model';

// Exportaciones específicas para evitar conflictos
export type {
  ValorAtributo,
  CreateValorAtributoRequest,
  UpdateValorAtributoRequest,
  ValorAtributoFilters,
  ValorAtributoStatistics,
  PaginatedValorAtributoResponse,
} from './valor-atributo.interface';

export type { Cupon, CuponFormData, TipoCupon } from './cupon.model';

export type { Categoria as CategoriaModel } from './categoria.model';

// Variación Producto interfaces - Exportaciones específicas para evitar conflictos
export type {
  VariacionProducto as VariacionProductoInterface,
  VariacionProductoSimple,
  ImagenVariacion,
  CreateVariacionProductoRequest,
  UpdateVariacionProductoRequest,
  VariacionProductoResponse,
  VariacionesProductoResponse,
  VariacionesByProductoResponse,
  VariacionProductoPagination,
  VariacionProductoFilters,
  VariacionProductoFormData,
  UpdateStockRequest,
  UpdateStockResponse,
  VariacionProductoApiError,
  VariacionProductoState,
  EstadoStock,
  OperacionStock,
  SortField,
  SortOrder,
} from './variacion-producto.interface';

// Imagen Producto interfaces - Exportaciones específicas para evitar conflictos
export type {
  ImagenProducto as ImagenProductoInterface,
  ProductoBasico,
  VariacionBasica,
  ImagenMetadata,
  TipoImagen,
  CreateImagenProductoRequest,
  UpdateImagenProductoRequest,
  ImagenProductoFilters,
  ImagenProductoListResponse,
  ImagenProductoResponse,
  ImagenProductoByProductoResponse,
  ImagenProductoByVariacionResponse,
  UpdateOrderRequest,
  ImagenProductoStatistics,
  ImagenProductoStatisticsResponse,
} from './imagen-producto.interface';

// Exportar constantes y utilidades (no tipos)
export {
  TIPOS_IMAGEN,
  IMAGEN_CONSTRAINTS,
  isValidImageType,
  isValidImageSize,
  getImageTypeDisplay,
} from './imagen-producto.interface';

// Exportar todas las interfaces de pedidos (básicas)
export * from './pedido.interface';

// FASE 3 - Sistema de Comercio - Interfaces avanzadas para gestión de pedidos
// Exportaciones específicas para evitar conflictos con pedido.interface.ts

// Detalle Pedido - Interfaces avanzadas
export type {
  DetallePedido as DetallePedidoAvanzado,
  CreateDetallePedidoDto as CreateDetallePedidoAvanzadoDto,
  UpdateDetallePedidoDto,
  DetallePedidoFilters,
  DetallePedidoEstadisticas,
  DetallePedidoPaginatedResponse,
  DetallePedidoCalculos,
  ValidacionStock,
  UpdateMasivoDetallePedido,
  ResumenDetallePedido,
  TipoDescuentoDetalle,
  EstadoDetallePedido,
  ConfiguracionImpuesto,
  HistorialDetallePedido,
  ExportacionDetalles,
  MonedaDetalle,
  CampoOrdenamiento,
  DireccionOrdenamiento,
} from './detalle-pedido.interface';

// Exportar constantes (no tipos)
export { DETALLE_PEDIDO_CONSTANTS } from './detalle-pedido.interface';

// Pago - Interfaces avanzadas
export type {
  Pago as PagoAvanzado,
  CreatePagoDto,
  UpdatePagoDto,
  PagoFilters,
  PagoEstadisticas,
  ProcesarPagoRequest,
  DatosTarjeta,
  DatosTransferencia,
  DatosBilleteraDigital,
  DireccionFacturacion,
  ProcesarPagoResponse,
  ReembolsoRequest,
  ReembolsoResponse,
  ConfiguracionMetodoPago,
  ConciliacionPago,
  NotificacionPago,
  AuditoriaPago,
  PagoPaginatedResponse,
  MonedaPago,
  MetodoRequiereAutorizacion,
  MetodoInstantaneo,
  EstadoFinal,
  CampoOrdenamientoPago,
} from './pago.interface';

// Exportar constantes y utilidades (no tipos)
export {
  PAGO_CONSTANTS,
  PagoUtils,
  MetodoPago as MetodoPagoAvanzado,
  EstadoPago as EstadoPagoAvanzado,
} from './pago.interface';

// Cuota Crédito - Interfaces avanzadas
export type {
  CuotaCredito as CuotaCreditoAvanzada,
  CreateCuotaCreditoDto,
  UpdateCuotaCreditoDto,
  CuotaCreditoFilters,
  CuotaCreditoEstadisticas,
  CronogramaPagos,
  SimulacionCredito,
  PagoCuotaRequest,
  PagoCuotaResponse,
  RefinanciamientoRequest,
  CondonacionRequest,
  CalculoMora,
  ConfiguracionCredito,
  EvaluacionCrediticia,
  NotificacionCuota,
  ReporteCartera,
  CuotaCreditoPaginatedResponse,
  EstadoActivo,
  EstadoFinalCuota,
  MetodoCalculo,
  CampoOrdenamientoCuota,
} from './cuota-credito.interface';

// Exportar constantes y utilidades (no tipos)
export {
  CUOTA_CREDITO_CONSTANTS,
  CuotaCreditoUtils,
  EstadoCuota as EstadoCuotaAvanzada,
} from './cuota-credito.interface';

// Dirección - Interfaces para gestión de direcciones de usuarios
export * from './direccion.interface';

// Comentario - Interfaces para gestión de comentarios de productos (exportaciones específicas para evitar conflictos)
export type {
  Comentario as ComentarioCompleto,
  UsuarioComentario,
  ProductoComentario,
  CreateComentarioDto,
  UpdateComentarioDto,
  ComentarioFilters,
  ComentarioResponse,
  ComentarioSingleResponse,
  ComentariosByProductoResponse,
  EstadisticasProductoComentarios,
  EstadisticasComentarios,
  ComentarioOperationResponse,
  ResponderComentarioDto,
  CalificacionEnum,
  EstadoAprobacion,
  ComentarioValidation,
  ResumenComentarios,
  FiltrosRapidos,
  AccionMasivaComentarios,
  AccionMasivaResponse,
} from './comentario.interface';

// Exportar constantes y utilidades (no tipos)
export { COMENTARIO_CONSTANTS, ComentarioUtils } from './comentario.interface';

// Favorito - Interfaces para gestión de favoritos de usuarios
export * from './favorito.interface';

// Notificación - Interfaces para gestión de notificaciones del sistema (exportaciones específicas para evitar conflictos)
export type {
  Notificacion as NotificacionCompleta,
  UsuarioNotificacion,
  TipoDetalladoNotificacion,
  TipoNotificacion,
  PrioridadNotificacion,
  CreateNotificacionDto,
  UpdateNotificacionDto,
  NotificacionFilters,
  NotificacionResponse,
  NotificacionSingleResponse,
  NotificacionesByUsuarioResponse,
  EstadisticasUsuarioNotificaciones,
  EstadisticasNotificaciones,
  NotificacionOperationResponse,
  MarcarLeidasRequest,
  MarcarLeidasResponse,
  LimpiarAntiguasRequest,
  LimpiarAntiguasResponse,
  EnviarMasivaRequest,
  EnviarMasivaResponse,
  NotificacionValidation,
  ResumenNotificaciones,
  FiltrosRapidosNotificaciones,
  AccionMasivaNotificaciones,
  AccionMasivaNotificacionesResponse,
  TipoOrdenamientoNotificacion,
  DireccionOrdenamientoNotificacion,
} from './notificacion.interface';

// Exportar constantes y utilidades (no tipos)
export {
  NOTIFICACION_CONSTANTS,
  TIPOS_NOTIFICACION_CONFIG,
  PRIORIDADES_CONFIG,
  NotificacionUtils,
} from './notificacion.interface';

// Dashboard - Interfaces para el sistema de dashboard administrativo (exportaciones específicas para evitar conflictos)
export type {
  // Tipos principales
  PeriodoDashboard,
  MonedaDashboard,
  TipoAgrupacion,
  OrdenamientoProducto,
  RolUsuario,
  TipoAlerta,
  PrioridadAlerta,
  TipoActividad,
  TipoCache,

  // Interfaces de datos principales
  FechasPeriodo,
  KPIsPrincipales,
  VentasPorEstado,
  VentasPorCanal,
  TendenciaDiariaVenta,
  EstadisticasVentas,
  ProductoMasVendido,
  EstadisticasProductos,
  TopCliente,
  EstadisticasUsuarios,
  PagosPorMetodo,
  EstadisticasFinancieras,
  ActividadReciente,
  AlertaSistema,
  ResumenDashboard,

  // Interfaces de respuesta
  DashboardResumenResponse,
  DashboardVentasResponse,
  DashboardProductosResponse,
  DashboardUsuariosResponse,
  DashboardFinancierasResponse,
  DashboardAlertasResponse,
  DashboardActividadResponse,
  LimpiarCacheResponse,
  DashboardErrorResponse,

  // Interfaces de filtros
  DashboardFiltros,
  VentasFiltros,
  ProductosFiltros,
  UsuariosFiltros,
  FinancierasFiltros,
  AlertasFiltros,
  ActividadFiltros,
  LimpiarCacheRequest,

  // Interfaces detalladas
  VentasPorPeriodo,
  AnalisisConversion,
  ComparacionPeriodo,
  EstadisticasVentasDetalladas,
  ResumenProductos,
  ProductoBajoStock,
  ProductoMejorCalificado,
  AnalisisCategorias,
  TendenciaPrecios,
  EstadisticasProductosDetalladas,
  ResumenUsuarios,
  NuevosRegistrosPorPeriodo,
  UsuarioMasActivo,
  AnalisisComportamiento,
  DistribucionGeografica,
  AnalisisRetencion,
  EstadisticasUsuariosDetalladas,
  ResumenFinanciero,
  FlujoCaja,
  AnalisisCreditos,
  AnalisisCupones,
  ProyeccionesFinancieras,
  EstadisticasFinancierasDetalladas,
} from './dashboard.interface';

// Exportar constantes y utilidades (no tipos)
export {
  DASHBOARD_CONSTANTS,
  DASHBOARD_COLORS,
  DASHBOARD_ICONS,
  DashboardUtils,
} from './dashboard.interface';

// Reportes - Interfaces para el sistema de reportes administrativos (exportaciones específicas para evitar conflictos)
export type {
  // Tipos principales
  TipoReporte,
  CategoriaReporte,
  FormatoExportacion,
  PeriodoReporte,
  MonedaReporte,
  AgrupacionReporte,
  EstadoPedidoReporte,
  CanalVentaReporte,
  SegmentacionCliente,
  ModuloPersonalizado,

  // Interfaces de datos principales
  MetadatosReporte,
  ReporteDisponible,
  ParametrosBaseReporte,
  ResumenVentas,
  VentasAgrupadas,
  ProductoMasVendidoReporte,
  AnalisisPorCanal,
  AnalisisPorMetodoPago,
  DetallePedidoReporte,

  // Interfaces de respuesta
  ListaReportesResponse,
  ReporteVentasResponse,
  ReporteInventarioResponse,
  ReporteClientesResponse,
  ReporteFinancieroResponse,
  ReportePersonalizadoResponse,
  EstadisticasReportesResponse,
  ExportacionResponse,
  ReporteErrorResponse,

  // Interfaces de filtros y parámetros
  ListaReportesFiltros,
  ParametrosReporteVentas,
  ParametrosReporteInventario,
  ParametrosReporteClientes,
  ParametrosReporteFinanciero,
  ParametrosReportePersonalizado,
  ParametrosEstadisticasReportes,

  // Interfaces de datos de reportes
  DatosReporteVentas,
  DatosReporteInventario,
  DatosReporteClientes,
  DatosReporteFinanciero,
  DatosReportePersonalizado,
  DatosEstadisticasReportes,

  // Interfaces específicas de inventario
  ResumenInventario,
  ProductoStockBajo,
  AnalisisCategoriasInventario,
  RotacionInventario,
  ValoracionInventario,
  ProductoInventario,

  // Interfaces específicas de clientes
  ResumenClientes,
  NuevosClientesPorPeriodo,
  SegmentacionClientesData,
  TopClienteReporte,
  AnalisisRetencionClientes,
  DistribucionGeograficaClientes,
  AnalisisComportamientoClientes,
  ClienteConCredito,

  // Interfaces específicas financieras
  ResumenFinancieroReporte,
  IngresosPorPeriodo,
  CuentasPorCobrar,
  AnalisisCuponesFinanciero,
  FlujoCajaReporte,
  ProyeccionesFinancierasReporte,
  IndicadoresFinancieros,

  // Interfaces de reportes personalizados
  ConfiguracionReportePersonalizado,

  // Interfaces de estadísticas
  EstadisticasGeneralesReportes,
  TendenciasReportes,
  ReporteMasGenerado,
} from './reporte.interface';

// Exportar constantes y utilidades (no tipos)
export {
  REPORTE_CONSTANTS,
  CATEGORIAS_REPORTES,
  ICONOS_REPORTES,
  COLORES_REPORTES,
  ReporteUtils,
} from './reporte.interface';

// Carrito - Interfaces para gestión del carrito de compras
export * from './carrito.interface';

// Checkout - Interfaces para el proceso de checkout y compra
export type {
  MetodoPago as MetodoPagoCheckout,
  DatosPersonales,
  DireccionEnvio as DireccionEnvioCheckout,
  MetodoEnvio as MetodoEnvioCheckout,
  ItemCheckout,
  CuponDescuento as CuponDescuentoCheckout,
  ResumenCheckout,
  ConfiguracionCheckout,
  EstadoCheckout,
  ApiResponse as ApiResponseCheckout,
  SolicitudIniciarCheckout,
  RespuestaIniciarCheckout,
  SolicitudProcesarPedido,
  RespuestaProcesarPedido,
  PedidoCreado,
  PagoCreado,
  Cliente as ClienteCheckout,
  SolicitudFormTokenIzipay,
  RespuestaFormTokenIzipay,
  ConfiguracionIzipay,
} from './checkout.interface';

// Método Envío - Interfaces para gestión de métodos de envío (exportaciones específicas para evitar conflictos)
export type {
  MetodoEnvioCompleto,
  MetodoEnvioDetallado,
  MetodosEnvioRequest,
  MetodosEnvioResponse,
  MetodoEnvioDetalladoResponse,
  CalcularCostoEnvioRequest,
  CalcularCostoEnvioResponse,
  TiempoEstimado,
  ZonaCobertura,
  ZonasCoberturaResponse,
  ConfiguracionMetodoEnvio,
  CalcularTiempoRequest,
  CalcularTiempoResponse,
  ValidarDisponibilidadRequest,
  ValidarDisponibilidadResponse,
  CompararMetodosRequest,
  ComparacionMetodo,
  CompararMetodosResponse,
  TipoEntrega,
  EstadoDisponibilidad,
  ZonaEntrega,
  EventoMetodoEnvio,
  ConfiguracionServicioEnvio,
  EstadisticasMetodoEnvio,
  EstadisticasMetodosEnvioResponse,
  CacheCalculoEnvio,
  FiltrosMetodoEnvio,
  MetodoEnvioResponse,
  InformacionEmpresaEnvio,
  InformacionEmpresaEnvioResponse,
} from './metodo-envio.interface';

// Método Pago - Interfaces para gestión de métodos de pago (exportaciones específicas para evitar conflictos)
export type {
  MetodoPago,
  CreateMetodoPagoRequest,
  UpdateMetodoPagoRequest,
  MetodoPagoFilters,
  MetodoPagoForSelect,
  CalcularComisionRequest,
  CalcularComisionResponse,
  EstadisticasMetodoPago,
  ValidarMetodoPagoRequest,
  ValidarMetodoPagoResponse,
  ObtenerMetodosPagoRequest,
  ObtenerMetodosPagoResponse,
  TipoMetodoPago,
  ProveedorPago,
  MetodoPagoResponse,
  MetodoPagoListResponse,
  MetodoPagoForSelectResponse,
  EstadisticasMetodoPagoResponse,
} from './metodo-pago.interface';

// Exportar constantes (no tipos)
export { TIPOS_METODO_PAGO, PROVEEDORES_PAGO } from './metodo-pago.interface';

// Contacto - Interfaces para gestión de contacto y soporte (exportaciones específicas para evitar conflictos)
export type {
  EnviarMensajeRequest,
  EnviarMensajeResponse,
  TipoConsulta,
  InformacionEmpresa,
  HorarioAtencion,
  InformacionEmpresaResponse,
  TipoConsultaInfo,
  TiposConsultaResponse,
  FaqContacto,
  CategoriaFaqContacto,
  FaqContactoResponse,
  EstadoServicio,
  EstadoCanal,
  EstadoCanalEmail,
  EstadoCanalTienda,
  EstadoServicioResponse,
  ConfiguracionServicioContacto,
  EventoContacto,
  FiltrosFaqContacto,
  EstadisticasContacto,
  EstadisticasContactoResponse,
  ValidacionFormularioContacto,
  SugerenciaMensaje,
  PlantillaMensaje,
  SugerenciasMensajesResponse,
  HistorialMensaje,
  EstadoMensaje,
  HistorialMensajesResponse,
  ContactoEmergencia,
  ContactosEmergenciaResponse,
  CacheContacto,
  NotificacionContacto,
  NotificacionesContactoResponse,
  PreferenciasContacto,
  CanalContacto,
  PreferenciasContactoResponse,
  SolicitarCallbackRequest,
  SolicitarCallbackResponse,
  EvaluacionSatisfaccion,
  EvaluacionSatisfaccionResponse,
  SeguimientoTicket,
  HistorialEstado,
  SeguimientoTicketResponse,
  UbicacionOficina,
  UbicacionesResponse,
  ContactoResponse,
  DatosRemitente,
  ArchivoAdjunto,
  LimitesContacto,
  LimitesContactoResponse,
  DisponibilidadTiempoReal,
  DisponibilidadTiempoRealResponse,
  MetricasServicioContacto,
  MetricasServicioContactoResponse,
  UtilValidacionContacto,
} from './contacto.interface';

// Preguntas Frecuentes - Interfaces para gestión de FAQ (exportaciones específicas para evitar conflictos)
export type {
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
  PreguntaUtil,
  HistorialUtilidad,
  ConfiguracionServicioFaq,
  EventoFaq,
  AnalisisPregunta,
  MetricasFaq,
  ResumenMetricasFaq,
  MetricasFaqResponse,
  ValidacionSugerencia,
  RespuestaAutomatica,
  BusquedaInteligente,
  BusquedaInteligenteResponse,
  CacheFaq,
  NotificacionFaq,
  NotificacionesFaqResponse,
  ExportacionFaq,
  ExportacionFaqResponse,
  AdminFaq,
  MetadatosFaq,
  AccesibilidadFaq,
  VersionFaq,
  HistorialVersionesFaq,
  HistorialVersionesFaqResponse,
  FaqResponse,
  ConfiguracionEmpresaFaq,
  ConfiguracionEmpresaFaqResponse,
  FeedbackFaq,
  FeedbackFaqResponse,
  RecomendacionFaq,
  RecomendacionesFaqResponse,
  AnalyticsFaq,
  AnalyticsFaqResponse,
  UtilFaq,
} from './preguntas-frecuentes.interface';

// Newsletter - Interfaces para gestión de newsletter y suscripciones (exportaciones específicas para evitar conflictos)
export type {
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
  CampanaNewsletter,
  EstadisticasNewsletter,
  EstadisticasNewsletterResponse,
  ConfiguracionServicioNewsletter,
  EventoNewsletter,
  ValidacionSuscripcion,
  HistorialSuscripcion,
  HistorialSuscripcionResponse,
  SegmentoAudiencia,
  SegmentosAudienciaResponse,
  PersonalizacionContenido,
  PersonalizacionContenidoResponse,
  MetricasAvanzadasNewsletter,
  MetricasAvanzadasNewsletterResponse,
  PruebaABNewsletter,
  PruebasABNewsletterResponse,
  AutomatizacionNewsletter,
  AutomatizacionesNewsletterResponse,
  PlantillaNewsletter,
  PlantillasNewsletterResponse,
  ListaNewsletter,
  ListasNewsletterResponse,
  ConfiguracionPrivacidadNewsletter,
  ConfiguracionPrivacidadNewsletterResponse,
  AnalisisContenidoNewsletter,
  AnalisisContenidoNewsletterResponse,
  CacheNewsletter,
  NotificacionNewsletter,
  NotificacionesNewsletterResponse,
  ExportacionSuscriptores,
  ExportacionSuscriptoresResponse,
  ImportacionSuscriptores,
  ImportacionSuscriptoresResponse,
  WebhookNewsletter,
  WebhooksNewsletterResponse,
  NewsletterResponse,
  ConfiguracionEmpresaNewsletter,
  ConfiguracionEmpresaNewsletterResponse,
  LimitesNewsletter,
  LimitesNewsletterResponse,
  EstadoServicioNewsletter,
  EstadoServicioNewsletterResponse,
  UtilNewsletter,
} from './newsletter.interface';

// Búsqueda - Interfaces para gestión del sistema de búsqueda y filtros (exportaciones específicas para evitar conflictos)
export type {
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
  ProductoAutocompletado,
  CategoriaAutocompletado,
  TerminoPopular,
  CategoriaFiltro,
  MarcaFiltro,
  RangoPrecio,
  OpcionOrdenamiento,
  TerminoEstadistica,
  CategoriaEstadistica,
  EstadisticasBusqueda,
  ConfiguracionServicioBusqueda,
  EventoBusqueda,
  ElementoHistorial,
  HistorialBusquedas,
  FiltroAplicado,
  GrupoFiltros,
  EstadoBusqueda,
  MetricasBusqueda,
  MetricasBusquedaResponse,
  SugerenciaInteligente,
  SugerenciasInteligentesResponse,
  AnalisisConsulta,
  AnalisisConsultaResponse,
  BusquedaVozRequest,
  BusquedaVozResponse,
  BusquedaImagenRequest,
  BusquedaImagenResponse,
  PreferenciasBusqueda,
  PersonalizacionBusqueda,
  CacheBusqueda,
  NotificacionBusqueda,
  NotificacionesBusquedaResponse,
  ExportacionBusquedas,
  ExportacionBusquedasResponse,
  ConfiguracionEmpresaBusqueda,
  ConfiguracionEmpresaBusquedaResponse,
  PruebaABBusqueda,
  PruebasABBusquedaResponse,
  BusquedaGeoLocalizada,
  ResultadoGeoLocalizado,
  BusquedaGeoLocalizadaResponse,
  TendenciaBusqueda,
  TendenciasBusquedaResponse,
  ComparacionProductos,
  ProductoComparacion,
  ComparacionProductosResponse,
  BusquedaResponse,
  UtilBusqueda,
  FiltrosDisponiblesBusqueda,
} from './busqueda.interface';

// Cliente - Interfaces para gestión de clientes (exportaciones específicas para evitar conflictos)
export type {
  Cliente as ClienteInterface,
  ClienteSimple,
  Usuario as UsuarioCliente,
  DatosFacturacion as DatosFacturacionCliente,
  ClientePreferencias,
  ClienteMetadata,
  ClienteResumen,
  CreateClienteRequest,
  UpdateClienteRequest,
  ClienteFilters,
  ClienteListResponse,
  ClienteCollectionResponse,
  ClienteResponse,
  ClienteStatistics,
  ClienteStatisticsResponse,
  CambiarEstadoRequest,
  EstadoCliente,
  GeneroCliente,
  TipoDocumento as TipoDocumentoCliente,
  SortDirection as SortDirectionCliente,
  ClienteSortField,
} from './cliente.interface';

// Exportar constantes (no tipos)
export { CLIENTE_SORT_FIELDS } from './cliente.interface';

// Datos Facturación - Interfaces para gestión de datos de facturación (exportaciones específicas para evitar conflictos)
export type {
  DatosFacturacion as DatosFacturacionInterface,
  ClienteBasico as ClienteBasicoFacturacion,
  TipoDocumentoInfo,
  DatosFacturacionComprobante,
  DatosFacturacionResumen,
  CreateDatosFacturacionRequest,
  UpdateDatosFacturacionRequest,
  DatosFacturacionFilters,
  DatosFacturacionByClienteFilters,
  DatosFacturacionListResponse,
  DatosFacturacionCollectionResponse,
  DatosFacturacionResponse,
  DatosFacturacionByClienteResponse,
  DatosFacturacionStatistics,
  DatosFacturacionStatisticsResponse,
  ValidarDocumentoRequest,
  ValidarDocumentoResponse,
  TipoDocumento as TipoDocumentoFacturacion,
  SortDirection as SortDirectionFacturacion,
  DatosFacturacionSortField,
} from './datos-facturacion.interface';

// Exportar constantes y utilidades (no tipos)
export {
  DATOS_FACTURACION_SORT_FIELDS,
  TIPOS_DOCUMENTO_OPCIONES,
  VALIDACIONES_DOCUMENTO,
  CAMPOS_REQUERIDOS_POR_TIPO,
  esTipoEmpresa,
  validarDocumento,
  limpiarDocumento,
  formatearDocumento,
} from './datos-facturacion.interface';

// FASE 6 - Sistema de Gestión Avanzada - Interfaces para funcionalidades avanzadas del sistema

// Adicionales y Grupos - Interfaces para gestión de adicionales y grupos de adicionales
export type {
  Adicional,
  InformacionNutricional,
  EstadisticasAdicional,
  ProductoAdicional,
  GrupoAdicional,
  CreateAdicionalDto,
  UpdateAdicionalDto,
  FiltrosAdicional,
  AdicionalResponse,
  AdicionalesResponse,
  TipoAdicional,
  TipoAdicionalOption,
} from './adicional.interface';

// Exportar constantes (no tipos)
export { TIPOS_ADICIONAL, ALERGENOS_COMUNES } from './adicional.interface';

export type {
  AdicionalGrupo,
  AdicionalDetalle,
  GrupoAdicionalDetalle,
  CreateAdicionalGrupoDto,
  UpdateAdicionalGrupoDto,
  FiltrosAdicionalGrupo,
  AdicionalGrupoResponse,
  AdicionalesGrupoResponse,
  EstadisticasAdicionalGrupo,
  ConfiguracionOrdenAdicionalGrupo,
  AdicionalPorGrupo,
  GrupoPorAdicional,
  OpcionOrdenAdicionalGrupo,
  DireccionOrdenAdicionalGrupo,
} from './adicional-grupo.interface';

// Exportar constantes (no tipos)
export {
  OPCIONES_ORDEN_ADICIONAL_GRUPO,
  DIRECCIONES_ORDEN_ADICIONAL_GRUPO,
} from './adicional-grupo.interface';

export type {
  GrupoAdicional as GrupoAdicionalInterface,
  AdicionalGrupo as AdicionalGrupoInterface,
  ProductoGrupo,
  ReglasSeleccion,
  EstadisticasGrupo,
  CreateGrupoAdicionalDto,
  UpdateGrupoAdicionalDto,
  FiltrosGrupoAdicional,
  GrupoAdicionalResponse,
  GruposAdicionalesResponse,
  EstadisticasGrupoAdicional,
  ConfiguracionOrdenGrupo,
  TipoSeleccion,
  OpcionOrdenGrupo,
  DireccionOrdenGrupo,
} from './grupo-adicional.interface';

// Exportar constantes (no tipos)
export {
  OPCIONES_ORDEN_GRUPO,
  DIRECCIONES_ORDEN_GRUPO,
} from './grupo-adicional.interface';

// Producto Adicional - Interfaces para relaciones producto-adicional
export type {
  ProductoAdicional as ProductoAdicionalInterface,
  ProductoBasico as ProductoBasicoAdicional,
  AdicionalBasico,
  CreateProductoAdicionalDto,
  UpdateProductoAdicionalDto,
  FiltrosProductoAdicional,
  ProductoAdicionalResponse,
  ProductoAdicionalesResponse,
  EstadisticasProductoAdicional,
  ConfiguracionOrden,
  OpcionOrden,
  DireccionOrden,
} from './producto-adicional.interface';

// Exportar constantes (no tipos)
export {
  OPCIONES_ORDEN as OPCIONES_ORDEN_PRODUCTO_ADICIONAL,
  DIRECCIONES_ORDEN as DIRECCIONES_ORDEN_PRODUCTO_ADICIONAL,
} from './producto-adicional.interface';

export type {
  ProductoGrupoAdicional,
  ProductoDetalle,
  GrupoAdicionalDetalle as GrupoAdicionalDetalleProducto,
  AdicionalDetalle as AdicionalDetalleProducto,
  CreateProductoGrupoAdicionalDto,
  UpdateProductoGrupoAdicionalDto,
  FiltrosProductoGrupoAdicional,
  ProductoGrupoAdicionalResponse,
  ProductosGrupoAdicionalResponse,
  EstadisticasProductoGrupoAdicional,
  ConfiguracionOrdenProductoGrupo,
  GrupoPorProducto,
  ProductoPorGrupo,
  ConfiguracionProductoGrupo,
  OpcionOrdenProductoGrupo,
  DireccionOrdenProductoGrupo,
  EstadoRelacion,
} from './producto-grupo-adicional.interface';

// Exportar constantes (no tipos)
export {
  OPCIONES_ORDEN_PRODUCTO_GRUPO,
  DIRECCIONES_ORDEN_PRODUCTO_GRUPO,
  ESTADOS_RELACION,
} from './producto-grupo-adicional.interface';

export type {
  DetalleAdicional,
  DetallePedidoInfo,
  AdicionalInfo,
  DiferenciaPrecio,
  CreateDetalleAdicionalDto,
  UpdateDetalleAdicionalDto,
  FiltrosDetalleAdicional,
  DetalleAdicionalResponse,
  DetallesAdicionalesResponse,
  EstadisticasDetalleAdicional,
  AdicionalesPorDetallePedido,
  DetallesPorAdicional,
  ResumenPedidoAdicionales,
  OpcionOrdenDetalleAdicional,
  DireccionOrdenDetalleAdicional as DireccionOrdenDetalleAdicionalInterface,
  TipoAdicional as TipoAdicionalDetalle,
} from './detalle-adicional.interface';

// Exportar constantes (no tipos)
export {
  OPCIONES_ORDEN_DETALLE_ADICIONAL,
  DIRECCIONES_ORDEN_DETALLE_ADICIONAL,
  TIPOS_ADICIONAL as TIPOS_ADICIONAL_DETALLE,
} from './detalle-adicional.interface';

// Carrito Temporal - Interfaces para gestión del carrito temporal
export type {
  CarritoTemporal,
  UsuarioCarrito,
  ProductoCarrito,
  VariacionCarrito,
  AdicionalSeleccionado,
  AdicionalDetalle as AdicionalDetalleCarrito,
  ValidacionesCarrito,
  CreateCarritoTemporalDto,
  UpdateCarritoTemporalDto,
  LimpiarCarritoDto,
  FiltrosCarritoTemporal,
  CarritoTemporalResponse,
  CarritosTemporalResponse,
  LimpiarCarritoResponse,
  EstadisticasCarrito,
  ProductoEstadistica,
  EstadoCarrito,
} from './carrito-temporal.interface';

// Exportar constantes (no tipos)
export { ESTADOS_CARRITO } from './carrito-temporal.interface';

// Ubicación Geográfica - Interfaces para gestión de ubicaciones
export type {
  Departamento,
  Provincia,
  Distrito,
  EstadisticasDepartamento,
  CreateDepartamentoRequest,
  UpdateDepartamentoRequest,
  DepartamentoFilters,
  DepartamentoPorPaisRequest,
  DepartamentoPorPaisResponse,
  EstadisticasDepartamentoGeneral,
  PaisDepartamento,
  DepartamentoResponse,
  DepartamentoListResponse,
  DepartamentoSimpleListResponse,
  EstadisticasDepartamentoResponse,
  DepartamentoErrorResponse,
  DepartamentoFormData,
  DepartamentoSortOption,
  PaisDisponible,
  SortDirection as SortDirectionDepartamento,
} from './departamento.interface';

// Exportar constantes (no tipos)
export {
  DEPARTAMENTO_SORT_OPTIONS,
  PAISES_DISPONIBLES,
} from './departamento.interface';

export type {
  Provincia as ProvinciaInterface,
  DepartamentoBasico,
  DistritoBasico,
  EstadisticasProvincia,
  CreateProvinciaRequest,
  UpdateProvinciaRequest,
  ProvinciaFilters,
  ProvinciaPorDepartamentoRequest,
  ProvinciaPorDepartamentoResponse,
  EstadisticasProvinciaGeneral,
  DepartamentoProvincia,
  EstadisticasProvinciaRequest,
  ProvinciaResponse,
  ProvinciaListResponse,
  ProvinciaSimpleListResponse,
  EstadisticasProvinciaResponse,
  ProvinciaErrorResponse,
  ProvinciaFormData,
  ProvinciaSortOption,
  SortDirection as SortDirectionProvincia,
} from './provincia.interface';

// Exportar constantes (no tipos)
export { PROVINCIA_SORT_OPTIONS } from './provincia.interface';

export type {
  Distrito as DistritoInterface,
  Coordenadas,
  ProvinciaBasica,
  DepartamentoBasico as DepartamentoBasicoDistrito,
  ZonaRepartoBasica,
  EstadisticasDistrito,
  CreateDistritoRequest,
  UpdateDistritoRequest,
  DistritoFilters,
  DistritoPorProvinciaRequest,
  DistritoPorProvinciaResponse,
  DistritosDisponiblesDeliveryResponse,
  ProvinciasConDistritos,
  BuscarPorCoordenadasRequest,
  BuscarPorCoordenadasResponse,
  EstadisticasDistritoGeneral,
  ProvinciaDistrito,
  EstadisticasDistritoRequest,
  DistritoResponse,
  DistritoListResponse,
  DistritoSimpleListResponse,
  EstadisticasDistritoResponse,
  DistritoErrorResponse,
  DistritoFormData,
  DistritoSortOption,
  SortDirection as SortDirectionDistrito,
} from './distrito.interface';

// Exportar constantes (no tipos)
export { DISTRITO_SORT_OPTIONS } from './distrito.interface';

// Zonas de Reparto - Interfaces para gestión de zonas de reparto y cobertura
export type {
  ZonaReparto,
  CoordenadasCentro,
  DistritoZona,
  EstadisticasZona,
  ZonaRepartoEstadisticas,
  CreateZonaRepartoRequest,
  UpdateZonaRepartoRequest,
  ZonaRepartoFilters,
  CalcularCostoEnvioRequest as CalcularCostoEnvioZonaRequest,
  CalcularCostoEnvioResponse as CalcularCostoEnvioZonaResponse,
  VerificarDisponibilidadRequest,
  VerificarDisponibilidadResponse,
  ZonaRepartoResponse,
  ZonaRepartoListResponse,
  ZonaRepartoEstadisticasResponse,
} from './zona-reparto.interface';

export type {
  ZonaDistrito,
  ZonaRepartoInfo,
  DistritoInfo,
  ProvinciaInfo,
  DepartamentoInfo,
  TiempoEntregaCalculado,
  CreateZonaDistritoDto,
  UpdateZonaDistritoDto,
  FiltrosZonaDistrito,
  ZonaDistritoResponse,
  ZonasDistritosResponse,
  EstadisticasZonaDistrito,
  AsignacionesPorZona,
  AsignacionesPorDistrito,
  ResumenCobertura,
  PrioridadZonaDistrito,
  OpcionOrdenZonaDistrito,
  DireccionOrdenZonaDistrito,
} from './zona-distrito.interface';

// Exportar constantes (no tipos)
export {
  PRIORIDADES_ZONA_DISTRITO,
  OPCIONES_ORDEN_ZONA_DISTRITO,
  DIRECCIONES_ORDEN_ZONA_DISTRITO,
} from './zona-distrito.interface';

export type {
  CostoEnvioDinamico,
  ZonaRepartoCosto,
  ValidacionesCosto,
  CreateCostoEnvioDinamicoDto,
  UpdateCostoEnvioDinamicoDto,
  FiltrosCostoEnvioDinamico,
  CostoEnvioDinamicoResponse,
  CostosEnvioDinamicoResponse,
  EstadisticasCostoEnvioDinamico,
  CostosPorZona,
  AnalisisCobertura,
  CalculoCosto,
  OptimizacionRangos,
  OpcionOrdenCosto,
  DireccionOrdenCosto,
} from './costo-envio-dinamico.interface';

// Exportar constantes (no tipos)
export {
  OPCIONES_ORDEN_COSTO,
  DIRECCIONES_ORDEN_COSTO,
} from './costo-envio-dinamico.interface';

export type {
  HorarioZona,
  ZonaRepartoHorario,
  EstadoActualHorario,
  CreateHorarioZonaDto,
  UpdateHorarioZonaDto,
  FiltrosHorarioZona,
  HorarioZonaResponse,
  HorariosZonaResponse,
  EstadisticasHorarioZona,
  HorariosPorZona,
  HorariosPorDia,
  ResumenCoberturaSemanal,
  AnalisisDisponibilidad,
  DiaSemana,
  OpcionOrdenHorario,
  DireccionOrdenHorario,
  FranjaHoraria,
} from './horario-zona.interface';

// Exportar constantes (no tipos)
export {
  DIAS_SEMANA,
  OPCIONES_ORDEN_HORARIO,
  DIRECCIONES_ORDEN_HORARIO,
  FRANJAS_HORARIAS,
} from './horario-zona.interface';

export type {
  ExcepcionZona,
  ZonaRepartoExcepcion,
  EstadoExcepcion,
  CreateExcepcionZonaDto,
  UpdateExcepcionZonaDto,
  FiltrosExcepcionZona,
  ExcepcionZonaResponse,
  ExcepcionesZonaResponse,
  EstadisticasExcepcionZona,
  ExcepcionesPorTipo,
  ExcepcionesPorZona,
  TendenciaMensual,
  TipoExcepcion,
  CampoOrdenamientoExcepcion,
  DireccionOrdenamiento as DireccionOrdenamientoExcepcion,
} from './excepcion-zona.interface';

// Exportar constantes (no tipos)
export {
  TIPOS_EXCEPCION,
  OPCIONES_ORDEN_EXCEPCION,
  DIRECCIONES_ORDEN,
} from './excepcion-zona.interface';

// Direcciones Validadas - Interfaces para validación de direcciones
export type {
  DireccionValidada,
  Coordenadas as CoordenadasDireccion,
  EstadoValidacion,
  DireccionDetalle,
  ZonaRepartoDetalle,
  DireccionValidadaResponse,
  DireccionValidadaListResponse,
  DireccionValidadaPaginationLinks,
  DireccionValidadaPaginationMeta,
  DireccionValidadaPaginationLink,
  CreateDireccionValidadaRequest,
  UpdateDireccionValidadaRequest,
  ValidarDireccionRequest,
  ValidarDireccionResponse,
  MetricasValidacion,
  RevalidarDireccionesRequest,
  RevalidarDireccionesResponse,
  ErrorRevalidacion,
  DireccionValidadaFilters,
  EstadisticasDireccionValidada,
  EstadisticasGenerales,
  EstadisticasPorZona,
  EstadoCobertura,
  TipoValidacion,
} from './direccion-validada.interface';

// Inventario y Movimientos - Interfaces para gestión de inventario
export type {
  InventarioMovimiento,
  TipoMovimiento,
  ProductoMovimiento,
  VariacionMovimiento,
  UsuarioMovimiento,
  DetalleMovimiento,
  AuditoriaStock,
  CreateInventarioMovimientoDto,
  UpdateInventarioMovimientoDto,
  FiltrosInventarioMovimiento,
  PaginacionInventarioMovimiento,
  InventarioMovimientosResponse,
  InventarioMovimientoResponse,
  CreateInventarioMovimientoResponse,
  FiltrosReporteInventario,
  ResumenMovimientos,
  ResumenTipoMovimiento,
  ReporteInventarioResponse as ReporteInventarioMovimientoResponse,
  FiltrosEstadisticasInventario,
  EstadisticasPorTipo,
  CantidadesPorTipo,
  ProductoMasMovido,
  UsuarioMasActivo as UsuarioMasActivoInventario,
  EstadisticasInventarioResponse,
  ErroresValidacionInventario,
  ErrorInventarioResponse,
} from './inventario-movimiento.interface';

// Exportar constantes (no tipos)
export { TIPOS_MOVIMIENTO } from './inventario-movimiento.interface';

// Entregas y Programación - Interfaces para gestión de entregas
export type {
  ProgramacionEntrega,
  TiempoTranscurrido,
  EstadoProgramacionInfo,
  PedidoProgramacion,
  RepartidorProgramacion,
  TiemposEntrega,
  InfoRuta,
  ResumenRuta,
  RutaRepartidorResponse,
  CreateProgramacionEntregaDto,
  UpdateProgramacionEntregaDto,
  CambiarEstadoDto,
  ReprogramarEntregaDto,
  RutaRepartidorDto,
  FiltrosProgramacionEntrega,
  PaginacionProgramacionEntrega,
  ProgramacionEntregaResponse,
  EstadoProgramacion,
  TipoPuntualidad,
  EstadoRuta,
} from './programacion-entrega.interface';

// Exportar constantes (no tipos)
export { ESTADOS_PROGRAMACION } from './programacion-entrega.interface';

export type {
  SeguimientoPedido,
  PedidoSeguimiento,
  UsuarioCambio,
  CoordenadasSeguimiento,
  TiempoTranscurrido as TiempoTranscurridoSeguimiento,
  EstadoSeguimiento,
  EstadoPedido,
  CreateSeguimientoPedidoDto,
  UpdateSeguimientoPedidoDto,
  FiltrosSeguimientoPedido,
  SeguimientoPedidoResponse,
  SeguimientosPedidoResponse,
  EstadisticasSeguimiento,
} from './seguimiento-pedido.interface';

// Exportar constantes (no tipos)
export { ESTADOS_PEDIDO } from './seguimiento-pedido.interface';

// Promociones y Marketing - Interfaces para gestión de promociones
export type {
  Promocion,
  TipoPromocion,
  EstadoPromocion,
  AlcancePromocion,
  ValidacionesPromocion,
  CreatePromocionDto,
  UpdatePromocionDto,
  AplicarPromocionDto,
  FiltrosPromocion,
  PaginacionPromocion,
  PromocionesResponse,
  PromocionResponse,
  CreatePromocionResponse,
  UpdatePromocionResponse,
  DeletePromocionResponse,
  ToggleActivoResponse,
  AplicarPromocionResponse,
  ErroresValidacionPromocion,
  ErrorPromocionResponse,
  EstadisticasPromociones,
} from './promocion.interface';

// Exportar constantes (no tipos)
export { TIPOS_PROMOCION } from './promocion.interface';

// SEO y Optimización - Interfaces para gestión de SEO
export type {
  SeoProducto,
  ValidacionesSeo,
  ProductoSeo,
  OpenGraphData,
  SchemaOrgData,
  SchemaOffer,
  SchemaBrand,
  SchemaOrganization,
  AnalisisSeo,
  RecomendacionPrioritaria,
  ComparacionCompetencia,
  CreateSeoProductoDto,
  UpdateSeoProductoDto,
  GenerarSeoAutomaticoDto,
  OptimizarMasivoDto,
  FiltrosSeoProducto,
  PaginacionSeoProducto,
  SeoProductoResponse,
  OptimizacionMasivaResponse,
  AnalisisSeoResponse,
  PrioridadRecomendacion,
  TipoValidacionSeo,
  EstadoOptimizacion,
} from './seo-producto.interface';

// Métricas y Análisis - Interfaces para métricas de negocio
export type {
  MetricaNegocio,
  MetricasPorcentuales,
  KpisMetrica,
  ComparacionesMetrica,
  TopsMetrica,
  ResumenPeriodo,
  PeriodoResumen,
  TotalesResumen,
  PromediosResumen,
  KpisResumen,
  CreateMetricaNegocioDto,
  UpdateMetricaNegocioDto,
  GenerarMetricasDto,
  FiltrosMetricaNegocio,
  PaginacionMetricaNegocio,
  MetricasNegocioResponse,
  ResumenPeriodoResponse,
  EficienciaEntrega,
  TipoComparacion,
  TipoKpi,
} from './metrica-negocio.interface';

// Cuenta Usuario - Interfaces para gestión de cuenta de usuario cliente
export type {
  ClienteInfo,
  EstadisticasUsuario,
  PreferenciasUsuario,
  MetodoPagoPreferido,
  CategoriaFavorita,
  DashboardUsuario,
  MetricasHistorial,
  CategoriaPreferida,
  CuotaPendiente,
  HistorialCredito,
  InformacionCredito,
  EstadisticasFavoritos,
  FiltrosPedidosUsuario,
  FiltrosFavoritosUsuario,
  FiltrosHistorial,
  FiltrosNotificaciones,
  DashboardResponse,
  PedidosUsuarioResponse,
  FavoritosUsuarioResponse,
  HistorialResponse,
  DireccionesUsuarioResponse,
  NotificacionesUsuarioResponse,
  CreditoResponse,
  SimpleResponse,
  ResumenActividad,
  ComparacionPeriodos,
  MetricasPeriodo,
  TendenciasUsuario,
  FrecuenciaCompra,
  CategoriaConPorcentaje,
  MetodoPagoConPorcentaje,
  HorarioCompra,
  ConfiguracionPrivacidad,
  PreferenciasNotificaciones,
  ActualizarPreferenciasDto,
  MarcarNotificacionDto,
  DashboardMovil,
  UsuarioBasico,
  AccesoRapido,
  EstadoCliente as EstadoClienteCuentaUsuario,
  EstadoPedido as EstadoPedidoCuentaUsuario,
  TipoNotificacion as TipoNotificacionCuentaUsuario,
  OrdenamientoPedidos,
  OrdenamientoFavoritos,
} from './cuenta-usuario.interface';
