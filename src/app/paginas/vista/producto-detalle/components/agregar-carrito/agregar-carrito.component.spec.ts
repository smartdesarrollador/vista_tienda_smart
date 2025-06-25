import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgregarCarritoComponent } from './agregar-carrito.component';

describe('AgregarCarritoComponent', () => {
  let component: AgregarCarritoComponent;
  let fixture: ComponentFixture<AgregarCarritoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgregarCarritoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgregarCarritoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
