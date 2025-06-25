# VariacionProductoService - Guía de Uso

## Descripción

El `VariacionProductoService` es un servicio Angular que gestiona las operaciones CRUD y funcionalidades avanzadas para las variaciones de productos. Utiliza Angular Signals para gestión reactiva del estado y sigue las mejores prácticas de Angular 17.

## Características Principales

- ✅ **Gestión reactiva del estado** con Angular Signals
- ✅ **CRUD completo** para variaciones de productos
- ✅ **Filtros avanzados** y paginación
- ✅ **Gestión de stock** con operaciones específicas
- ✅ **Búsqueda y ordenamiento**
- ✅ **Manejo de errores** robusto
- ✅ **TypeScript** con tipado estricto

## Importación

```typescript
import { VariacionProductoService } from "@core/services";
import { VariacionProductoInterface, VariacionProductoFilters, CreateVariacionProductoRequest, UpdateVariacionProductoRequest, EstadoStock, SortField, SortOrder } from "@core/models";
```

## Inyección del Servicio

```typescript
import { Component, inject } from "@angular/core";

@Component({
  selector: "app-variaciones",
  template: `...`,
})
export class VariacionesComponent {
  private readonly variacionService = inject(VariacionProductoService);

  // Signals reactivos
  readonly variaciones = this.variacionService.variaciones;
  readonly loading = this.variacionService.loading;
  readonly error = this.variacionService.error;
  readonly pagination = this.variacionService.pagination;
}
```

## Signals Disponibles

### Signals Principales

```typescript
// Datos principales
readonly variaciones = computed(() => this._state().variaciones);
readonly currentVariacion = computed(() => this._state().currentVariacion);
readonly loading = computed(() => this._state().loading);
readonly error = computed(() => this._state().error);
readonly filters = computed(() => this._state().filters);
readonly pagination = computed(() => this._state().pagination);
```

### Signals Computados

```typescript
// Información de paginación
readonly hasVariaciones = computed(() => this.variaciones().length > 0);
readonly totalVariaciones = computed(() => this.pagination()?.total ?? 0);
readonly currentPage = computed(() => this.pagination()?.current_page ?? 1);
readonly lastPage = computed(() => this.pagination()?.last_page ?? 1);
readonly hasNextPage = computed(() => this.currentPage() < this.lastPage());
readonly hasPrevPage = computed(() => this.currentPage() > 1);

// Estadísticas
readonly variacionesActivas = computed(() =>
  this.variaciones().filter(v => v.activo).length
);
readonly variacionesConStock = computed(() =>
  this.variaciones().filter(v => v.stock > 0).length
);
readonly variacionesSinStock = computed(() =>
  this.variaciones().filter(v => v.stock === 0).length
);
readonly stockTotal = computed(() =>
  this.variaciones().reduce((total, v) => total + v.stock, 0)
);
```

## Operaciones CRUD

### 1. Obtener Variaciones

```typescript
// Obtener todas las variaciones con filtros
loadVariaciones(): void {
  const filters: VariacionProductoFilters = {
    activo: true,
    con_stock: true,
    per_page: 20,
    sort_by: 'created_at',
    sort_order: 'desc'
  };

  this.variacionService.getVariaciones(filters).subscribe({
    next: (response) => {
      console.log('Variaciones cargadas:', response.data);
    },
    error: (error) => {
      console.error('Error al cargar variaciones:', error);
    }
  });
}

// Obtener variaciones por producto
loadVariacionesByProducto(productoId: number): void {
  this.variacionService.getVariacionesByProducto(productoId).subscribe({
    next: (response) => {
      console.log('Variaciones del producto:', response.data);
      console.log('Info del producto:', response.producto);
    }
  });
}
```

### 2. Obtener Variación Individual

```typescript
loadVariacion(id: number): void {
  this.variacionService.getVariacion(id).subscribe({
    next: (response) => {
      console.log('Variación cargada:', response.data);
    }
  });
}
```

### 3. Crear Variación

```typescript
createVariacion(): void {
  const newVariacion: CreateVariacionProductoRequest = {
    producto_id: 1,
    sku: 'IPH15-BLU-128GB',
    precio: 3999,
    precio_oferta: 3599,
    stock: 50,
    activo: true,
    atributos: {
      color: 'Azul',
      almacenamiento: '128GB'
    },
    valores_atributos: [1, 5] // IDs de valores de atributos
  };

  this.variacionService.createVariacion(newVariacion).subscribe({
    next: (response) => {
      console.log('Variación creada:', response.data);
      // Refrescar lista
      this.variacionService.refresh();
    },
    error: (error) => {
      console.error('Error al crear variación:', error);
    }
  });
}
```

### 4. Actualizar Variación

```typescript
updateVariacion(id: number): void {
  const updateData: UpdateVariacionProductoRequest = {
    precio: 4199,
    precio_oferta: 3799,
    stock: 45,
    activo: true
  };

  this.variacionService.updateVariacion(id, updateData).subscribe({
    next: (response) => {
      console.log('Variación actualizada:', response.data);
    }
  });
}
```

