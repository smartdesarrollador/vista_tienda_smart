# Componente de Paginación

Componente reutilizable de paginación diseñado específicamente para tiendas virtuales con Angular 18 y Tailwind CSS.

## Características

- ✅ **Responsive**: Se adapta perfectamente a mobile, tablet y desktop
- ✅ **Accesible**: Cumple con estándares WCAG con aria-labels y navegación por teclado
- ✅ **Optimizado**: Usa signals de Angular y ChangeDetectionStrategy.OnPush
- ✅ **Configurable**: Múltiples opciones para personalizar comportamiento
- ✅ **TypeScript**: Totalmente tipado con interfaces específicas
- ✅ **Standalone**: No requiere módulos adicionales

## Instalación

```typescript
import { PaginationComponent } from "./shared/components/pagination";
```

## Uso Básico

### En el template:

```html
<app-pagination [totalItems]="1250" [currentPage]="currentPage" [itemsPerPage]="25" (pageChange)="onPageChange($event)" (pageSizeChange)="onPageSizeChange($event)"> </app-pagination>
```

### En el componente:

```typescript
import { Component, signal } from "@angular/core";
import { PaginationComponent, PageChangeEvent, PageSizeChangeEvent } from "./shared/components/pagination";

@Component({
  selector: "app-product-list",
  standalone: true,
  imports: [PaginationComponent],
  template: `
    <!-- Tu lista de productos aquí -->
    <app-pagination [totalItems]="totalProducts()" [currentPage]="currentPage()" [itemsPerPage]="pageSize()" (pageChange)="onPageChange($event)" (pageSizeChange)="onPageSizeChange($event)"> </app-pagination>
  `,
})
export class ProductListComponent {
  // Signals para estado
  totalProducts = signal(1250);
  currentPage = signal(1);
  pageSize = signal(25);

  onPageChange(event: PageChangeEvent) {
    this.currentPage.set(event.page);
    // Cargar productos de la nueva página
    this.loadProducts(event.page, event.itemsPerPage);
  }

  onPageSizeChange(event: PageSizeChangeEvent) {
    this.pageSize.set(event.pageSize);
    this.currentPage.set(event.currentPage);
    // Cargar productos con nuevo tamaño de página
    this.loadProducts(event.currentPage, event.pageSize);
  }

  private loadProducts(page: number, size: number) {
    // Lógica para cargar productos
  }
}
```

## Propiedades (Inputs)

### Requeridas

| Propiedad      | Tipo     | Descripción                        |
| -------------- | -------- | ---------------------------------- |
| `totalItems`   | `number` | Total de elementos en la colección |
| `currentPage`  | `number` | Página actual (base 1)             |
| `itemsPerPage` | `number` | Número de elementos por página     |

### Opcionales

| Propiedad         | Tipo       | Defecto             | Descripción                              |
| ----------------- | ---------- | ------------------- | ---------------------------------------- |
| `maxVisiblePages` | `number`   | `5`                 | Máximo número de páginas visibles        |
| `showFirstLast`   | `boolean`  | `true`              | Mostrar botones primera/última página    |
| `showPrevNext`    | `boolean`  | `true`              | Mostrar botones anterior/siguiente       |
| `showPageNumbers` | `boolean`  | `true`              | Mostrar números de página                |
| `showPageSize`    | `boolean`  | `true`              | Mostrar selector de tamaño de página     |
| `pageSizeOptions` | `number[]` | `[10, 25, 50, 100]` | Opciones para tamaño de página           |
| `showItemsInfo`   | `boolean`  | `true`              | Mostrar información "Mostrando X-Y de Z" |
| `disabled`        | `boolean`  | `false`             | Deshabilitar todos los controles         |

## Eventos (Outputs)

### pageChange

```typescript
interface PageChangeEvent {
  page: number; // Nueva página
  itemsPerPage: number; // Elementos por página actual
  totalItems: number; // Total de elementos
  totalPages: number; // Total de páginas
}
```

### pageSizeChange

