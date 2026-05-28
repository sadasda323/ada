# Catálogo de animaciones — HRCO Frontend

Documento de referencia con **todas** las animaciones del frontend, sus nombres,
ubicación, parámetros y cómo reutilizarlas en otra parte del proyecto.

> Stack de animación
> - **framer-motion 11** — orquestación principal (variants, spring, AnimatePresence, layout, useSpring, useTransform, useMotionValue).
> - **tailwindcss-animate** — clases utilitarias `animate-in`, `fade-in-0`, `zoom-in-95`, `slide-in-from-*`, `data-state` para Radix.
> - **CSS keyframes** custom en `tailwind.config.js` + transiciones globales en `src/styles/index.css`.
> - **SVG `motion.path` / `pathLength`** para charts.

---

## Tabla resumen

| # | Nombre | Tipo | Archivo | Función |
|---|--------|------|---------|---------|
| 1 | `MotionPage` | page transition | `components/ui/motion.tsx` | Fade+slide en cada cambio de ruta |
| 2 | `Stagger` / `StaggerItem` | list reveal | `components/ui/motion.tsx` | Children en cascada |
| 3 | `AnimatedCounter` | count-up | `components/ui/motion.tsx` | Spring tween de 0→valor |
| 4 | `RollingDigits` | scramble slot-machine | `components/charts/RollingDigits.tsx` | Cada dígito rueda 0-9 |
| 5 | `MiniBarChart` | bar grow | `components/charts/index.tsx` | Bars suben con stagger |
| 6 | `MiniCandleChart` | candle fade-up | `components/charts/index.tsx` | Velas aparecen secuencialmente |
| 7 | `ArcGauge` | semicircle fill | `components/charts/index.tsx` | strokeDashoffset 0→pct |
| 8 | `SparkLine` | path drawing | `components/charts/index.tsx` | Curva con pathLength + área fade |
| 9 | `SalesAnalyticsChart` | path + auto-tour tooltip | `components/charts/SalesAnalyticsChart.tsx` | Curva + tooltip que recorre solo |
| 10 | `TopProductsHeatmap` | value-sorted reveal | `components/charts/TopProductsHeatmap.tsx` | Celdas saturadas primero |
| 11 | `BudgetBar` | width 0→% | `pages/DashboardPage.tsx` | Barra horizontal animada |
| 12 | `KpiCard` hover-lift | hover spring | `pages/DashboardPage.tsx` | y: -2 con spring al hover |
| 13 | `Card.interactive` spotlight | cursor follow | `components/ui/Card.tsx` | Spotlight CSS sigue al cursor |
| 14 | `Modal` / `Dialog` | scale+slide | `components/ui/dialog.tsx` | data-state animations |
| 15 | `AlertDialog` | center pop | `components/ui/alert-dialog.tsx` | zoom-in + fade |
| 16 | `DropdownMenu` | side-aware | `components/ui/dropdown-menu.tsx` | slide-in-from-top/bottom/etc |
| 17 | `Tooltip` | delayed fade-zoom | `components/ui/tooltip.tsx` | Aparece a 150ms |
| 18 | `Sheet` (drawer) | slide from side | `components/ui/sheet.tsx` | Mobile sidebar |
| 19 | `Sidebar` collapse | width spring | `components/layout/Sidebar.tsx` | 256px ↔ 68px |
| 20 | `Sidebar.activeIndicator` | layoutId shared | `components/layout/Sidebar.tsx` | Magic move entre items |
| 21 | `Sidebar` items stagger | container variant | `components/layout/Sidebar.tsx` | Items entran en cascada |
| 22 | `Header.themeToggle` rotate | AnimatePresence wait | `components/layout/Header.tsx` (legacy) | (Reemplazado por ThemeToggle pill) |
| 23 | `ThemeToggle` pill iOS | layout spring | `components/layout/ThemeToggle.tsx` | Bola se mueve entre extremos |
| 24 | `Bell` notification ping | CSS animate-ping | `components/layout/Header.tsx` | Pulso en badge |
| 25 | `AuthShell` curtains | exit slide opposite | `components/layout/AuthShell.tsx` | Cortinas se abren al login |
| 26 | `Table` row stagger | fade-up con delay | `components/ui/Table.tsx` | Filas entran progresivas |
| 27 | `ConfirmDialog` icon spring | initial rotate | `components/ui/ConfirmDialog.tsx` | Triángulo de alerta entra rebotando |
| 28 | `Badge.dot` ping | CSS animate-ping | `components/ui/Badge.tsx` | Punto pulsante |
| 29 | `Brand` pulse-glow | CSS keyframes | `tailwind.config.js` | Halo en logo |
| 30 | `Hero gradient` aurora | CSS animate-gradient-x | `pages/DashboardPage.tsx` | Gradient móvil |
| 31 | Theme cross-fade | CSS transition global | `styles/index.css` | Cambio dark/light suave |
| 32 | Reduced motion | `useReducedMotion` | `components/ui/motion.tsx` | Respeta accesibilidad |

