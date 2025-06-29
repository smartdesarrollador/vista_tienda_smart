# Implementación de Favoritos en ProductoCard

## Descripción

Se ha implementado la funcionalidad completa de favoritos para usuarios logueados en el componente `ProductoCardComponent` del proyecto `vista_tienda_smart`.

## Funcionalidades Implementadas

### 1. Verificación Automática de Favoritos

- Al cargar un producto, se verifica automáticamente si es favorito del usuario logueado
- Utiliza un `effect` que reacciona a cambios en el usuario o producto
- Solo se ejecuta si el usuario está autenticado y en el navegador (no en SSR)

### 2. Toggle de Favoritos

- Botón de corazón que permite agregar/quitar productos de favoritos
- Verifica autenticación antes de permitir la acción
- Redirige al login si el usuario no está autenticado
- Muestra spinner de carga durante la operación
- Maneja errores de forma silenciosa

### 3. Estados Visuales

- Corazón rojo lleno cuando es favorito
- Corazón gris contorno cuando no es favorito
- Spinner de carga durante el procesamiento
- Botón deshabilitado durante la carga
- Opacidad reducida cuando está cargando

## Archivos Modificados

### Frontend (`vista_tienda_smart`)

- `src/app/shared/components/producto-card/producto-card.component.ts`
- `src/app/shared/components/producto-card/producto-card.component.html`

### Backend (`api_tienda_smart`)

- Ya existían todos los archivos necesarios:
  - `app/Models/Favorito.php`
  - `app/Http/Controllers/Api/FavoritoController.php`
  - `database/migrations/2025_06_01_001088_create_favoritos_table.php`
  - Rutas en `routes/api.php`

## Servicios Utilizados

### AuthService

- `isAuthenticated()`: Verifica si el usuario está logueado
- `currentUser()`: Obtiene el usuario actual

### FavoritoService

- `toggleFavorito(userId, productoId)`: Alterna el estado de favorito
- `verificarFavorito(request)`: Verifica si un producto es favorito

## Endpoints de la API

### Toggle Favorito

```
POST /api/vista/favoritos/toggle
Body: {
  "user_id": number,
  "producto_id": number
}
```

### Verificar Favorito

```
POST /api/vista/favoritos/verificar
Body: {
  "user_id": number,
  "producto_id": number
}
```

## Uso del Componente

El componente `producto-card` ahora maneja automáticamente los favoritos:

```html
<app-producto-card [producto]="producto" [vista]="'grid'" [configuracion]="{ mostrarFavoritos: true }" (onFavoritoToggle)="onFavoritoChange($event)"> </app-producto-card>
```

## Flujo de Funcionamiento

1. **Carga inicial**: Al mostrar un producto, se verifica automáticamente si es favorito
2. **Click en favorito**:
   - Verifica autenticación
   - Si no está logueado, redirige al login
   - Si está logueado, llama al servicio para hacer toggle
   - Actualiza el estado visual del botón
3. **Manejo de errores**: Los errores se logean en consola silenciosamente

## Consideraciones Técnicas

- Usa signals de Angular 17+ para reactividad
- Implementa verificación de plataforma (browser vs SSR)
- Maneja estados de carga y error apropiadamente
- Previene múltiples clicks simultáneos
- Usa efectos para verificación automática

## Configuración Necesaria

Asegúrate de que la configuración del entorno tenga la URL correcta de la API:

```typescript
// environments/environment.ts
export const environment = {
  apiUrl: "http://localhost:8000/api",
  // ...
};
```

## Pruebas

Para probar la funcionalidad:

1. Asegúrate de que la API esté corriendo
2. Inicia sesión con un usuario
3. Ve a cualquier página con productos
4. Haz click en el botón de corazón
5. Verifica que el estado cambie correctamente
6. Recarga la página y verifica que el estado persista

## Notas Adicionales

- Los favoritos se guardan en la base de datos
- La funcionalidad está completamente integrada con el sistema de autenticación
- El componente es reutilizable en cualquier parte de la aplicación
- Soporta todos los tipos de vista: grid, lista y compacta
