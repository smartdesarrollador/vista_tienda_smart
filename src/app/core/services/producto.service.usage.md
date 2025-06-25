# ProductoService - Guía de Uso

## Descripción

El `ProductoService` es un servicio Angular que gestiona todas las operaciones relacionadas con productos en el sistema. Utiliza signals para el manejo reactivo del estado y proporciona una API completa para CRUD de productos.

## Características Principales

- ✅ **Signals reactivos** para estado en tiempo real
- ✅ **Gestión completa de estado** (productos, filtros, paginación, estadísticas)
- ✅ **Manejo de errores** robusto
- ✅ **Filtros avanzados** y búsqueda
- ✅ **Paginación** automática
- ✅ **Subida de imágenes** con FormData
- ✅ **Operaciones especiales** (toggle destacado/activo, estadísticas)

## Importación

```typescript
import { ProductoService } from "@core/services";
import { Producto, ProductoFilters, CreateProductoRequest, UpdateProductoRequest } from "@core/models";
```

## Inyección en Componentes

```typescript
import { Component, inject, OnInit } from "@angular/core";
import { ProductoService } from "@core/services";

@Component({
  selector: "app-productos",
  template: `...`,
})
export class ProductosComponent implements OnInit {
  private readonly productoService = inject(ProductoService);

  // Signals reactivos
  productos = this.productoService.productos;
  loading = this.productoService.loading;
  error = this.productoService.error;
  pagination = this.productoService.pagination;

  ngOnInit(): void {
    this.loadProductos();
  }

  private loadProductos(): void {
    this.productoService.loadProductos();
  }
}
```

## Ejemplos de Uso

### 1. Listar Productos con Filtros

```typescript
export class ProductosListComponent implements OnInit {
  private readonly productoService = inject(ProductoService);

  // Signals reactivos
  productos = this.productoService.productos;
  loading = this.productoService.loading;
  pagination = this.productoService.pagination;
  hasProductos = this.productoService.hasProductos;

  ngOnInit(): void {
    // Cargar productos con filtros
    const filters: ProductoFilters = {
      activo: true,
      per_page: 15,
      order_by: "nombre",
      order_direction: "asc",
    };

    this.productoService.loadProductos(filters);
  }

  onFilterChange(filters: ProductoFilters): void {
    this.productoService.setFilters(filters);
    this.productoService.loadProductos(filters);
  }

  onPageChange(page: number): void {
    this.productoService.goToPage(page);
  }
}
```

### 2. Crear Nuevo Producto

```typescript
export class ProductoCreateComponent {
  private readonly productoService = inject(ProductoService);
  private readonly router = inject(Router);

  loading = this.productoService.loading;
  error = this.productoService.error;

  onSubmit(formData: any, imageFile: File | null): void {
    const request: CreateProductoRequest = {
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      precio: formData.precio,
      precio_oferta: formData.precio_oferta || null,
      stock: formData.stock,
      categoria_id: formData.categoria_id,
      marca: formData.marca,
      modelo: formData.modelo,
      destacado: formData.destacado || false,
      activo: formData.activo !== false,
      imagen_principal: imageFile || undefined,
    };

    this.productoService.createProducto(request).subscribe({
      next: (response) => {
        console.log("Producto creado:", response.data);
        this.router.navigate(["/admin/productos"]);
      },
      error: (error) => {
        console.error("Error al crear producto:", error);
      },
    });
  }
}
```

### 3. Editar Producto Existente

```typescript
export class ProductoEditComponent implements OnInit {
  private readonly productoService = inject(ProductoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  currentProducto = this.productoService.currentProducto;
  loading = this.productoService.loading;
  error = this.productoService.error;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get("id"));
    if (id) {
      this.productoService.getProducto(id).subscribe();
    }
  }

  onSubmit(formData: any, imageFile: File | null): void {
    const producto = this.currentProducto();
    if (!producto) return;

    const request: UpdateProductoRequest = {
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      precio: formData.precio,
      stock: formData.stock,
      imagen_principal: imageFile || undefined,
    };

    this.productoService.updateProducto(producto.id, request).subscribe({
      next: (response) => {
        console.log("Producto actualizado:", response.data);
        this.router.navigate(["/admin/productos"]);
      },
    });
  }
}
```

### 4. Búsqueda de Productos

```typescript
export class ProductoSearchComponent {
  private readonly productoService = inject(ProductoService);

  searchResults = signal<Producto[]>([]);
  loading = this.productoService.loading;

  onSearch(query: string): void {
    if (query.length < 2) {
      this.searchResults.set([]);
      return;
    }

    this.productoService.searchProductos({ q: query, limit: 10 }).subscribe({
      next: (productos) => {
        this.searchResults.set(productos);
      },
    });
  }
}
```

### 5. Operaciones Especiales

```typescript
export class ProductoActionsComponent {
  private readonly productoService = inject(ProductoService);

  // Toggle destacado
  toggleDestacado(producto: Producto): void {
    this.productoService.toggleDestacado(producto.id).subscribe({
      next: (response) => {
        console.log("Estado destacado cambiado:", response.data.destacado);
      },
    });
  }

  // Toggle activo
  toggleActivo(producto: Producto): void {
    this.productoService.toggleActivo(producto.id).subscribe({
      next: (response) => {
        console.log("Estado activo cambiado:", response.data.activo);
      },
    });
  }

  // Eliminar imagen principal
  removeImage(producto: Producto): void {
    this.productoService.removeImagenPrincipal(producto.id).subscribe({
      next: (response) => {
        console.log("Imagen eliminada");
      },
    });
  }

  // Eliminar producto
  deleteProducto(producto: Producto): void {
    if (confirm("¿Estás seguro de eliminar este producto?")) {
      this.productoService.deleteProducto(producto.id).subscribe({
        next: () => {
          console.log("Producto eliminado");
        },
      });
    }
  }
}
```