---

## 1. Page transitions — `<MotionPage />`

**Qué hace.** Envuelve cada `<Outlet />` y aplica fade-up al cambiar de ruta usando `AnimatePresence mode="wait"`.

**Archivo.** `src/components/ui/motion.tsx`

**Cómo se usa.**
```tsx
import { MotionPage } from '@/components/ui/motion';

<main>
  <MotionPage className="px-4 py-8">
    <Outlet />
  </MotionPage>
</main>
```

**Variants.**
```ts
fadeUpVariants = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  exit:   { opacity: 0, y: -8, transition: { duration: 0.18, ease: 'easeIn' } },
}
```

**Donde se usa.** `components/layout/AppLayout.tsx`.

---

## 2. Stagger lists — `<Stagger />` + `<StaggerItem />`

**Qué hace.** Renderiza children con un retraso escalonado (`staggerChildren`).

**Archivo.** `src/components/ui/motion.tsx`

**Cómo se usa.**
```tsx
import { Stagger, StaggerItem } from '@/components/ui/motion';

<Stagger className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4"
         staggerChildren={0.08}
         delayChildren={0.1}>
  <StaggerItem><Card1 /></StaggerItem>
  <StaggerItem><Card2 /></StaggerItem>
</Stagger>
```

**Variants generados.**
```ts
staggerContainer = (sc, dc) => ({
  hidden: {},
  show: { transition: { staggerChildren: sc, delayChildren: dc } },
})
```

**Donde se usa.** `pages/DashboardPage.tsx` (KPIs, fila de gráficos, fila inferior).

---

## 3. Count-up animado — `<AnimatedCounter />`

**Qué hace.** Tween con `useSpring` de 0 al valor final. Usa `useMotionValue` + `useTransform` para mostrar texto numérico.

**Archivo.** `src/components/ui/motion.tsx`

**Cómo se usa.**
```tsx
import { AnimatedCounter } from '@/components/ui/motion';

<AnimatedCounter value={48295} format={(n) => formatCOP(n)} />
<AnimatedCounter value={1284} />
<AnimatedCounter value={65}   format={(n) => `${n.toFixed(0)}%`} />
```

**Donde se usa.** Filas inferiores del Dashboard, KPIs secundarios. (Para los KPIs grandes del Dashboard usamos `RollingDigits`.)

---

## 4. Scramble slot-machine — `<RollingDigits />`

**Qué hace.** Cada dígito es una columna `overflow-hidden` que rueda **3 vueltas + el target** (~37 frames de 0-9) hasta detenerse en el dígito final. Replica el efecto del video Yann UIUX donde los números pasan por valores aleatorios antes de fijarse.

**Archivo.** `src/components/charts/RollingDigits.tsx`

**Cómo se usa.**
```tsx
import { RollingDigits } from '@/components/charts/RollingDigits';

<RollingDigits
  value={48295}
  format={(n) => formatCOP(n)}   // "$48.295"
  duration={1.8}                  // segundos del rolling completo
/>
```

