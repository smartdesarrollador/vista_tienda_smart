import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  FiltrosAvanzadosComponent,
  FiltrosAplicados,
} from './components/filtros-avanzados/filtros-avanzados.component';
import { environment } from '../../../../environments/environment';
import {
  ProductoCardComponent,
  ProductoCardEventos,
  ProductoCardConfig,
  VistaProductoCard,
} from '../../../shared/components/producto-card/producto-card.component';
import {
  Producto,
  ProductosResponse,
} from '../../../core/models/producto.interface';
import { ProductoService } from '../../../core/services/producto.service';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { PageChangeEvent, PageSizeChangeEvent } from '../../../core/models';

/**
 * Componente principal del catálogo de productos
 * Maneja la visualización de productos, filtros y paginación
 */
@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FiltrosAvanzadosComponent,
    ProductoCardComponent,
    PaginationComponent,
  ],
  templateUrl: './catalogo.component.html',
  styleUrl: './catalogo.component.css',
})
export class CatalogoComponent implements OnInit {
  // Servicios inyectados
  private readonly productoService = inject(ProductoService);

  // Exponer Math para uso en template
  readonly Math = Math;

  // Exponer URL base de imágenes para uso en template
  readonly baseUrlImagenes = environment.baseUrlImagenes;

  // Configuración para ProductoCard
  readonly configProductoCard: ProductoCardConfig = {
    mostrarMarca: true,
    mostrarCategoria: true,
    mostrarDescripcion: true,
    mostrarRating: true,
    mostrarStock: true,
    mostrarBotonCarrito: true,
    mostrarAccionesRapidas: true,
    mostrarFavoritos: true,
    mostrarVistaRapida: true,
    stockBajo: 5,
    urlPorDefecto: 'productos/default.jpg',
    textoDestacado: 'Destacado',
  };

  // Signals para el estado del componente
  readonly productos = signal<Producto[]>([]);
  readonly loading = signal<boolean>(false);
  readonly filtrosActivos = signal<FiltrosAplicados>({
    categorias: [],
    atributos: {},
  });

  // Paginación
  readonly paginaActual = signal<number>(1);
  readonly totalPaginas = signal<number>(1);
  readonly totalProductos = signal<number>(0);
  readonly productosPorPagina = signal<number>(12);

  // Vista y ordenamiento
  readonly vistaActual = signal<'grid' | 'lista'>('grid');
  readonly ordenamientoActual = signal<string>('relevancia');
  readonly mostrandoFiltros = signal<boolean>(true);

  // Búsqueda
  readonly terminoBusqueda = signal<string>('');
  readonly buscandoProductos = signal<boolean>(false);