### 6. Estadísticas de Productos

```typescript
export class ProductoStatsComponent implements OnInit {
  private readonly productoService = inject(ProductoService);

  statistics = this.productoService.statistics;
  loading = this.productoService.loading;

  ngOnInit(): void {
    this.loadStatistics();
  }

  loadStatistics(): void {
    this.productoService.getStatistics().subscribe({
      next: (stats) => {
        console.log("Estadísticas cargadas:", stats);
      },
    });
  }
}
```

### 7. Filtros Avanzados

```typescript
export class ProductoFiltersComponent {
  private readonly productoService = inject(ProductoService);

  currentFilters = this.productoService.filters;

  applyFilters(): void {
    const filters: ProductoFilters = {
      categoria_id: 1,
      precio_min: 100,
      precio_max: 1000,
      con_stock: true,
      destacado: true,
      activo: true,
      marca: "Apple",
      order_by: "precio",
      order_direction: "desc",
      per_page: 20,
    };

    this.productoService.setFilters(filters);
    this.productoService.loadProductos(filters);
  }

  clearFilters(): void {
    this.productoService.clearFilters();
    this.productoService.loadProductos();
  }
}
```

### 8. Paginación

```typescript
export class ProductoPaginationComponent {
  private readonly productoService = inject(ProductoService);

  pagination = this.productoService.pagination;
  currentPage = this.productoService.currentPage;
  lastPage = this.productoService.lastPage;
  hasNextPage = this.productoService.hasNextPage;
  hasPrevPage = this.productoService.hasPrevPage;

  goToPage(page: number): void {
    this.productoService.goToPage(page);
  }

  nextPage(): void {
    this.productoService.nextPage();
  }

  prevPage(): void {
    this.productoService.prevPage();
  }

  changePageSize(size: number): void {
    this.productoService.changePageSize(size);
  }
}
```

## Template Examples

### Lista de Productos

```html
<div class="productos-container">
  <!-- Loading State -->
  @if (loading()) {
  <div class="loading">Cargando productos...</div>
  }

  <!-- Error State -->
  @if (error()) {
  <div class="error">{{ error() }}</div>
  }

  <!-- Products Grid -->
  @if (hasProductos()) {
  <div class="productos-grid">
    @for (producto of productos(); track producto.id) {
    <div class="producto-card">
      <img [src]="producto.imagen_principal" [alt]="producto.nombre" />
      <h3>{{ producto.nombre }}</h3>
      <p>{{ producto.precio | currency:'PEN' }}</p>

      <div class="actions">
        <button (click)="toggleDestacado(producto)">{{ producto.destacado ? 'Quitar destacado' : 'Destacar' }}</button>
        <button (click)="editProducto(producto.id)">Editar</button>
        <button (click)="deleteProducto(producto)">Eliminar</button>
      </div>
    </div>
    }
  </div>

  <!-- Pagination -->
  @if (pagination()) {
  <div class="pagination">
    <button [disabled]="!hasPrevPage()" (click)="prevPage()">Anterior</button>

    <span>Página {{ currentPage() }} de {{ lastPage() }}</span>

    <button [disabled]="!hasNextPage()" (click)="nextPage()">Siguiente</button>
  </div>
  } } @else {
  <div class="empty-state">No hay productos disponibles</div>
  }
</div>
```

## Manejo de Estado Reactivo

```typescript
export class ProductoReactiveComponent {
  private readonly productoService = inject(ProductoService);

  // Computed signals derivados
  productosActivos = computed(() => this.productoService.productos().filter((p) => p.activo));

  productosDestacados = computed(() => this.productoService.productos().filter((p) => p.destacado));

  totalValorInventario = computed(() => this.productoService.productos().reduce((total, p) => total + p.precio * p.stock, 0));

  // Effect para reaccionar a cambios
  constructor() {
    effect(() => {
      const productos = this.productoService.productos();
      console.log(`Se cargaron ${productos.length} productos`);
    });

    effect(() => {
      const error = this.productoService.error();
      if (error) {
        // Mostrar notificación de error
        this.showErrorNotification(error);
      }
    });
  }

  private showErrorNotification(error: string): void {
    // Implementar notificación
  }
}
```

## Mejores Prácticas

1. **Usar signals reactivos**: Aprovecha los computed signals para derivar estado
2. **Manejo de errores**: Siempre maneja los errores en las suscripciones
3. **Loading states**: Usa el signal `loading` para mostrar estados de carga
4. **Cleanup**: Los signals se limpian automáticamente, no necesitas unsubscribe
5. **Filtros persistentes**: Usa `setFilters()` para mantener filtros entre navegaciones
6. **Paginación**: Usa los métodos de paginación en lugar de manejar manualmente

## Notas Importantes

- El servicio maneja automáticamente el estado de loading
- Los errores se capturan y almacenan en el signal `error`
- La paginación se actualiza automáticamente con cada request
- Los filtros se mantienen hasta que se limpien explícitamente
- Las imágenes se manejan como FormData para subida correcta
