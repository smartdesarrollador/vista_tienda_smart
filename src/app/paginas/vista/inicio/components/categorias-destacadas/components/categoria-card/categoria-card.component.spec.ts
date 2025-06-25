import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

import { CategoriaCardComponent } from './categoria-card.component';
import { Categoria } from '../../../../../../../core/models/categoria.model';

describe('CategoriaCardComponent', () => {
  let component: CategoriaCardComponent;
  let fixture: ComponentFixture<CategoriaCardComponent>;

  const mockCategoria: Categoria = {
    id: 1,
    nombre: 'Electrónicos',
    slug: 'electronicos',
    descripcion: 'Dispositivos electrónicos y gadgets',
    imagen: '/assets/categorias/electronicos.jpg',
    activo: true,
    orden: 1,
    categoria_padre_id: null,
    meta_title: 'Electrónicos',
    meta_description: 'Categoría de electrónicos',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    productos_count: 25,
    subcategorias_count: 3,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoriaCardComponent, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoriaCardComponent);
    component = fixture.componentInstance;

    // Configurar el input requerido
    fixture.componentRef.setInput('categoria', mockCategoria);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display category name', () => {
    const nameElement = fixture.debugElement.query(By.css('h3'));
    expect(nameElement.nativeElement.textContent.trim()).toBe('Electrónicos');
  });

  it('should display category description when provided', () => {
    const descriptionElement = fixture.debugElement.query(By.css('p'));
    expect(descriptionElement.nativeElement.textContent.trim()).toBe(
      'Dispositivos electrónicos y gadgets'
    );
  });

  it('should display product count', () => {
    const productCountElements = fixture.debugElement.queryAll(
      By.css('.text-xs span')
    );
    expect(productCountElements[0].nativeElement.textContent.trim()).toBe(
      '25 productos'
    );
  });

  it('should display subcategories count when available', () => {
    const subcategoriesElements = fixture.debugElement.queryAll(
      By.css('.text-xs span')
    );
    expect(subcategoriesElements[1].nativeElement.textContent.trim()).toBe(
      '3 subcategorías'
    );
  });

  it('should generate complete image URL with domain', () => {
    // Verificar que la URL se genere correctamente (asumiendo environment local)
    const result = component.imagenCompleta();
    expect(result).toContain('/assets/categorias/electronicos.jpg');
  });

  it('should handle image URLs that already have protocol', () => {
    const categoriaWithFullUrl: Categoria = {
      ...mockCategoria,
      imagen: 'https://example.com/image.jpg',
    };

    fixture.componentRef.setInput('categoria', categoriaWithFullUrl);
    fixture.detectChanges();

    expect(component.imagenCompleta()).toBe('https://example.com/image.jpg');
  });

  it('should handle image paths without leading slash', () => {
    const categoriaWithRelativePath: Categoria = {
      ...mockCategoria,
      imagen: 'assets/categorias/test.jpg',
    };

    fixture.componentRef.setInput('categoria', categoriaWithRelativePath);
    fixture.detectChanges();

    const result = component.imagenCompleta();
    expect(result).toContain('/assets/categorias/test.jpg');
  });

  it('should return empty string when no image provided', () => {
    const categoriaWithoutImage: Categoria = {
      ...mockCategoria,
      imagen: null,
    };

    fixture.componentRef.setInput('categoria', categoriaWithoutImage);
    fixture.detectChanges();

    expect(component.imagenCompleta()).toBe('');
  });

  it('should show fallback SVG when no image is provided', () => {
    const categoriaWithoutImage: Categoria = {
      ...mockCategoria,
      imagen: null,
    };

    fixture.componentRef.setInput('categoria', categoriaWithoutImage);
    fixture.detectChanges();

    const svgElement = fixture.debugElement.query(By.css('svg'));
    expect(svgElement).toBeTruthy();
  });

  it('should show image when image is provided', () => {
    const imgElement = fixture.debugElement.query(By.css('img'));
    expect(imgElement).toBeTruthy();
  });

  it('should show product count badge when products exist', () => {
    const badgeElement = fixture.debugElement.query(By.css('.bg-white'));
    expect(badgeElement).toBeTruthy();
    expect(badgeElement.nativeElement.textContent).toContain('25 productos');
  });

  it('should not show product count badge when no products', () => {
    const categoriaWithoutProducts: Categoria = {
      ...mockCategoria,
      productos_count: 0,
    };

    fixture.componentRef.setInput('categoria', categoriaWithoutProducts);
    fixture.detectChanges();

    // Buscar específicamente el badge que debe mostrar el conteo de productos
    const badgeElement = fixture.debugElement.query(
      By.css('.absolute.top-3.right-3')
    );
    expect(badgeElement).toBeFalsy();
  });

  it('should emit cardClick when card is clicked', () => {
    spyOn(component.cardClick, 'emit');

    component.onCardClick();

    expect(component.cardClick.emit).toHaveBeenCalledWith(mockCategoria);
  });

  it('should emit exploreClick when explore button is clicked', () => {
    spyOn(component.exploreClick, 'emit');

    const clickEvent = new Event('click');
    spyOn(clickEvent, 'preventDefault');
    spyOn(clickEvent, 'stopPropagation');

    component.onExploreClick(clickEvent);

    expect(clickEvent.preventDefault).toHaveBeenCalled();
    expect(clickEvent.stopPropagation).toHaveBeenCalled();
    expect(component.exploreClick.emit).toHaveBeenCalledWith(mockCategoria);
  });

  it('should have correct router link with query params', () => {
    const linkElement = fixture.debugElement.query(By.css('a'));
    expect(linkElement.attributes['ng-reflect-router-link']).toBe('/productos');
  });

  it('should have correct aria-label for accessibility', () => {
    const linkElement = fixture.debugElement.query(By.css('a'));
    expect(linkElement.attributes['aria-label']).toBe(
      'Ver productos de Electrónicos'
    );
  });

  it('should handle undefined product count gracefully', () => {
    const categoriaWithUndefinedCount: Categoria = {
      ...mockCategoria,
      productos_count: undefined,
    };

    fixture.componentRef.setInput('categoria', categoriaWithUndefinedCount);
    fixture.detectChanges();

    const productCountElements = fixture.debugElement.queryAll(
      By.css('.text-xs span')
    );
    expect(productCountElements[0].nativeElement.textContent.trim()).toBe(
      '0 productos'
    );
  });

  it('should handle undefined subcategories count gracefully', () => {
    const categoriaWithUndefinedSubCount: Categoria = {
      ...mockCategoria,
      subcategorias_count: undefined,
    };

    fixture.componentRef.setInput('categoria', categoriaWithUndefinedSubCount);
    fixture.detectChanges();

    const subcategoriesElements = fixture.debugElement.queryAll(
      By.css('.text-xs span')
    );
    // Solo debe haber un span (productos), no el de subcategorías
    expect(subcategoriesElements.length).toBe(1);
  });
});
