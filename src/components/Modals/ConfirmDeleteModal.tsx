import { createPortal } from 'react-dom';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

interface ConfirmDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    itemName: string;
    description?: string;
    loading?: boolean;
    confirmText?: string;
    cancelText?: string;
}

/**
 * Generic delete confirmation modal with consistent styling.
 * Replaces inline delete modals across admin pages.
 */
export function ConfirmDeleteModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Excluir?',
    itemName,
    description = 'Esta ação não pode ser desfeita.',
    loading = false,
    confirmText = 'Sim, Excluir',
    cancelText = 'Cancelar'
}: ConfirmDeleteModalProps) {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in-up">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-300 hover:text-gray-500 hover:bg-gray-50 rounded-full transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Icon */}
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                        <AlertTriangle className="text-red-600" size={32} />
                    </div>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                    {title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 text-center mb-6">
                    Você tem certeza que deseja remover{' '}
                    <strong className="text-gray-900">{itemName}</strong>?
                    <br />
                    <span className="text-sm text-gray-500">
                        {description}
                    </span>
                </p>

                {/* Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Excluindo...
                            </>
                        ) : (
                            confirmText
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
