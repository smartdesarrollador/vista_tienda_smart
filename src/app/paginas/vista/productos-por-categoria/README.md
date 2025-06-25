# Componente Productos Por Categoría

Este componente muestra los productos de una categoría específica con funcionalidades avanzadas de filtrado, ordenamiento y paginación.

## Características

### ✨ **Funcionalidades principales**

- 📱 **Responsivo**: Diseño adaptable a todos los dispositivos
- 🎯 **Dinámico**: Captura automáticamente el ID o slug de la categoría desde la URL
- 🔄 **Reactivo**: Utiliza Angular 17 signals para gestión de estado eficiente
- 📄 **Paginación**: Sistema completo de paginación con navegación intuitiva
- 🔍 **Ordenamiento**: Múltiples opciones de ordenamiento de productos
- 👁️ **Vistas**: Alterna entre vista de cuadrícula y lista
- ⚡ **Rendimiento**: Carga diferida y optimizaciones de rendimiento
- 🎨 **Diseño**: Interfaz moderna con Tailwind CSS

### 🛠️ **Características técnicas**

- **Framework**: Angular 17 con Standalone Components
- **Gestión de estado**: Angular Signals
- **Styling**: Tailwind CSS
- **Navegación**: Angular Router con parámetros dinámicos
- **HTTP**: HttpClient para comunicación con API
- **Tipado**: TypeScript estricto
- **SSR**: Compatible con Server Side Rendering

## Uso

### URL Route

```
/categoria/:categoria
```

Donde `:categoria` puede ser:

- **ID numérico**: `/categoria/1`
- **Slug**: `/categoria/electronica`

### Parámetros de la URL

- `categoria` (string): ID o slug de la categoría

### Ejemplo de implementación en router

```typescript
{
  path: 'categoria/:categoria',
  component: ProductosPorCategoriaComponent,
  title: 'Productos por Categoría'
}
```

## API Endpoints

El componente consume los siguientes endpoints:

### Categorías

- `GET /api/categorias/{id}` - Obtener categoría por ID
- `GET /api/categorias/slug/{slug}` - Obtener categoría por slug

### Productos

- `GET /api/productos` - Obtener productos con filtros
  - `categoria_id`: ID de la categoría
  - `page`: Página actual
  - `per_page`: Productos por página
  - `order_by`: Campo de ordenamiento
  - `order_direction`: Dirección del ordenamiento

## Configuración

### Opciones de ordenamiento

```typescript
- Nombre (A-Z / Z-A)
- Precio (Menor a Mayor / Mayor a Menor)
- Más Nuevos
- Destacados
```

### Productos por página

```typescript
[12, 24, 36, 48];
```

### Tipos de vista

```typescript
- 'grid': Vista en cuadrícula
- 'lista': Vista en lista
```

## Estados del componente

### Loading

Muestra un spinner mientras se cargan los datos.

### Error

Muestra mensaje de error si ocurre algún problema.

### Sin productos

Muestra mensaje cuando no hay productos en la categoría.

### Con productos

Muestra la lista/grid de productos con todas las funcionalidades.

## Eventos

### Producto Card Events

- `onProductoClick`: Navega al detalle del producto
- `onCarritoClick`: Agrega producto al carrito
- `onFavoritoToggle`: Alterna estado de favorito
- `onVistaRapida`: Muestra vista rápida del producto

## Responsive Design

### Mobile (< 640px)

- Vista de lista optimizada
- Controles simplificados
- Paginación básica

### Tablet (640px - 1024px)

- Grid de 2-3 columnas
- Controles intermedios

### Desktop (> 1024px)

- Grid de 4 columnas
- Controles completos
- Paginación avanzada

## Breadcrumb

Genera automáticamente el breadcrumb basado en:

- Página de inicio
- Página de productos
- Categoría padre (si existe)
- Categoría actual

## Optimizaciones de rendimiento

### Angular Signals

- Estado reactivo eficiente
- Computed values automáticos
- Detección de cambios optimizada

### Effects

- Monitoring de parámetros de ruta
- Limpieza automática de subscripciones

### Lazy Loading

- Carga diferida de imágenes
- Navegación optimizada

## Dependencias

### Core Dependencies

```typescript
- @angular/core: ^17.0.0
- @angular/common: ^17.0.0
- @angular/router: ^17.0.0
```

### Services

```typescript
-ProductoService - CategoriasService;
```

### Components

```typescript
-ProductoCardComponent;
```

### Interfaces

```typescript
-Producto, ProductoFilters, ProductosResponse - Categoria, CategoriaSingleResponse;
```

## Estructura de archivos

```
productos-por-categoria/
├── productos-por-categoria.component.ts
├── productos-por-categoria.component.html
├── productos-por-categoria.component.css
└── README.md
```

## Ejemplo de uso

```html
<!-- En el router -->
<router-outlet></router-outlet>

<!-- Navegación -->
<a routerLink="/categoria/electronica">Electrónica</a>
<a routerLink="/categoria/1">Categoría 1</a>
```

## Buenas prácticas implementadas

### Angular 17

- Standalone components
- Signals para estado reactivo
- Control flow syntax (@if, @for)
- Computed signals
- Effect para side effects

### TypeScript

- Tipado estricto
- Interfaces bien definidas
- Generics apropiados

### Performance

- OnPush change detection
- TrackBy functions
- Lazy loading
- Debounced effects

### Accessibility

- ARIA labels
- Keyboard navigation
- Screen reader support
- Focus management

### UX/UI

- Loading states
- Error handling
- Empty states
- Responsive design
- Smooth transitions
