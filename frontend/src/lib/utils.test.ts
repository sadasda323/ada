import { describe, expect, it } from 'vitest';
import { formatCOP, formatDate, initials, cn } from '@/lib/utils';

describe('utils', () => {
  it('formatCOP formatea pesos colombianos sin decimales', () => {
    expect(formatCOP(1500000)).toMatch(/1\.500\.000/);
    expect(formatCOP('2000000')).toMatch(/2\.000\.000/);
    expect(formatCOP(null)).toBe('$0');
    expect(formatCOP('abc')).toBe('$0');
  });

  it('formatDate maneja entradas inválidas', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate('not-a-date')).toBe('—');
    expect(formatDate('2024-05-15T00:00:00Z')).toMatch(/2024/);
  });

  it('initials toma primeras letras', () => {
    expect(initials('Dilan', 'Test')).toBe('DT');
    expect(initials('', '')).toBe('');
  });

  it('cn combina clases Tailwind sin duplicar', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('text-sm', undefined, 'font-bold')).toBe('text-sm font-bold');
  });
});
