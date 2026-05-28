import { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * Modal con la API legacy del proyecto HRCO.
 * Por dentro usa Dialog shadcn (Radix) con animaciones data-state.
 *
 * Props:
 *   open       → abierto
 *   onClose    → callback al cerrar
 *   title?     → título (h-display)
 *   description? → subtítulo
 *   size?      → 'sm' | 'md' | 'lg' | 'xl'
 *   children   → cuerpo
 */
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
}: ModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent size={size}>
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        <div className="overflow-y-auto p-6">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
