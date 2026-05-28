import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCOP(value: string | number | undefined | null): string {
  if (value === null || value === undefined || value === '') return '$0';
  const n = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(n)) return '$0';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDate(s: string | undefined | null): string {
  if (!s) return '—';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(d);
}

export function initials(nombre: string, apellido: string): string {
  return ((nombre?.[0] ?? '') + (apellido?.[0] ?? '')).toUpperCase();
}
