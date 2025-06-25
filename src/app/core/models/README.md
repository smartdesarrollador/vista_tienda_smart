# 📋 Interfaces y Servicios de Pedidos

## 🎯 **Descripción General**

Este módulo contiene todas las interfaces TypeScript y servicios para la gestión de pedidos en el panel administrativo. Está diseñado siguiendo las mejores prácticas de Angular 17 con tipado estricto y programación reactiva.

## 📁 **Estructura de Archivos**

```
core/
├── models/
│   ├── common.interface.ts      # Interfaces comunes reutilizables
│   ├── pedido.interface.ts      # Interfaces específicas de pedidos
│   └── index.ts                 # Exportaciones centralizadas
└── services/
    ├── pedido.service.ts        # Servicio principal de pedidos
    └── index.ts                 # Exportaciones centralizadas
```

## 🔧 **Interfaces Principales**

### **Pedido**

Interface principal que representa un pedido completo con todas sus relaciones:

```typescript
interface Pedido {
  id: number;
  estado: EstadoPedido;
  tipo_pago: TipoPago;
  total: number;
  usuario: UsuarioPedido;
  detalles: DetallePedido[];
  // ... otros campos
}
```

### **DetallePedido**

Representa cada item dentro de un pedido:

```typescript
interface DetallePedido {
  id: number;
  producto_id: number;
  variacion_id?: number;
  cantidad: number;
  precio_unitario: number;
  producto: ProductoPedido;
  variacion?: VariacionPedido;
  // ... otros campos
}
```

### **DTOs para Formularios**

Interfaces optimizadas para envío de datos:

```typescript
interface CreatePedidoDto {
  user_id: number;
  tipo_pago: TipoPago;
  items: CreateDetallePedidoDto[];
  // ... campos opcionales
}
```

## 🛠️ **Servicio PedidoService**

### **Características Principales**

- ✅ **Estado Reactivo**: Usa `BehaviorSubject` para gestión de estado
- ✅ **Tipado Estricto**: Todas las operaciones están tipadas
- ✅ **Manejo de Errores**: Gestión centralizada de errores
- ✅ **Loading States**: Control de estados de carga
- ✅ **Caché Local**: Mantiene estado local de pedidos

### **Métodos Principales**

#### **CRUD Básico**

```typescript
// Obtener pedidos con filtros
obtenerPedidos(filtros?: PedidoFilters): Observable<PedidoResponse>

// Obtener pedido específico
obtenerPedido(id: number): Observable<Pedido>

// Crear nuevo pedido
crearPedido(pedidoData: CreatePedidoDto): Observable<Pedido>

// Actualizar pedido
actualizarPedido(id: number, datos: UpdatePedidoDto): Observable<Pedido>

// Eliminar pedido
eliminarPedido(id: number): Observable<void>
```

#### **Operaciones Especiales**

```typescript
// Cambiar estado del pedido
cambiarEstado(id: number, cambio: CambiarEstadoDto): Observable<Pedido>

// Aplicar cupón
aplicarCupon(id: number, cupon: AplicarCuponDto): Observable<AplicarCuponResponse>

// Obtener estadísticas
obtenerEstadisticas(fechaDesde?: string, fechaHasta?: string): Observable<EstadisticasResponse>

// Pedidos por usuario
obtenerPedidosPorUsuario(usuarioId: number): Observable<PedidosPorUsuarioResponse>
```

#### **Filtros Rápidos**

```typescript
// Filtros predefinidos
obtenerPedidosPendientes(): Observable<PedidoResponse>
obtenerPedidosEnProceso(): Observable<PedidoResponse>
obtenerPedidosFinalizados(): Observable<PedidoResponse>

// Filtros por criterio
obtenerPedidosPorEstado(estado: EstadoPedido): Observable<PedidoResponse>
obtenerPedidosPorTipoPago(tipoPago: TipoPago): Observable<PedidoResponse>
buscarPedidos(termino: string): Observable<PedidoResponse>
```

### **Estado Reactivo**

El servicio expone observables para reactividad:

```typescript
// Lista de pedidos actual
pedidos$: Observable<Pedido[]>;

// Pedido seleccionado
pedidoSeleccionado$: Observable<Pedido | null>;

// Estado de carga
loading$: Observable<boolean>;

// Estadísticas
estadisticas$: Observable<EstadisticasResponse | null>;
```

