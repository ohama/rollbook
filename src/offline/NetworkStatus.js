
/**
 * Check if currently online
 */
export function isOnline() {
    return (navigator).onLine;
}

/**
 * Subscribe to online/offline status changes
 * Returns a function to unsubscribe
 */
export function onStatusChange(callback) {
    const handleOnline = (_arg) => {
        callback(true);
    };
    const handleOffline = (_arg_1) => {
        callback(false);
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
    };
}

/**
 * Subscribe to visibility changes (for fallback sync trigger)
 */
export function onVisibilityChange(callback) {
    const handleVisibility = (_arg) => {
        const isVisible = document.visibilityState === "visible";
        callback(isVisible);
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
        document.removeEventListener("visibilitychange", handleVisibility);
    };
}

