import { createPortal } from 'react-dom';
import { CheckCircle, AlertTriangle, X } from 'lucide-react';

interface SuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string | React.ReactNode;
    variant?: 'success' | 'warning';
    buttonText?: string;
}

/**
 * Generic feedback modal for success/warning notifications.
 * Replaces inline success and block modals across admin pages.
 */
export function SuccessModal({
    isOpen,
    onClose,
    title,
    message,
    variant = 'success',
    buttonText
}: SuccessModalProps) {
    if (!isOpen) return null;

    const isSuccess = variant === 'success';
    const Icon = isSuccess ? CheckCircle : AlertTriangle;
    const iconColor = isSuccess ? 'text-emerald-500' : 'text-amber-500';
    const bgColor = isSuccess ? 'bg-emerald-50' : 'bg-amber-50';
    const ringColor = isSuccess ? 'bg-emerald-100' : 'bg-amber-100';
    const buttonBg = isSuccess ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-gray-900 hover:bg-black shadow-gray-200';
    const defaultButtonText = isSuccess ? 'Fechar' : 'Entendi';

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-md transition-all duration-300"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 ease-out">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-300 hover:text-gray-500 hover:bg-gray-50 rounded-full transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center text-center">
                    {/* Icon with Ring Effect */}
                    <div className="relative mb-6">
                        <div className={`absolute inset-0 ${ringColor} rounded-full animate-ping opacity-20`}></div>
                        <div className={`relative w-20 h-20 ${bgColor} rounded-full flex items-center justify-center border-4 border-white shadow-lg`}>
                            <Icon size={40} className={iconColor} />
                        </div>
                    </div>

                    {/* Content */}
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">{title}</h3>

                    <div className="text-gray-600 mb-8 leading-relaxed text-base">
                        {message}
                    </div>

                    {/* Action */}
                    <button
                        onClick={onClose}
                        className={`w-full py-3.5 text-white rounded-2xl font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl ${buttonBg}`}
                    >
                        {buttonText || defaultButtonText}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
