export interface MetodoPago {
  id: number;
  nombre: string;
  tipo:
    | 'tarjeta_credito'
    | 'tarjeta_debito'
    | 'yape'
    | 'plin'
    | 'transferencia_bancaria'
    | 'contra_entrega'
    | 'paypal';
  descripcion: string;
  logo_url: string;
  activo: boolean;
  monto_minimo?: number;
  monto_maximo?: number;
  comision_porcentaje?: number;
  comision_fija?: number;
  comision_calculada?: number;
  monto_total_con_comision?: number;
  tiempo_procesamiento: string;
  tiempo_procesamiento_texto: string;
  permite_cuotas: boolean;
  cuotas_maximas?: number;
  pais_disponible: string[];
  moneda_soportada: string;
  instrucciones?: string;
  es_tarjeta: boolean;
  es_billetera_digital: boolean;
  es_transferencia: boolean;
  es_efectivo: boolean;
  requiere_verificacion?: boolean;
}

export interface DatosPersonales {
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  documento_tipo: 'DNI' | 'CE' | 'Pasaporte';
  documento_numero: string;
  crear_cuenta?: boolean;
  password?: string;
  password_confirmation?: string;
}

export interface DireccionEnvio {
  direccion_id?: number;
  nombre_contacto: string;
  telefono_contacto: string;
  direccion: string;
  referencia?: string;
  distrito: string;
  provincia: string;
  departamento: string;
  codigo_postal?: string;
}

export interface MetodoEnvio {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  tiempo_entrega: string;
  activo: boolean;
}

export interface ItemCheckout {
  producto_id: number;
  producto?: {
    id: number;
    nombre: string;
    imagen_principal?: string;
    peso?: number;
  };
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  variacion_id?: number;
  variacion?: {
    id: number;
    nombre: string;
    color?: string;
    talla?: string;
  };
}

export interface CuponDescuento {
  id: number;
  codigo: string;
  tipo: 'porcentaje' | 'monto_fijo';
  valor: number;
  descripcion: string;
  monto_minimo?: number;
  descuento_maximo?: number;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
  limite_uso?: number;
  veces_usado: number;
}

export interface ResumenCheckout {
  items: ItemCheckout[];
  items_count: number;
  peso_total: number;
  subtotal: number;
  descuento: number;
  costo_envio: number;
  igv: number;
  total: number;
  cupon_aplicado?: CuponDescuento;
  metodo_envio?: string;
  distrito?: string;
}

export interface ConfiguracionCheckout {
  permitir_invitados: boolean;
  validar_stock_tiempo_real: boolean;
  tiempo_sesion_checkout: number;
  metodos_pago_disponibles: string[];
  envio_gratis_monto_minimo: number;
  calcular_igv: boolean;
  porcentaje_igv: number;
  moneda_defecto: string;
  pais_defecto: string;
  tipos_documento: Record<string, string>;
  metodos_envio: Record<
    string,
    {
      nombre: string;
      tiempo: string;
      descripcion: string;
    }
  >;
  validaciones: {
    telefono_requerido: boolean;
    direccion_referencia_requerida: boolean;
    validar_codigo_postal: boolean;
    verificar_identidad: boolean;
  };
  limites: {
    items_maximo_carrito: number;
    cantidad_maxima_item: number;
    monto_maximo_pedido: number;
    peso_maximo_envio: number;
  };
}

export interface SolicitudIniciarCheckout {
  items: {
    producto_id: number;
    cantidad: number;
    variacion_id?: number;
  }[];
  pais?: string;
  moneda?: string;
}

export interface RespuestaIniciarCheckout {
  items: ItemCheckout[];
  subtotal: number;
  igv: number;
  total: number;
  metodos_pago_disponibles: MetodoPago[];
  checkout_token: string;
}

export interface SolicitudProcesarPedido {
  datos_personales: DatosPersonales;
  direccion_envio: DireccionEnvio;
  metodo_envio: MetodoEnvio;
  metodo_pago_id: number;
  items: ItemCheckout[];
  subtotal: number;
  descuento?: number;
  costo_envio: number;
  igv: number;
  total: number;
  cupon_codigo?: string;
  pais?: string;
  moneda?: string;
}

export interface PedidoCreado {
  id: number;
  numero_pedido: string;
  user_id?: number;
  total: number;
  subtotal: number;
  descuento: number;
  costo_envio: number;
  igv: number;
  estado:
    | 'pendiente'
    | 'aprobado'
    | 'rechazado'
    | 'entregado'
    | 'cancelado'
    | 'enviado'
    | 'devuelto'
    | 'en_proceso';
  metodo_pago_id: number;
  tipo_pago: string;
  tipo_entrega: string;
  datos_envio: DireccionEnvio;
  metodo_envio: MetodoEnvio;
  datos_cliente: DatosPersonales;
  cupon_codigo?: string;
  observaciones?: string;
  moneda: string;
  canal_venta: string;
  created_at: string;
  updated_at: string;
  metodoPago?: MetodoPago;
}

