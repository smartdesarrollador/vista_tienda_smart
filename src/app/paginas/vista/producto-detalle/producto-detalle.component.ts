import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  DestroyRef,
  PLATFORM_ID,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { catchError, finalize, tap } from 'rxjs/operators';
import { of } from 'rxjs';

import { ProductoService } from '../../../core/services/producto.service';
import { CarritoService } from '../../../core/services/carrito.service';
import { Producto } from '../../../core/models/producto.interface';
import { VariacionProducto } from '../../../core/models/variacion-producto.interface';
import {
  GaleriaImagenesComponent,
  ImagenGaleria,
} from './components/galeria-imagenes/galeria-imagenes.component';
import { InformacionProductoComponent } from './components/informacion-producto/informacion-producto.component';
import { VariacionesProductoComponent } from './components/variaciones-producto/variaciones-producto.component';
import { AgregarCarritoComponent } from './components/agregar-carrito/agregar-carrito.component';
import { TabsInformacionComponent } from './components/tabs-informacion/tabs-informacion.component';
import { ProductosRelacionadosComponent } from './components/productos-relacionados/productos-relacionados.component';

/**
 * Estado del componente producto detalle
 */
interface EstadoProductoDetalle {
  cargando: boolean;
  error: string | null;
  producto: Producto | null;
  imagenPrincipal: string;
  imagenSeleccionada: number;
  variacionSeleccionada: VariacionProducto | null;
  precioActual: number;
  stockActual: number;
}

@Component({
  selector: 'app-producto-detalle',
  standalone: true,
  imports: [
    CommonModule,
    GaleriaImagenesComponent,
    InformacionProductoComponent,
    VariacionesProductoComponent,
    AgregarCarritoComponent,
    TabsInformacionComponent,
    ProductosRelacionadosComponent,
  ],
  templateUrl: './producto-detalle.component.html',
  styleUrls: ['./producto-detalle.component.css'],
})
export class ProductoDetalleComponent implements OnInit {
  // Servicios inyectados
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productoService = inject(ProductoService);
  private readonly carritoService = inject(CarritoService);
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  // Estado del componente
  private readonly _estado = signal<EstadoProductoDetalle>({
    cargando: false,
    error: null,
    producto: null,
    imagenPrincipal: '',
    imagenSeleccionada: 0,
    variacionSeleccionada: null,
    precioActual: 0,
    stockActual: 0,
  });

  // Signal para mostrar notificación de carrito
  private readonly _notificacionCarrito = signal<{
    visible: boolean;
    mensaje: string;
    tipo: 'success' | 'error';
  }>({
    visible: false,
    mensaje: '',
    tipo: 'success',
  });

  // Signals públicos
  readonly cargando = computed(() => this._estado().cargando);
  readonly error = computed(() => this._estado().error);
  readonly producto = computed(() => this._estado().producto);
  readonly imagenPrincipal = computed(() => this._estado().imagenPrincipal);
  readonly imagenSeleccionada = computed(
    () => this._estado().imagenSeleccionada
  );
  readonly variacionSeleccionada = computed(
    () => this._estado().variacionSeleccionada
  );
  readonly precioActual = computed(() => this._estado().precioActual);
  readonly stockActual = computed(() => this._estado().stockActual);

  // Computed signal público para notificación
  readonly notificacionCarrito = computed(() => this._notificacionCarrito());

  // Computed signals adicionales
  readonly tituloProducto = computed(() => {
    const producto = this.producto();
    return producto ? producto.nombre : 'Producto no encontrado';
  });

  readonly breadcrumbs = computed(() => {
    const producto = this.producto();
    if (!producto) return [];

    return [
      { label: 'Inicio', url: '/' },
      { label: 'Catálogo', url: '/catalogo' },
      {
        label: producto.categoria?.nombre || 'Categoría',
        url: `/catalogo?categoria=${producto.categoria?.slug || ''}`,
      },
      { label: producto.nombre, url: '', active: true },
    ];
  });

  readonly precioFormateado = computed(() => {
    const precio = this.precioActual() || this.producto()?.precio || 0;
    return this.formatearPrecio(precio);
  });

  readonly precioOfertaFormateado = computed(() => {
    const variacion = this.variacionSeleccionada();
    const producto = this.producto();

    if (variacion?.precio_oferta) {
      return this.formatearPrecio(variacion.precio_oferta);
    }

    if (producto?.precio_oferta && !variacion) {
      return this.formatearPrecio(producto.precio_oferta);
    }

    return null;
  });

  readonly porcentajeDescuento = computed(() => {
    const variacion = this.variacionSeleccionada();
    const producto = this.producto();

    if (variacion?.precio_oferta) {
      const descuento =
        ((variacion.precio - variacion.precio_oferta) / variacion.precio) * 100;
      return Math.round(descuento);
    }

    if (producto?.precio_oferta && !variacion) {
      const descuento =
        ((producto.precio - producto.precio_oferta) / producto.precio) * 100;
      return Math.round(descuento);
    }

    return null;
  });

