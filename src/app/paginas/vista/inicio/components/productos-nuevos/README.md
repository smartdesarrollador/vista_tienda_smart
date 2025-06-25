# Componente ProductosNuevos

## 📋 Descripción

El componente `ProductosNuevosComponent` es responsable de mostrar los productos más recientes agregados al catálogo de la tienda virtual. Forma parte de la página de inicio y presenta los últimos productos en un diseño atractivo con información clave.

## 🎯 Funcionalidades Principales

### ✨ Características

- **Grid Responsive**: Adaptación automática a diferentes tamaños de pantalla
- **Badge "NUEVO"**: Distintivo visual que identifica productos recientes
- **Fecha Relativa**: Muestra cuándo fue agregado el producto (ej: "hace 2 días")
- **Estados de Stock**: Indicadores visuales del nivel de inventario
- **Descuentos**: Muestra badges de descuento cuando aplica
- **Navegación**: Enlaces directos al detalle del producto
- **Estados de Carga**: Skeleton loading mientras cargan los datos
- **Manejo de Errores**: UI amigable para estados de error
- **Estado Vacío**: Mensaje motivacional cuando no hay productos

### 🔧 Funcionalidades Técnicas

- **Angular 18 + SSR**: Componente standalone optimizado para Server Side Rendering
- **Signals**: Gestión de estado reactivo con Angular Signals
- **Lazy Loading**: Carga diferida de imágenes para mejor performance
- **TrackBy Function**: Optimización del renderizado de listas
- **Error Handling**: Manejo robusto de errores de API
- **TypeScript Strict**: Tipado estricto completo

## 🛠️ Implementación

### Estructura de Archivos

```
productos-nuevos/
├── productos-nuevos.component.ts      # Lógica principal
├── productos-nuevos.component.html    # Template (inline)
├── productos-nuevos.component.css     # Estilos específicos
├── productos-nuevos.component.spec.ts # Pruebas unitarias
└── README.md                          # Documentación
```

### Dependencias

```typescript
// Servicios
ProductoService; // Obtención de productos desde API
Router; // Navegación entre páginas

// Angular Core
inject(); // Inyección de dependencias
signal(); // Estado reactivo
computed(); // Valores derivados
DestroyRef; // Limpieza automática
takeUntilDestroyed; // Manejo de suscripciones
```

### Configuración de Filtros

```typescript
const filters = {
  activo: true, // Solo productos activos
  order_by: "created_at", // Ordenar por fecha de creación
  order_direction: "desc", // Más recientes primero
  per_page: 8, // Máximo 8 productos
  include_stats: true, // Incluir estadísticas
};
```

## 🎨 Diseño y UX

### Paleta de Colores

- **Color Principal**: Emerald (Verde) - `#10b981`
- **Estados de Stock**:
  - Alto: Verde (`#059669`)
  - Medio: Ámbar (`#d97706`)
  - Bajo/Agotado: Rojo (`#dc2626`)
- **Descuentos**: Rojo (`#ef4444`)

### Responsive Design

```css
/* Móvil: 1 columna */
@media (max-width: 640px) {
  grid-template-columns: repeat(1, 1fr);
}

/* Tablet: 2 columnas */
@media (641px - 768px) {
  grid-template-columns: repeat(2, 1fr);
}

/* Desktop pequeño: 3 columnas */
@media (769px - 1024px) {
  grid-template-columns: repeat(3, 1fr);
}

/* Desktop grande: 4 columnas */
@media (1025px+) {
  grid-template-columns: repeat(4, 1fr);
}
```

### Estados Visuales

1. **Loading State**: Skeleton loading con 8 placeholders
2. **Error State**: Mensaje de error con botón de reintentar
3. **Empty State**: Mensaje motivacional con CTA al catálogo
4. **Success State**: Grid de productos con información completa

## 📱 Interacciones de Usuario

### Eventos Principales