**Cómo funciona internamente.**
```tsx
<motion.span
  initial={{ y: 0 }}
  animate={{ y: `-${(3 * 10 + target)}em` }}
  transition={{ duration, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
>
  {/* spans con 0,1,2,...,9,0,1,2,...,target apilados verticalmente */}
</motion.span>
```

**Donde se usa.** Total Revenue + Total Orders KPIs en `DashboardPage`.

---

## 5. Mini bar chart — `<MiniBarChart />`

**Qué hace.** Bars verticales que crecen desde abajo con `initial={{ y: height, height: 0 }}` → `animate={{ y, height: h }}`, con stagger de 40ms. La bar activa tiene **glow** (`drop-shadow`) intenso en dark mode.

**Archivo.** `src/components/charts/index.tsx`

**Cómo se usa.**
```tsx
<MiniBarChart
  data={[42, 55, 38, 60, 48, 70, 52, 80, 58, 90, 75, 95]}
  width={130}
  height={48}
  activeIndex={9}                 // por defecto: penúltimo
  className="h-12 w-32"
/>
```

**Donde se usa.** KPI "Nómina del mes" en Dashboard.

---

## 6. Mini candlestick — `<MiniCandleChart />`

**Qué hace.** Candles OHLC mini con cuerpo opaco (bullish) o semi-transparente (bearish) y wick. Aparecen con `opacity 0→1` + `y: 6→0`.

**Archivo.** `src/components/charts/index.tsx`

**Cómo se usa.**
```tsx
<MiniCandleChart
  data={[{ o: 35, h: 55, l: 30, c: 50 }, ...]}
  width={130}
  height={48}
/>
```

**Donde se usa.** KPI "Empleados totales" en Dashboard.

---

## 7. Arc gauge semicircular — `<ArcGauge />`

**Qué hace.** Semicírculo SVG con dos `<path>`: track gris + arc de progreso animado con `strokeDasharray` (longitud total) y `strokeDashoffset` que va de `arcLen` → `arcLen * (1 - pct)` con duración 1.4s.

**Archivo.** `src/components/charts/index.tsx`

**Cómo se usa.**
```tsx
<ArcGauge value={65} size={130} thickness={14} showLabel />
```

**Detalle clave.**
```tsx
<motion.path
  d={trackPath}
  strokeDasharray={arcLen}
  initial={{ strokeDashoffset: arcLen }}
  animate={{ strokeDashoffset: arcLen * (1 - pct) }}
  transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
/>
```

**Donde se usa.** KPI "Meta mensual" en Dashboard.

---

## 8. Sparkline — `<SparkLine />`

**Qué hace.** Línea suavizada (catmull-rom → cubic bezier) con área gradient debajo. La línea se dibuja con `pathLength: 0 → 1` (1.4s), el área aparece con `opacity` después.

**Archivo.** `src/components/charts/index.tsx`

**Cómo se usa.**
```tsx
<SparkLine
  data={[1820, 2950, 2410, 3320, 2890, 3760]}
  width={120}
  height={40}
  color="#8B5CF6"
/>
```

---

## 9. Sales Analytics chart — `<SalesAnalyticsChart />`

**Qué hace.** Line chart completo con:
- **Path drawing** (`pathLength: 0→1`, 1.4s) para la curva.
- **Area gradient** que aparece a 0.6s.
- **Tooltip auto-tour**: cada `tourInterval` segundos avanza al siguiente punto de la curva (replica el demo del video Yann).
- **Hover** override: cuando entras con el mouse, controlas tú; cuando sales, vuelve al auto-tour.
- **Tooltip + dot** con spring (stiffness 220, damping 26) — se desliza suave entre puntos.
- **Crosshair** vertical también animado con spring.

**Archivo.** `src/components/charts/SalesAnalyticsChart.tsx`

**Cómo se usa.**
```tsx
<SalesAnalyticsChart
  title="Ventas / nómina diaria"
  scopeLabel="Ventas diarias"
  rangeLabel="10–16 abr 2026"
  autoTour                              // habilita el recorrido automático
  tourInterval={2.4}                    // segundos entre punto y punto
  data={[
    { label: '10 abr', value: 1820, amount: 2120 },
    { label: '11 abr', value: 2950, amount: 3210 },
    ...
  ]}
/>
```

