# ValorAtributoService - Documentación

## 🎯 **Descripción General**

El `ValorAtributoService` es un servicio Angular 17 que gestiona la comunicación con la API de valores de atributos. Implementa las mejores prácticas de Angular moderno usando **Signals**, **standalone components**, **función inject** y **manejo reactivo de estado**.

## 🚀 **Características Principales**

### **✅ Funcionalidades Implementadas**

- ✅ **CRUD Completo**: Crear, leer, actualizar y eliminar valores
- ✅ **Gestión Reactiva**: Signals para estado y BehaviorSubjects para datos complejos
- ✅ **Filtros Avanzados**: Múltiples criterios de filtrado y búsqueda
- ✅ **Paginación**: Control completo de navegación
- ✅ **Manejo de Imágenes**: Subida, actualización y eliminación
- ✅ **Operaciones Masivas**: Creación en lote de valores
- ✅ **Estadísticas**: Métricas del sistema
- ✅ **Estado Local**: Sincronización automática con el servidor
- ✅ **Manejo de Errores**: Centralizado y tipado
- ✅ **Utils Helpers**: Validaciones y formateo

## 🔧 **Configuración e Instalación**

### **1. Imports Requeridos**

```typescript
// En tu app.config.ts o módulo principal
import { provideHttpClient } from "@angular/common/http";

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    // ... otros providers
  ],
};
```

### **2. Estructura de Archivos**

```
src/app/core/
├── models/
│   ├── valor-atributo.interface.ts  # Interfaces TypeScript
│   └── index.ts                     # Exportaciones
├── services/
│   ├── valor-atributo.service.ts    # Servicio principal
│   └── index.ts                     # Exportaciones
└── ...
```

## 🎨 **Interfaces Principales**

### **ValorAtributo (Entidad Principal)**

```typescript
export interface ValorAtributo {
  id: number;
  atributo_id: number;
  valor: string;
  codigo?: string | null; // Código hexadecimal para colores
  imagen?: string | null; // Ruta de imagen
  created_at: string;
  updated_at: string;
  valor_formateado: string; // Valor procesado por el backend
  es_color: boolean; // True si es atributo tipo color
  tiene_imagen: boolean; // True si tiene imagen asociada
  atributo: Atributo; // Atributo padre
  variaciones_count?: number; // Cantidad de variaciones que usan este valor
}
```

### **Filtros y Búsqueda**

```typescript
export interface ValorAtributoFilters {
  atributo_id?: number; // Filtrar por atributo específico
  valor?: string; // Búsqueda parcial en valor
  codigo?: string; // Búsqueda parcial en código
  tipo_atributo?: string; // Filtrar por tipo (color, tamaño, etc.)
  con_imagen?: boolean; // Con/sin imagen
  include_usage?: boolean; // Incluir conteo de uso
  order_by?: "valor" | "codigo" | "created_at" | "atributo_id";
  order_direction?: "asc" | "desc";
  per_page?: number; // Elementos por página
  page?: number; // Página actual
}
```

### **Requests y Responses**

```typescript
// Para crear valor
export interface CreateValorAtributoRequest {
  atributo_id: number;
  valor: string;
  codigo?: string;
  imagen?: File;
}

// Para actualizar valor
export interface UpdateValorAtributoRequest {
  valor?: string;
  codigo?: string;
  imagen?: File;
  atributo_id?: number;
}

// Respuesta paginada
export interface PaginatedValorAtributoResponse {
  data: ValorAtributo[];
  links: PaginationLinks;
  meta: PaginationMeta;
}
```

## 📡 **Métodos del Servicio**

### **1. Listado y Filtrado**

```typescript
// Obtener lista paginada con filtros
getValoresAtributo(filters: ValorAtributoFilters = {}): Observable<PaginatedValorAtributoResponse>

// Obtener valores de un atributo específico
getValoresByAtributo(atributoId: number): Observable<ApiResponse<ValorAtributo[]>>

// Obtener valor por ID
getValorAtributoById(id: number): Observable<ApiResponse<ValorAtributo>>
```

### **2. Operaciones CRUD**

```typescript
// Crear nuevo valor
createValorAtributo(data: CreateValorAtributoRequest): Observable<ApiResponse<ValorAtributo>>

// Actualizar valor existente
updateValorAtributo(id: number, data: UpdateValorAtributoRequest): Observable<ApiResponse<ValorAtributo>>

// Eliminar valor
deleteValorAtributo(id: number): Observable<void>
```

### **3. Operaciones Especiales**

```typescript
// Creación masiva
bulkCreateValoresAtributo(atributoId: number, data: BulkCreateValorAtributoRequest): Observable<BulkCreateValorAtributoResponse>

// Eliminar solo imagen
removeImagenValorAtributo(id: number): Observable<ApiResponse<ValorAtributo>>

// Obtener estadísticas
getStatistics(): Observable<ApiResponse<ValorAtributoStatistics>>
```

### **4. Gestión de Estado**