## 📊 **Uso en Componentes**

### **Ejemplo Básico**

```typescript
import { Component, inject, OnInit } from "@angular/core";
import { PedidoService } from "@core/services";
import { Pedido, PedidoFilters } from "@core/models";

@Component({
  selector: "app-pedido-list",
  template: `
    <div class="pedidos-container">
      @if (loading$ | async) {
      <div class="loading">Cargando pedidos...</div>
      } @for (pedido of pedidos$ | async; track pedido.id) {
      <div class="pedido-card">
        <h3>Pedido #{{ pedido.id }}</h3>
        <p>Cliente: {{ pedido.usuario.nombre }}</p>
        <p>Total: {{ pedido.total | currency : "PEN" }}</p>
        <span class="badge" [class]="'badge-' + getEstadoColor(pedido.estado)">
          {{ pedido.estado_detallado.nombre }}
        </span>
      </div>
      }
    </div>
  `,
})
export class PedidoListComponent implements OnInit {
  private pedidoService = inject(PedidoService);

  // Observables reactivos
  pedidos$ = this.pedidoService.pedidos$;
  loading$ = this.pedidoService.loading$;

  ngOnInit(): void {
    this.cargarPedidos();
  }

  cargarPedidos(): void {
    const filtros: PedidoFilters = {
      sort_by: "created_at",
      sort_direction: "desc",
      per_page: 20,
    };

    this.pedidoService.obtenerPedidos(filtros).subscribe();
  }

  filtrarPorEstado(estado: EstadoPedido): void {
    this.pedidoService.obtenerPedidosPorEstado(estado).subscribe();
  }

  getEstadoColor(estado: EstadoPedido): string {
    const colores = {
      pendiente: "warning",
      aprobado: "info",
      entregado: "success",
      cancelado: "danger",
    };
    return colores[estado] || "secondary";
  }
}
```

### **Ejemplo con Formulario**

```typescript
import { Component, inject } from "@angular/core";
import { FormBuilder, FormArray, Validators } from "@angular/forms";
import { PedidoService } from "@core/services";
import { CreatePedidoDto, TipoPago } from "@core/models";

@Component({
  selector: "app-pedido-form",
  template: `
    <form [formGroup]="pedidoForm" (ngSubmit)="onSubmit()">
      <!-- Información del cliente -->
      <div class="form-group">
        <label>Cliente</label>
        <select formControlName="user_id" class="form-control">
          <option value="">Seleccionar cliente...</option>
          @for (cliente of clientes; track cliente.id) {
          <option [value]="cliente.id">{{ cliente.nombre }}</option>
          }
        </select>
      </div>

      <!-- Tipo de pago -->
      <div class="form-group">
        <label>Tipo de Pago</label>
        <select formControlName="tipo_pago" class="form-control">
          @for (tipo of tiposPago; track tipo.value) {
          <option [value]="tipo.value">{{ tipo.label }}</option>
          }
        </select>
      </div>

      <!-- Items del pedido -->
      <div class="items-section">
        <h4>Items del Pedido</h4>
        <div formArrayName="items">
          @for (item of itemsArray.controls; track $index; let i = $index) {
          <div [formGroupName]="i" class="item-row">
            <select formControlName="producto_id" class="form-control">
              <option value="">Seleccionar producto...</option>
              @for (producto of productos; track producto.id) {
              <option [value]="producto.id">{{ producto.nombre }}</option>
              }
            </select>

            <input type="number" formControlName="cantidad" placeholder="Cantidad" class="form-control" min="1" />

            <button type="button" (click)="removeItem(i)" class="btn btn-danger">Eliminar</button>
          </div>
          }
        </div>

        <button type="button" (click)="addItem()" class="btn btn-secondary">Agregar Item</button>
      </div>

      <div class="form-actions">
        <button type="submit" [disabled]="pedidoForm.invalid || (loading$ | async)" class="btn btn-primary">@if (loading$ | async) { Creando... } @else { Crear Pedido }</button>
      </div>
    </form>
  `,
})
export class PedidoFormComponent {
  private fb = inject(FormBuilder);
  private pedidoService = inject(PedidoService);

  loading$ = this.pedidoService.loading$;

  pedidoForm = this.fb.group({
    user_id: ["", Validators.required],
    tipo_pago: ["contado" as TipoPago, Validators.required],
    observaciones: [""],
    items: this.fb.array([]),
  });

  get itemsArray() {
    return this.pedidoForm.get("items") as FormArray;
  }

  addItem(): void {
    const itemForm = this.fb.group({
      producto_id: ["", Validators.required],
      variacion_id: [null],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      descuento: [0],
    });

    this.itemsArray.push(itemForm);
  }

  removeItem(index: number): void {
    this.itemsArray.removeAt(index);
  }

  onSubmit(): void {
    if (this.pedidoForm.valid) {
      const pedidoData: CreatePedidoDto = this.pedidoForm.value as CreatePedidoDto;

      this.pedidoService.crearPedido(pedidoData).subscribe({
        next: (pedido) => {
          console.log("Pedido creado:", pedido);
          // Navegar o mostrar mensaje de éxito
        },
        error: (error) => {
          console.error("Error al crear pedido:", error);
          // Mostrar mensaje de error
        },
      });
    }
  }
}
```