**Implementación clave del auto-tour.**
```tsx
const [tourIdx, setTourIdx] = React.useState(0);
const [isHovering, setIsHovering] = React.useState(false);

React.useEffect(() => {
  if (!autoTour || isHovering) return;
  const id = setInterval(() => setTourIdx(i => (i + 1) % data.length), tourInterval * 1000);
  return () => clearInterval(id);
}, [autoTour, isHovering, data.length, tourInterval]);

const activeIdx = hoverIdx ?? (autoTour ? tourIdx : null);
```

---

## 10. Top Products heatmap — `<TopProductsHeatmap />`

**Qué hace.** Heatmap estilo GitHub-contributions. **Stagger por VALOR**: las celdas se ordenan por valor descendente y aparecen las saturadas primero, las grises al final (efecto "datos importantes primero" que se ve en el video).

**Archivo.** `src/components/charts/TopProductsHeatmap.tsx`

**Cómo se usa.**
```tsx
<TopProductsHeatmap
  title="Actividad por área"
  scopeLabel="Esta semana"
  rows={['TI', 'Operaciones', 'RRHH', 'Comercial', 'Finanzas', 'Soporte']}
  cols={['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']}
  matrix={[
    [0.9, 0.7, 0.85, 0.6, 0.95, 0.3, 0.1],
    ...
  ]}
/>
```

**Lógica del orden por valor.**
```tsx
const cells = rows.flatMap((_, i) => cols.map((_, j) => ({ i, j, v: matrix[i][j] })));
const sorted = [...cells].sort((a, b) => b.v - a.v);
const orderMap = new Map(sorted.map(({i, j}, k) => [`${i}-${j}`, k]));

<motion.rect
  delay={0.02 * orderMap.get(`${i}-${j}`)}
  ...
/>
```

---

## 11. Budget bars animadas

**Qué hace.** Barra horizontal con `width: 0 → ${pct}%` con duración 1.2s y delay escalonado por índice. Tiene **glow violet** mediante `filter: drop-shadow(0 0 6px rgba(139,92,246,0.5))`.

**Archivo.** `src/pages/DashboardPage.tsx` (componente `BudgetBar`).

**Snippet.**
```tsx
<motion.div
  initial={{ width: 0 }}
  animate={{ width: `${pct}%` }}
  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.6 + index * 0.15 }}
  className="bg-gradient-brand rounded-full"
  style={{ filter: 'drop-shadow(0 0 6px rgba(139,92,246,0.5))' }}
/>
```

---

## 12. Hover lift en KPI cards

**Qué hace.** Al pasar el mouse, la card se eleva 2px con spring suave.

**Archivo.** `src/pages/DashboardPage.tsx` (`KpiCard`).

**Snippet.**
```tsx
<motion.div
  whileHover={{ y: -2 }}
  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
>
  ...
</motion.div>
```

---

## 13. Spotlight cursor en `<Card interactive>`

**Qué hace.** Un radial-gradient sigue la posición del cursor sobre la card. Usa CSS variables `--spotlight-x` y `--spotlight-y` actualizadas en `onMouseMove`.

**Archivo.** `src/components/ui/Card.tsx` + clase `.card-spotlight` en `styles/index.css`.

**Cómo se usa.**
```tsx
<Card interactive>
  ...
</Card>
```

**CSS clave.**
```css
.card-spotlight::after {
  content: '';
  position: absolute; inset: 0;
  opacity: 0; transition: opacity 0.3s;
  background: radial-gradient(
    400px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%),
    rgba(139, 92, 246, 0.10), transparent 40%
  );
}
.card-spotlight:hover::after { opacity: 1; }
```

---

## 14-18. Componentes Radix con `data-state` animations

Todos usan **tailwindcss-animate** + Radix data-states (open/closed). No hay framer-motion, son CSS keyframes ultra-eficientes.

