import { useRef, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { AlertCircle } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  itemName: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isDeleting?: boolean;
}

export default function DeleteConfirmationModal({
  isOpen,
  itemName,
  onConfirm,
  onCancel,
  isDeleting = false,
}: DeleteConfirmationModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen && !isDeleting) {
        onCancel();
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onCancel, isDeleting]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (dialogRef.current && e.target === dialogRef.current && !isDeleting) {
      onCancel();
    }
  };

  return (
    <div
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
    >
      <Card className="w-full max-w-sm mx-4">
        <div className="px-6 py-5 border-b border-surfaceHighlight flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
          <h3 className="text-lg font-semibold text-white">Delete Investment</h3>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-textMuted">
            Are you sure you want to delete <span className="font-semibold text-white">{itemName}</span>? This action cannot be undone.
          </p>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isDeleting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              className="flex-1 bg-red-600 hover:bg-red-700"
              onClick={onConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
