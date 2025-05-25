let toastContext = null;

export function initializeToast(toast) {
    toastContext = toast;
}

export function showToast(message, type='success', duration=3000) {
    if (toastContext) {
        toastContext.showToast(message, type, duration);
    } else {
        console.warn('ToastContext не инициализирован');
    }
}