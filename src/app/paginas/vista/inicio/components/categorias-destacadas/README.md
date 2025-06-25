# Componente Categorías Destacadas

## 📋 Descripción

Componente que muestra **5 categorías seleccionadas aleatoriamente** de las categorías principales activas para la página de inicio de la tienda virtual.

## ✨ Características Principales

### 🎲 Selección Aleatoria

- **Muestra exactamente 5 categorías** de forma aleatoria
- **Algoritmo Fisher-Yates** para shuffle verdaderamente aleatorio
- **Actualización automática** en cada carga de la página
- **Manejo inteligente**: Si hay 5 o menos categorías, muestra todas

### 🖼️ Gestión de Imágenes

- **URLs completas**: Las imágenes se concatenan automáticamente con el dominio del environment
- **Formato resultante**: `http://localhost:8000/assets/categorias/categoria.jpg`
- **Compatibilidad**: Maneja URLs absolutas y relativas correctamente
- **Fallback elegante**: SVG placeholder cuando no hay imagen disponible

### 🎯 Funcionalidades

- ✅ **Estados de UI completos**: loading, error, vacío, éxito
- ✅ **Responsive design** adaptable a todos los dispositivos
- ✅ **Navegación directa** a productos de cada categoría
- ✅ **Imágenes optimizadas** con NgOptimizedImage
- ✅ **Performance optimizado** con trackBy functions
- ✅ **SSR compatible** con Angular 18

## 🔧 Implementación Técnica

### Gestión de URLs de Imágenes

```typescript
/**
 * Computed signal para generar la URL completa de la imagen
 */
readonly imagenCompleta = computed(() => {
  const imagen = this.categoria().imagen;
  if (!imagen) {
    return '';
  }

  // Si la imagen ya tiene el protocolo (http/https), devolverla tal como está
  if (imagen.startsWith('http://') || imagen.startsWith('https://')) {
    return imagen;
  }

  // Si es una ruta relativa, concatenar con el dominio del backend
  const baseUrl = environment.urlDominioApi.replace('/api', '');

  // Asegurar que no haya doble slash
  const imagenPath = imagen.startsWith('/') ? imagen : `/${imagen}`;

  return `${baseUrl}${imagenPath}`;
});
```

### Algoritmo de Selección Aleatoria

```typescript
/**
 * Baraja un array usando el algoritmo Fisher-Yates
 */
private shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
```

### Computed Signal para Categorías

```typescript
readonly categoriasDestacadas = computed(() => {
  const categoriasActivas = this.categorias()
    .filter(categoria => categoria.activo && categoria.categoria_padre_id === null);

  // Si hay 5 o menos categorías, devolver todas
  if (categoriasActivas.length <= 5) {
    return categoriasActivas;
  }

  // Si hay más de 5, seleccionar 5 aleatorias
  return this.shuffleArray([...categoriasActivas]).slice(0, 5);
});
```

## 📊 Grid Responsive

```css
/* Grid adaptable para diferentes pantallas */
.grid {
  grid-template-columns: repeat(2, 1fr); /* Móvil: 2 columnas */
}

@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(3, 1fr); /* Tablet: 3 columnas */
  }
}

@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(4, 1fr); /* Desktop: 4 columnas */
  }
}

@media (min-width: 1280px) {
  .grid {
    grid-template-columns: repeat(5, 1fr); /* Desktop XL: 5 columnas */
  }
}
```

## 🧪 Testing

### Tests Implementados

- ✅ **Creación del componente**
- ✅ **Carga de categorías** con filtros correctos
- ✅ **Estados de UI**: loading, error, vacío
- ✅ **Navegación** a productos y categorías
- ✅ **Funcionalidad aleatoria** con mocks de Math.random
- ✅ **Filtrado correcto** de categorías activas/principales
- ✅ **Límite de 5 categorías** funcional
- ✅ **Gestión de URLs de imágenes** con diferentes formatos
- ✅ **Fallbacks de imágenes** cuando no hay imagen disponible

### Comando para Tests