### 5. Eliminar Variación

```typescript
deleteVariacion(id: number): void {
  if (confirm('¿Estás seguro de eliminar esta variación?')) {
    this.variacionService.deleteVariacion(id).subscribe({
      next: (response) => {
        console.log('Variación eliminada:', response.message);
      }
    });
  }
}
```

## Operaciones Especiales

### 1. Alternar Estado Activo

```typescript
toggleActivo(id: number): void {
  this.variacionService.toggleActivo(id).subscribe({
    next: (response) => {
      const estado = response.data.activo ? 'activada' : 'desactivada';
      console.log(`Variación ${estado}`);
    }
  });
}
```

### 2. Gestión de Stock

```typescript
// Establecer stock específico
setStock(id: number, newStock: number): void {
  this.variacionService.updateStock(id, {
    stock: newStock,
    operacion: 'set'
  }).subscribe({
    next: (response) => {
      console.log(`Stock actualizado de ${response.stock_anterior} a ${response.stock_nuevo}`);
    }
  });
}

// Agregar stock
addStock(id: number, cantidad: number): void {
  this.variacionService.updateStock(id, {
    stock: cantidad,
    operacion: 'add'
  }).subscribe();
}

// Reducir stock
subtractStock(id: number, cantidad: number): void {
  this.variacionService.updateStock(id, {
    stock: cantidad,
    operacion: 'subtract'
  }).subscribe();
}
```

## Filtros y Búsqueda

### 1. Filtros Básicos

```typescript
// Filtrar por producto
filterByProducto(productoId: number): void {
  this.variacionService.filterByProducto(productoId);
}

// Filtrar por estado activo
filterByActivo(activo: boolean): void {
  this.variacionService.filterByActivo(activo);
}

// Filtrar por stock
filterByStock(conStock: boolean): void {
  this.variacionService.filterByStock(conStock);
}

// Filtrar por rango de precios
filterByPriceRange(min: number, max: number): void {
  this.variacionService.filterByPriceRange(min, max);
}
```

### 2. Búsqueda por SKU

```typescript
searchVariaciones(searchTerm: string): void {
  this.variacionService.searchBySku(searchTerm);
}
```

### 3. Ordenamiento

```typescript
sortVariaciones(): void {
  this.variacionService.sortVariaciones(SortField.PRECIO, SortOrder.ASC);
}
```

## Paginación

```typescript
// Navegación de páginas
goToNextPage(): void {
  this.variacionService.nextPage();
}

goToPrevPage(): void {
  this.variacionService.prevPage();
}

goToPage(page: number): void {
  this.variacionService.goToPage(page);
}

// Cambiar tamaño de página
changePageSize(size: number): void {
  this.variacionService.changePageSize(size);
}
```

## Métodos de Utilidad

### 1. Obtener Variaciones por Estado de Stock

```typescript
getVariacionesSinStock(): VariacionProductoInterface[] {
  return this.variacionService.getVariacionesByEstadoStock(EstadoStock.SIN_STOCK);
}

getVariacionesConStockLimitado(): VariacionProductoInterface[] {
  return this.variacionService.getVariacionesByEstadoStock(EstadoStock.STOCK_LIMITADO);
}
```

### 2. Obtener Variaciones con Descuento

```typescript
getVariacionesEnOferta(): VariacionProductoInterface[] {
  return this.variacionService.getVariacionesConDescuento();
}
```

## Gestión de Estado

### 1. Refrescar Datos

```typescript
// Refrescar con filtros actuales
refreshData(): void {
  this.variacionService.refresh();
}

// Refrescar variaciones específicamente
refreshVariaciones(): void {
  this.variacionService.refreshVariaciones();
}
```

### 2. Limpiar Estado

```typescript
clearData(): void {
  this.variacionService.clearState();
}

clearFilters(): void {
  this.variacionService.clearFilters();
}
```

## Ejemplo de Componente Completo

