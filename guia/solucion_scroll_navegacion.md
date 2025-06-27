# Solución de Scroll Automático en Navegación - Vista Tienda Smart

## Problema Identificado

La aplicación tenía un comportamiento inconsistente en la navegación donde al hacer clic en enlaces o botones que redirigen a otras páginas, a veces la nueva página aparecía desplazada hacia abajo en lugar de mostrar la parte superior de la página.

Este problema es común en aplicaciones Angular con SSR (Server-Side Rendering) debido a que el router no tiene configurado el comportamiento de scroll automático.

## Solución Implementada

### 1. Configuración del Router con Scroll Automático

Se modificó el archivo `app.config.ts` para incluir la configuración de scroll automático:

```typescript
import { provideRouter, withInMemoryScrolling } from "@angular/router";

export const appConfig: ApplicationConfig = {
  providers: [
    // ... otros providers
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: "top",
        anchorScrolling: "enabled",
      })
    ),
    // ... otros providers
  ],
};
```

### 2. Configuración Explicada

- **`scrollPositionRestoration: 'top'`**: Hace que el scroll siempre vaya a la parte superior (top) cuando se navega a una nueva ruta
- **`anchorScrolling: 'enabled'`**: Habilita el scroll automático a anclas (#) en caso de que se usen enlaces con fragmentos

### 3. Casos Específicos Adicionales

Algunos componentes ya tenían implementación manual de scroll, lo cual está bien como refuerzo:

- `productos-por-categoria.component.ts`: Usa `window.scrollTo({ top: 0, behavior: 'smooth' })`
- `busqueda.component.ts`: Implementa scroll manual en ciertas operaciones

## Resultado

Con esta configuración, ahora:

✅ **Todas las navegaciones** inician desde la parte superior de la página
✅ **Botones de productos** redirigen al detalle mostrando la parte superior
✅ **Enlaces de categorías** muestran la página desde arriba
✅ **Navegación general** tiene comportamiento consistente
✅ **Compatible con SSR** sin conflictos

## Casos de Uso Cubiertos

- Navegación desde cards de producto al detalle
- Navegación entre páginas del catálogo
- Redirecciones desde carrito a checkout
- Navegación desde enlaces del navbar
- Cualquier navegación programática con `router.navigate()`

## Notas Adicionales

- Esta configuración es **global** para toda la aplicación
- Es **compatible con SSR** (Server-Side Rendering)
- No afecta el comportamiento de scroll manual cuando es necesario
- Los componentes que ya tenían scroll manual seguirán funcionando normalmente

## Archivos Modificados

- `src/app/app.config.ts`: Agregada configuración de scroll automático al router