### 14. `<Dialog>` (modal centrado)
**Archivo.** `src/components/ui/dialog.tsx`
```tsx
data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-bottom-2
data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-bottom-2
duration-200
```

### 15. `<AlertDialog>`
**Archivo.** `src/components/ui/alert-dialog.tsx` — mismas clases que Dialog pero sin slide.

### 16. `<DropdownMenu>` con dirección automática
**Archivo.** `src/components/ui/dropdown-menu.tsx`
```tsx
data-[side=bottom]:slide-in-from-top-2
data-[side=top]:slide-in-from-bottom-2
data-[side=left]:slide-in-from-right-2
data-[side=right]:slide-in-from-left-2
```

### 17. `<Tooltip>`
**Archivo.** `src/components/ui/tooltip.tsx`
```tsx
delayDuration={150}
data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95
```

### 18. `<Sheet>` drawer
**Archivo.** `src/components/ui/sheet.tsx`
```tsx
data-[state=open]:slide-in-from-left   // o right/top/bottom según side
data-[state=closed]:slide-out-to-left
duration-300
```

---

## 19. Sidebar collapse — width spring

**Qué hace.** El `<motion.aside>` anima su `width` entre 68 y 256 con spring. Los labels e iconos hacen `AnimatePresence` con fade lateral (`opacity 0, x: -6` ↔ `opacity 1, x: 0`).

**Archivo.** `src/components/layout/Sidebar.tsx`

**Snippet.**
```tsx
<motion.aside
  initial={false}
  animate={{ width: collapsed ? 68 : 256 }}
  transition={{ type: 'spring', stiffness: 320, damping: 32 }}
>
```

---

## 20. Active indicator compartido — `layoutId`

**Qué hace.** El indicador morado del item activo en el sidebar **se desliza** mágicamente entre items cuando cambias de ruta, en lugar de aparecer/desaparecer. Es la magia de `layoutId` de framer-motion.

**Archivo.** `src/components/layout/Sidebar.tsx` (`NavItem`).

**Snippet.**
```tsx
{isActive && (
  <motion.span
    layoutId="sidebar-active-indicator"        // ⇐ clave compartida
    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
    className="absolute left-0 h-6 w-[3px] rounded-r-full bg-gradient-brand"
  />
)}
```

---

## 21. Sidebar items stagger

**Qué hace.** Al montar el sidebar, los grupos de items entran uno a uno con `staggerChildren: 0.05, delayChildren: 0.1`.

**Archivo.** `src/components/layout/Sidebar.tsx`

```tsx
<motion.ul
  variants={{
    hidden: {},
    show: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
  }}
  initial="hidden"
  animate="show"
>
  {groups.map(g => (
    <motion.li
      variants={{
        hidden: { opacity: 0, y: 6 },
        show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
      }}
    >...</motion.li>
  ))}
</motion.ul>
```

---

## 23. Theme toggle pill iOS — `<ThemeToggle />`

**Qué hace.** Pill horizontal con bola que se desliza de izquierda a derecha con `layout` prop de framer-motion (no necesita `x`). Iconos del fondo cambian de color, icono dentro de la bola hace cross-fade rotando.

**Archivo.** `src/components/layout/ThemeToggle.tsx`

**Snippet clave.**
```tsx
<motion.span
  layout
  transition={{ type: 'spring', stiffness: 500, damping: 32 }}
  className={isDark ? 'ml-auto bg-gradient-brand' : 'bg-white'}
>
  <motion.span
    key={isDark ? 'm' : 's'}
    initial={{ scale: 0.6, opacity: 0, rotate: -45 }}
    animate={{ scale: 1, opacity: 1, rotate: 0 }}
    transition={{ duration: 0.18 }}
  >
    {isDark ? <Moon /> : <Sun />}
  </motion.span>
</motion.span>
```

---

## 24. Notification badge ping

**Qué hace.** Doble layer: un círculo sólido + un círculo idéntico con `animate-ping` (CSS de Tailwind built-in).

**Archivo.** `src/components/layout/Header.tsx`