```typescript
import { Component, inject, OnInit, signal } from "@angular/core";
import { VariacionProductoService } from "@core/services";
import { VariacionProductoInterface, VariacionProductoFilters, EstadoStock } from "@core/models";

@Component({
  selector: "app-variaciones-list",
  template: `
    <div class="variaciones-container">
      <!-- Filtros -->
      <div class="filters">
        <input type="text" placeholder="Buscar por SKU..." (input)="onSearch($event)" class="search-input" />

        <select (change)="onFilterByStock($event)">
          <option value="">Todos</option>
          <option value="true">Con stock</option>
          <option value="false">Sin stock</option>
        </select>
      </div>

      <!-- Loading -->
      @if (loading()) {
      <div class="loading">Cargando variaciones...</div>
      }

      <!-- Error -->
      @if (error()) {
      <div class="error">{{ error() }}</div>
      }

      <!-- Lista de variaciones -->
      @if (hasVariaciones()) {
      <div class="variaciones-grid">
        @for (variacion of variaciones(); track variacion.id) {
        <div class="variacion-card">
          <h3>{{ variacion.sku }}</h3>
          <p>Precio: {{ variacion.precio | currency : "PEN" }}</p>
          @if (variacion.precio_oferta) {
          <p>Oferta: {{ variacion.precio_oferta | currency : "PEN" }}</p>
          }
          <p>Stock: {{ variacion.stock }}</p>
          <p>Estado: {{ variacion.estado_stock }}</p>

          <div class="actions">
            <button (click)="toggleActivo(variacion.id)">
              {{ variacion.activo ? "Desactivar" : "Activar" }}
            </button>
            <button (click)="editVariacion(variacion.id)">Editar</button>
            <button (click)="deleteVariacion(variacion.id)">Eliminar</button>
          </div>
        </div>
        }
      </div>

      <!-- Paginación -->
      <div class="pagination">
        <button (click)="prevPage()" [disabled]="!hasPrevPage()">Anterior</button>

        <span> Página {{ currentPage() }} de {{ lastPage() }} </span>

        <button (click)="nextPage()" [disabled]="!hasNextPage()">Siguiente</button>
      </div>

      <!-- Estadísticas -->
      <div class="stats">
        <p>Total: {{ totalVariaciones() }}</p>
        <p>Activas: {{ variacionesActivas() }}</p>
        <p>Con stock: {{ variacionesConStock() }}</p>
        <p>Sin stock: {{ variacionesSinStock() }}</p>
        <p>Stock total: {{ stockTotal() }}</p>
      </div>
      } @else {
      <div class="no-data">No hay variaciones disponibles</div>
      }
    </div>
  `,
})
export class VariacionesListComponent implements OnInit {
  private readonly variacionService = inject(VariacionProductoService);

  // Signals del servicio
  readonly variaciones = this.variacionService.variaciones;
  readonly loading = this.variacionService.loading;
  readonly error = this.variacionService.error;
  readonly pagination = this.variacionService.pagination;
  readonly hasVariaciones = this.variacionService.hasVariaciones;
  readonly currentPage = this.variacionService.currentPage;
  readonly lastPage = this.variacionService.lastPage;
  readonly hasNextPage = this.variacionService.hasNextPage;
  readonly hasPrevPage = this.variacionService.hasPrevPage;
  readonly totalVariaciones = this.variacionService.totalVariaciones;
  readonly variacionesActivas = this.variacionService.variacionesActivas;
  readonly variacionesConStock = this.variacionService.variacionesConStock;
  readonly variacionesSinStock = this.variacionService.variacionesSinStock;
  readonly stockTotal = this.variacionService.stockTotal;

  ngOnInit(): void {
    this.loadVariaciones();
  }

  loadVariaciones(): void {
    const filters: VariacionProductoFilters = {
      per_page: 20,
      sort_by: "created_at",
      sort_order: "desc",
    };
    this.variacionService.loadVariaciones(filters);
  }

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.variacionService.searchBySku(target.value);
  }

  onFilterByStock(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = target.value;
    if (value === "") {
      this.variacionService.filterByStock(null);
    } else {
      this.variacionService.filterByStock(value === "true");
    }
  }

  toggleActivo(id: number): void {
    this.variacionService.toggleActivo(id).subscribe();
  }

  editVariacion(id: number): void {
    // Implementar navegación a formulario de edición
    console.log("Editar variación:", id);
  }

  deleteVariacion(id: number): void {
    if (confirm("¿Estás seguro de eliminar esta variación?")) {
      this.variacionService.deleteVariacion(id).subscribe();
    }
  }

  nextPage(): void {
    this.variacionService.nextPage();
  }

  prevPage(): void {
    this.variacionService.prevPage();
  }
}
```

## Manejo de Errores

El servicio incluye manejo robusto de errores:

```typescript
// Los errores se capturan automáticamente y se almacenan en el signal error()
// Puedes suscribirte a errores específicos:

this.variacionService.getVariaciones().subscribe({
  next: (response) => {
    // Éxito
  },
  error: (error) => {
    // Error específico de esta operación
    console.error("Error específico:", error);
  },
});

// O usar el signal error() para errores globales del servicio:
effect(() => {
  const error = this.variacionService.error();
  if (error) {
    // Mostrar notificación de error
    this.showErrorNotification(error);
  }
});
```

## Mejores Prácticas

1. **Usa signals reactivos** en lugar de suscripciones manuales cuando sea posible
2. **Limpia el estado** cuando cambies de contexto
3. **Maneja errores** tanto a nivel de operación como global
4. **Usa filtros** para optimizar las consultas
5. **Implementa paginación** para listas grandes
6. **Aprovecha los computed signals** para estadísticas en tiempo real

## Notas Importantes

- El servicio utiliza Angular Signals para gestión reactiva del estado
- Todas las operaciones son asíncronas y devuelven Observables
- Los filtros se mantienen en el estado hasta que se limpien explícitamente
- La paginación se gestiona automáticamente con los filtros
- Los errores se manejan de forma centralizada