| Acción            | Método                  | Descripción                        |
| ----------------- | ----------------------- | ---------------------------------- |
| Click en producto | `onProductoClick()`     | Navega al detalle del producto     |
| Vista rápida      | `onQuickView()`         | Abre modal de vista rápida (TODO)  |
| Agregar carrito   | `onAgregarCarrito()`    | Agrega producto al carrito (TODO)  |
| Ver todos         | `onVerTodosProductos()` | Navega al catálogo filtrado        |
| Ver catálogo      | `onVerCatalogo()`       | Navega al catálogo general         |
| Reintentar        | `recargarProductos()`   | Recarga productos en caso de error |

### Navegación

```typescript
// Detalle de producto
/producto/:slug

// Catálogo con filtro de nuevos
/productos?orden=recientes&page=1

// Catálogo general
/productos
```

## 🧪 Testing

### Cobertura de Pruebas

- ✅ Creación del componente
- ✅ Inicialización y carga de datos
- ✅ Manejo de estados (loading, error, success, empty)
- ✅ Computed signals
- ✅ Funciones de utilidad (trackBy, imagen, descuentos, fechas)
- ✅ Interacciones de usuario
- ✅ Renderizado del template
- ✅ Casos edge (productos sin imagen, sin stock, etc.)

### Ejecutar Pruebas

```bash
# Pruebas unitarias
ng test --include="**/productos-nuevos.component.spec.ts"

# Con cobertura
ng test --code-coverage --include="**/productos-nuevos.component.spec.ts"
```

## 🚀 Uso

### En el Componente Padre

```typescript
// inicio.component.ts
import { ProductosNuevosComponent } from './components/productos-nuevos/productos-nuevos.component';

@Component({
  imports: [ProductosNuevosComponent],
  // ...
})
```

```html
<!-- inicio.component.html -->
<app-productos-nuevos></app-productos-nuevos>
```

### Configuración de Rutas

El componente maneja navegación a:

- Detalle de producto: `/producto/:slug`
- Catálogo filtrado: `/productos?orden=recientes`
- Catálogo general: `/productos`

## 🔮 Futuras Mejoras

### TODOs Identificados

1. **Modal de Vista Rápida**: Implementar modal con información detallada
2. **Carrito de Compras**: Integrar lógica de agregar al carrito
3. **Sistema de Favoritos**: Botón de favoritos con persistencia
4. **Comparar Productos**: Funcionalidad de comparación
5. **Filtros Dinámicos**: Filtros por categoría desde el componente
6. **Infinite Scroll**: Carga progresiva de más productos
7. **PWA Features**: Cache offline y sincronización

### Optimizaciones Potenciales

- **Virtual Scrolling**: Para listas muy largas
- **Image Optimization**: WebP, responsive images
- **Bundle Splitting**: Lazy loading del componente
- **Cache Strategy**: Cache inteligente de productos
- **Prefetch**: Precarga de imágenes siguientes

## 🔗 Enlaces Relacionados

- [Plan de Componentes General](../../../../../../guia/implementacion_tienda_virtual/planes_y_estructuras_de_implementacion/plan_componentes_vista_publica_tienda_virtual.md)
- [Producto Service](../../../../../core/services/producto.service.ts)
- [Producto Interface](../../../../../core/models/producto.interface.ts)
- [Componente Inicio](../../inicio.component.ts)

## 📝 Notas de Desarrollo

### Consideraciones de Performance

- **Lazy Loading**: Imágenes con `loading="lazy"`
- **TrackBy**: Optimización de ngFor con función trackBy
- **OnPush**: Preparado para change detection optimizada
- **Memory Leaks**: Uso de `takeUntilDestroyed` para prevenir leaks

### Consideraciones de SEO

- **ARIA Labels**: Accesibilidad completa
- **Semantic HTML**: Estructura semántica correcta
- **Structured Data**: Preparado para microdatos de productos
- **Meta Tags**: Compatible con SSR para meta tags dinámicos

### Consideraciones de UX

- **Loading States**: Estados de carga claros
- **Error Recovery**: Opciones de recuperación de errores
- **Empty States**: Estados vacíos motivacionales
- **Responsive**: Experiencia consistente en todos los dispositivos
- **Touch Friendly**: Botones y áreas de click optimizadas para móvil
