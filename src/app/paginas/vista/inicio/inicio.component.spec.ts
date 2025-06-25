import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { InicioComponent } from './inicio.component';
import { ProductoService } from '../../../core/services/producto.service';
import { of } from 'rxjs';

describe('InicioComponent', () => {
  let component: InicioComponent;
  let fixture: ComponentFixture<InicioComponent>;
  let mockProductoService: jasmine.SpyObj<ProductoService>;

  beforeEach(async () => {
    const spyProductoService = jasmine.createSpyObj('ProductoService', [
      'getProductosDestacados',
    ]);

    await TestBed.configureTestingModule({
      imports: [InicioComponent],
      providers: [{ provide: ProductoService, useValue: spyProductoService }],
    }).compileComponents();

    fixture = TestBed.createComponent(InicioComponent);
    component = fixture.componentInstance;
    mockProductoService = TestBed.inject(
      ProductoService
    ) as jasmine.SpyObj<ProductoService>;

    // Mock básico para productos destacados
    mockProductoService.getProductosDestacados.and.returnValue(of([]));

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should contain banner carousel component', () => {
    const bannerElement = fixture.debugElement.query(
      By.css('app-banner-carousel')
    );
    expect(bannerElement).toBeTruthy();
  });

  it('should contain categorias destacadas component', () => {
    const categoriasElement = fixture.debugElement.query(
      By.css('app-categorias-destacadas')
    );
    expect(categoriasElement).toBeTruthy();
  });

  it('should contain productos destacados component', () => {
    const productosElement = fixture.debugElement.query(
      By.css('app-productos-destacados')
    );
    expect(productosElement).toBeTruthy();
  });

  it('should display welcome section', () => {
    const welcomeHeading = fixture.debugElement.query(By.css('h2'));
    expect(welcomeHeading.nativeElement.textContent).toContain(
      'Bienvenido a nuestra plataforma'
    );
  });

  it('should have correct component order', () => {
    const sections = fixture.debugElement.queryAll(
      By.css(
        'app-banner-carousel, app-categorias-destacadas, app-productos-destacados'
      )
    );

    expect(sections[0].name).toBe('app-banner-carousel');
    expect(sections[1].name).toBe('app-categorias-destacadas');
    expect(sections[2].name).toBe('app-productos-destacados');
  });
});
