import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VariacionesProductoComponent } from './variaciones-producto.component';

describe('VariacionesProductoComponent', () => {
  let component: VariacionesProductoComponent;
  let fixture: ComponentFixture<VariacionesProductoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VariacionesProductoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VariacionesProductoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
