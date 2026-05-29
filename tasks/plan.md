# Plan — MANUAL Wizard + Mobile-first

Ref: SPEC.md

## Contexto

La implementación actual de la solapa MANUAL no cumple con el spec. Debe ser completamente reescrita como un wizard secuencial táctil. Adicionalmente, toda la app necesita adaptarse a mobile-first manteniendo el estilo visual actual.

---

## Grafo de dependencias

```
[API lnt/grupos]      ← ya existe
[API lnt/articulos]   ← ya existe
         ↓
[ManualWizard component]
  ├── Paso 1: Grupo
  ├── Paso 2: Tipo
  ├── Paso 3: Artículo base
  ├── Paso 4: Color
  └── Paso 5: Peso + Agregar
         ↓
[Integración en page.tsx]   ← reemplaza código MANUAL viejo
         ↓
[CHECKPOINT B — E2E]

[T1: Sidebar mobile]   ← independiente, puede ir en paralelo con T2-T5
[T7: Mobile polish]    ← independiente, va al final
```

---

## Orden de ejecución

```
T1 ──────────────────────────────────────────┐
T2 → T3 → T4 → T5 → CHECKPOINT A → T6 → CHECKPOINT B → T7
```

T1 puede ejecutarse en paralelo con T2-T5 ya que no hay dependencias entre ellos.

---

## TAREA 1 — Sidebar colapsable en mobile

**Archivos:** `src/app/page.tsx` (el bloque `<aside>`)

**Cambios:**
- Agregar estado `sidebarOpen: boolean`
- En mobile (`< sm`): sidebar oculta por defecto, se despliega como overlay al presionar botón hamburguesa
- En desktop (`>= sm`): sidebar siempre visible, sin cambios de comportamiento
- Preguntar al usuario si hay dudas sobre el comportamiento en desktop

**Criterio de aceptación:**
- En pantalla < 640px: sidebar no visible al cargar; botón hamburguesa la muestra como overlay
- En pantalla >= 640px: sidebar siempre visible, igual que hoy
- El botón LOTES sigue funcionando en ambos casos

---

## TAREA 2 — ManualWizard: Pasos 1 y 2 (Grupo + Tipo)

**Archivo nuevo:** `src/app/components/ManualWizard.tsx`

**Props:**
```ts
interface ManualWizardProps {
  onAddPiece: (piece: PieceData) => void;
}
```

**Tipos internos:**
```ts
type WizardStep = 1 | 2 | 3 | 4 | 5;
interface GrupoDto { id: number; nombre: string; tipos: string[]; }
```

**Estado:** `step`, `grupos`, `selectedGrupo`, `selectedTipo`

**Paso 1 — Selección de grupo:**
- Fetch de `/api/lnt/grupos` en mount
- Botones táctiles (min-h-[48px]) en grilla de 2 columnas
- Al seleccionar → avanza a paso 2

**Paso 2 — Selección de tipo:**
- Tabs horizontales, uno por cada `tipo` del grupo seleccionado
- Breadcrumb: `{grupo.nombre}`
- Al seleccionar tipo → avanza a paso 3
- Botón "volver" → paso 1, limpia `selectedGrupo`

**Criterio de aceptación:**
- Grupos cargados de la API, se muestran como botones
- Tipos del grupo seleccionado se muestran como tabs
- Breadcrumb visible en paso 2
- Navegación forward/backward funciona sin errores

---

## TAREA 3 — ManualWizard: Paso 3 (Artículo Base)

**Archivo:** `src/app/components/ManualWizard.tsx`

**Estado adicional:** `articulos: ArticuloDto[]`, `articulosLoading`, `selectedBase`

**Lógica:**
- Al entrar al paso 3: fetch `/api/lnt/articulos?tipo={tipo}&limit=500`, guardar en `articulos`
- `articulosBase` = `articulos.filter(a => !a.descAdicional)`
- Un artículo base sin colores = ningún artículo en `articulos` tiene mismo `codBase` y `descAdicional` no vacío → `disabled`

**UI:**
- Grilla 2 columnas, botones con `nombreBase` y `codigo`
- Artículos sin colores: `disabled`, opacity reducida
- Breadcrumb: `{grupo} > {tipo}`
- Botón "volver" → paso 2, limpia `selectedTipo`

**Criterio de aceptación:**
- Solo muestra artículos donde `descAdicional` es null o vacío
- Artículos sin colores no son seleccionables
- Breadcrumb correcto
- Navegación funciona

---

## TAREA 4 — ManualWizard: Paso 4 (Color)

**Archivo:** `src/app/components/ManualWizard.tsx`

**Estado adicional:** `selectedColor: ArticuloDto | null`

**Lógica:**
- `coloresDisponibles` = `articulos.filter(a => a.codBase === selectedBase.codBase && !!a.descAdicional)`
- No requiere fetch adicional (ya están en `articulos`)

