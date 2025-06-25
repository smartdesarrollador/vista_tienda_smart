import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ProductosNuevosComponent } from './productos-nuevos.component';
import { ProductoService } from '../../../../../core/services/producto.service';
import { Producto } from '../../../../../core/models/producto.interface';

describe('ProductosNuevosComponent', () => {
  let component: ProductosNuevosComponent;
  let fixture: ComponentFixture<ProductosNuevosComponent>;
  let mockProductoService: jasmine.SpyObj<ProductoService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockProductos: Producto[] = [
    {
      id: 1,
      nombre: 'Producto Nuevo 1',
      slug: 'producto-nuevo-1',
      descripcion: 'Descripción del producto nuevo 1',
      precio: 100.0,
      precio_oferta: 80.0,
      stock: 10,
      sku: 'PROD-001',
      codigo_barras: '123456789',
      imagen_principal: 'imagen1.jpg',
      destacado: false,
      activo: true,
      categoria_id: 1,
      marca: 'Marca A',
      modelo: 'Modelo 1',
      garantia: '1 año',
      meta_title: 'Meta Title',
      meta_description: 'Meta Description',
      idioma: 'es',
      moneda: 'PEN',
      atributos_extra: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 2,
      nombre: 'Producto Nuevo 2',
      slug: 'producto-nuevo-2',
      descripcion: 'Descripción del producto nuevo 2',
      precio: 150.0,
      precio_oferta: null,
      stock: 5,
      sku: 'PROD-002',
      codigo_barras: '123456790',
      imagen_principal: 'imagen2.jpg',
      destacado: false,
      activo: true,
      categoria_id: 2,
      marca: 'Marca B',
      modelo: 'Modelo 2',
      garantia: '2 años',
      meta_title: 'Meta Title 2',
      meta_description: 'Meta Description 2',
      idioma: 'es',
      moneda: 'PEN',
      atributos_extra: null,
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Ayer
      updated_at: new Date().toISOString(),
    },
    {
      id: 3,
      nombre: 'Producto Agotado',
      slug: 'producto-agotado',
      descripcion: 'Producto sin stock',
      precio: 200.0,
      precio_oferta: null,
      stock: 0,
      sku: 'PROD-003',
      codigo_barras: '123456791',
      imagen_principal: null,
      destacado: false,
      activo: true,
      categoria_id: 3,
      marca: 'Marca C',
      modelo: 'Modelo 3',
      garantia: '1 año',
      meta_title: 'Meta Title 3',
      meta_description: 'Meta Description 3',
      idioma: 'es',
      moneda: 'PEN',
      atributos_extra: null,
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Hace una semana
      updated_at: new Date().toISOString(),
    },
  ];

  const mockProductosResponse = {
    data: mockProductos,
    links: {
      first: 'first-link',
      last: 'last-link',
      prev: null,
      next: null,
    },
    meta: {
      current_page: 1,
      from: 1,
      last_page: 1,
      links: [],
      path: 'path',
      per_page: 8,
      to: 3,
      total: 3,
    },
  };

  beforeEach(async () => {
    const productServiceSpy = jasmine.createSpyObj(
      'ProductoService',
      ['getProductos'],
      {
        baseUrlImagenes: 'http://localhost:8000/storage/',
      }
    );
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [ProductosNuevosComponent],
      providers: [
        { provide: ProductoService, useValue: productServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductosNuevosComponent);
    component = fixture.componentInstance;
    mockProductoService = TestBed.inject(
      ProductoService
    ) as jasmine.SpyObj<ProductoService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load productos nuevos on init', () => {
      mockProductoService.getProductos.and.returnValue(
        of(mockProductosResponse)
      );

      component.ngOnInit();

      expect(mockProductoService.getProductos).toHaveBeenCalledWith({
        activo: true,
        order_by: 'created_at',
        order_direction: 'desc',
        per_page: 8,
        include_stats: true,
      });
    });

    it('should set productos after successful load', () => {
      mockProductoService.getProductos.and.returnValue(
        of(mockProductosResponse)
      );

      component.ngOnInit();

      expect(component.productos()).toEqual(mockProductos);
      expect(component.loading()).toBeFalse();
      expect(component.error()).toBeNull();
    });

    it('should handle error when loading fails', () => {
      const errorMessage = 'Network error';
      mockProductoService.getProductos.and.returnValue(
        throwError(() => new Error(errorMessage))
      );

      component.ngOnInit();

      expect(component.productos()).toEqual([]);
      expect(component.loading()).toBeFalse();
      expect(component.error()).toBe(
        'No se pudieron cargar los productos nuevos'
      );
    });
  });

  describe('computed signals', () => {
    it('should return productos from productosNuevos computed', () => {
      component.productos.set(mockProductos);

      expect(component.productosNuevos()).toEqual(mockProductos);
    });

    it('should return loading state from isLoading computed', () => {
      component.loading.set(true);

      expect(component.isLoading()).toBeTrue();
    });

    it('should return error state from hasError computed', () => {
      component.error.set('Error message');

      expect(component.hasError()).toBeTrue();
    });

    it('should return error message from errorMessage computed', () => {
      const errorMsg = 'Test error';
      component.error.set(errorMsg);

      expect(component.errorMessage()).toBe(errorMsg);
    });
  });

  describe('trackByProducto', () => {
    it('should return producto id', () => {
      const producto = mockProductos[0];
      const result = component.trackByProducto(0, producto);

      expect(result).toBe(producto.id);
    });
  });

  describe('getImagenCompleta', () => {
    it('should return empty string for empty image', () => {
      const result = component.getImagenCompleta('');

      expect(result).toBe('');
    });

    it('should return full URL for relative path', () => {
      const relativePath = 'products/image.jpg';
      const result = component.getImagenCompleta(relativePath);

      expect(result).toBe('http://localhost:8000/storage/products/image.jpg');
    });

    it('should return original URL for absolute URL', () => {
      const absoluteUrl = 'https://example.com/image.jpg';
      const result = component.getImagenCompleta(absoluteUrl);

      expect(result).toBe(absoluteUrl);
    });
  });

  describe('tieneDescuento', () => {
    it('should return true for producto with valid discount', () => {
      const producto = mockProductos[0]; // Tiene precio_oferta válido

      const result = component.tieneDescuento(producto);

      expect(result).toBeTrue();
    });

    it('should return false for producto without discount', () => {
      const producto = mockProductos[1]; // No tiene precio_oferta

      const result = component.tieneDescuento(producto);

      expect(result).toBeFalse();
    });

    it('should return false for producto with precio_oferta equal to precio', () => {
      const producto = {
        ...mockProductos[0],
        precio_oferta: 100.0, // Igual al precio
      };

      const result = component.tieneDescuento(producto);

      expect(result).toBeFalse();
    });
  });

  describe('calcularPorcentajeDescuento', () => {
    it('should calculate correct percentage discount', () => {
      const producto = mockProductos[0]; // precio: 100, precio_oferta: 80

      const result = component.calcularPorcentajeDescuento(producto);

      expect(result).toBe(20); // (100-80)/100 * 100 = 20%
    });

    it('should return 0 for producto without discount', () => {
      const producto = mockProductos[1]; // Sin descuento

      const result = component.calcularPorcentajeDescuento(producto);

      expect(result).toBe(0);
    });
  });

  describe('getFechaRelativa', () => {
    it('should return "hoy" for today', () => {
      const today = new Date().toISOString();

      const result = component.getFechaRelativa(today);

      expect(result).toBe('hoy');
    });

    it('should return "ayer" for yesterday', () => {
      const yesterday = new Date(
        Date.now() - 24 * 60 * 60 * 1000
      ).toISOString();

      const result = component.getFechaRelativa(yesterday);

      expect(result).toBe('ayer');
    });

    it('should return days for recent dates', () => {
      const threeDaysAgo = new Date(
        Date.now() - 3 * 24 * 60 * 60 * 1000
      ).toISOString();

      const result = component.getFechaRelativa(threeDaysAgo);

      expect(result).toBe('hace 3 días');
    });

    it('should return weeks for older dates', () => {
      const twoWeeksAgo = new Date(
        Date.now() - 14 * 24 * 60 * 60 * 1000
      ).toISOString();

      const result = component.getFechaRelativa(twoWeeksAgo);

      expect(result).toBe('hace 2 semanas');
    });
  });

  describe('user interactions', () => {
    it('should navigate to product detail on producto click', () => {
      const producto = mockProductos[0];

      component.onProductoClick(producto);

      expect(mockRouter.navigate).toHaveBeenCalledWith([
        '/producto',
        producto.slug,
      ]);
    });

    it('should stop propagation and log on quick view', () => {
      const event = new Event('click');
      const producto = mockProductos[0];
      spyOn(event, 'stopPropagation');
      spyOn(console, 'log');

      component.onQuickView(event, producto);

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('Vista rápida:', producto);
    });

    it('should stop propagation and log on agregar carrito for available product', () => {
      const event = new Event('click');
      const producto = mockProductos[0]; // Con stock
      spyOn(event, 'stopPropagation');
      spyOn(console, 'log');

      component.onAgregarCarrito(event, producto);

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('Agregar al carrito:', producto);
    });

    it('should handle agregar carrito for out of stock product', () => {
      const event = new Event('click');
      const producto = mockProductos[2]; // Sin stock
      spyOn(event, 'stopPropagation');
      spyOn(console, 'log');

      component.onAgregarCarrito(event, producto);

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('Producto agotado');
    });

    it('should reload productos on recargar', () => {
      mockProductoService.getProductos.and.returnValue(
        of(mockProductosResponse)
      );

      component.recargarProductos();

      expect(mockProductoService.getProductos).toHaveBeenCalled();
    });

    it('should navigate to productos page with filters on ver todos productos', () => {
      component.onVerTodosProductos();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/productos'], {
        queryParams: {
          orden: 'recientes',
          page: 1,
        },
      });
    });

    it('should navigate to productos page on ver catalogo', () => {
      component.onVerCatalogo();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/productos']);
    });
  });

  describe('template rendering', () => {
    beforeEach(() => {
      mockProductoService.getProductos.and.returnValue(
        of(mockProductosResponse)
      );
    });

    it('should show loading skeleton when loading', () => {
      component.loading.set(true);
      fixture.detectChanges();

      const skeletonElements =
        fixture.nativeElement.querySelectorAll('.animate-pulse');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });

    it('should show error message when error occurs', () => {
      component.error.set('Test error message');
      fixture.detectChanges();

      const errorElement = fixture.nativeElement.querySelector('.bg-red-50');
      expect(errorElement).toBeTruthy();
      expect(errorElement.textContent).toContain('Test error message');
    });

    it('should render productos when loaded successfully', () => {
      component.productos.set(mockProductos);
      component.loading.set(false);
      fixture.detectChanges();

      const productCards = fixture.nativeElement.querySelectorAll(
        '.group.relative.bg-white'
      );
      expect(productCards.length).toBe(mockProductos.length);
    });

    it('should show empty state when no productos', () => {
      component.productos.set([]);
      component.loading.set(false);
      fixture.detectChanges();

      const emptyStateElement =
        fixture.nativeElement.querySelector('.text-center.py-12');
      expect(emptyStateElement).toBeTruthy();
      expect(emptyStateElement.textContent).toContain(
        'No hay productos nuevos disponibles'
      );
    });

    it('should show "Ver más" button when there are 8 or more productos', () => {
      const manyProductos = new Array(8).fill(null).map((_, index) => ({
        ...mockProductos[0],
        id: index + 1,
        nombre: `Producto ${index + 1}`,
      }));
      component.productos.set(manyProductos);
      component.loading.set(false);
      fixture.detectChanges();

      const verMasButton = fixture.nativeElement.querySelector(
        '.boton-ver-mas, .bg-emerald-600'
      );
      expect(verMasButton).toBeTruthy();
    });
  });
});
