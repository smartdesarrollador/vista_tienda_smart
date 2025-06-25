import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ProductoDetailComponent } from './producto-detail.component';
import { Producto } from '../../../../../../../core/models/producto.interface';

describe('ProductoDetailComponent', () => {
  let component: ProductoDetailComponent;
  let fixture: ComponentFixture<ProductoDetailComponent>;

  const mockProducto: Producto = {
    id: 1,
    nombre: 'Smartphone Pro Max',
    slug: 'smartphone-pro-max',
    descripcion: 'El mejor smartphone del mercado con tecnología avanzada',
    precio: 1200,
    precio_oferta: 999,
    stock: 15,
    sku: 'SPM001',
    codigo_barras: '1234567890123',
    imagen_principal: '/assets/productos/smartphone-pro.jpg',
    destacado: true,
    activo: true,
    categoria_id: 1,
    marca: 'TechBrand',
    modelo: 'Pro Max 256GB',
    garantia: '2 años internacional',
    meta_title: 'Smartphone Pro Max',
    meta_description: 'Smartphone de alta gama',
    idioma: 'es',
    moneda: 'PEN',
    atributos_extra: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    rating_promedio: 4.8,
    total_comentarios: 256,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductoDetailComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductoDetailComponent);
    component = fixture.componentInstance;

    // Configurar inputs requeridos
    fixture.componentRef.setInput('producto', mockProducto);
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display producto information correctly', () => {
    const nombreElement = fixture.debugElement.query(By.css('h1'));
    expect(nombreElement.nativeElement.textContent.trim()).toContain(
      'Smartphone Pro Max'
    );

    const skuElement = fixture.debugElement.query(By.css('p'));
    expect(skuElement.nativeElement.textContent).toContain('SKU: SPM001');
  });

  it('should show discounted price when producto has precio_oferta', () => {
    fixture.detectChanges();

    const precioOfertaElement = fixture.debugElement.query(
      By.css('.text-primary-600')
    );
    const precioOriginalElement = fixture.debugElement.query(
      By.css('.line-through')
    );

    expect(precioOfertaElement.nativeElement.textContent).toContain(
      'S/ 999.00'
    );
    expect(precioOriginalElement.nativeElement.textContent).toContain(
      'S/ 1,200.00'
    );
  });

  it('should calculate discount percentage correctly', () => {
    expect(component.tieneDescuento()).toBeTrue();
    expect(component.porcentajeDescuento()).toBe(17); // (1200-999)/1200 * 100 = 16.75, redondeado 17
  });

  it('should show regular price when no discount', () => {
    const productoSinDescuento: Producto = {
      ...mockProducto,
      precio_oferta: null,
    };

    fixture.componentRef.setInput('producto', productoSinDescuento);
    fixture.detectChanges();

    expect(component.tieneDescuento()).toBeFalse();

    const precioElements = fixture.debugElement.queryAll(By.css('span'));
    const precioElement = precioElements.find((el) =>
      el.nativeElement.textContent.includes('S/ 1,200.00')
    );
    expect(precioElement).toBeTruthy();
  });

  it('should generate complete image URL correctly', () => {
    const result = component.imagenCompleta();
    expect(result).toContain('/assets/productos/smartphone-pro.jpg');
  });

  it('should handle image URLs with protocol correctly', () => {
    const productoWithFullUrl: Producto = {
      ...mockProducto,
      imagen_principal: 'https://example.com/image.jpg',
    };

    fixture.componentRef.setInput('producto', productoWithFullUrl);
    fixture.detectChanges();

    expect(component.imagenCompleta()).toBe('https://example.com/image.jpg');
  });

  it('should show stock availability correctly', () => {
    const stockElement = fixture.debugElement.query(By.css('.text-green-600'));
    expect(stockElement.nativeElement.textContent).toContain('15 en stock');
  });

  it('should show out of stock when stock is 0', () => {
    const productoSinStock: Producto = {
      ...mockProducto,
      stock: 0,
    };

    fixture.componentRef.setInput('producto', productoSinStock);
    fixture.detectChanges();

    const stockElement = fixture.debugElement.query(By.css('.text-red-600'));
    expect(stockElement.nativeElement.textContent).toContain('Agotado');
  });

  it('should show product description when available', () => {
    const descripcionElement = fixture.debugElement.query(By.css('h3'));
    expect(descripcionElement.nativeElement.textContent).toContain(
      'Descripción'
    );

    const descripcionText = fixture.debugElement.query(
      By.css('.text-gray-600')
    );
    expect(descripcionText.nativeElement.textContent).toContain(
      mockProducto.descripcion
    );
  });

  it('should display product attributes correctly', () => {
    const attributeElements = fixture.debugElement.queryAll(
      By.css('.grid .text-gray-600')
    );

    const marcaElement = attributeElements.find((el) =>
      el.nativeElement.textContent.includes('TechBrand')
    );
    expect(marcaElement).toBeTruthy();

    const modeloElement = attributeElements.find((el) =>
      el.nativeElement.textContent.includes('Pro Max 256GB')
    );
    expect(modeloElement).toBeTruthy();
  });

  it('should render star rating correctly', () => {
    expect(component.estrellas()).toEqual([true, true, true, true, false]);

    const starElements = fixture.debugElement.queryAll(
      By.css('.text-yellow-400')
    );
    expect(starElements.length).toBe(4); // 4 estrellas llenas para rating 4.8
  });

  // Tests de cantidad
  it('should start with quantity 1', () => {
    expect(component.cantidad()).toBe(1);
  });

  it('should increment quantity correctly', () => {
    component.incrementarCantidad();
    expect(component.cantidad()).toBe(2);
  });

  it('should not increment beyond stock limit', () => {
    // Establecer cantidad al máximo stock
    for (let i = 1; i < mockProducto.stock; i++) {
      component.incrementarCantidad();
    }
    expect(component.cantidad()).toBe(mockProducto.stock);

    // Intentar incrementar más allá del stock
    component.incrementarCantidad();
    expect(component.cantidad()).toBe(mockProducto.stock); // No debería cambiar
  });

  it('should decrement quantity correctly', () => {
    component.incrementarCantidad(); // Cantidad = 2
    component.decrementarCantidad(); // Cantidad = 1
    expect(component.cantidad()).toBe(1);
  });

  it('should not decrement below 1', () => {
    expect(component.cantidad()).toBe(1);
    component.decrementarCantidad();
    expect(component.cantidad()).toBe(1); // No debería cambiar
  });

  it('should disable increment button when at stock limit', () => {
    // Simular producto con stock bajo
    const productoStockBajo: Producto = {
      ...mockProducto,
      stock: 2,
    };

    fixture.componentRef.setInput('producto', productoStockBajo);
    component.incrementarCantidad(); // cantidad = 2 = stock
    fixture.detectChanges();

    const buttons = fixture.debugElement.queryAll(By.css('button'));
    const incrementButton = buttons.find((btn) =>
      btn.nativeElement.querySelector(
        'svg path[d*="M12 6v6m0 0v6m0-6h6m-6 0H6"]'
      )
    );

    expect(incrementButton?.nativeElement.disabled).toBeTrue();
  });

  it('should disable decrement button when quantity is 1', () => {
    fixture.detectChanges();

    const buttons = fixture.debugElement.queryAll(By.css('button'));
    const decrementButton = buttons.find((btn) =>
      btn.nativeElement.querySelector('svg path[d*="M20 12H4"]')
    );

    expect(decrementButton?.nativeElement.disabled).toBeTrue();
  });

  // Tests de modal
  it('should emit close event when close modal', () => {
    spyOn(component.close, 'emit');

    component.onCloseModal();

    expect(component.close.emit).toHaveBeenCalled();
    expect(component.cantidad()).toBe(1); // Debería resetear cantidad
  });

  it('should emit agregarCarrito event with correct data', () => {
    spyOn(component.agregarCarrito, 'emit');
    component.incrementarCantidad(); // cantidad = 2

    component.onAgregarCarrito();

    expect(component.agregarCarrito.emit).toHaveBeenCalledWith({
      producto: mockProducto,
      cantidad: 2,
    });
  });

  it('should not add to cart when stock is 0', () => {
    spyOn(component.agregarCarrito, 'emit');

    const productoSinStock: Producto = {
      ...mockProducto,
      stock: 0,
    };

    fixture.componentRef.setInput('producto', productoSinStock);
    fixture.detectChanges();

    component.onAgregarCarrito();

    expect(component.agregarCarrito.emit).not.toHaveBeenCalled();
  });

  it('should disable add to cart button when stock is 0', () => {
    const productoSinStock: Producto = {
      ...mockProducto,
      stock: 0,
    };

    fixture.componentRef.setInput('producto', productoSinStock);
    fixture.detectChanges();

    const addToCartButton = fixture.debugElement.query(
      By.css('.bg-primary-600')
    );
    expect(addToCartButton.attributes['disabled']).toBeDefined();
  });

  it('should show modal when isOpen is true', () => {
    const modalElement = fixture.debugElement.query(By.css('.fixed.inset-0'));
    expect(modalElement).toBeTruthy();
  });

  it('should hide modal when isOpen is false', () => {
    fixture.componentRef.setInput('isOpen', false);
    fixture.detectChanges();

    const modalElement = fixture.debugElement.query(By.css('.fixed.inset-0'));
    expect(modalElement).toBeFalsy();
  });

  it('should prevent event propagation on modal content click', () => {
    const modalContent = fixture.debugElement.query(
      By.css('.bg-white.rounded-xl')
    );
    const event = new Event('click');
    spyOn(event, 'stopPropagation');

    modalContent.triggerEventHandler('click', event);

    expect(event.stopPropagation).toHaveBeenCalled();
  });

  it('should handle productos without optional fields gracefully', () => {
    const productoMinimo: Producto = {
      ...mockProducto,
      descripcion: null,
      marca: null,
      modelo: null,
      garantia: null,
      rating_promedio: undefined,
      imagen_principal: null,
    };

    fixture.componentRef.setInput('producto', productoMinimo);
    fixture.detectChanges();

    // No debería mostrar secciones opcionales
    expect(component.imagenCompleta()).toBe('');

    // Debería mostrar placeholder de imagen
    const placeholderSvg = fixture.debugElement.query(
      By.css('.w-24.h-24.text-gray-400')
    );
    expect(placeholderSvg).toBeTruthy();
  });
});