**UI:**
- Grilla 2 columnas, botones con `descAdicional` (nombre de color) y `codigo`
- Breadcrumb: `{grupo} > {tipo} > {base.nombreBase}`
- Al seleccionar → avanza a paso 5
- Botón "volver" → paso 3, limpia `selectedBase`

**Criterio de aceptación:**
- Solo muestra artículos con mismo `codBase` que el base seleccionado Y con `descAdicional` no vacío
- Breadcrumb hasta artículo base
- Navegación funciona

---

## TAREA 5 — ManualWizard: Paso 5 (Peso + Agregar)

**Archivo:** `src/app/components/ManualWizard.tsx`

**Estado adicional:** `peso: string`, `mismoColor: boolean`

**Validación de peso:**
- Regex: `/^\d{1,2}(\.\d{1,2})?$/`
- Botón "Agregar" disabled si no cumple

**Acción "Agregar":**
```ts
onAddPiece({
  clientId: createClientId(),
  id: createClientId(),
  article: selectedBase.nombreBase,
  codArticulo: selectedColor.codigo,
  color: selectedColor.descAdicional ?? "",
  measure: peso,
  idColorWeb: selectedColor.idColorWeb ?? "",
  source: "MANUAL",
  originalData: selectedColor,
});
setPeso("");
if (!mismoColor) {
  setSelectedColor(null);
  setStep(4);
}
// si mismoColor === true: queda en paso 5, listo para siguiente peso
```

**UI:**
- Breadcrumb: `{grupo} > {tipo} > {base.nombreBase} > {color}`
- Input numérico grande (`inputMode="decimal"`, min-h-[48px])
- Checkbox "Seguir con el mismo color"
- Botón "Agregar" prominente, disabled si peso inválido
- Botón "volver" → paso 4, limpia `selectedColor`

**Criterio de aceptación:**
- Validación `/^\d{1,2}(\.\d{1,2})?$/` funciona
- `onAddPiece` se llama con todos los campos correctos
- Con checkbox marcado: queda en paso 5, peso reseteado
- Sin checkbox: vuelve a paso 4, color y peso reseteados
- `peso` siempre se resetea al agregar

---

## CHECKPOINT A — ManualWizard en aislamiento

Antes de integrar, verificar:
- Flujo completo grupo → tipo → base → color → peso → agregar funciona
- Navegación hacia atrás en cada paso funciona
- Breadcrumb correcto en cada paso
- Validación de peso funciona
- Checkbox "mismo color" funciona

---

## TAREA 6 — Integración: reemplazar MANUAL en page.tsx

**Archivo:** `src/app/page.tsx`

**Cambios:**
- Eliminar todos los estados `manual*` del componente
- Eliminar los efectos de carga de grupos y artículos
- Reemplazar el bloque `activeTab === "MANUAL"` por:
  ```tsx
  <ManualWizard onAddPiece={(piece) => setPieces(prev => [...prev, piece])} />
  ```
- Verificar que el mensaje de estado vacío de MANUAL sigue funcionando (puede moverse dentro del wizard)
- `handleSavePieces` no necesita resetear estado MANUAL (ya no existe en page.tsx)

**Criterio de aceptación:**
- page.tsx compila sin errores TypeScript
- Las tres solapas funcionan correctamente
- Flujo MANUAL → lista de piezas → guardar funciona end-to-end

---

## CHECKPOINT B — Test E2E completo

Verificar:
- Flujo CLADD: scan → pieza en lista → guardar
- Flujo IMPORTADO: scan → pieza en lista → guardar
- Flujo MANUAL completo: grupo → tipo → base → color → peso → pieza en lista → guardar
- Sidebar en mobile (< 640px): oculta por defecto, toggle funciona
- Sidebar en desktop (>= 640px): siempre visible

---

## TAREA 7 — Mobile polish general

**Archivos:** `src/app/components/PieceCard.tsx`, `src/app/components/SearchBar.tsx`, `src/app/page.tsx`

**Cambios:**
- Botón "Guardar piezas": min-h-[48px]
- PieceCard: botones de acción con área táctil mínima 48px
- SearchBar: input más alto, padding generoso
- Layout general: márgenes y padding cómodos en 375px de ancho

**Criterio de aceptación:**
- App usable en 375px (iPhone SE)
- No hay texto cortado ni botones inaccesibles en mobile
- Desktop no regresa visualmente

---

## Lo que NO se toca en ninguna tarea (MANUAL / mobile)

- Lógica de fetch y procesamiento de CLADD e IMPORTADO
- `POST /api/pieces` — sin cambios
- Entidades TypeORM — `PieceSource` ya tiene `"MANUAL"`, no tocar más
- Colores, tipografía y estilo visual de la app

---

---

# Plan — Scanner de cámara (QR + código de barras)

Ref: SPEC.md § 6

## Contexto

