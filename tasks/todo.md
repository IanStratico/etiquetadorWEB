# Tasks — MANUAL Wizard + Mobile-first + Scanner de cámara

Ref: tasks/plan.md · SPEC.md

## Pendiente

- [ ] CHECKPOINT B — Test E2E completo (CLADD + IMPORTADO + MANUAL + sidebar mobile)

### Scanner de cámara (QR + código de barras)

- [ ] CHECKPOINT C — Prueba funcional del scanner en browser/celular

## En progreso

ninguna

## Completado

- [x] T8 — Instalar `@zxing/browser` + `searchPiece` retorna `Promise<boolean>` (`src/app/page.tsx`)
- [x] T9 — Crear `CameraScanner.tsx` (`src/app/components/CameraScanner.tsx`)
- [x] T10 — Integrar scanner: botón en `SearchBar.tsx` + wiring en `page.tsx`

- [x] T1 — Sidebar colapsable en mobile (`src/app/page.tsx`)
- [x] T2 — ManualWizard: Pasos 1 y 2 — Grupo + Tipo (nuevo `src/app/components/ManualWizard.tsx`)
- [x] T3 — ManualWizard: Paso 3 — Artículo Base (`ManualWizard.tsx`)
- [x] T4 — ManualWizard: Paso 4 — Color (`ManualWizard.tsx`)
- [x] T5 — ManualWizard: Paso 5 — Peso + Agregar (`ManualWizard.tsx`)
- [x] CHECKPOINT A — build limpio, tipos correctos
- [x] T6 — Integración ManualWizard en `page.tsx` (código MANUAL viejo eliminado)
- [x] T7 — Mobile polish general (PieceCard, SearchBar, layout)
