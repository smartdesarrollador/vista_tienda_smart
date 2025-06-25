# Componente Inicio - Página Principal

## 📋 Descripción

Componente principal de la página de inicio de la tienda virtual. Muestra las secciones más importantes para atraer y orientar a los usuarios hacia los productos y categorías destacadas.

## 🎯 Funcionalidades Principales

### 1. **Banner Carousel**

- Carrusel principal con banners promocionales
- Imágenes de alta calidad para campañas destacadas
- Enlaces directo a productos o categorías específicas

### 2. **Categorías Destacadas**

- Grid responsive de categorías principales
- 5 categorías seleccionadas aleatoriamente
- Navegación directa al catálogo filtrado
- Optimizado con Fisher-Yates shuffle algorithm

### 3. **Productos Destacados** ⭐

- **Carrusel horizontal** con productos destacados
- **4 productos visibles** simultáneamente en desktop
- **Modal de vista rápida** con ProductoDetailComponent
- **Sistema de descuentos** y precios dinámicos
- **Navegación fluida** con indicadores de página

### 4. **Sección de Bienvenida**

- Mensaje personalizado para nuevos usuarios
- Call-to-action para explorar productos

## 🔧 Implementación Técnica

### Arquitectura Angular 18

```typescript
@Component({
  selector: "app-inicio",
  standalone: true,
  imports: [
    RouterOutlet,
    BannerCarouselComponent,
    CategoriasDestacadasComponent,
    ProductosDestacadosComponent, // ⭐ Nuevo componente integrado
  ],
  templateUrl: "./inicio.component.html",
  styleUrl: "./inicio.component.css",
})
export class InicioComponent {}
```

### Estructura de Template

```html
<!-- 1. Banner Principal -->
<div class="w-screen overflow-hidden">
  <app-banner-carousel class="w-full block"></app-banner-carousel>
</div>

<!-- 2. Categorías Destacadas -->
<app-categorias-destacadas></app-categorias-destacadas>

<!-- 3. Productos Destacados ⭐ -->
<app-productos-destacados></app-productos-destacados>

<!-- 4. Contenido de Bienvenida -->
<div class="container mx-auto pt-4 px-4">
  <!-- Mensaje de bienvenida -->
</div>
```

## ✨ Características de Productos Destacados

### **Carrusel Avanzado**

- **4 productos visibles** en desktop
- **Navegación con flechas** izquierda/derecha
- **Indicadores de página** en la parte inferior
- **Transiciones suaves** con CSS transforms
- **Responsive design** adaptable

### **Product Cards Interactivas**

- **Hover effects** con overlay de botones
- **Badges de descuento** visualmente atractivos
- **Badge "Destacado"** para identificación
- **Información de stock** en tiempo real
- **Sistema de calificaciones** con estrellas

### **Modal de Detalle Rápido**

- **Vista completa del producto** sin navegar
- **Selector de cantidad** interactivo
- **Cálculo automático** de descuentos
- **Información detallada** (marca, modelo, garantía)
- **Gestión de stock** en tiempo real
- **Botón agregar al carrito** funcional

### **Sistema de Precios Inteligente**

- **Detección automática** de productos en oferta
- **Cálculo de porcentajes** de descuento
- **Visualización clara** precio original vs oferta
- **Badges visuales** para descuentos destacados

## 🎨 Diseño y UX

### **Estados Visuales**

1. **Loading State**: Skeleton animado con 4 placeholders
2. **Productos Cargados**: Carrusel interactivo completo
3. **Estado Vacío**: Mensaje amigable cuando no hay productos
4. **Estado de Error**: Mensaje de error con botón de reintento

### **Responsive Design**

- **Desktop (1280px+)**: 4 productos visibles
- **Tablet (768px-1023px)**: 3 productos visibles
- **Mobile (640px-767px)**: 2 productos visibles
- **Mobile Small (<640px)**: 1 producto visible

## 🧪 Testing

### **Tests Implementados**

- ✅ Verificación de creación del componente
- ✅ Presencia de banner carousel
- ✅ Presencia de categorías destacadas
- ✅ **Presencia de productos destacados** ⭐
- ✅ Visualización de sección de bienvenida
- ✅ **Orden correcto de componentes**

### **Ejemplo de Test**

```typescript
it("should contain productos destacados component", () => {
  const productosElement = fixture.debugElement.query(By.css("app-productos-destacados"));
  expect(productosElement).toBeTruthy();
});

it("should have correct component order", () => {
  const sections = fixture.debugElement.queryAll(By.css("app-banner-carousel, app-categorias-destacadas, app-productos-destacados"));

  expect(sections[0].name).toBe("app-banner-carousel");
  expect(sections[1].name).toBe("app-categorias-destacadas");
  expect(sections[2].name).toBe("app-productos-destacados");
});
```

## 📊 Performance y Optimización

### **Optimizaciones Implementadas**

- **Lazy loading** de imágenes en todos los componentes
- **Computed signals** para cálculos reactivos eficientes
- **TrackBy functions** para renderizado optimizado
- **SSR compatible** con takeUntilDestroyed
- **Estados de loading** con skeletons animados

### **Métricas Objetivo**

- **Tiempo de carga inicial**: < 2 segundos
- **LCP (Largest Contentful Paint)**: < 2.5 segundos
- **CLS (Cumulative Layout Shift)**: < 0.1
- **FID (First Input Delay)**: < 100ms

## 🚀 Funcionalidades Futuras

### **Mejoras Planeadas**

- [ ] **Auto-play** configurable para el carrusel de productos
- [ ] **Gestos touch** para navegación en móviles
- [ ] **Productos vistos recientemente**
- [ ] **Recomendaciones personalizadas**
- [ ] **Integración con sistema de carrito** completo
- [ ] **Analytics y tracking** de interacciones
- [ ] **A/B testing** para optimizar conversiones

### **Integración con Servicios**

- [ ] **CarritoService**: Funcionalidad completa de carrito
- [ ] **UsuarioService**: Personalización según usuario
- [ ] **AnalyticsService**: Seguimiento de interacciones
- [ ] **RecomendacionesService**: Productos sugeridos

## 🔗 Dependencias

### **Componentes Relacionados**

- `BannerCarouselComponent`: Carrusel principal de banners
- `CategoriasDestacadasComponent`: Grid de categorías
- `ProductosDestacadosComponent`: **Carrusel de productos** ⭐
- `ProductoDetailComponent`: **Modal de vista rápida** ⭐

### **Servicios Utilizados**

- `ProductoService`: Carga de productos destacados
- `CategoriasService`: Carga de categorías destacadas

## 🎯 Resultado Final

La página de inicio ahora presenta una experiencia completa y moderna con:

✅ **Banner principal** atractivo y promocional  
✅ **5 categorías destacadas** con selección aleatoria  
✅ **Carrusel de productos destacados** con funcionalidad completa ⭐  
✅ **Modal de vista rápida** para experiencia fluida ⭐  
✅ **Diseño responsive** y optimizado  
✅ **Performance optimizada** con lazy loading  
✅ **Compatibilidad SSR** para SEO

La integración de productos destacados convierte la página de inicio en un portal de ventas efectivo que guía a los usuarios desde el descubrimiento hasta la acción de compra.
