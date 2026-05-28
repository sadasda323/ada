import { ReactNode } from 'react';
import { Sparkles, ShieldCheck, Zap } from 'lucide-react';

export function AuthShell({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
  return (
    <div className="min-h-screen flex">
      {/* Pane izquierdo: form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-zinc-200/60 dark:bg-violet-600/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-zinc-300/40 dark:bg-fuchsia-500/20 blur-3xl" />
        </div>

        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-10">
            <div className="relative">
              <div className="h-11 w-11 rounded-xl bg-gradient-brand text-white font-bold text-base flex items-center justify-center shadow-glow-violet h-display">
                HR
              </div>
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-zinc-900 dark:bg-cyan-400 ring-2 ring-white dark:ring-ink-950 animate-pulse-glow" />
            </div>
            <div className="leading-tight">
              <p className="h-display text-xl text-zinc-900 dark:text-white">HRCO</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-700 dark:text-violet-300/80 font-semibold">Suite</p>
            </div>
          </div>

          <h1 className="h-display text-3xl text-zinc-900 dark:text-white tracking-tight2">{title}</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-ink-300">{subtitle}</p>

          <div className="mt-8">{children}</div>
        </div>
      </div>

      {/* Pane derecho: arte */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-zinc-100 dark:bg-ink-900">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-100 via-zinc-50 to-white dark:from-violet-700/40 dark:via-fuchsia-600/30 dark:to-cyan-500/20" />
        <div className="absolute inset-0 bg-grid-pattern bg-grid-32 opacity-[0.04]" />

        <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-zinc-300/40 dark:bg-fuchsia-500/30 blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-zinc-400/30 dark:bg-violet-500/40 blur-3xl animate-float [animation-delay:2s]" />
        <div className="absolute top-1/2 right-1/3 h-40 w-40 rounded-full bg-zinc-200/40 dark:bg-cyan-400/30 blur-3xl animate-float [animation-delay:4s]" />

        <div className="relative flex flex-col justify-center p-16 max-w-2xl">
          <span className="section-eyebrow flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5" /> Sistema de gestión
          </span>
          <h2 className="mt-3 h-display text-5xl text-zinc-900 dark:text-white tracking-tight2 leading-[1.05]">
            Tu nómina, sin <span className="text-gradient">fricción</span>.
          </h2>
          <p className="mt-5 text-base text-zinc-700/80 dark:text-ink-200/80 leading-relaxed max-w-md">
            Empleados, cargos, áreas, novedades y nómina (Colombia 2025) — todo automatizado y trazable.
          </p>

          <div className="mt-10 space-y-3">
            <Feature icon={ShieldCheck} title="Multi-tenant seguro" desc="Aislamiento por empresa con JWT + refresh tokens" />
            <Feature icon={Zap} title="Cálculos en segundos" desc="Salud, pensión, auxilio y horas extra automáticos" />
            <Feature icon={Sparkles} title="Diseño elegante" desc="Pensado para el día a día del equipo de RRHH" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon: Icon, title, desc }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-2xl
                    bg-white/70 border border-zinc-200 backdrop-blur-md
                    dark:bg-white/[0.04] dark:border-white/[0.06]">
      <div className="h-9 w-9 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow-violet shrink-0">
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div>
        <p className="text-sm font-semibold text-zinc-900 dark:text-white">{title}</p>
        <p className="text-xs text-zinc-600 dark:text-ink-300">{desc}</p>
      </div>
    </div>
  );
}
