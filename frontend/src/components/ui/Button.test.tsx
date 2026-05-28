import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('<Button />', () => {
  it('renderiza el texto', () => {
    render(<Button>Guardar</Button>);
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument();
  });

  it('muestra spinner cuando loading=true y deshabilita', () => {
    render(<Button loading>Guardar</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
  });

  it('llama onClick', () => {
    let clicked = false;
    render(<Button onClick={() => { clicked = true; }}>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(clicked).toBe(true);
  });

  it('aplica variantes', () => {
    const { rerender } = render(<Button variant="danger">x</Button>);
    expect(screen.getByRole('button').className).toContain('bg-red-600');
    rerender(<Button variant="outline">x</Button>);
    expect(screen.getByRole('button').className).toContain('border');
  });
});