export interface PagoCreado {
  id: number;
  pedido_id: number;
  metodo_pago_id: number;
  monto: number;
  comision: number;
  fecha_pago: string;
  estado:
    | 'pendiente'
    | 'pagado'
    | 'atrasado'
    | 'fallido'
    | 'cancelado'
    | 'reembolsado';
  metodo: string;
  referencia: string;
  moneda: string;
  observaciones?: string;
  metodoPago?: MetodoPago;
}

export interface Cliente {
  id: number;
  user_id?: number;
  dni: string;
  telefono: string;
  direccion: string;
  nombre_completo: string;
  apellidos: string;
  estado: 'activo' | 'inactivo';
  verificado: boolean;
  limite_credito: number;
  metadata?: Record<string, any>;
}

export interface RespuestaProcesarPedido {
  pedido: PedidoCreado;
  pago: PagoCreado;
  cliente?: Cliente;
  metodo_pago: MetodoPago;
  comision_aplicada: number;
  instrucciones_pago?: string;
}

// Interfaces para Izipay
export interface SolicitudFormTokenIzipay {
  pedido_id: number;
  datos_personales: DatosPersonales;
  direccion_envio: DireccionEnvio;
}

export interface RespuestaFormTokenIzipay {
  formToken: string;
  publicKey: string;
  pedido: PedidoCreado;
  endpoint_izipay: string;
}

export interface SolicitudValidarPagoIzipay {
  'kr-answer': string;
  'kr-hash': string;
  pedido_id?: number;
}

export interface SolicitudSimularPagoIzipay {
  pedido_id: number;
}

export interface RespuestaSimularPagoIzipay {
  order_status: string;
  transaction_uuid: string;
  order_id: string;
  amount: string;
  pedido: PedidoCreado;
  message: string;
}

export interface RespuestaValidarPagoIzipay {
  order_status: string;
  transaction_uuid: string;
  order_id: string;
  amount: number;
  pedido?: PedidoCreado;
  message?: string;
}

export interface ConfiguracionIzipay {
  username_configurado: boolean;
  password_configurado: boolean;
  public_key_configurado: boolean;
  sha256_key_configurado: boolean;
  api_url: string;
  configuracion_completa: boolean;
}

export interface TestConfiguracionIzipay {
  IZIPAY_USERNAME: string;
  IZIPAY_PASSWORD: string;
  IZIPAY_PUBLIC_KEY: string;
  IZIPAY_SHA256_KEY: string;
  IZIPAY_API_URL: string;
  configuracion_completa: boolean;
}

// Interfaces para solicitudes específicas
export interface SolicitudCalcularEnvio {
  distrito: string;
  peso_total: number;
  subtotal?: number;
}

export interface SolicitudAplicarCupon {
  codigo_cupon: string;
  subtotal: number;
}

export interface RespuestaAplicarCupon {
  cupon: CuponDescuento;
  descuento: number;
  nuevo_subtotal: number;
}

export interface SolicitudValidarMetodoPago {
  metodo_pago_id: number;
  monto: number;
  pais?: string;
  moneda?: string;
}

export interface RespuestaValidarMetodoPago {
  metodo_pago: MetodoPago;
  monto_original: number;
  comision: number;
  monto_total_con_comision: number;
  tiempo_procesamiento: string;
  requiere_verificacion: boolean;
  permite_cuotas: boolean;
  cuotas_maximas?: number;
  instrucciones?: string;
}

export interface FiltrosMetodosPago {
  monto?: number;
  pais?: string;
  moneda?: string;
}

export interface RespuestaMetodosPago {
  metodos_pago: MetodoPago[];
  total_disponibles: number;
  filtros_aplicados: FiltrosMetodosPago;
}

// Respuestas genéricas de la API
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

// Estados del checkout
export interface EstadoCheckout {
  paso_actual: 1 | 2 | 3 | 4;
  datos_personales?: DatosPersonales;
  direccion_envio?: DireccionEnvio;
  metodo_envio?: MetodoEnvio;
  metodo_pago?: MetodoPago;
  items: ItemCheckout[];
  resumen?: ResumenCheckout;
  checkout_token?: string;
  en_proceso: boolean;
  errores?: Record<string, string>;
}
