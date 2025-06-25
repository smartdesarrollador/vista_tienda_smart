import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BadgeDescuentoComponent } from './badge-descuento.component';
import { Component, input } from '@angular/core';

// Mock Host Component para probar inputs
@Component({
  template: `
    <app-badge-descuento
      [precioOriginal]="precioOriginal()"
      [precioOferta]="precioOferta()"
      [mostrarTexto]="mostrarTexto()"
      [sinRotacion]="sinRotacion()"
    />
  `,
  standalone: true,
  imports: [BadgeDescuentoComponent],
})
class TestHostComponent {
  precioOriginal = input.required<number>();
  precioOferta = input.required<number>();
  mostrarTexto = input<boolean>(true);
  sinRotacion = input<boolean>(false);
}

describe('BadgeDescuentoComponent', () => {
  let component: BadgeDescuentoComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;
  let compiled: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeDescuentoComponent, TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    // Acceder al componente hijo
    component = fixture.debugElement.children[0].componentInstance;
    compiled = fixture.nativeElement;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('no debería mostrar nada si no hay descuento', () => {
    fixture.componentRef.setInput('precioOriginal', 100);
    fixture.componentRef.setInput('precioOferta', 100);
    fixture.detectChanges();
    const badgeElement = compiled.querySelector('.badge-descuento');
    expect(badgeElement).toBeNull();
  });

  it('debería mostrar el badge si hay descuento', () => {
    fixture.componentRef.setInput('precioOriginal', 100);
    fixture.componentRef.setInput('precioOferta', 80);
    fixture.detectChanges();
    const badgeElement = compiled.querySelector('.badge-descuento');
    expect(badgeElement).toBeTruthy();
  });

  it('debería calcular el porcentaje de descuento correctamente', () => {
    fixture.componentRef.setInput('precioOriginal', 100);
    fixture.componentRef.setInput('precioOferta', 75);
    fixture.detectChanges();
    expect(component.porcentajeDescuento()).toBe(25);
    const porcentajeElement = compiled.querySelector('.porcentaje');
    expect(porcentajeElement?.textContent).toContain('-25%');
  });

  it('debería redondear el porcentaje de descuento', () => {
    fixture.componentRef.setInput('precioOriginal', 30);
    fixture.componentRef.setInput('precioOferta', 20);
    fixture.detectChanges(); // (10 / 30) * 100 = 33.33... -> 33
    expect(component.porcentajeDescuento()).toBe(33);
    const porcentajeElement = compiled.querySelector('.porcentaje');
    expect(porcentajeElement?.textContent).toContain('-33%');
  });

  it('debería aplicar la clase de nivel de descuento correcta - pequeno', () => {
    fixture.componentRef.setInput('precioOriginal', 100);
    fixture.componentRef.setInput('precioOferta', 90); // 10%
    fixture.detectChanges();
    expect(component.nivelDescuento()).toBe('pequeno');
    const badgeElement = compiled.querySelector('.badge-descuento');
    expect(badgeElement?.classList).toContain('descuento-pequeno');
  });

  it('debería aplicar la clase de nivel de descuento correcta - mediano', () => {
    fixture.componentRef.setInput('precioOriginal', 100);
    fixture.componentRef.setInput('precioOferta', 80); // 20%
    fixture.detectChanges();
    expect(component.nivelDescuento()).toBe('mediano');
    const badgeElement = compiled.querySelector('.badge-descuento');
    expect(badgeElement?.classList).toContain('descuento-mediano');
  });

  it('debería aplicar la clase de nivel de descuento correcta - grande', () => {
    fixture.componentRef.setInput('precioOriginal', 100);
    fixture.componentRef.setInput('precioOferta', 60); // 40%
    fixture.detectChanges();
    expect(component.nivelDescuento()).toBe('grande');
    const badgeElement = compiled.querySelector('.badge-descuento');
    expect(badgeElement?.classList).toContain('descuento-grande');
  });

  it('debería aplicar la clase de nivel de descuento correcta - mega', () => {
    fixture.componentRef.setInput('precioOriginal', 100);
    fixture.componentRef.setInput('precioOferta', 40); // 60%
    fixture.detectChanges();
    expect(component.nivelDescuento()).toBe('mega');
    const badgeElement = compiled.querySelector('.badge-descuento');
    expect(badgeElement?.classList).toContain('descuento-mega');
  });

  it('debería mostrar texto de descuento si mostrarTexto es true y el porcentaje es >= 15%', () => {
    fixture.componentRef.setInput('precioOriginal', 100);
    fixture.componentRef.setInput('precioOferta', 80); // 20%
    fixture.componentRef.setInput('mostrarTexto', true);
    fixture.detectChanges();
    const textoElement = compiled.querySelector('.texto-descuento');
    expect(textoElement).toBeTruthy();
    expect(textoElement?.textContent).toContain('¡OFERTA!');
  });

  it('NO debería mostrar texto de descuento si mostrarTexto es false', () => {
    fixture.componentRef.setInput('precioOriginal', 100);
    fixture.componentRef.setInput('precioOferta', 80);
    fixture.componentRef.setInput('mostrarTexto', false);
    fixture.detectChanges();
    const textoElement = compiled.querySelector('.texto-descuento');
    expect(textoElement).toBeNull();
  });

  it('NO debería mostrar texto de descuento si el porcentaje es < 15%', () => {
    fixture.componentRef.setInput('precioOriginal', 100);
    fixture.componentRef.setInput('precioOferta', 90); // 10%
    fixture.componentRef.setInput('mostrarTexto', true);
    fixture.detectChanges();
    const textoElement = compiled.querySelector('.texto-descuento');
    expect(textoElement).toBeNull();
  });

  it('debería obtener el texto de descuento correcto', () => {
    fixture.componentRef.setInput('precioOriginal', 100);
    fixture.componentRef.setInput('precioOferta', 40); // 60% -> MEGA
    fixture.detectChanges();
    expect(component.getTextoDescuento()).toBe('¡MEGA OFERTA!');

    fixture.componentRef.setInput('precioOferta', 60); // 40% -> SÚPER
    fixture.detectChanges();
    expect(component.getTextoDescuento()).toBe('¡SÚPER OFERTA!');

    fixture.componentRef.setInput('precioOferta', 80); // 20% -> OFERTA
    fixture.detectChanges();
    expect(component.getTextoDescuento()).toBe('¡OFERTA!');
  });

  it('debería añadir clase sin-rotacion si sinRotacion es true', () => {
    fixture.componentRef.setInput('precioOriginal', 100);
    fixture.componentRef.setInput('precioOferta', 80);
    fixture.componentRef.setInput('sinRotacion', true);
    fixture.detectChanges();
    const badgeElement = compiled.querySelector('.badge-descuento');
    expect(badgeElement?.classList).toContain('sin-rotacion');
  });

  it('NO debería añadir clase sin-rotacion si sinRotacion es false', () => {
    fixture.componentRef.setInput('precioOriginal', 100);
    fixture.componentRef.setInput('precioOferta', 80);
    fixture.componentRef.setInput('sinRotacion', false);
    fixture.detectChanges();
    const badgeElement = compiled.querySelector('.badge-descuento');
    expect(badgeElement?.classList).not.toContain('sin-rotacion');
  });

  it('debería mostrar estrella de decoración para descuentos grandes (>=30%)', () => {
    fixture.componentRef.setInput('precioOriginal', 100);
    fixture.componentRef.setInput('precioOferta', 70);
    fixture.detectChanges(); // 30%
    let estrella = compiled.querySelector('.decoracion-estrella');
    expect(estrella).toBeTruthy();

    fixture.componentRef.setInput('precioOferta', 50); // 50%
    fixture.detectChanges();
    estrella = compiled.querySelector('.decoracion-estrella');
    expect(estrella).toBeTruthy();
  });

  it('NO debería mostrar estrella de decoración para descuentos menores a 30%', () => {
    fixture.componentRef.setInput('precioOriginal', 100);
    fixture.componentRef.setInput('precioOferta', 71);
    fixture.detectChanges(); // 29%
    const estrella = compiled.querySelector('.decoracion-estrella');
    expect(estrella).toBeNull();
  });

  it('debería manejar precioOferta igual a 0 como sin descuento', () => {
    fixture.componentRef.setInput('precioOriginal', 100);
    fixture.componentRef.setInput('precioOferta', 0);
    fixture.detectChanges();
    expect(component.tieneDescuento()).toBeFalse();
    const badgeElement = compiled.querySelector('.badge-descuento');
    expect(badgeElement).toBeNull();
  });

  it('debería manejar precioOferta mayor que precioOriginal como sin descuento', () => {
    fixture.componentRef.setInput('precioOriginal', 100);
    fixture.componentRef.setInput('precioOferta', 120);
    fixture.detectChanges();
    expect(component.tieneDescuento()).toBeFalse();
    const badgeElement = compiled.querySelector('.badge-descuento');
    expect(badgeElement).toBeNull();
  });
});
