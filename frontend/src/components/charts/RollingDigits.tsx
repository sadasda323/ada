import * as React from 'react';
import { motion } from 'framer-motion';

import { useReducedMotionSafe } from '@/components/ui/motion';

/**
 * RollingDigits — número con efecto scramble/slot-machine.
 * Cada dígito es una columna que rueda del 0-9 hasta detenerse en el valor real.
 *
 * Replica el efecto del video Yann UIUX donde los números pasan por
 * varios estados aleatorios antes de fijarse en el valor final.
 */
interface RollingDigitsProps {
  /** Valor numérico final */
  value: number;
  /** Sufijo opcional (ej. "%") */
  suffix?: string;
  /** Prefijo opcional (ej. "$") */
  prefix?: string;
  /** Formatea el valor antes de descomponer en dígitos. Por defecto es toLocaleString es-CO. */
  format?: (n: number) => string;
  /** Duración total del scramble en segundos */
  duration?: number;
  className?: string;
}

export function RollingDigits({
  value,
  suffix,
  prefix,
  format = (n) => Math.round(n).toLocaleString('es-CO'),
  duration = 1.6,
  className,
}: RollingDigitsProps) {
  const reduced = useReducedMotionSafe();
  const formatted = format(value);

  // Convertir cada char en un objeto: {ch, isDigit}
  const chars = formatted.split('');

  if (reduced) {
    return (
      <span className={className}>
        {prefix}{formatted}{suffix}
      </span>
    );
  }

  return (
    <span className={className}>
      {prefix}
      {chars.map((c, i) => {
        if (/\d/.test(c)) {
          return <Digit key={i} target={parseInt(c, 10)} duration={duration} delay={i * 0.04} />;
        }
        return (
          <span key={i} className="inline-block">
            {c}
          </span>
        );
      })}
      {suffix}
    </span>
  );
}

interface DigitProps {
  target: number;   // 0..9
  duration: number;
  delay: number;
}

const DIGIT_HEIGHT = 1; // em — usaremos line-height: 1 para precisión

function Digit({ target, duration, delay }: DigitProps) {
  // rolar 3 vueltas + el target = (3*10 + target) posiciones
  const totalSteps = 3 * 10 + target;

  return (
    <span
      className="relative inline-block overflow-hidden"
      style={{ height: '1em', verticalAlign: 'top', lineHeight: 1 }}
    >
      <motion.span
        initial={{ y: 0 }}
        animate={{ y: `-${totalSteps}em` }}
        transition={{
          duration,
          delay,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="block"
        style={{ lineHeight: 1 }}
      >
        {Array.from({ length: totalSteps + 1 }, (_, i) => (
          <span
            key={i}
            className="block tabular-nums"
            style={{ height: '1em', lineHeight: 1 }}
          >
            {i % 10}
          </span>
        ))}
      </motion.span>
    </span>
  );
}