**Snippet.**
```tsx
<span className="absolute h-2 w-2 rounded-full bg-cyan-400 ring-2 ring-ink-900" />
<span className="absolute h-2 w-2 rounded-full bg-cyan-400/40 animate-ping" />
```

---

## 25. AuthShell curtains — animación de cortinas

**Qué hace.** Pane izquierdo (splash) y pane derecho (form) se separan en direcciones opuestas al hacer login exitoso. Replica los frames 1-7 del video Yann UIUX.

**Archivo.** `src/components/layout/AuthShell.tsx`

**Cómo se usa.**
```tsx
import { AuthShell, useAuthShell } from '@/components/layout/AuthShell';

function LoginPage() {
  const shell = useAuthShell();
  const navigate = useNavigate();

  const onSubmit = async (values) => {
    await login(values);
    shell.close();                  // ⇐ dispara cortinas
  };

  return (
    <AuthShell
      title="..."
      subtitle="..."
      closing={shell.closing}
      onClosed={() => navigate('/dashboard')}   // ← al terminar la animación
    >
      <form>...</form>
    </AuthShell>
  );
}
```

**Variants internos.**
```tsx
const SPRING = { type: 'spring', stiffness: 90, damping: 22 };

// Pane izquierdo (splash)
<motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={SPRING}>

// Pane derecho (form)
<motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={SPRING}>
```

`AnimatePresence onExitComplete={onClosed}` asegura que `navigate('/dashboard')` se llame solo cuando termina la salida.

---

## 26. Table row stagger

**Qué hace.** Las filas de la tabla entran con fade-up + delay escalonado por índice (cap 0.4s para que no sea infinito).

**Archivo.** `src/components/ui/Table.tsx`

**Snippet.**
```tsx
<MotionTr
  initial={{ opacity: 0, y: 6 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{
    duration: 0.25,
    ease: [0.16, 1, 0.3, 1],
    delay: Math.min(idx * 0.025, 0.4),
  }}
>
```

---

## 27. ConfirmDialog icon spring

**Qué hace.** El ícono de alerta del ConfirmDialog entra con spring rebotando (rotate -8°→0° + scale 0.8→1).

**Archivo.** `src/components/ui/ConfirmDialog.tsx`

**Snippet.**
```tsx
<motion.div
  initial={{ rotate: -8, scale: 0.8, opacity: 0 }}
  animate={{ rotate: 0, scale: 1, opacity: 1 }}
  transition={{ type: 'spring', stiffness: 400, damping: 14 }}
>
  <AlertTriangle />
</motion.div>
```

---

## 28-30. Animaciones CSS keyframes globales

Definidas en `tailwind.config.js` y disponibles como clases utility `animate-{name}`:

| Clase | Keyframe | Uso |
|---|---|---|
| `animate-fade-in` | opacity 0→1 (300ms) | Toasts, dropdowns |
| `animate-slide-up` | translateY(12px)→0 + fade | Modal entry legacy |
| `animate-shimmer` | bg-position -200%→200% (2.5s loop) | `.skeleton` |
| `animate-pulse-glow` | box-shadow ring que se expande (2.4s loop) | Logo brand dot |
| `animate-float` | translateY(0)→-12→0 (6s loop) | Blobs decorativos |
| `animate-aurora` | bg-position move (18s loop) | Hero gradients |
| `animate-gradient-x` | bg-position 0%→100%→0% (6s loop) | `.text-gradient-animated` y hero card |
| `animate-marquee` | translateX(0)→-50% loop | Reservada para tickers de logos |
| `animate-spotlight` | scale 0.5→1 + translate (2s) | Reservada para hero spots |
| `animate-bounce-in` | scale 0.3→1.05→0.9→1 (cubic) | Reservada para badges importantes |

**Cómo se usa.**
```tsx
<div className="animate-pulse-glow" />
<h1 className="text-gradient-animated">Tu nómina</h1>
```

---

## 31. Theme cross-fade global

**Qué hace.** Al togglear el tema, **todo el árbol DOM** hace cross-fade suave (240ms) en `background-color`, `border-color`, `color`, `fill`, `stroke`, `box-shadow`. Replica el dark mode toggle del video.

