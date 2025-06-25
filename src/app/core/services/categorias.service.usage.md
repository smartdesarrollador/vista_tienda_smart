# 📚 **Guía de Uso - CategoriasService**

## **🎯 Descripción**

Servicio completo para la gestión de categorías en el panel de administración. Maneja operaciones CRUD, jerarquías, filtros, búsquedas y cache reactivo.

---

## **📦 Importación**

```typescript
import { CategoriasService } from "@core/services/categorias.service";
import { Categoria, CategoriaFormData, CategoriaFilters } from "@core/models/categoria.model";
```

---

## **🔧 Inyección en Componente**

```typescript
import { Component, inject, OnInit } from "@angular/core";
import { CategoriasService } from "@core/services/categorias.service";

@Component({
  selector: "app-categorias",
  standalone: true,
  template: `...`,
})
export class CategoriasComponent implements OnInit {
  private readonly categoriasService = inject(CategoriasService);

  ngOnInit(): void {
    this.loadCategorias();
  }

  loadCategorias(): void {
    this.categoriasService.getCategorias().subscribe({
      next: (response) => console.log(response.data),
      error: (error) => console.error(error),
    });
  }
}
```

---

## **📋 Métodos Principales**

### **🌐 Métodos Públicos (Sin Autenticación)**

#### **1. Listar Categorías con Filtros**

```typescript
// Listar todas las categorías
this.categoriasService.getCategorias().subscribe((response) => {
  console.log(response.data); // Array de categorías
  console.log(response.meta); // Información de paginación
});

// Con filtros
const filters: CategoriaFilters = {
  activo: true,
  search: "smartphones",
  sort_by: "nombre",
  sort_direction: "asc",
  per_page: 10,
  page: 1,
};

this.categoriasService.getCategorias(filters).subscribe((response) => {
  // Manejar respuesta filtrada
});
```

#### **2. Obtener Estructura de Árbol**

```typescript
this.categoriasService.getCategoriaTree().subscribe((response) => {
  console.log(response.data); // Estructura jerárquica
  console.log(response.meta.total_categorias);
});
```

#### **3. Categorías Principales**

```typescript
this.categoriasService.getCategoriasPrincipales().subscribe((response) => {
  // Solo categorías sin padre
});
```

#### **4. Obtener Categoría Individual**

```typescript
// Por ID
this.categoriasService.getCategoriaById(1).subscribe((response) => {
  console.log(response.data); // Categoría completa
});

// Por Slug
this.categoriasService.getCategoriaBySlug("smartphones").subscribe((response) => {
  console.log(response.data); // Categoría completa
});
```

---

### **🔐 Métodos Protegidos (Requieren Autenticación)**

#### **1. Crear Categoría**

```typescript
const nuevaCategoria: CategoriaFormData = {
  nombre: "Nueva Categoría",
  descripcion: "Descripción de la categoría",
  imagen: "categorias/nueva.jpg",
  activo: true,
  orden: 1,
  categoria_padre_id: null, // null para categoría principal
  meta_title: "SEO Title",
  meta_description: "SEO Description",
};

this.categoriasService.createCategoria(nuevaCategoria).subscribe({
  next: (response) => {
    console.log("Categoría creada:", response.data);
    // El servicio automáticamente actualiza las listas
  },
  error: (error) => console.error("Error al crear:", error),
});
```

#### **2. Actualizar Categoría**

```typescript
const categoriaActualizada: CategoriaFormData = {
  nombre: "Nombre Actualizado",
  descripcion: "Nueva descripción",
  activo: true,
  orden: 2,
};

this.categoriasService.updateCategoria(1, categoriaActualizada).subscribe({
  next: (response) => console.log("Actualizada:", response.data),
  error: (error) => console.error("Error al actualizar:", error),
});
```

#### **3. Eliminar Categoría**

```typescript
this.categoriasService.deleteCategoria(1).subscribe({
  next: (response) => console.log(response.message),
  error: (error) => console.error("Error al eliminar:", error),
});
```

#### **4. Actualizar Orden**

```typescript
const nuevoOrden = {
  categorias: [
    { id: 1, orden: 1 },
    { id: 2, orden: 2 },
    { id: 3, orden: 3 },
  ],
};

this.categoriasService.updateCategoriaOrder(nuevoOrden).subscribe({
  next: (response) => console.log("Orden actualizado:", response.message),
  error: (error) => console.error("Error:", error),
});
```

---

## **📊 Observables Reactivos**

### **Suscribirse a Estados**