## 🎨 **Constantes y Utilidades**

### **Constantes Predefinidas**

```typescript
import { ESTADOS_PEDIDO, TIPOS_PAGO, CANALES_VENTA, MONEDAS } from '@core/models';

// Usar en templates
@for (estado of ESTADOS_PEDIDO; track estado.value) {
  <option [value]="estado.value" [class]="'text-' + estado.color">
    {{ estado.label }}
  </option>
}
```

### **Validaciones de Negocio**

```typescript
// Verificar si se puede editar
if (this.pedidoService.puedeEditarPedido(pedido)) {
  // Mostrar botón de editar
}

// Verificar transición de estado válida
if (this.pedidoService.puedeCambiarEstado(pedido, "enviado")) {
  // Permitir cambio de estado
}

// Verificar si se puede aplicar cupón
if (this.pedidoService.puedeAplicarCupon(pedido)) {
  // Mostrar opción de cupón
}
```

## 🔄 **Gestión de Estado**

### **Selección de Pedido**

```typescript
// Seleccionar pedido
this.pedidoService.seleccionarPedido(pedido);

// Escuchar pedido seleccionado
this.pedidoService.pedidoSeleccionado$.subscribe((pedido) => {
  if (pedido) {
    console.log("Pedido seleccionado:", pedido);
  }
});

// Limpiar selección
this.pedidoService.limpiarPedidoSeleccionado();
```

### **Refrescar Datos**

```typescript
// Refrescar todos los datos
this.pedidoService.refrescarDatos();

// Limpiar caché
this.pedidoService.limpiarPedidos();
this.pedidoService.limpiarEstadisticas();
```

## 📈 **Estadísticas y Reportes**

```typescript
// Obtener estadísticas del mes actual
const fechaDesde = "2024-01-01";
const fechaHasta = "2024-01-31";

this.pedidoService.obtenerEstadisticas(fechaDesde, fechaHasta).subscribe((stats) => {
  console.log("Total de pedidos:", stats.estadisticas.resumen.total_pedidos);
  console.log("Ventas totales:", stats.estadisticas.resumen.total_ventas);
  console.log("Ticket promedio:", stats.estadisticas.resumen.ticket_promedio);
});

// Escuchar estadísticas reactivamente
this.pedidoService.estadisticas$.subscribe((stats) => {
  if (stats) {
    // Actualizar gráficos o métricas
  }
});
```

## 🚀 **Mejores Prácticas**

1. **Siempre usar los observables** del servicio para reactividad
2. **Manejar estados de loading** para mejor UX
3. **Usar las constantes predefinidas** para opciones de formularios
4. **Validar permisos** antes de mostrar acciones
5. **Gestionar errores** adecuadamente en los componentes
6. **Limpiar suscripciones** en `ngOnDestroy`

## 🔧 **Extensibilidad**

El servicio está diseñado para ser fácilmente extensible:

- Agregar nuevos filtros en `PedidoFilters`
- Crear nuevos métodos de utilidad
- Extender las interfaces según necesidades
- Agregar nuevos estados reactivos

## 📚 **Referencias**

- [Documentación Angular 17](https://angular.dev)
- [RxJS Operators](https://rxjs.dev/guide/operators)
- [Angular Reactive Forms](https://angular.dev/guide/forms/reactive-forms)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