```typescript
// Signals de solo lectura
readonly loading: Signal<boolean>        // Estado de carga
readonly error: Signal<string | null>    // Error actual
readonly valoresAtributo: Signal<ValorAtributo[]>  // Lista de valores

// Observables para datos complejos
readonly pagination$: Observable<PaginationMeta | null>
readonly filters$: Observable<ValorAtributoFilters>

// Métodos de control
clearState(): void                       // Limpiar todo el estado
refresh(): Observable<PaginatedValorAtributoResponse>  // Recargar con filtros actuales
```

### **5. Métodos Helper**

```typescript
// Obtener URL completa de imagen
getImageUrl(imagePath: string | null): string | null

// Validar código hexadecimal
isValidHexColor(color: string): boolean

// Formatear código de color
formatColorCode(color: string): string
```

## 💡 **Ejemplos de Uso**

### **1. Uso Básico en Componente**

```typescript
import { Component, inject, OnInit } from "@angular/core";
import { ValorAtributoService } from "../../../core/services/valor-atributo.service";

@Component({
  selector: "app-ejemplo",
  standalone: true,
  template: `
    @if (valorAtributoService.loading()) {
    <div>Cargando...</div>
    } @if (valorAtributoService.error()) {
    <div class="error">{{ valorAtributoService.error() }}</div>
    } @for (valor of valorAtributoService.valoresAtributo(); track valor.id) {
    <div>{{ valor.valor }} - {{ valor.atributo.nombre }}</div>
    }
  `,
})
export class EjemploComponent implements OnInit {
  private readonly valorAtributoService = inject(ValorAtributoService);

  ngOnInit() {
    // Cargar datos al inicializar
    this.valorAtributoService.getValoresAtributo().subscribe();
  }
}
```

### **2. Filtrado Avanzado**

```typescript
export class ListComponent {
  private readonly valorAtributoService = inject(ValorAtributoService);

  searchByColor() {
    const filters: ValorAtributoFilters = {
      tipo_atributo: "color",
      con_imagen: true,
      order_by: "valor",
      order_direction: "asc",
      per_page: 20,
    };

    this.valorAtributoService.getValoresAtributo(filters).subscribe();
  }

  searchByTerm(searchTerm: string) {
    const filters: ValorAtributoFilters = {
      valor: searchTerm,
      page: 1,
    };

    this.valorAtributoService.getValoresAtributo(filters).subscribe();
  }
}
```

### **3. Crear Valor con Imagen**

```typescript
export class CreateComponent {
  private readonly valorAtributoService = inject(ValorAtributoService);

  onFileSelected(event: Event, atributoId: number, valor: string) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      const data: CreateValorAtributoRequest = {
        atributo_id: atributoId,
        valor: valor,
        codigo: "#FF0000", // Para colores
        imagen: file,
      };

      this.valorAtributoService.createValorAtributo(data).subscribe({
        next: (response) => {
          console.log("Valor creado:", response.data);
          // El estado local se actualiza automáticamente
        },
        error: (error) => {
          console.error("Error:", error);
        },
      });
    }
  }
}
```

### **4. Creación Masiva**

```typescript
export class BulkCreateComponent {
  private readonly valorAtributoService = inject(ValorAtributoService);

  createMultipleColors(atributoId: number) {
    const data: BulkCreateValorAtributoRequest = {
      valores: [
        { valor: "Rojo", codigo: "#FF0000" },
        { valor: "Verde", codigo: "#00FF00" },
        { valor: "Azul", codigo: "#0000FF" },
        { valor: "Negro", codigo: "#000000" },
        { valor: "Blanco", codigo: "#FFFFFF" },
      ],
    };

    this.valorAtributoService.bulkCreateValoresAtributo(atributoId, data).subscribe({
      next: (response) => {
        console.log(`Creados: ${response.total_creados}`);
        console.log(`Errores: ${response.total_errores}`);
        if (response.errores.length > 0) {
          console.log("Errores:", response.errores);
        }
      },
    });
  }
}
```

### **5. Estadísticas**

```typescript
export class StatsComponent implements OnInit {
  private readonly valorAtributoService = inject(ValorAtributoService);
  readonly stats = signal<ValorAtributoStatistics | null>(null);

  ngOnInit() {
    this.valorAtributoService.getStatistics().subscribe({
      next: (response) => {
        this.stats.set(response.data);
      },
    });
  }
}
```

### **6. Paginación**

```typescript
export class PaginatedListComponent {
  private readonly valorAtributoService = inject(ValorAtributoService);
  readonly pagination = signal<PaginationMeta | null>(null);

  constructor() {
    // Suscribirse a cambios de paginación
    this.valorAtributoService.pagination$.subscribe((meta) => {
      this.pagination.set(meta);
    });
  }

  goToPage(page: number) {
    const filters: ValorAtributoFilters = { page };
    this.valorAtributoService.getValoresAtributo(filters).subscribe();
  }

  changePerPage(perPage: number) {
    const filters: ValorAtributoFilters = { per_page: perPage, page: 1 };
    this.valorAtributoService.getValoresAtributo(filters).subscribe();
  }
}
```

## 🎯 **Patterns y Mejores Prácticas**

### **1. Gestión de Estado Reactivo**