```typescript
export class CategoriasComponent implements OnInit {
  private readonly categoriasService = inject(CategoriasService);

  // Estados reactivos
  categorias$ = this.categoriasService.categorias$;
  loading$ = this.categoriasService.loading$;
  total$ = this.categoriasService.totalCategorias$;
  tree$ = this.categoriasService.categoriaTree$;

  ngOnInit(): void {
    // Los observables se actualizan automáticamente
    this.categorias$.subscribe((categorias) => {
      console.log("Categorías actualizadas:", categorias);
    });

    this.loading$.subscribe((loading) => {
      if (loading) {
        console.log("Cargando...");
      }
    });
  }
}
```

### **Uso en Template con Async Pipe**

```html
<!-- Lista de categorías -->
<div *ngIf="loading$ | async" class="loading-spinner">Cargando categorías...</div>

<div *ngFor="let categoria of categorias$ | async" class="categoria-item">
  <h3>{{ categoria.nombre }}</h3>
  <p>{{ categoria.descripcion }}</p>
  <span [class]="categoria.activo ? 'active' : 'inactive'"> {{ categoria.activo ? 'Activo' : 'Inactivo' }} </span>
</div>

<!-- Árbol jerárquico -->
<ng-container *ngFor="let nodo of tree$ | async">
  <app-categoria-tree-node [node]="nodo"></app-categoria-tree-node>
</ng-container>
```

---

## **🛠️ Métodos de Utilidad**

### **1. Búsqueda**

```typescript
this.categoriasService.searchCategorias("smartphone", 5).subscribe((categorias) => {
  console.log("Resultados de búsqueda:", categorias);
});
```

### **2. Validaciones**

```typescript
// Verificar si tiene productos
this.categoriasService.checkCategoriaHasProducts(1).subscribe((result) => {
  if (result.has_products) {
    console.log(`Tiene ${result.products_count} productos`);
  }
});

// Verificar si tiene subcategorías
this.categoriasService.checkCategoriaHasSubcategorias(1).subscribe((result) => {
  if (result.has_subcategorias) {
    console.log(`Tiene ${result.subcategorias_count} subcategorías`);
  }
});

// Validar nombre disponible
this.categoriasService.validateNombreDisponible("Mi Categoría").subscribe((result) => {
  if (!result.available) {
    console.log("Nombre no disponible");
  }
});
```

### **3. Navegación y Breadcrumbs**

```typescript
// Obtener breadcrumb
this.categoriasService.getBreadcrumb(5).subscribe((breadcrumb) => {
  console.log("Ruta:", breadcrumb.map((item) => item.nombre).join(" > "));
});

// Obtener ruta completa (usando cache local)
const rutaCompleta = this.categoriasService.getFullPath(5);
console.log("Ruta completa:", rutaCompleta);
```

### **4. Para Selectores/Dropdown**

```typescript
this.categoriasService.getCategoriasForSelect().subscribe((opciones) => {
  // Array optimizado para selectores con niveles de jerarquía
  opciones.forEach((opcion) => {
    console.log(`${"--".repeat(opcion.nivel)} ${opcion.nombre}`);
  });
});
```

---

## **📈 Gestión de Estado**

### **Valores Actuales sin Suscripción**

```typescript
// Obtener estado actual sin observables
const categoriasActuales = this.categoriasService.getCurrentCategorias();
const arbolActual = this.categoriasService.getCurrentTree();

console.log("Categorías en memoria:", categoriasActuales);
console.log("Árbol en memoria:", arbolActual);
```

### **Refrescar Datos**

```typescript
// Forzar actualización desde servidor
this.categoriasService.refreshData();

// Limpiar cache local
this.categoriasService.clearCache();
```

---

## **🎨 Ejemplo Completo de Componente**

