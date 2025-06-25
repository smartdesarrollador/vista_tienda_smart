import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';

import { CategoriasDestacadasComponent } from './categorias-destacadas.component';
import { CategoriasService } from '../../../../../core/services/categorias.service';
import {
  Categoria,
  CategoriaResponse,
} from '../../../../../core/models/categoria.model';

describe('CategoriasDestacadasComponent', () => {
  let component: CategoriasDestacadasComponent;
  let fixture: ComponentFixture<CategoriasDestacadasComponent>;
  let mockCategoriasService: jasmine.SpyObj<CategoriasService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockCategorias: Categoria[] = [
    {
      id: 1,
      nombre: 'Electrónicos',
      slug: 'electronicos',
      descripcion: 'Dispositivos electrónicos y gadgets',
      imagen: '/assets/images/electronicos.jpg',
      activo: true,
      orden: 1,
      categoria_padre_id: null,
      meta_title: 'Electrónicos',
      meta_description: 'Categoría de electrónicos',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      productos_count: 25,
      subcategorias_count: 3,
    },
    {
      id: 2,
      nombre: 'Ropa',
      slug: 'ropa',
      descripcion: 'Ropa y accesorios de moda',
      imagen: '/assets/images/ropa.jpg',
      activo: true,
      orden: 2,
      categoria_padre_id: null,
      meta_title: 'Ropa',
      meta_description: 'Categoría de ropa',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      productos_count: 15,
      subcategorias_count: 2,
    },
  ];

  const mockResponse: CategoriaResponse = {
    data: mockCategorias,
    links: {
      first: 'first',
      last: 'last',
      prev: null,
      next: null,
    },
    meta: {
      current_page: 1,
      from: 1,
      last_page: 1,
      links: [],
      path: '/api/categorias',
      per_page: 10,
      to: 2,
      total: 2,
    },
  };

  beforeEach(async () => {
    const categoriasServiceSpy = jasmine.createSpyObj(
      'CategoriasService',
      ['getCategorias'],
      {
        loading$: of(false),
      }
    );

    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [CategoriasDestacadasComponent],
      providers: [
        { provide: CategoriasService, useValue: categoriasServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoriasDestacadasComponent);
    component = fixture.componentInstance;
    mockCategoriasService = TestBed.inject(
      CategoriasService
    ) as jasmine.SpyObj<CategoriasService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load categories on init', () => {
    mockCategoriasService.getCategorias.and.returnValue(of(mockResponse));

    component.ngOnInit();

    expect(mockCategoriasService.getCategorias).toHaveBeenCalledWith({
      activo: true,
      categoria_padre_id: undefined,
      sort_by: 'orden',
      sort_direction: 'asc',
      per_page: 12,
    });
  });

  it('should display categories when loaded successfully', () => {
    mockCategoriasService.getCategorias.and.returnValue(of(mockResponse));

    component.ngOnInit();
    fixture.detectChanges();

    const categoryCards =
      fixture.nativeElement.querySelectorAll('app-categoria-card');
    expect(categoryCards.length).toBe(2);
  });

  it('should show loading state', () => {
    // Simular estado de carga
    component['loading'].set(true);
    fixture.detectChanges();

    const loadingElements =
      fixture.nativeElement.querySelectorAll('.animate-pulse');
    expect(loadingElements.length).toBe(5); // 5 skeleton items
  });

  it('should show error state when service fails', () => {
    const errorMessage = 'Error de red';
    mockCategoriasService.getCategorias.and.returnValue(
      throwError(() => new Error(errorMessage))
    );

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.hasError()).toBe(true);
    expect(component.errorMessage()).toContain(
      'No se pudieron cargar las categorías'
    );
  });

  it('should show empty state when no categories available', () => {
    const emptyResponse: CategoriaResponse = {
      ...mockResponse,
      data: [],
    };
    mockCategoriasService.getCategorias.and.returnValue(of(emptyResponse));

    component.ngOnInit();
    fixture.detectChanges();

    const emptyStateText = fixture.nativeElement.querySelector('h3');
    expect(emptyStateText?.textContent?.trim()).toBe(
      'No hay categorías disponibles'
    );
  });

  it('should navigate to products when category is clicked', () => {
    const categoria = mockCategorias[0];

    component.onCategoriaClick(categoria);

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/productos'], {
      queryParams: { categoria: categoria.slug },
    });
  });

  it('should navigate to products when explore button is clicked', () => {
    const categoria = mockCategorias[0];

    component.onExploreCategoria(categoria);

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/productos'], {
      queryParams: { categoria: categoria.slug },
    });
  });

  it('should navigate to all categories page', () => {
    component.onVerTodasCategorias();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/categorias']);
  });

  it('should reload categories when retry button is clicked', () => {
    mockCategoriasService.getCategorias.and.returnValue(of(mockResponse));

    component.recargarCategorias();

    expect(mockCategoriasService.getCategorias).toHaveBeenCalled();
  });

  it('should filter and limit categories to 5 main categories', () => {
    const manyCategories: Categoria[] = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      nombre: `Categoria ${i + 1}`,
      slug: `categoria-${i + 1}`,
      descripcion: `Descripción ${i + 1}`,
      imagen: null,
      activo: true,
      orden: i + 1,
      categoria_padre_id: null,
      meta_title: null,
      meta_description: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      productos_count: 10,
      subcategorias_count: 0,
    }));

    const manyResponse: CategoriaResponse = {
      ...mockResponse,
      data: manyCategories,
    };

    mockCategoriasService.getCategorias.and.returnValue(of(manyResponse));
    component.ngOnInit();

    expect(component.categoriasDestacadas().length).toBe(5);
  });

  it('should use trackBy function correctly', () => {
    const categoria = mockCategorias[0];
    const result = component.trackByCategoria(0, categoria);

    expect(result).toBe(categoria.id);
  });

  it('should filter out inactive categories', () => {
    const categoriesWithInactive: Categoria[] = [
      ...mockCategorias,
      {
        id: 3,
        nombre: 'Categoria Inactiva',
        slug: 'categoria-inactiva',
        descripcion: null,
        imagen: null,
        activo: false, // Inactiva
        orden: 3,
        categoria_padre_id: null,
        meta_title: null,
        meta_description: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    const responseWithInactive: CategoriaResponse = {
      ...mockResponse,
      data: categoriesWithInactive,
    };

    mockCategoriasService.getCategorias.and.returnValue(
      of(responseWithInactive)
    );
    component.ngOnInit();

    // Solo debe mostrar las 2 categorías activas
    expect(component.categoriasDestacadas().length).toBe(2);
    expect(component.categoriasDestacadas().every((cat) => cat.activo)).toBe(
      true
    );
  });

  it('should filter out subcategories', () => {
    const categoriesWithSubcategories: Categoria[] = [
      ...mockCategorias,
      {
        id: 4,
        nombre: 'Subcategoria',
        slug: 'subcategoria',
        descripcion: null,
        imagen: null,
        activo: true,
        orden: 4,
        categoria_padre_id: 1, // Es subcategoría
        meta_title: null,
        meta_description: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    const responseWithSubcategories: CategoriaResponse = {
      ...mockResponse,
      data: categoriesWithSubcategories,
    };

    mockCategoriasService.getCategorias.and.returnValue(
      of(responseWithSubcategories)
    );
    component.ngOnInit();

    // Solo debe mostrar las 2 categorías principales
    expect(component.categoriasDestacadas().length).toBe(2);
    expect(
      component
        .categoriasDestacadas()
        .every((cat) => cat.categoria_padre_id === null)
    ).toBe(true);
  });

  it('should return all categories when there are 5 or less', () => {
    const fewCategories: Categoria[] = Array.from({ length: 3 }, (_, i) => ({
      id: i + 1,
      nombre: `Categoria ${i + 1}`,
      slug: `categoria-${i + 1}`,
      descripcion: `Descripción ${i + 1}`,
      imagen: null,
      activo: true,
      orden: i + 1,
      categoria_padre_id: null,
      meta_title: null,
      meta_description: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      productos_count: 10,
      subcategorias_count: 0,
    }));

    const fewResponse: CategoriaResponse = {
      ...mockResponse,
      data: fewCategories,
    };

    mockCategoriasService.getCategorias.and.returnValue(of(fewResponse));
    component.ngOnInit();

    expect(component.categoriasDestacadas().length).toBe(3);
  });

  it('should shuffle categories when there are more than 5', () => {
    const manyCategories: Categoria[] = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      nombre: `Categoria ${i + 1}`,
      slug: `categoria-${i + 1}`,
      descripcion: `Descripción ${i + 1}`,
      imagen: null,
      activo: true,
      orden: i + 1,
      categoria_padre_id: null,
      meta_title: null,
      meta_description: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      productos_count: 10,
      subcategorias_count: 0,
    }));

    const manyResponse: CategoriaResponse = {
      ...mockResponse,
      data: manyCategories,
    };

    // Simular Math.random para testing determinístico
    const originalRandom = Math.random;
    const mockRandom = jasmine
      .createSpy('random')
      .and.returnValues(0.5, 0.3, 0.8, 0.2, 0.7, 0.1, 0.9, 0.4, 0.6);
    Math.random = mockRandom;

    mockCategoriasService.getCategorias.and.returnValue(of(manyResponse));
    component.ngOnInit();

    const result = component.categoriasDestacadas();

    expect(result.length).toBe(5);
    expect(mockRandom).toHaveBeenCalled();

    // Restaurar Math.random original
    Math.random = originalRandom;
  });

  it('should call getCategorias with increased per_page for better randomization', () => {
    mockCategoriasService.getCategorias.and.returnValue(of(mockResponse));

    component.ngOnInit();

    expect(mockCategoriasService.getCategorias).toHaveBeenCalledWith({
      activo: true,
      categoria_padre_id: undefined,
      sort_by: 'orden',
      sort_direction: 'asc',
      per_page: 20,
    });
  });
});