```bash
ng test --include="**/categoria-card.component.spec.ts" --no-watch --browsers=ChromeHeadless
ng test --include="**/categorias-destacadas.component.spec.ts" --no-watch --browsers=ChromeHeadless
```

## 🎨 Estados Visuales

### 1. **Loading State**

- 5 skeleton placeholders animados
- Grid responsive mantenido
- Transiciones suaves

### 2. **Success State**

- Grid de 5 categorías aleatorias
- Cards interactivas con hover effects
- Imágenes con URLs completas desde el backend
- Botón "Ver Todas las Categorías"

### 3. **Empty State**

- Mensaje informativo elegante
- Icono representativo
- Guía para el usuario

### 4. **Error State**

- Mensaje de error claro
- Botón de reintento funcional
- Manejo graceful de errores

## 🔄 Flujo de Datos

1. **Carga inicial**: `ngOnInit()` → `cargarCategorias()`
2. **Servicio API**: Obtiene hasta 20 categorías principales
3. **Filtrado**: Solo categorías activas sin padre
4. **Aleatorización**: Fisher-Yates shuffle si hay más de 5
5. **Selección**: Toma las primeras 5 del array shuffled
6. **Renderizado**: Computed signal actualiza la vista
7. **Imágenes**: URLs se construyen automáticamente con el dominio del environment

## 🚀 Performance

### Optimizaciones Implementadas

- **Computed signals** para derivaciones eficientes
- **TrackBy functions** en listas para cambios mínimos DOM
- **NgOptimizedImage** para carga de imágenes optimizada
- **Lazy loading** de imágenes no críticas
- **TakeUntilDestroyed** para prevenir memory leaks
- **URLs absolutas** para mejor cache de imágenes

### Métricas Esperadas

- **Tiempo de carga**: < 200ms
- **Tamaño bundle**: ~25KB gzipped
- **LCP**: Optimizado con priority="false" en imágenes
- **CLS**: Minimizado con aspect-ratio: 1/1

## 🔧 Configuración

### Variables de Environment

El componente utiliza `environment.urlDominioApi` para construir las URLs completas de las imágenes:

```typescript
// environment.ts
export const environment = {
  urlDominioApi: "http://localhost:8000/api",
};

// Resultado para imagen: '/assets/categorias/ejemplo.jpg'
// URL final: 'http://localhost:8000/assets/categorias/ejemplo.jpg'
```

### Variables de Configuración

```typescript
const CONFIG = {
  CATEGORIAS_MOSTRADAS: 5, // Número de categorías a mostrar
  CATEGORIAS_CARGADAS: 20, // Número de categorías a cargar para selección
  HABILITAR_ALEATORIZACION: true, // Habilitar/deshabilitar aleatorización
};
```

### Personalización de Grid

```typescript
// Cambiar número de categorías mostradas
readonly categoriasDestacadas = computed(() => {
  // Cambiar el slice(0, 5) por slice(0, N)
  return this.shuffleArray([...categoriasActivas]).slice(0, 5);
});
```

## 📱 Responsive Breakpoints

| Dispositivo | Breakpoint | Columnas | Observaciones          |
| ----------- | ---------- | -------- | ---------------------- |
| Móvil       | < 768px    | 2        | Layout compacto        |
| Tablet      | 768px+     | 3        | Balance visual         |
| Desktop     | 1024px+    | 4        | Espaciado óptimo       |
| Desktop XL  | 1280px+    | 5        | Uso completo del ancho |

## 🎯 Próximas Mejoras

- [ ] **Cache inteligente** para evitar re-shuffles innecesarios
- [ ] **Configuración admin** para número de categorías mostradas
- [ ] **Análitics** para tracking de clicks por categoría
- [ ] **A/B Testing** para orden fijo vs aleatorio
- [ ] **Prefetch** de imágenes de categorías no mostradas
- [ ] **Animaciones de entrada** para mejor UX
- [ ] **Modo dark** support completo
- [ ] **Compresión de imágenes** automática en el backend
- [ ] **WebP support** para mejor performance