```typescript
interface PageSizeChangeEvent {
  pageSize: number; // Nuevo tamaño de página
  currentPage: number; // Página calculada para mantener contexto
  totalItems: number; // Total de elementos
  totalPages: number; // Nuevo total de páginas
}
```

## Ejemplos de Uso

### 1. Lista de Productos (Uso Completo)

```html
<app-pagination [totalItems]="products.length" [currentPage]="currentPage" [itemsPerPage]="productsPerPage" [pageSizeOptions]="[12, 24, 48, 96]" [showItemsInfo]="true" [showPageSize]="true" (pageChange)="loadProducts($event)" (pageSizeChange)="changePageSize($event)"> </app-pagination>
```

### 2. Búsqueda de Productos (Minimalista)

```html
<app-pagination [totalItems]="searchResults.length" [currentPage]="currentPage" [itemsPerPage]="20" [showPageSize]="false" [showFirstLast]="false" [maxVisiblePages]="3" (pageChange)="searchPage($event)"> </app-pagination>
```

### 3. Móvil Optimizado

```html
<app-pagination [totalItems]="orders.length" [currentPage]="currentPage" [itemsPerPage]="10" [showPageNumbers]="false" [showItemsInfo]="false" [showPageSize]="false" (pageChange)="loadOrders($event)"> </app-pagination>
```

### 4. Para Administración (Completo)

```html
<app-pagination [totalItems]="allUsers.length" [currentPage]="page" [itemsPerPage]="pageSize" [pageSizeOptions]="[10, 25, 50, 100, 200]" [maxVisiblePages]="7" [disabled]="loading" (pageChange)="onPageChange($event)" (pageSizeChange)="onPageSizeChange($event)"> </app-pagination>
```

## Casos de Uso en Tienda Virtual

1. **Catálogo de Productos**: Navegación principal de productos
2. **Resultados de Búsqueda**: Paginación de resultados filtrados
3. **Categorías**: Productos por categoría específica
4. **Historial de Pedidos**: Lista de pedidos del usuario
5. **Reseñas de Productos**: Comentarios y valoraciones
6. **Lista de Deseos**: Productos guardados por el usuario
7. **Comparación de Productos**: Lista de productos para comparar
8. **Administración**: Gestión de productos, usuarios, pedidos

## Personalización Avanzada

### Cambiar Colores (Tailwind)

```typescript
// En el componente padre, puedes wrapper y personalizar:
@Component({
  template: `
    <div class="custom-pagination">
      <app-pagination
        [totalItems]="total"
        [currentPage]="current"
        [itemsPerPage]="size"
        (pageChange)="onPageChange($event)">
      </app-pagination>
    </div>
  `,
  styles: [`
    .custom-pagination ::ng-deep button {
      @apply bg-green-600 hover:bg-green-700 text-white;
    }
  `]
})
```

### Integración con Servicios

```typescript
@Injectable()
export class ProductPaginationService {
  private currentPage = signal(1);
  private pageSize = signal(25);
  private totalItems = signal(0);

  // Computed para estado de paginación
  paginationState = computed(() => ({
    currentPage: this.currentPage(),
    pageSize: this.pageSize(),
    totalItems: this.totalItems(),
    totalPages: Math.ceil(this.totalItems() / this.pageSize()),
  }));

  updatePage(event: PageChangeEvent) {
    this.currentPage.set(event.page);
  }

  updatePageSize(event: PageSizeChangeEvent) {
    this.pageSize.set(event.pageSize);
    this.currentPage.set(event.currentPage);
  }

  setTotalItems(total: number) {
    this.totalItems.set(total);
  }
}
```

## Mejores Prácticas

1. **Usa signals** para el estado de paginación
2. **Implementa loading states** durante cambios de página
3. **Mantén contexto de usuario** al cambiar tamaño de página
4. **Usa trackBy functions** en listas largas
5. **Implementa URL synchronization** para SEO
6. **Considera lazy loading** para grandes datasets
7. **Prueba la accesibilidad** con lectores de pantalla
