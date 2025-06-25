import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductosRelacionadosComponent } from './productos-relacionados.component';

describe('ProductosRelacionadosComponent', () => {
  let component: ProductosRelacionadosComponent;
  let fixture: ComponentFixture<ProductosRelacionadosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductosRelacionadosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductosRelacionadosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
