# SPEC — Etiquetador Web: MANUAL tab + rediseño mobile-first

## 1. Objetivo

Permitir que un operador etiquete rollos de tela que no tienen etiqueta interna escaneada, usando un flujo táctil desde celular o tablet. El diseño general de la app debe adaptarse a mobile-first manteniendo el estilo visual actual.

---

## 2. Flujo MANUAL (wizard secuencial)

```
[1. Selección de GRUPO]
        ↓
[2. Selección de TIPO]  ← tabs, uno por cada tipo del grupo
        ↓
[3. Selección de ARTÍCULO BASE]  ← botones, descAdicional vacío
        ↓
[4. Selección de COLOR]  ← botones, mismo codBase, descAdicional no vacío
        ↓
[5. Ingreso de PESO]  ← teclado numérico, formato XX.XX
        ↓
   ¿checkbox "mismo color"?
   SÍ → vuelve al paso 5     NO → vuelve al paso 4
```

**Reglas del flujo:**
- Un artículo base sin colores disponibles no puede seleccionarse (deshabilitado visualmente)
- El checkbox "seguir con el mismo color" aparece en el paso 5 y persiste mientras se mantenga el mismo color seleccionado
- Cada paso muestra un breadcrumb o resumen de lo ya seleccionado (ej: "TELA > JER CAR 1003 > BLANCO")

---

## 3. Datos y API

**Fuente:** LNT API en `LNT_API_URL` (env var)

| Paso | Endpoint | Filtro |
|---|---|---|
| Grupos | `GET /api/v1/internal/grupos` (con `x-sync-key`) | todos |
| Artículos del tipo | `GET /api/v1/articulos?tipo=X&limit=500` | — |
| Artículos base | — | `descAdicional` null o vacío |
| Colores del base | — | mismo `codBase`, `descAdicional` no vacío |

**Mapping a PieceData:**

| Campo ArticuloDto | Campo PieceData |
|---|---|
| `codigo` | `codArticulo` |
| `nombreBase` | `article` |
| `descAdicional` | `color` |
| `idColorWeb ?? ""` | `idColorWeb` |
| input peso | `measure` |
| `"MANUAL"` | `source` |
| ArticuloDto completo | `originalData` |

---

## 4. UX / UI — MANUAL tab

- Cada opción seleccionable es un **botón grande** (mínimo 48px alto, táctil)
- Grilla responsiva: 2 columnas en mobile, más en desktop
- Los tipos del grupo se muestran como **tabs horizontales** en el paso 2
- Artículos base y colores: **botones con nombre y código**, deshabilitados si no tienen colores
- El paso de peso muestra un **input numérico grande** con validación `XX.XX` (máx 4 dígitos, punto decimal)
- El botón "Agregar" está deshabilitado si el peso no cumple el formato
- Breadcrumb visible en pasos 3, 4 y 5 mostrando grupo → tipo → artículo seleccionado

---

## 5. Rediseño mobile-first (toda la app)

**Problema principal:** la sidebar queda desplegada en mobile y tapa la pantalla.

**Cambios requeridos:**
- Sidebar colapsable: en mobile se oculta por defecto, se abre con un botón hamburguesa
- Layout general: padding, tipografía y botones deben ser cómodos en pantalla táctil
- CLADD e IMPORTADO: el input de scan se mantiene como text input, pero el resto del layout se ajusta (botones más grandes, mejor espaciado vertical)
- El estilo visual (colores, tipografía, identidad) se mantiene igual

---

## 6. Scanner de cámara (QR y código de barras)

### Objetivo

Permitir al operador escanear piezas con la cámara del celular en las solapas CLADD e IMPORTADO, replicando el comportamiento del lector bluetooth ya existente: detectar el código → ejecutar la misma búsqueda que dispara el Enter.

---

### Librería

`@zxing/browser` — detecta automáticamente QR (IMPORTADO), Code128 y Code93 (CLADD) sin configuración por tab.

---

### UX

```
[ SearchBar input                    ] [📷] [↩]
```

- Botón de cámara (ícono) al lado derecho del input en `SearchBar`
- Al clickear: abre overlay fullscreen con el feed de cámara
- Overlay contiene:
  - Feed de cámara a pantalla completa (fondo)
  - Recuadro/marco centrado indicando el área de escaneo
  - Texto de guía: "Apuntá el código al recuadro"
  - Botón para cambiar entre cámara trasera y frontal (ícono flip)
  - Botón cerrar (X) esquina superior derecha
  - Zona de error en la parte inferior (visible solo cuando hay error)
- Cámara activa por defecto: trasera (`environment` facing mode)
- Al detectar un código: ejecuta la búsqueda
  - Búsqueda exitosa → cierra scanner automáticamente
  - Búsqueda fallida (404 o error) → muestra mensaje de error en el overlay, scanner permanece abierto para reintentar

---

### Arquitectura

**Nuevo componente:** `src/app/components/CameraScanner.tsx`

```ts
interface CameraScannerProps {
  isOpen: boolean;
  onScan: (value: string) => Promise<boolean>; // true = pieza encontrada, false = no encontrada/error
  onClose: () => void;
}
```

**`SearchBar.tsx` — cambios:**
- Nueva prop: `onCameraClick: () => void`
- Agrega botón de cámara al lado derecho del input

**`page.tsx` — cambios:**
- Nuevo estado: `const [isScannerOpen, setIsScannerOpen] = useState(false)`
- `searchPiece` se modifica para retornar `Promise<boolean>` (true si encontró la pieza, false si no)
- Pasa `onCameraClick={() => setIsScannerOpen(true)}` a `SearchBar`
- Renderiza `<CameraScanner isOpen={isScannerOpen} onScan={searchPiece} onClose={() => setIsScannerOpen(false)} />`
- El scanner solo aparece en las solapas CLADD e IMPORTADO (no en MANUAL)

---

### Criterios de aceptación

- El botón de cámara aparece en el SearchBar de las solapas CLADD e IMPORTADO
- Al tocar el botón se abre el overlay fullscreen con el feed de cámara
- Se puede cambiar entre cámara trasera y frontal
- Al enfocar un QR o código de barras válido, ejecuta la búsqueda automáticamente
- Si la pieza existe: el overlay se cierra y la pieza aparece en la lista
- Si la pieza no existe: aparece el error dentro del overlay y el scanner sigue abierto
- El operador puede cerrar el scanner manualmente en cualquier momento
- El proyecto compila sin errores TypeScript
- El scanner no interfiere con la lógica existente de CLADD, IMPORTADO ni MANUAL

---

## 7. Límites

**Nunca tocar:**
- Lógica de CLADD e IMPORTADO (fetch, procesamiento de datos)
- `POST /api/pieces` — no requiere cambios
- Entidades TypeORM — solo agregar `"MANUAL"` al union type de `PieceSource`

**Preguntar antes de:**
- Modificar la sidebar si afecta el comportamiento en desktop
- Cambiar colores o tipografía base del tema

**Siempre:**
- Mobile-first en cualquier componente nuevo
- Botones con área táctil mínima de 48px
- Validar peso en frontend antes de habilitar "Agregar"
