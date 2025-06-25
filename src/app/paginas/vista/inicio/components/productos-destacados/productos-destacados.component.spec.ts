import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { ProductosDestacadosComponent } from './productos-destacados.component';
import { ProductoService } from '../../../../../core/services/producto.service';
import { Producto } from '../../../../../core/models/producto.interface';
import { By } from '@angular/platform-browser';

describe('ProductosDestacadosComponent', () => {
  let component: ProductosDestacadosComponent;
  let fixture: ComponentFixture<ProductosDestacadosComponent>;
  let mockProductoService: jasmine.SpyObj<ProductoService>;

  const mockProductos: Producto[] = [
    {
      id: 1,
      nombre: 'Smartphone Pro',
      slug: 'smartphone-pro',
      descripcion: 'Teléfono inteligente de alta gama',
      precio: 1000,
      precio_oferta: 800,
      stock: 10,
      sku: 'SP001',
      codigo_barras: '1234567890',
      imagen_principal: '/assets/productos/smartphone.jpg',
      destacado: true,
      activo: true,
      categoria_id: 1,
      marca: 'TechBrand',
      modelo: 'Pro Max',
      garantia: '2 años',
      meta_title: 'Smartphone Pro',
      meta_description: 'El mejor smartphone',
      idioma: 'es',
      moneda: 'PEN',
      atributos_extra: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      rating_promedio: 4.5,
      total_comentarios: 150,
    },
    {
      id: 2,
      nombre: 'Laptop Gaming',
      slug: 'laptop-gaming',
      descripcion: 'Laptop para juegos',
      precio: 2000,
      precio_oferta: null,
      stock: 5,
      sku: 'LG001',
      codigo_barras: '2345678901',
      imagen_principal: '/assets/productos/laptop.jpg',
      destacado: true,
      activo: true,
      categoria_id: 2,
      marca: 'GameTech',
      modelo: 'Gaming X',
      garantia: '1 año',
      meta_title: 'Laptop Gaming',
      meta_description: 'Laptop para gamers',
      idioma: 'es',
      moneda: 'PEN',
      atributos_extra: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      rating_promedio: 4.2,
      total_comentarios: 89,
    },
  ];

  beforeEach(async () => {
    const spyProductoService = jasmine.createSpyObj('ProductoService', [
      'getProductosDestacados',
    ]);

    await TestBed.configureTestingModule({
      imports: [ProductosDestacadosComponent],
      providers: [{ provide: ProductoService, useValue: spyProductoService }],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductosDestacadosComponent);
    component = fixture.componentInstance;
    mockProductoService = TestBed.inject(
      ProductoService
    ) as jasmine.SpyObj<ProductoService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load productos destacados on init', () => {
    mockProductoService.getProductosDestacados.and.returnValue(
      of(mockProductos)
    );

    component.ngOnInit();

    expect(mockProductoService.getProductosDestacados).toHaveBeenCalledWith(12);
    expect(component.productosDestacados()).toEqual(mockProductos);
    expect(component.isLoading()).toBeFalse();
    expect(component.hasError()).toBeFalse();
  });

  it('should handle error when loading productos', () => {
    const errorMessage = 'Error de red';
    mockProductoService.getProductosDestacados.and.returnValue(
      throwError(() => new Error(errorMessage))
    );

    component.ngOnInit();

    expect(component.productos().length).toBe(0);
    expect(component.hasError()).toBeTrue();
    expect(component.errorMessage()).toContain(
      'No se pudieron cargar los productos destacados'
    );
    expect(component.isLoading()).toBeFalse();
  });

  it('should show loading state initially', () => {
    // Simular estado de carga antes de cualquier configuración
    expect(component.isLoading()).toBeFalse(); // Estado inicial

    // Establecer estado de carga manualmente y detectar cambios
    component['loading'].set(true);
    fixture.detectChanges();

    // Verificar que el estado de carga es correcto
    expect(component.isLoading()).toBeTrue();
  });

  it('should show empty state when no productos', () => {
    mockProductoService.getProductosDestacados.and.returnValue(of([]));

    component.ngOnInit();
    fixture.detectChanges();

    const emptyStateElement = fixture.nativeElement.querySelector('h3');
    expect(emptyStateElement?.textContent).toContain(
      'No hay productos destacados disponibles'
    );
  });

  it('should calculate discount percentage correctly', () => {
    const productoConDescuento = mockProductos[0]; // precio: 1000, precio_oferta: 800
    const productoSinDescuento = mockProductos[1]; // sin precio_oferta

    expect(component.tieneDescuento(productoConDescuento)).toBeTrue();
    expect(component.calcularPorcentajeDescuento(productoConDescuento)).toBe(
      20
    );

    expect(component.tieneDescuento(productoSinDescuento)).toBeFalse();
    expect(component.calcularPorcentajeDescuento(productoSinDescuento)).toBe(0);
  });

  it('should generate complete image URL correctly', () => {
    const imagenRelativa = '/assets/productos/test.jpg';
    const imagenCompleta = 'https://example.com/image.jpg';

    const urlRelativa = component.getImagenCompleta(imagenRelativa);
    expect(urlRelativa).toContain('/assets/productos/test.jpg');

    const urlCompleta = component.getImagenCompleta(imagenCompleta);
    expect(urlCompleta).toBe(imagenCompleta);
  });

  it('should open modal when clicking on producto', () => {
    const producto = mockProductos[0];

    component.onProductoClick(producto);

    expect(component.selectedProducto()).toBe(producto);
    expect(component.isModalOpen()).toBeTrue();
  });

  it('should close modal correctly', () => {
    // Primero abrir el modal
    component.onProductoClick(mockProductos[0]);
    expect(component.isModalOpen()).toBeTrue();

    // Luego cerrarlo
    component.closeModal();

    expect(component.isModalOpen()).toBeFalse();
    expect(component.selectedProducto()).toBeNull();
  });

  it('should handle quick view correctly', () => {
    const evento = new Event('click');
    spyOn(evento, 'stopPropagation');
    const producto = mockProductos[0];

    component.onQuickView(evento, producto);

    expect(evento.stopPropagation).toHaveBeenCalled();
    expect(component.selectedProducto()).toBe(producto);
    expect(component.isModalOpen()).toBeTrue();
  });

  it('should track productos by id', () => {
    const producto = mockProductos[0];
    const trackResult = component.trackByProducto(0, producto);
    expect(trackResult).toBe(producto.id);
  });

  // Tests del carrusel
  it('should handle carousel navigation correctly', () => {
    mockProductoService.getProductosDestacados.and.returnValue(
      of(
        Array(8)
          .fill(null)
          .map((_, i) => ({
            ...mockProductos[0],
            id: i + 1,
            nombre: `Producto ${i + 1}`,
          }))
      )
    );

    component.ngOnInit();

    // Estado inicial
    expect(component.currentIndex()).toBe(0);
    expect(component.canSlidePrev()).toBeFalse();
    expect(component.canSlideNext()).toBeTrue();

    // Deslizar hacia adelante
    component.slideNext();
    expect(component.currentIndex()).toBe(1);
    expect(component.canSlidePrev()).toBeTrue();

    // Deslizar hacia atrás
    component.slidePrev();
    expect(component.currentIndex()).toBe(0);
    expect(component.canSlidePrev()).toBeFalse();
  });

  it('should calculate total slides correctly', () => {
    mockProductoService.getProductosDestacados.and.returnValue(
      of(
        Array(10)
          .fill(null)
          .map((_, i) => ({
            ...mockProductos[0],
            id: i + 1,
          }))
      )
    );

    component.ngOnInit();

    // 10 productos / 4 slides por vista = 3 slides totales (redondeado hacia arriba)
    expect(component.totalSlides()).toBe(3);
  });

  it('should go to specific slide correctly', () => {
    mockProductoService.getProductosDestacados.and.returnValue(
      of(
        Array(8)
          .fill(null)
          .map((_, i) => ({
            ...mockProductos[0],
            id: i + 1,
          }))
      )
    );

    component.ngOnInit();

    component.goToSlide(1); // Ir al slide 1 (segunda página)
    expect(component.currentIndex()).toBe(4); // 1 * 4 = 4
    expect(component.currentSlide()).toBe(1);
  });

  it('should handle agregarCarrito from modal', () => {
    spyOn(console, 'log');
    const data = { producto: mockProductos[0], cantidad: 2 };

    component.onAgregarCarritoFromModal(data);

    expect(console.log).toHaveBeenCalledWith(
      'Agregando al carrito desde modal:',
      data.producto,
      'Cantidad:',
      data.cantidad
    );
    expect(component.isModalOpen()).toBeFalse();
  });

  it('should handle recargar productos', () => {
    mockProductoService.getProductosDestacados.and.returnValue(
      of(mockProductos)
    );

    component.recargarProductos();

    expect(mockProductoService.getProductosDestacados).toHaveBeenCalled();
  });

  it('should handle ver todos productos', () => {
    spyOn(console, 'log');

    component.onVerTodosProductos();

    expect(console.log).toHaveBeenCalledWith('Navegar a catálogo completo');
  });

  it('should prevent sliding beyond limits', () => {
    mockProductoService.getProductosDestacados.and.returnValue(
      of(mockProductos.slice(0, 2))
    ); // Solo 2 productos

    component.ngOnInit();

    // No debería poder deslizar con pocos productos
    expect(component.canSlideNext()).toBeFalse();

    component.slideNext();
    expect(component.currentIndex()).toBe(0); // No debería cambiar
  });
});
