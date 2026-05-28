import * as React from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  type HTMLMotionProps,
  type Variants,
} from 'framer-motion';
import { useLocation } from 'react-router-dom';

import { cn } from '@/lib/utils';

/* ─── Variants compartidas ──────────────────────────────────────────────── */

export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.18, ease: 'easeIn' as const },
  },
};

export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const popVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 380, damping: 26 },
  },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.12 } },
};

/** Stagger container para listas */
export const staggerContainer = (
  staggerChildren = 0.04,
  delayChildren = 0.05,
): Variants => ({
  hidden: {},
  show: {
    transition: {
      staggerChildren,
      delayChildren,
    },
  },
});

/* ─── useReducedMotionSafe ──────────────────────────────────────────────── */

export function useReducedMotionSafe() {
  const reduced = useReducedMotion();
  return !!reduced;
}

/* ─── <MotionPage /> wrapper de transiciones de página ─────────────────── */

type MotionDivProps = Omit<HTMLMotionProps<'div'>, 'children'> & {
  children?: React.ReactNode;
};

export function MotionPage({
  className,
  children,
  ...props
}: MotionDivProps) {
  const location = useLocation();
  const reduced = useReducedMotionSafe();

  if (reduced) {
    return (
      <div className={cn(className)} {...(props as React.HTMLAttributes<HTMLDivElement>)}>
        {children}
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={fadeUpVariants}
        initial="hidden"
        animate="show"
        exit="exit"
        className={cn(className)}
        {...props}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── <AnimatedCounter /> contador animado para KPIs ───────────────────── */

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
}

export function AnimatedCounter({
  value,
  duration = 1.0,
  format = (n) => Math.round(n).toLocaleString('es-CO'),
  className,
}: AnimatedCounterProps) {
  const reduced = useReducedMotionSafe();
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, {
    stiffness: 60,
    damping: 18,
    duration: duration * 1000,
    mass: 1,
  });
  const display = useTransform(spring, (v) => format(v));
  const [text, setText] = React.useState(format(reduced ? value : 0));

  React.useEffect(() => {
    if (reduced) {
      setText(format(value));
      return;
    }
    motionVal.set(value);
    const unsub = display.on('change', (v: string) => setText(v));
    return unsub;
  }, [value, motionVal, display, reduced, format]);

  return <span className={className}>{text}</span>;
}

/* ─── <Stagger /> renderiza children con stagger ────────────────────────── */

export function Stagger({
  children,
  className,
  staggerChildren = 0.05,
  delayChildren = 0,
  ...props
}: MotionDivProps & {
  staggerChildren?: number;
  delayChildren?: number;
}) {
  return (
    <motion.div
      variants={staggerContainer(staggerChildren, delayChildren)}
      initial="hidden"
      animate="show"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  variants = fadeUpVariants,
  ...props
}: MotionDivProps) {
  return (
    <motion.div variants={variants} className={className} {...props}>
      {children}
    </motion.div>
  );
}