  // Datos de ejemplo para desarrollo
  readonly productosEjemplo = signal<Producto[]>([
    {
      id: 1,
      nombre: 'iPhone 15 Pro Max',
      slug: 'iphone-15-pro-max',
      descripcion: 'El iPhone más avanzado con chip A17 Pro y cámara de 48MP.',
      precio: 4999,
      precio_oferta: 4699,
      stock: 25,
      sku: 'IPH15PM001',
      codigo_barras: '194253000001',
      imagen_principal: 'assets/productos/default.jpg',
      destacado: true,
      activo: true,
      categoria_id: 6,
      marca: 'Apple',
      modelo: 'iPhone 15 Pro Max',
      garantia: '1 año',
      peso: 0.221,
      dimensiones: '159.9 x 76.7 x 8.25 mm',
      caracteristicas: [
        'Chip A17 Pro',
        'Pantalla Super Retina XDR de 6.7"',
        'Cámara principal de 48MP',
        'Batería de hasta 29 horas de video',
        'Resistencia al agua IP68',
      ],
      meta_title: 'iPhone 15 Pro Max - Apple',
      meta_description: 'iPhone 15 Pro Max con chip A17 Pro',
      idioma: 'es',
      moneda: 'PEN',
      atributos_extra: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      rating_promedio: 4.6,
      total_comentarios: 7,
      categoria: {
        id: 6,
        nombre: 'Smartphones',
        slug: 'smartphones',
        descripcion: 'Teléfonos inteligentes',
        imagen: null,
        activo: true,
        orden: 1,
        categoria_padre_id: null,
        meta_title: null,
        meta_description: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    },
    {
      id: 2,
      nombre: 'iPhone 14',
      slug: 'iphone-14',
      descripcion: 'iPhone 14 con chip A15 Bionic y cámara mejorada.',
      precio: 3299,
      precio_oferta: 2999,
      stock: 40,
      sku: 'IPH14001',
      codigo_barras: '194253000002',
      imagen_principal: 'assets/productos/default.jpg',
      destacado: true,
      activo: true,
      categoria_id: 6,
      marca: 'Apple',
      modelo: 'iPhone 14',
      garantia: '1 año',
      peso: 0.172,
      dimensiones: '146.7 x 71.5 x 7.80 mm',
      caracteristicas: [
        'Chip A15 Bionic',
        'Pantalla Super Retina XDR de 6.1"',
        'Cámara principal de 12MP',
        'Batería de hasta 20 horas de video',
        'Resistencia al agua IP68',
      ],
      meta_title: 'iPhone 14 - Apple',
      meta_description: 'iPhone 14 con chip A15 Bionic',
      idioma: 'es',
      moneda: 'PEN',
      atributos_extra: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      rating_promedio: 3.3,
      total_comentarios: 6,
      categoria: {
        id: 6,
        nombre: 'Smartphones',
        slug: 'smartphones',
        descripcion: 'Teléfonos inteligentes',
        imagen: null,
        activo: true,
        orden: 1,
        categoria_padre_id: null,
        meta_title: null,
        meta_description: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    },
    {
      id: 3,
      nombre: 'Samsung Galaxy S24 Ultra',
      slug: 'samsung-galaxy-s24-ultra',
      descripcion:
        'El Galaxy más potente con S Pen integrado, cámara de 200MP.',
      precio: 4799,
      precio_oferta: null,
      stock: 30,
      sku: 'SGS24U001',
      codigo_barras: '194253000003',
      imagen_principal: 'assets/productos/default.jpg',
      destacado: true,
      activo: true,
      categoria_id: 7,
      marca: 'Samsung',
      modelo: 'Galaxy S24 Ultra',
      garantia: '1 año',
      meta_title: 'Samsung Galaxy S24 Ultra',
      meta_description: 'Galaxy S24 Ultra con S Pen',
      idioma: 'es',
      moneda: 'PEN',
      atributos_extra: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      rating_promedio: 4.8,
      total_comentarios: 6,
      categoria: {
        id: 7,
        nombre: 'Android',
        slug: 'android',
        descripcion: 'Dispositivos Android',
        imagen: null,
        activo: true,
        orden: 2,
        categoria_padre_id: null,
        meta_title: null,
        meta_description: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    },
    {
      id: 4,
      nombre: 'Samsung Galaxy A54',
      slug: 'samsung-galaxy-a54',
      descripcion: 'Galaxy A54 con pantalla Super AMOLED de 6.4 pulgadas.',
      precio: 1299,
      precio_oferta: 1199,
      stock: 60,
      sku: 'SGA54001',
      codigo_barras: '194253000004',
      imagen_principal: 'assets/productos/default.jpg',
      destacado: false,
      activo: true,
      categoria_id: 7,
      marca: 'Samsung',
      modelo: 'Galaxy A54',
      garantia: '1 año',
      meta_title: 'Samsung Galaxy A54',
      meta_description: 'Galaxy A54 Super AMOLED',
      idioma: 'es',
      moneda: 'PEN',
      atributos_extra: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      rating_promedio: 4.2,
      total_comentarios: 10,
      categoria: {
        id: 7,
        nombre: 'Android',
        slug: 'android',
        descripcion: 'Dispositivos Android',
        imagen: null,
        activo: true,
        orden: 2,
        categoria_padre_id: null,
        meta_title: null,
        meta_description: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    },
    {
      id: 5,
      nombre: 'Xiaomi 13 Pro',
      slug: 'xiaomi-13-pro',
      descripcion:
        'Xiaomi 13 Pro con cámara Leica, pantalla AMOLED de 6.73 pulgadas.',
      precio: 2899,
      precio_oferta: 2699,
      stock: 35,
      sku: 'XMI13P001',
      codigo_barras: '194253000005',
      imagen_principal: 'assets/productos/default.jpg',
      destacado: true,
      activo: true,
      categoria_id: 8,
      marca: 'Xiaomi',
      modelo: '13 Pro',
      garantia: '1 año',
      meta_title: 'Xiaomi 13 Pro',
      meta_description: 'Xiaomi 13 Pro con cámara Leica',
      idioma: 'es',
      moneda: 'PEN',
      atributos_extra: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      rating_promedio: 3.8,
      total_comentarios: 5,
      categoria: {
        id: 8,
        nombre: 'Xiaomi',
        slug: 'xiaomi',
        descripcion: 'Dispositivos Xiaomi',
        imagen: null,
        activo: true,
        orden: 3,
        categoria_padre_id: null,
        meta_title: null,
        meta_description: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    },
    {
      id: 6,
      nombre: 'ASUS ROG Strix G16',
      slug: 'asus-rog-strix-g16',
      descripcion:
        'Laptop gaming con procesador Intel Core i7 y tarjeta gráfica RTX 4060.',
      precio: 3999,
      precio_oferta: 3599,
      stock: 15,
      sku: 'ASROG16001',
      codigo_barras: '194253000006',
      imagen_principal: 'assets/productos/default.jpg',
      destacado: true,
      activo: true,
      categoria_id: 9,
      marca: 'ASUS',
      modelo: 'ROG Strix G16',
      garantia: '2 años',
      meta_title: 'ASUS ROG Strix G16',
      meta_description: 'Laptop gaming ASUS ROG',
      idioma: 'es',
      moneda: 'PEN',
      atributos_extra: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      rating_promedio: 3.5,
      total_comentarios: 8,
      categoria: {
        id: 9,
        nombre: 'Laptops Gaming',
        slug: 'laptops-gaming',
        descripcion: 'Laptops para gaming',
        imagen: null,
        activo: true,
        orden: 4,
        categoria_padre_id: null,
        meta_title: null,
        meta_description: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    },
    {
      id: 7,
      nombre: 'MacBook Air M2',
      slug: 'macbook-air-m2',
      descripcion:
        'MacBook Air con chip M2, pantalla Liquid Retina de 13.6 pulgadas.',
      precio: 4599,
      precio_oferta: 4299,
      stock: 20,
      sku: 'MBAM2001',
      codigo_barras: '194253000007',
      imagen_principal: 'assets/productos/default.jpg',
      destacado: true,
      activo: true,
      categoria_id: 10,
      marca: 'Apple',
      modelo: 'MacBook Air M2',
      garantia: '1 año',
      meta_title: 'MacBook Air M2',
      meta_description: 'MacBook Air con chip M2',
      idioma: 'es',
      moneda: 'PEN',
      atributos_extra: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      rating_promedio: 4.8,
      total_comentarios: 9,
      categoria: {
        id: 10,
        nombre: 'MacBooks',
        slug: 'macbooks',
        descripcion: 'MacBooks de Apple',
        imagen: null,
        activo: true,
        orden: 5,
        categoria_padre_id: null,
        meta_title: null,
        meta_description: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    },
    {
      id: 8,
      nombre: 'iPad Air',
      slug: 'ipad-air',
      descripcion:
        'iPad Air con chip M1, pantalla Liquid Retina de 10.9 pulgadas.',
      precio: 2599,
      precio_oferta: 2399,
      stock: 25,
      sku: 'IPAIR001',
      codigo_barras: '194253000008',
      imagen_principal: 'assets/productos/default.jpg',
      destacado: false,
      activo: true,
      categoria_id: 3,
      marca: 'Apple',
      modelo: 'iPad Air',
      garantia: '1 año',
      meta_title: 'iPad Air',
      meta_description: 'iPad Air con chip M1',
      idioma: 'es',
      moneda: 'PEN',
      atributos_extra: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      rating_promedio: 3.8,
      total_comentarios: 12,
      categoria: {
        id: 3,
        nombre: 'Tablets',
        slug: 'tablets',
        descripcion: 'Tablets y dispositivos portátiles',
        imagen: null,
        activo: true,
        orden: 6,
        categoria_padre_id: null,
        meta_title: null,
        meta_description: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    },
    // Agregar más productos para pruebas de paginación (40 productos adicionales)
    ...Array.from({ length: 40 }, (_, index) => ({
      id: index + 9,
      nombre: `Producto ${index + 9}`,
      slug: `producto-${index + 9}`,
      descripcion: `Descripción completa del producto ${
        index + 9
      }. Este es un excelente dispositivo tecnológico.`,
      precio: Math.floor(Math.random() * 4000) + 1000,
      precio_oferta:
        Math.random() > 0.6 ? Math.floor(Math.random() * 3500) + 800 : null,
      stock: Math.floor(Math.random() * 80) + 20,
      sku: `PROD${String(index + 9).padStart(3, '0')}`,
      codigo_barras: `19425300${String(index + 9).padStart(4, '0')}`,
      imagen_principal: 'assets/productos/default.jpg',
      destacado: Math.random() > 0.7,
      activo: true,
      categoria_id: [3, 6, 7, 8, 9, 10][Math.floor(Math.random() * 6)],
      marca: [
        'Apple',
        'Samsung',
        'Xiaomi',
        'Huawei',
        'OnePlus',
        'Sony',
        'LG',
        'Motorola',
      ][Math.floor(Math.random() * 8)],
      modelo: `Modelo ${index + 9}`,
      garantia: Math.random() > 0.5 ? '1 año' : '2 años',
      peso: Math.round((Math.random() * 0.4 + 0.15) * 1000) / 1000,
      dimensiones: `${Math.floor(Math.random() * 20) + 140} x ${
        Math.floor(Math.random() * 10) + 70
      } x ${Math.floor(Math.random() * 3) + 7} mm`,
      caracteristicas: [
        `Característica premium ${index + 9}`,
        `Tecnología avanzada`,
        `Diseño moderno`,
        `Alta durabilidad`,
      ],
      meta_title: `Producto ${index + 9} - Tecnología`,
      meta_description: `Descripción SEO del producto ${index + 9}`,
      idioma: 'es',
      moneda: 'PEN',
      atributos_extra: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      rating_promedio: Math.round((Math.random() * 4 + 1) * 10) / 10,
      total_comentarios: Math.floor(Math.random() * 25),
      categoria: {
        id: [3, 6, 7, 8, 9, 10][Math.floor(Math.random() * 6)],
        nombre: [
          'Tablets',
          'Smartphones',
          'Android',
          'Xiaomi',
          'Laptops Gaming',
          'MacBooks',
        ][Math.floor(Math.random() * 6)],
        slug: [
          'tablets',
          'smartphones',
          'android',
          'xiaomi',
          'laptops-gaming',
          'macbooks',
        ][Math.floor(Math.random() * 6)],
        descripcion: 'Categoría de productos tecnológicos',
        imagen: null,
        activo: true,
        orden: Math.floor(Math.random() * 6) + 1,
        categoria_padre_id: null,
        meta_title: null,
        meta_description: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    })),
  ]);

  // Computed para extraer categorías únicas de los productos
  readonly categoriasDisponibles = computed(() => {
    // Priorizar datos de la API siempre
    const productos =
      this.productos().length > 0 ? this.productos() : this.productosEjemplo();
    const categoriasMap = new Map();

    productos.forEach((producto) => {
      if (producto.categoria && !categoriasMap.has(producto.categoria_id)) {
        categoriasMap.set(producto.categoria_id, {
          id: producto.categoria_id,
          nombre: producto.categoria.nombre,
          slug: producto.categoria.slug,
          activo: producto.categoria.activo,
          productos_count: 0,
        });
      }
    });

    // Contar productos por categoría
    categoriasMap.forEach((categoria, id) => {
      categoria.productos_count = productos.filter(
        (p) => p.categoria_id === id
      ).length;
    });

    const categorias = Array.from(categoriasMap.values());
    console.log('🔧 CATALOGO: categoriasDisponibles computed', {
      totalCategorias: categorias.length,
      categorias: categorias.map((c) => ({
        id: c.id,
        nombre: c.nombre,
        count: c.productos_count,
      })),
    });

    return categorias;
  });

  // Computed signals
  readonly productosFiltrados = computed(() => {
    // Priorizar siempre los datos de la API
    let productos =
      this.productos().length > 0 ? this.productos() : this.productosEjemplo();
    const filtros = this.filtrosActivos();
    const termino = this.terminoBusqueda().toLowerCase().trim();

    // Filtrar por búsqueda
    if (termino) {
      productos = productos.filter(
        (producto) =>
          producto.nombre.toLowerCase().includes(termino) ||
          (producto.descripcion?.toLowerCase().includes(termino) ?? false) ||
          (producto.marca?.toLowerCase().includes(termino) ?? false)
      );
    }

    // Filtrar por categorías
    if (filtros.categorias.length > 0) {
      productos = productos.filter((producto) =>
        filtros.categorias.includes(producto.categoria_id)
      );
    }

    // Filtrar por precio
    if (filtros.precioMin !== undefined) {
      productos = productos.filter(
        (producto) =>
          (producto.precio_oferta || producto.precio) >= filtros.precioMin!
      );
    }

    if (filtros.precioMax !== undefined) {
      productos = productos.filter(
        (producto) =>
          (producto.precio_oferta || producto.precio) <= filtros.precioMax!
      );
    }

    // Filtrar por disponibilidad
    if (filtros.disponibilidad) {
      productos = productos.filter((producto) => producto.stock > 0);
    }

    // Filtrar por descuentos
    if (filtros.descuento) {
      productos = productos.filter(
        (producto) => producto.precio_oferta !== undefined
      );
    }

    // Filtrar por rating
    if (filtros.rating !== undefined) {
      productos = productos.filter(
        (producto) => (producto.rating_promedio || 0) >= filtros.rating!
      );
    }

    console.log('🔧 CATALOGO: productosFiltrados computed', {
      productosAPI: this.productos().length,
      productosEjemplo: this.productosEjemplo().length,
      usandoAPI: this.productos().length > 0,
      filtros: this.filtrosActivos(),
      termino: this.terminoBusqueda(),
      totalFiltrado: productos.length,
    });

    return productos;
  });

  readonly productosOrdenados = computed(() => {
    const productos = [...this.productosFiltrados()];
    const ordenamiento = this.ordenamientoActual();

    switch (ordenamiento) {
      case 'precio_asc':
        return productos.sort(
          (a, b) =>
            (a.precio_oferta || a.precio) - (b.precio_oferta || b.precio)
        );
      case 'precio_desc':
        return productos.sort(
          (a, b) =>
            (b.precio_oferta || b.precio) - (a.precio_oferta || a.precio)
        );
      case 'nombre_asc':
        return productos.sort((a, b) => a.nombre.localeCompare(b.nombre));
      case 'nombre_desc':
        return productos.sort((a, b) => b.nombre.localeCompare(a.nombre));
      case 'rating_desc':
        return productos.sort(
          (a, b) => (b.rating_promedio || 0) - (a.rating_promedio || 0)
        );
      case 'mas_vendidos':
        return productos.sort(
          (a, b) => (b.total_comentarios || 0) - (a.total_comentarios || 0)
        );
      case 'destacados':
        return productos.sort(
          (a, b) => Number(b.destacado) - Number(a.destacado)
        );
      default: // relevancia
        return productos.sort((a, b) => {
          const scoreA =
            (a.destacado ? 10 : 0) +
            (a.rating_promedio || 0) +
            (a.precio_oferta ? 5 : 0);
          const scoreB =
            (b.destacado ? 10 : 0) +
            (b.rating_promedio || 0) +
            (b.precio_oferta ? 5 : 0);
          return scoreB - scoreA;
        });
    }
  });

  readonly tieneResultados = computed(
    () => this.productosFiltrados().length > 0
  );
  readonly totalFiltrado = computed(() => this.productosFiltrados().length);

  // Computed para productos paginados que se mostrarán en el template
  readonly productosPaginados = computed(() => {
    const productos = this.productosOrdenados();
    const pagina = this.paginaActual();
    const porPagina = this.productosPorPagina();

    const inicio = (pagina - 1) * porPagina;
    const fin = inicio + porPagina;

    const resultado = productos.slice(inicio, fin);

    console.log('🔧 CATALOGO: productosPaginados computed', {
      totalProductos: productos.length,
      pagina,
      porPagina,
      inicio,
      fin,
      productosPaginados: resultado.length,
    });

    return resultado;
  });

  // Computed para calcular el total de páginas basado en productos filtrados
  readonly totalPaginasCalculado = computed(() => {
    const total = this.totalFiltrado();
    const porPagina = this.productosPorPagina();
    const resultado = Math.ceil(total / porPagina);

    console.log('🔧 CATALOGO: totalPaginasCalculado computed', {
      totalFiltrado: total,
      porPagina,
      totalPaginas: resultado,
    });

    return resultado;
  });

  ngOnInit(): void {
    console.log('🔧 CATALOGO: ngOnInit - Inicializando componente');
    this.cargarProductos();
  }

  /**
   * Carga los productos desde la API
   */
  private cargarProductos(): void {
    console.log('🔧 CATALOGO: cargarProductos - Iniciando carga de productos');
    this.loading.set(true);

    // Solicitar explícitamente un número alto de productos para el catálogo
    this.productoService.getProductos({ per_page: 100 }).subscribe({
      next: (response: ProductosResponse) => {
        console.log('🔧 CATALOGO: API Response exitosa', {
          total: response.meta.total,
          productos: response.data.length,
        });
        this.productos.set(response.data);
        this.totalProductos.set(response.meta.total);
        this.totalPaginas.set(
          Math.ceil(response.meta.total / this.productosPorPagina())
        );
        this.loading.set(false);
      },
      error: (error) => {
        console.error(
          '🔧 CATALOGO: Error API - Intentando nuevamente sin paginación',
          error
        );

        // Intentar de nuevo sin restricciones de paginación
        this.productoService.getProductos({ per_page: 100 }).subscribe({
          next: (response: ProductosResponse) => {
            console.log('🔧 CATALOGO: Segunda petición exitosa', {
              total: response.meta.total,
              productos: response.data.length,
            });
            this.productos.set(response.data);
            this.totalProductos.set(response.meta.total);
            this.totalPaginas.set(
              Math.ceil(response.meta.total / this.productosPorPagina())
            );
            this.loading.set(false);
          },
          error: (secondError) => {
            console.error(
              '🔧 CATALOGO: Segundo error API - Usando productos de ejemplo',
              secondError
            );
            // Fallback a productos de ejemplo solo después de dos intentos fallidos
            this.productos.set(this.productosEjemplo());
            this.totalProductos.set(this.productosEjemplo().length);
            this.totalPaginas.set(
              Math.ceil(
                this.productosEjemplo().length / this.productosPorPagina()
              )
            );
            console.log(
              '🔧 CATALOGO: Productos de ejemplo cargados como fallback',
              {
                total: this.productosEjemplo().length,
                totalPaginas: Math.ceil(
                  this.productosEjemplo().length / this.productosPorPagina()
                ),
              }
            );
            this.loading.set(false);
          },
        });
      },
    });
  }

  /**
   * Maneja los cambios en los filtros
   */
  onFiltrosAplicados(filtros: FiltrosAplicados): void {
    console.log('🔧 CATALOGO: onFiltrosAplicados', {
      filtros,
      paginaAnterior: this.paginaActual(),
      totalFiltradoAntes: this.totalFiltrado(),
    });
    this.filtrosActivos.set(filtros);
    this.paginaActual.set(1); // Resetear a primera página al aplicar filtros
    console.log('🔧 CATALOGO: Filtros aplicados', {
      totalFiltradoDespues: this.totalFiltrado(),
      totalPaginas: this.totalPaginasCalculado(),
      paginaActual: this.paginaActual(),
    });
  }

  /**
   * Maneja la limpieza de filtros
   */
  onFiltrosLimpiados(): void {
    this.filtrosActivos.set({
      categorias: [],
      atributos: {},
    });
    this.terminoBusqueda.set('');
    this.paginaActual.set(1);
  }

  /**
   * Cambia la vista entre grid y lista
   */
  cambiarVista(vista: 'grid' | 'lista'): void {
    this.vistaActual.set(vista);
  }

  /**
   * Cambia el ordenamiento
   */
  cambiarOrdenamiento(ordenamiento: string): void {
    console.log('🔧 CATALOGO: cambiarOrdenamiento', {
      ordenamientoAnterior: this.ordenamientoActual(),
      ordenamientoNuevo: ordenamiento,
      totalProductos: this.productosOrdenados().length,
    });
    this.ordenamientoActual.set(ordenamiento);
    console.log('🔧 CATALOGO: Ordenamiento aplicado', {
      ordenamiento: this.ordenamientoActual(),
      productosOrdenados: this.productosOrdenados().length,
      productosPaginados: this.productosPaginados().length,
    });
  }

  /**
   * Toggle para mostrar/ocultar filtros
   */
  toggleFiltros(): void {
    this.mostrandoFiltros.update((current) => !current);
  }

  /**
   * Maneja la búsqueda de productos
   */
  onBusquedaChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    console.log('🔧 CATALOGO: onBusquedaChange', {
      terminoAnterior: this.terminoBusqueda(),
      terminoNuevo: target.value,
      totalFiltradoAntes: this.totalFiltrado(),
    });
    this.terminoBusqueda.set(target.value);
    this.paginaActual.set(1);
    console.log('🔧 CATALOGO: Búsqueda aplicada', {
      termino: this.terminoBusqueda(),
      totalFiltrado: this.totalFiltrado(),
      totalPaginas: this.totalPaginasCalculado(),
    });
  }

  /**
   * Realiza búsqueda avanzada
   */
  buscarProductos(): void {
    this.buscandoProductos.set(true);

    // Simular búsqueda
    setTimeout(() => {
      this.buscandoProductos.set(false);
      this.paginaActual.set(1);
    }, 300);
  }

  /**
   * Cambia de página
   */
  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas()) {
      this.paginaActual.set(pagina);
      // Scroll al inicio de la lista de productos
      document
        .getElementById('productos-lista')
        ?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  /**
   * Maneja el evento de cambio de página del componente de paginación
   */
  onPageChange(event: PageChangeEvent): void {
    console.log('🔧 CATALOGO: onPageChange', {
      event,
      paginaAnterior: this.paginaActual(),
      totalPaginas: this.totalPaginasCalculado(),
      productosPorPagina: this.productosPorPagina(),
    });
    this.paginaActual.set(event.page);
    console.log('🔧 CATALOGO: Página cambiada', {
      paginaActual: this.paginaActual(),
      productosPaginados: this.productosPaginados().length,
    });
    // Scroll al inicio de la lista de productos
    document
      .getElementById('productos-lista')
      ?.scrollIntoView({ behavior: 'smooth' });
  }

  /**
   * Maneja el evento de cambio de tamaño de página del componente de paginación
   */
  onPageSizeChange(event: PageSizeChangeEvent): void {
    console.log('🔧 CATALOGO: onPageSizeChange', {
      event,
      productosPorPaginaAnterior: this.productosPorPagina(),
      totalProductos: this.totalFiltrado(),
    });
    this.productosPorPagina.set(event.pageSize);
    this.paginaActual.set(1); // Reiniciar a la primera página
    console.log('🔧 CATALOGO: Tamaño de página cambiado', {
      productosPorPagina: this.productosPorPagina(),
      totalPaginas: this.totalPaginasCalculado(),
      paginaActual: this.paginaActual(),
    });
    // Scroll al inicio de la lista de productos
    document
      .getElementById('productos-lista')
      ?.scrollIntoView({ behavior: 'smooth' });
  }

  /**
   * Obtiene el precio final del producto (con o sin oferta)
   */
  getPrecioFinal(producto: Producto): number {
    return producto.precio_oferta || producto.precio;
  }

  /**
   * Calcula el porcentaje de descuento
   */
  getPorcentajeDescuento(producto: Producto): number {
    if (!producto.precio_oferta) return 0;
    return Math.round(
      ((producto.precio - producto.precio_oferta) / producto.precio) * 100
    );
  }

  /**
   * Genera las estrellas para el rating
   */
  getEstrellas(rating: number): { llena: boolean }[] {
    const estrellas = [];
    for (let i = 1; i <= 5; i++) {
      estrellas.push({ llena: i <= Math.round(rating) });
    }
    return estrellas;
  }

  /**
   * Formatea el precio para mostrar
   */
  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(precio);
  }

  // Eventos del ProductoCard

  /**
   * Maneja los eventos del ProductoCard
   */
  onProductoCardEventos(eventos: ProductoCardEventos): void {
    console.log('Eventos del ProductoCard:', eventos);
  }

  /**
   * Maneja cuando se agrega un producto al carrito
   */
  onAgregarAlCarrito(productoId: number): void {
    console.log('Agregando al carrito producto ID:', productoId);
    // Aquí implementarías la lógica del carrito
  }

  /**
   * Maneja cuando se clickea en un producto
   */
  onClickProducto(productoId: number): void {
    console.log('Click en producto ID:', productoId);
    // Aquí implementarías la navegación al detalle del producto
  }

  /**
   * Convierte la vista del catálogo a VistaProductoCard
   */
  getVistaProductoCard(): VistaProductoCard {
    return this.vistaActual() === 'grid' ? 'grid' : 'lista';
  }
}
