import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResenasProductoComponent } from './resenas-producto.component';

describe('ResenasProductoComponent', () => {
  let component: ResenasProductoComponent;
  let fixture: ComponentFixture<ResenasProductoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResenasProductoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResenasProductoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
