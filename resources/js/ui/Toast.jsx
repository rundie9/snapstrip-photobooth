import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { X } from 'lucide-react';

const ToastContext = createContext({ push: () => {} });

export function useToast() {
    return useContext(ToastContext);
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const dismiss = useCallback((id) => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
    }, []);

    const push = useCallback(
        (message, tone = 'info') => {
            const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
            setToasts((current) => [...current.slice(-1), { id, message, tone }]);

            window.setTimeout(() => dismiss(id), 5400);

            return id;
        },
        [dismiss],
    );

    const value = useMemo(() => ({ push, dismiss }), [push, dismiss]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="toast-wrap" role="status" aria-live="polite">
                {toasts.map((toast) => (
                    <div className="toast" data-tone={toast.tone} key={toast.id}>
                        <span>{toast.message}</span>
                        <button
                            type="button"
                            className="toast__close"
                            onClick={() => dismiss(toast.id)}
                            aria-label="Tutup notifikasi"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
