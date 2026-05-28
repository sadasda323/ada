import { ReactNode, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ShieldCheck, Zap } from 'lucide-react';

import { useReducedMotionSafe } from '@/components/ui/motion';

/**
 * AuthShell — replica las "cortinas" del video Yann UIUX:
 *
 *   ┌──────────────┬───────────────┐
 *   │              │               │
 *   │  SPLASH      │   FORM        │
 *   │  (logo HR)   │  (children)   │
 *   │  cyan/violet │               │
 *   └──────────────┴───────────────┘
 *
 * Al ejecutar `closeShell()`:
 *   - El pane izquierdo se desliza a x: -100%
 *   - El pane derecho se desliza a x: +100%
 *   - Spring suave (~0.7s) → revela el contenido detrás (dashboard).
 *
 * Uso:
 *   const shellRef = useAuthShell();
 *   <AuthShell title="..." subtitle="..." onClose={shellRef.onClose}>
 *     <form onSubmit={async () => {
 *       await login();
 *       shellRef.close();             // ⇐ dispara cortinas
 *     }} />
 *   </AuthShell>
 *
 * Hace falta `react-router` con la ruta /dashboard ya activa cuando se llama close()
 * para que el contenido detrás sea visible al instante.
 */

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  /** Cuando es true, ejecuta la animación de cortinas que se abren */
  closing?: boolean;
  /** Callback al terminar la animación de cierre */
  onClosed?: () => void;
}

const SPRING = { type: 'spring' as const, stiffness: 90, damping: 22 };

export function AuthShell({
  title,
  subtitle,
  children,
  closing = false,
  onClosed,
}: AuthShellProps) {
  const reduced = useReducedMotionSafe();
  const dur = reduced ? 0 : 0.75;

  return (
    <AnimatePresence onExitComplete={onClosed}>
      {!closing && (
        <motion.div
          key="auth-shell"
          className="fixed inset-0 z-50 flex"
          initial={false}
        >
          {/* ─── Pane izquierdo: splash ─────────────────────────────────── */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={SPRING}
            className="hidden lg:flex flex-1 relative overflow-hidden"
            style={{ willChange: 'transform' }}
          >
            <SplashPane />
          </motion.div>

          {/* ─── Pane derecho: form ─────────────────────────────────────── */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={SPRING}
            className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12 relative overflow-hidden bg-white dark:bg-ink-950"
            style={{ willChange: 'transform' }}
          >
            {/* Halos decorativos del form */}
            <div className="absolute inset-0 -z-10 pointer-events-none">
              <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-zinc-200/60 dark:bg-violet-600/20 blur-3xl" />
              <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-zinc-300/40 dark:bg-fuchsia-500/20 blur-3xl" />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: dur * 0.7, delay: dur * 0.4 }}
              className="w-full max-w-md"
            >
              {/* Brand para mobile (en lg+ se muestra en SplashPane) */}
              <div className="flex items-center gap-3 mb-10 lg:hidden">
                <BrandLogo />
              </div>

              <h1 className="h-display text-3xl text-zinc-900 dark:text-white tracking-tight2">
                {title}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>

              <div className="mt-8">{children}</div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── SplashPane (lado izquierdo del video) ──────────────────────────────── */

function SplashPane() {
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-violet-700 to-fuchsia-600" />
      <div className="absolute inset-0 bg-grid-pattern bg-grid-32 opacity-[0.06]" />

      {/* Blobs animados */}
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-fuchsia-400/30 blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-cyan-400/30 blur-3xl animate-float [animation-delay:2s]" />
      <div className="absolute top-1/2 right-1/3 h-40 w-40 rounded-full bg-violet-300/40 blur-3xl animate-float [animation-delay:4s]" />

      {/* Logo + brand centrados */}
      <div className="relative flex flex-col justify-center items-center text-center w-full p-16">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 18, delay: 0.5 }}
          className="relative mb-6"
        >
          <div className="h-24 w-24 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 text-white font-bold text-3xl flex items-center justify-center shadow-2xl">
            HR
          </div>
          <span className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-cyan-400 ring-4 ring-violet-700/40 animate-pulse-glow" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <p className="h-display text-4xl text-white tracking-tight2">
            HRCO Suite
          </p>
          <p className="mt-2 text-[11px] uppercase tracking-[0.3em] text-violet-100/90 font-semibold">
            Sistema de gestión RRHH
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="mt-12 space-y-3 max-w-sm w-full"
        >
          <Feature icon={ShieldCheck} title="Multi-tenant seguro" desc="JWT + refresh tokens" />
          <Feature icon={Zap} title="Cálculos en segundos" desc="Salud, pensión, horas extra" />
          <Feature icon={Sparkles} title="Diseño elegante" desc="Pensado para el equipo de RRHH" />
        </motion.div>
      </div>
    </>
  );
}

function BrandLogo() {
  return (
    <>
      <div className="relative">
        <div className="h-11 w-11 rounded-xl bg-gradient-brand text-white font-bold text-base flex items-center justify-center shadow-glow-violet h-display">
          HR
        </div>
        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-zinc-900 dark:bg-cyan-400 ring-2 ring-white dark:ring-ink-950 animate-pulse-glow" />
      </div>
      <div className="leading-tight">
        <p className="h-display text-xl text-zinc-900 dark:text-white">HRCO</p>
        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-700 dark:text-violet-300/80 font-semibold">
          Suite
        </p>
      </div>
    </>
  );
}

function Feature({
  icon: Icon, title, desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md text-left">
      <div className="h-9 w-9 rounded-xl bg-white/20 border border-white/25 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-violet-100/80">{desc}</p>
      </div>
    </div>
  );
}

/* ─── Hook para gestionar el estado de cierre ────────────────────────────── */

export function useAuthShell() {
  const [closing, setClosing] = useState(false);

  const close = useCallback(() => setClosing(true), []);

  return { closing, close, setClosing };
}