```typescript
export class ReactiveComponent {
  private readonly valorAtributoService = inject(ValorAtributoService);

  // Signals computadas para datos derivados
  readonly totalValores = computed(() => this.valorAtributoService.valoresAtributo().length);

  readonly valoresConImagen = computed(() => this.valorAtributoService.valoresAtributo().filter((v) => v.tiene_imagen).length);

  // Effect para reaccionar a cambios
  constructor() {
    effect(() => {
      const error = this.valorAtributoService.error();
      if (error) {
        // Mostrar notificación de error
        this.showErrorNotification(error);
      }
    });
  }
}
```

### **2. Búsqueda con Debounce**

```typescript
export class SearchComponent {
  private readonly valorAtributoService = inject(ValorAtributoService);
  private readonly searchSubject = new Subject<string>();

  constructor() {
    // Configurar búsqueda con debounce
    this.searchSubject
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntilDestroyed() // Angular 16+ operator
      )
      .subscribe((term) => {
        const filters: ValorAtributoFilters = { valor: term, page: 1 };
        this.valorAtributoService.getValoresAtributo(filters).subscribe();
      });
  }

  onSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchSubject.next(target.value);
  }
}
```

### **3. Validación de Formularios**

```typescript
export class FormComponent {
  private readonly valorAtributoService = inject(ValorAtributoService);

  validateColorCode(control: AbstractControl) {
    const value = control.value;
    if (!value) return null;

    return this.valorAtributoService.isValidHexColor(value) ? null : { invalidHexColor: true };
  }

  formatColorInput(event: Event) {
    const input = event.target as HTMLInputElement;
    input.value = this.valorAtributoService.formatColorCode(input.value);
  }
}
```

## 🚨 **Manejo de Errores**

### **Tipos de Error**

```typescript
// Error de validación (422)
{
  message: "Los datos proporcionados no son válidos",
  errors: {
    valor: ["El valor ya existe para este atributo"],
    codigo: ["El código debe ser un color hexadecimal válido"]
  }
}

// Error de conflicto (409)
{
  message: "No se puede eliminar el valor porque está en uso",
  variaciones_count: 5
}

// Error interno (500)
{
  message: "Error interno del servidor",
  error: "Database connection failed"
}
```

### **Manejo en Componentes**

```typescript
export class ErrorHandlingComponent {
  private readonly valorAtributoService = inject(ValorAtributoService);

  handleOperation() {
    this.valorAtributoService.createValorAtributo(data).subscribe({
      next: (response) => {
        // Éxito
        this.showSuccessMessage("Valor creado exitosamente");
      },
      error: (error) => {
        // El servicio ya maneja el error y actualiza el signal
        // Solo necesitamos reaccionar si es necesario
        if (error.message.includes("ya existe")) {
          this.showWarningMessage("Este valor ya existe");
        }
      },
    });
  }
}
```

## 🔄 **Ciclo de Vida y Limpieza**

```typescript
export class LifecycleComponent implements OnInit, OnDestroy {
  private readonly valorAtributoService = inject(ValorAtributoService);
  private readonly destroy$ = new Subject<void>();

  ngOnInit() {
    // Cargar datos iniciales
    this.valorAtributoService.getValoresAtributo().subscribe();
  }

  ngOnDestroy() {
    // Limpiar estado del servicio
    this.valorAtributoService.clearState();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

## 📊 **Performance y Optimización**

### **Estrategias Implementadas**

- ✅ **Signals**: Detección de cambios granular
- ✅ **OnPush**: Compatible con ChangeDetectionStrategy.OnPush
- ✅ **Debounce**: Búsquedas optimizadas
- ✅ **Estado Local**: Reduce llamadas al servidor
- ✅ **TrackBy**: Optimización de listas
- ✅ **Lazy Loading**: Paginación eficiente

### **Ejemplo de TrackBy**

```typescript
// En el template
@for (valor of valoresAtributo(); track trackByFn) {
  <!-- contenido -->
}

// En el componente
trackByFn = (index: number, item: ValorAtributo) => item.id;
```

## 🛠️ **Testing**

### **Configuración para Tests**

```typescript
import { TestBed } from "@angular/core/testing";
import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing";
import { ValorAtributoService } from "./valor-atributo.service";

describe("ValorAtributoService", () => {
  let service: ValorAtributoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ValorAtributoService],
    });

    service = TestBed.inject(ValorAtributoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it("should fetch valores atributo", () => {
    const mockResponse = { data: [], links: {}, meta: {} };

    service.getValoresAtributo().subscribe((response) => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/admin/valores-atributo`);
    expect(req.request.method).toBe("GET");
    req.flush(mockResponse);
  });
});
```

## 📈 **Próximas Mejoras**

- [ ] Cache con TTL
- [ ] Retry automático en errores de red
- [ ] Optimización de imágenes client-side
- [ ] WebSocket para actualizaciones en tiempo real
- [ ] Service Worker para offline support

---

**📖 Esta documentación cubre todas las funcionalidades del ValorAtributoService. Para más ejemplos específicos, consulta el código de los componentes de ejemplo.**