**Archivo.** `src/styles/index.css`

**CSS.**
```css
body {
  transition:
    background-color 280ms cubic-bezier(0.16, 1, 0.3, 1),
    color           280ms cubic-bezier(0.16, 1, 0.3, 1);
}

*, *::before, *::after {
  transition-property: background-color, border-color, color, fill, stroke, box-shadow;
  transition-duration: 240ms;
  transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
}

/* Excepción: Radix data-state mantiene sus propias transiciones */
[data-state] {
  transition-property: opacity, transform;
}
```

---

## 32. Reduced motion

**Qué hace.** Respeta `prefers-reduced-motion: reduce` del usuario. Hay dos capas de protección:

### Capa 1: CSS global (`styles/index.css`)
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### Capa 2: Hook React `useReducedMotionSafe`
```ts
import { useReducedMotionSafe } from '@/components/ui/motion';

function MyComponent() {
  const reduced = useReducedMotionSafe();
  if (reduced) return <Static />;
  return <motion.div ... />;
}
```

**Donde se usa.** `MotionPage`, `AnimatedCounter`, `RollingDigits`, `Sidebar`, `AuthShell`.

---

## Convenciones y curvas de easing

Todas las animaciones del proyecto usan **una de estas tres curvas** para coherencia:

| Easing | Bezier / Type | Cuándo usar |
|---|---|---|
| **"Quint out"** | `[0.16, 1, 0.3, 1]` | Default. Entradas suaves, lift, fades, count-ups. |
| **"Spring soft"** | `{ type: 'spring', stiffness: 320, damping: 32 }` | Sidebar collapse, layoutId moves. |
| **"Spring bouncy"** | `{ type: 'spring', stiffness: 400, damping: 14 }` | Iconos importantes (alert, success). |

Duraciones estándar:
- **Micro** 150–200ms — tooltip, hover, focus.
- **Pequeña** 250–350ms — entries, exits, dropdowns.
- **Media** 400–600ms — page transitions, fade-ups.
- **Larga** 1.0–1.6s — count-ups, path drawings, gauges.
- **Loop infinito** 2–18s — pulse, float, gradient-x, aurora.

---

## Stagger delays recomendados

| Tipo de lista | `staggerChildren` | `delayChildren` |
|---|---|---|
| Sidebar items | 0.05 | 0.10 |
| KPI cards (3-4) | 0.08 | 0.10 |
| Heatmap cells | 0.02 (sorted by value) | 0.00 |
| Table rows | 0.025 (cap 0.4s) | 0.00 |
| Reviews / lista vertical | 0.08 | 0.50 (esperar a charts) |
| MiniBarChart bars | 0.04 | 0.00 |

---

## Cómo añadir una animación nueva

1. **Si es de framer-motion**: usa `motion.div` con variants. Si va a entrar en cascada con otras, **define la variant aparte** y pásala con `<StaggerItem variants={...}>`.
2. **Si es CSS pura** (loop, hover): añade el keyframe en `tailwind.config.js` → mapea a `animation: { 'mi-anim': 'miKeyframe 2s linear infinite' }` → úsala como `animate-mi-anim`.
3. **Si es de Radix** (Dialog/Sheet/Dropdown): usa `data-[state=*]` con clases de `tailwindcss-animate` (`animate-in`, `fade-in-0`, `zoom-in-95`, `slide-in-from-*`).
4. **Siempre** comprueba `useReducedMotionSafe()` para entradas largas o repetitivas.
5. **Easing por defecto**: `[0.16, 1, 0.3, 1]` salvo que necesites spring (movimientos físicos) o bouncy (acentos importantes).

---

## Referencias

- [framer-motion docs](https://www.framer.com/motion/)
- [tailwindcss-animate](https://github.com/jamiebuilds/tailwindcss-animate)
- [Radix UI primitives](https://www.radix-ui.com/primitives)
- Inspiración del Dashboard: video [@yann.uiux](https://www.tiktok.com/@yann.uiux/video/7634927057578888464) "Store Overview"
