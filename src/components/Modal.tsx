import { type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  if (!open) return null;

  const sizeClass = size === 'sm' ? 'max-w-md' : size === 'lg' ? 'max-w-3xl' : 'max-w-xl';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-espresso-900/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative w-full ${sizeClass} max-h-[90vh] overflow-y-auto rounded-2xl bg-cream-50 shadow-2xl animate-scale-in scrollbar-thin`}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-espresso-200 bg-cream-50/95 backdrop-blur px-6 py-4 z-10">
          <h2 className="font-display text-xl font-semibold text-espresso-800">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-espresso-400 hover:bg-espresso-100 hover:text-espresso-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