  readonly imagenes = computed((): ImagenGaleria[] => {
    const producto = this.producto();
    if (!producto) return [];

    const imagenes: ImagenGaleria[] = [];

    // Imagen principal
    if (producto.imagen_principal) {
      imagenes.push({
        url: producto.imagen_principal,
        alt: `${producto.nombre} - Imagen principal`,
        esPrincipal: true,
      });
    }

    // Imágenes adicionales (cuando se implemente)
    // if (producto.imagenes) {
    //   producto.imagenes.forEach((imagen, index) => {
    //     imagenes.push({
    //       url: imagen.url,
    //       alt: `${producto.nombre} - Imagen ${index + 2}`,
    //       esPrincipal: false,
    //     });
    //   });
    // }

    return imagenes;
  });

  readonly tieneVariaciones = computed(() => {
    const producto = this.producto();
    return producto && (producto.variaciones_count || 0) > 0;
  });

  ngOnInit(): void {
    this.cargarProductoPorSlug();
  }

  /**
   * Carga el producto basado en el slug de la URL
   */
  private cargarProductoPorSlug(): void {
    this.route.paramMap
      .pipe(
        tap((params) => {
          const slug = params.get('slug');
          console.log('📄 [PRODUCTO-DETALLE] Slug recibido:', slug);
          if (slug) {
            this.cargarProducto(slug);
          } else {
            this.manejarError('Slug de producto no válido');
          }
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  /**
   * Carga un producto por su slug
   */
  private cargarProducto(slug: string): void {
    this._estado.update((estado) => ({
      ...estado,
      cargando: true,
      error: null,
    }));

    // Por ahora, como no tenemos endpoint específico por slug,
    // cargaremos todos los productos y buscaremos por slug
    this.productoService
      .getProductos({ activo: true, per_page: 100 })
      .pipe(
        tap((response) => {
          // Primero buscar por slug
          let producto = response.data.find((p) => p.slug === slug);

          // Si no se encuentra por slug, intentar extraer ID del slug
          if (!producto) {
            const idExtraido = this.extraerIdDeSlug(slug);
            if (idExtraido) {
              producto = response.data.find((p) => p.id === idExtraido);
            }
          }

          // Como último recurso, intentar buscar por ID directo (si el slug es numérico)
          if (!producto && !isNaN(Number(slug))) {
            producto = response.data.find((p) => p.id === Number(slug));
          }

          if (producto) {
            this.establecerProducto(producto);
            this.configurarSEO(producto);

            // Log para debugging (opcional)
            console.log(
              `Producto cargado: ${producto.nombre} (${
                producto.slug || producto.id
              })`
            );
          } else {
            this.manejarError(
              `Producto con identificador "${slug}" no encontrado`
            );
          }
        }),
        catchError((error) => {
          console.error('Error al cargar producto:', error);
          this.manejarError(
            'Error al cargar el producto. Por favor, intenta nuevamente.'
          );
          return of(null);
        }),
        finalize(() => {
          this._estado.update((estado) => ({
            ...estado,
            cargando: false,
          }));
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  /**
   * Extrae el ID de un slug que termina con -ID
   */
  private extraerIdDeSlug(slug: string): number | null {
    const match = slug.match(/-(\d+)$/);
    const id = match ? parseInt(match[1], 10) : null;
    console.log('🔍 [PRODUCTO-DETALLE] ID extraído:', id, 'del slug:', slug);
    return id;
  }

  /**
   * Establece el producto cargado en el estado
   */
  private establecerProducto(producto: Producto): void {
    this._estado.update((estado) => ({
      ...estado,
      producto,
      imagenPrincipal: producto.imagen_principal || '',
      precioActual: producto.precio_oferta || producto.precio,
      stockActual: producto.stock,
      error: null,
    }));
  }

  /**
   * Configura los meta tags para SEO
   */
  private configurarSEO(producto: Producto): void {
    // Título de la página
    this.title.setTitle(
      producto.meta_title || `${producto.nombre} - Tienda Virtual`
    );

    // Meta description
    this.meta.updateTag({
      name: 'description',
      content:
        producto.meta_description ||
        producto.descripcion ||
        `Compra ${producto.nombre} al mejor precio`,
    });

    // Open Graph tags
    this.meta.updateTag({
      property: 'og:title',
      content: producto.nombre,
    });
    this.meta.updateTag({
      property: 'og:description',
      content: producto.descripcion || '',
    });
    this.meta.updateTag({
      property: 'og:image',
      content: producto.imagen_principal || '',
    });
    this.meta.updateTag({
      property: 'og:type',
      content: 'product',
    });

    // Structured data para productos (solo en el navegador)
    if (isPlatformBrowser(this.platformId)) {
      this.agregarStructuredData(producto);
    }
  }

  /**
   * Agrega structured data JSON-LD para SEO
   */
  private agregarStructuredData(producto: Producto): void {
    // Solo ejecutar en el navegador
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      const structuredData = {
        '@context': 'https://schema.org/',
        '@type': 'Product',
        name: producto.nombre,
        description: producto.descripcion,
        sku: producto.sku,
        brand: {
          '@type': 'Brand',
          name: producto.marca || 'Tienda Virtual',
        },
        offers: {
          '@type': 'Offer',
          price: this.precioActual(),
          priceCurrency: 'PEN',
          availability:
            this.stockActual() > 0
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          url: `${window.location.origin}/producto/${producto.slug}`,
        },
        image: producto.imagen_principal,
      };

      // Verificar que document esté disponible
      if (typeof document !== 'undefined') {
        // Remover scripts anteriores del mismo producto
        const existingScript = document.getElementById(
          'product-structured-data'
        );
        if (existingScript) {
          existingScript.remove();
        }

        // Agregar al head
        const script = document.createElement('script');
        script.id = 'product-structured-data';
        script.type = 'application/ld+json';
        script.text = JSON.stringify(structuredData);
        document.head.appendChild(script);
      }
    } catch (error) {
      console.warn('Error al agregar structured data:', error);
    }
  }

  /**
   * Maneja errores y redirige si es necesario
   */
  private manejarError(mensaje: string): void {
    this._estado.update((estado) => ({
      ...estado,
      error: mensaje,
      cargando: false,
    }));

    // Redirigir al catálogo después de unos segundos si el producto no existe
    if (mensaje.includes('no encontrado')) {
      setTimeout(() => {
        this.router.navigate(['/catalogo']);
      }, 3000);
    }
  }

  /**
   * Cambia la imagen seleccionada en la galería
   */
  onImagenSeleccionada(indice: number): void {
    const imagenes = this.imagenes();
    if (imagenes[indice]) {
      this._estado.update((estado) => ({
        ...estado,
        imagenSeleccionada: indice,
        imagenPrincipal: imagenes[indice].url,
      }));
    }
  }

  /**
   * Maneja el cambio de variación seleccionada
   */
  onVariacionCambiada(evento: any): void {
    this._estado.update((estado) => ({
      ...estado,
      variacionSeleccionada: evento.variacionSeleccionada,
      precioActual: evento.precioActualizado,
      stockActual: evento.stockActualizado,
    }));

    // Actualizar imagen si la variación tiene una imagen específica
    if (evento.imagenActualizada) {
      this._estado.update((estado) => ({
        ...estado,
        imagenPrincipal: evento.imagenActualizada,
      }));
    }
  }

  /**
   * Maneja eventos de agregar al carrito
   */
  onAgregarAlCarrito(evento: any): void {
    const producto = this.producto();
    if (!producto) {
      this.mostrarNotificacionCarrito('Producto no encontrado', 'error');
      return;
    }

    // Preparar request para el carrito
    const request = {
      producto_id: producto.id,
      variacion_id: this.variacionSeleccionada()?.id || undefined,
      cantidad: evento.cantidad || 1,
    };

    // Agregar al carrito
    this.carritoService.agregarItem(request).subscribe({
      next: (response) => {
        if (response.success) {
          this.mostrarNotificacionCarrito('¡Añadido al carrito!', 'success');
          console.log(
            'Producto agregado exitosamente al carrito:',
            response.data
          );
        } else {
          this.mostrarNotificacionCarrito('Error al agregar producto', 'error');
        }
      },
      error: (error) => {
        console.error('Error al agregar item al carrito:', error);
        this.mostrarNotificacionCarrito('Error al agregar al carrito', 'error');
      },
    });
  }

  /**
   * Maneja el evento de comprar ahora
   */
  onComprarAhora(evento: any): void {
    console.log('Comprar ahora:', evento);
    // TODO: Redirigir al checkout con el producto
    this.router.navigate(['/checkout'], {
      queryParams: {
        producto: evento.producto.id,
        variacion: evento.variacion?.id,
        cantidad: evento.cantidad,
      },
    });
  }

  /**
   * Navega de vuelta al catálogo
   */
  volverAlCatalogo(): void {
    this.router.navigate(['/catalogo']);
  }

  /**
   * Formatea precios
   */
  private formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(precio);
  }

  /**
   * Muestra una notificación de carrito
   */
  private mostrarNotificacionCarrito(
    mensaje: string,
    tipo: 'success' | 'error'
  ): void {
    this._notificacionCarrito.update((notificacion) => ({
      ...notificacion,
      visible: true,
      mensaje,
      tipo,
    }));

    // Ocultar la notificación después de 3 segundos
    setTimeout(() => {
      this._notificacionCarrito.update((notificacion) => ({
        ...notificacion,
        visible: false,
      }));
    }, 3000);
  }
}