Las solapas CLADD e IMPORTADO tienen un `SearchBar` con input de texto. El lector bluetooth ya funciona porque popula el input y simula Enter → `searchPiece()`. El scanner de cámara replica ese comportamiento: detecta el código y llama `searchPiece(valor)`.

`searchPiece` actualmente no retorna nada (`void`). Para que el scanner pueda saber si cerrar el overlay o mostrar error, necesita retornar `Promise<boolean>` (true = encontrada, false = no encontrada o error).

---

## Grafo de dependencias

```
T8 (instalar lib + searchPiece → bool)
        │
        ├──→ T9  (CameraScanner.tsx)
        │
        └──→ T10 (SearchBar.tsx + page.tsx wiring)
                  └── depende de T9
```

---

## TAREA 8 — Instalar `@zxing/browser` y modificar `searchPiece`

**Archivos:** `package.json` (via npm), `src/app/page.tsx`

**Cambios:**
1. `npm install @zxing/browser`
2. Cambiar firma de `searchPiece` a `async (nroSerie: string): Promise<boolean>`
3. Retornar `true` cuando la pieza se encuentra y se agrega a la lista
4. Retornar `false` en todos los casos de error (404, error de red, pieza duplicada)
5. La lógica interna no cambia — solo se agregan los `return`

**Criterio de aceptación:** `npm run build` sin errores TypeScript. `searchPiece` retorna bool en todos los paths.

---

## TAREA 9 — Crear `CameraScanner.tsx`

**Archivo nuevo:** `src/app/components/CameraScanner.tsx`

**Props:**
```ts
interface CameraScannerProps {
  isOpen: boolean;
  onScan: (value: string) => Promise<boolean>;
  onClose: () => void;
}
```

**Comportamiento:**
- `isOpen` → true: inicializar `BrowserMultiFormatReader`, pedir cámara, iniciar decode loop
- `isOpen` → false: `reader.reset()`, liberar cámara
- Al detectar código: llamar `onScan(result.getText())`
  - Retorna `true` → llamar `onClose()`
  - Retorna `false` → mostrar error en overlay, continuar escaneando
- Botón flip: alternar `environment` ↔ `user` facing mode, reiniciar reader
- Botón X: llamar `onClose()`
- Estado de carga: texto "Iniciando cámara..." mientras no hay video

**Layout del overlay:**
```
┌─────────────────────────────┐  fixed inset-0 z-50 bg-black
│  [🔄]               [✕]    │  flex flex-col
│                             │
│  ┌───────────────────────┐  │  <video> object-cover w-full flex-1
│  │                       │  │
│  │    [ recuadro ]       │  │  recuadro: absolute centrado ~60% ancho
│  │                       │  │  borde: 2px solid white/gold
│  └───────────────────────┘  │
│  Apuntá el código al marco  │  texto guía, text-white text-sm
│                             │
│  [mensaje error si hay]     │  text-red-400 text-sm
└─────────────────────────────┘
```

**Criterio de aceptación:** `npm run build` sin errores. Overlay renderiza sin crashes cuando `isOpen=false`.

---

## TAREA 10 — Integrar scanner en `SearchBar.tsx` y `page.tsx`

**Archivos:** `src/app/components/SearchBar.tsx`, `src/app/page.tsx`

**`SearchBar.tsx`:**
- Nueva prop opcional: `onCameraClick?: () => void`
- Si está definido: agregar botón con ícono de cámara (SVG) al lado derecho del input
- Ajustar padding-right del input para que no quede tapado por el botón
- Botón: `min-h-[48px]`, color `[#1A2753]`

**`page.tsx`:**
- Nuevo estado: `const [isScannerOpen, setIsScannerOpen] = useState(false)`
- Pasar `onCameraClick={() => setIsScannerOpen(true)}` a `SearchBar` (solo cuando `activeTab !== "MANUAL"`)
- Renderizar `<CameraScanner>` con:
  - `isOpen={isScannerOpen && activeTab !== "MANUAL"}`
  - `onScan={searchPiece}`
  - `onClose={() => setIsScannerOpen(false)}`

**Criterio de aceptación:** `npm run build` sin errores TypeScript. El botón no aparece en la tab MANUAL.

---

## CHECKPOINT — Prueba funcional

- Botón de cámara visible en CLADD e IMPORTADO, no en MANUAL
- Overlay abre con feed de cámara activo
- Cambio de cámara frontal/trasera funciona
- Escaneo exitoso: pieza en lista + overlay cierra
- Escaneo fallido: error en overlay + scanner sigue abierto
- Botón X cierra el overlay en cualquier momento
- Lector bluetooth sigue funcionando (no hay regresión)
- `npm run build` limpio

---

## Lo que NO se toca (scanner)

- Lógica de fetch de CLADD e IMPORTADO (solo se agrega `return` al resultado)
- `ManualWizard.tsx`
- `POST /api/pieces`
- Entidades TypeORM
- Estilo visual base