```typescript
import { Component, inject, OnInit, OnDestroy, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from "rxjs";
import { FormBuilder, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { CategoriasService } from "@core/services/categorias.service";
import { Categoria, CategoriaFilters } from "@core/models/categoria.model";

@Component({
  selector: "app-categorias",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="categorias-container">
      <!-- Filtros -->
      <form [formGroup]="filtrosForm" class="filters-form">
        <input formControlName="search" placeholder="Buscar categorías..." class="search-input" />
        <select formControlName="activo" class="status-select">
          <option value="">Todos los estados</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
      </form>

      <!-- Loading -->
      <div *ngIf="loading$ | async" class="loading">Cargando categorías...</div>

      <!-- Lista de categorías -->
      <div class="categorias-grid">
        <div *ngFor="let categoria of categorias$ | async; trackBy: trackByCategoria" class="categoria-card" [class.inactive]="!categoria.activo">
          <h3>{{ categoria.nombre }}</h3>
          <p>{{ categoria.descripcion }}</p>

          <div class="categoria-info">
            <span class="orden">Orden: {{ categoria.orden }}</span>
            <span class="productos-count"> Productos: {{ categoria.productos_count || 0 }} </span>
          </div>

          <div class="categoria-actions">
            <button (click)="editarCategoria(categoria)">Editar</button>
            <button (click)="eliminarCategoria(categoria.id)" [disabled]="categoria.productos_count > 0">Eliminar</button>
          </div>
        </div>
      </div>

      <!-- Paginación -->
      <div class="pagination">Total: {{ totalCategorias$ | async }} categorías</div>
    </div>
  `,
  styles: [
    `
      .categorias-container {
        @apply p-6 space-y-6;
      }

      .filters-form {
        @apply flex gap-4 mb-6;
      }

      .search-input,
      .status-select {
        @apply px-4 py-2 border border-gray-300 rounded-lg;
      }

      .categorias-grid {
        @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6;
      }

      .categoria-card {
        @apply bg-white p-6 rounded-lg shadow-md border;
      }

      .categoria-card.inactive {
        @apply opacity-60 bg-gray-50;
      }

      .categoria-info {
        @apply flex justify-between text-sm text-gray-600 mt-4;
      }

      .categoria-actions {
        @apply flex gap-2 mt-4;
      }

      .categoria-actions button {
        @apply px-4 py-2 rounded text-sm font-medium;
      }

      .categoria-actions button:first-child {
        @apply bg-blue-500 text-white hover:bg-blue-600;
      }

      .categoria-actions button:last-child {
        @apply bg-red-500 text-white hover:bg-red-600 disabled:bg-gray-300;
      }
    `,
  ],
})
export class CategoriasComponent implements OnInit, OnDestroy {
  private readonly categoriasService = inject(CategoriasService);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  // Estados reactivos del servicio
  readonly categorias$ = this.categoriasService.categorias$;
  readonly loading$ = this.categoriasService.loading$;
  readonly totalCategorias$ = this.categoriasService.totalCategorias$;

  // Formulario de filtros
  filtrosForm: FormGroup = this.fb.group({
    search: [""],
    activo: [""],
  });

  ngOnInit(): void {
    // Cargar categorías iniciales
    this.loadCategorias();

    // Suscribirse a cambios en filtros
    this.filtrosForm.valueChanges.pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$)).subscribe(() => {
      this.applyFilters();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCategorias(): void {
    this.categoriasService.getCategorias().subscribe({
      error: (error) => console.error("Error al cargar categorías:", error),
    });
  }

  private applyFilters(): void {
    const formValue = this.filtrosForm.value;
    const filters: CategoriaFilters = {};

    if (formValue.search) {
      filters.search = formValue.search;
    }

    if (formValue.activo !== "") {
      filters.activo = formValue.activo === "true";
    }

    this.categoriasService.getCategorias(filters).subscribe();
  }

  editarCategoria(categoria: Categoria): void {
    // Implementar lógica de edición
    console.log("Editar categoría:", categoria);
  }

  eliminarCategoria(id: number): void {
    if (confirm("¿Estás seguro de eliminar esta categoría?")) {
      this.categoriasService.deleteCategoria(id).subscribe({
        next: () => console.log("Categoría eliminada exitosamente"),
        error: (error) => console.error("Error al eliminar:", error),
      });
    }
  }

  trackByCategoria(index: number, categoria: Categoria): number {
    return categoria.id;
  }
}
```

---

## **🚨 Manejo de Errores**

```typescript
this.categoriasService.createCategoria(data).subscribe({
  next: (response) => {
    // Éxito
    console.log("Categoría creada:", response.data);
  },
  error: (error) => {
    // El servicio ya maneja errores básicos
    // Aquí puedes agregar lógica específica
    if (error.message.includes("duplicated")) {
      alert("Ya existe una categoría con ese nombre");
    } else {
      alert(`Error: ${error.message}`);
    }
  },
});
```

---

## **🎯 Mejores Prácticas**

1. **Usar trackBy** en `*ngFor` para optimizar renders
2. **Gestionar suscripciones** con `takeUntil` y `OnDestroy`
3. **Debounce en búsquedas** para evitar muchas peticiones
4. **Cache inteligente**: El servicio maneja automáticamente el cache
5. **Estados reactivos**: Preferir observables sobre métodos directos
6. **Validaciones**: Usar métodos de validación antes de acciones destructivas

---

**🎉 ¡El servicio está listo para usar en toda la aplicación!**
