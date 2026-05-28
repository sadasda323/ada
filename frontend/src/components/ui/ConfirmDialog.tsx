import { AlertTriangle, ShieldQuestion } from 'lucide-react';
import { motion } from 'framer-motion';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { ButtonProps } from '@/components/ui/Button';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
}

const iconAnimDanger = {
  initial: { rotate: -8, scale: 0.8, opacity: 0 },
  animate: { rotate: 0, scale: 1, opacity: 1 },
  transition: { type: 'spring' as const, stiffness: 400, damping: 14 },
};

const iconAnimPrimary = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { type: 'spring' as const, stiffness: 380, damping: 18 },
};

export function ConfirmDialog({
  open,
  title = '¿Confirmar acción?',
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onClose,
  loading,
}: ConfirmDialogProps) {
  const isDanger = variant === 'danger';
  const Icon = isDanger ? AlertTriangle : ShieldQuestion;
  const animConfig = isDanger ? iconAnimDanger : iconAnimPrimary;

  // Mapear a variant del Button shadcn
  const actionVariant: ButtonProps['variant'] = isDanger ? 'destructive' : 'default';

  return (
    <AlertDialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <motion.div
              {...animConfig}
              className={
                isDanger
                  ? 'shrink-0 h-10 w-10 rounded-full bg-rose-50 border border-rose-100 dark:bg-rose-500/15 dark:border-rose-400/20 flex items-center justify-center'
                  : 'shrink-0 h-10 w-10 rounded-full bg-zinc-100 border border-zinc-200 dark:bg-violet-500/15 dark:border-violet-400/20 flex items-center justify-center'
              }
            >
              <Icon
                className={
                  isDanger
                    ? 'h-5 w-5 text-rose-600 dark:text-rose-300'
                    : 'h-5 w-5 text-zinc-900 dark:text-violet-300'
                }
                aria-hidden
              />
            </motion.div>
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="mt-1">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            variant={actionVariant}
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
          >
            {loading && (
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                aria-hidden
              />
            )}
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
