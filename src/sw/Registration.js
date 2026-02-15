import { PromiseBuilder__For_1565554B, PromiseBuilder__Delay_62FBFDE1, PromiseBuilder__Run_212F1D4B } from "../fable_modules/Fable.Promise.3.2.0/Promise.fs.js";
import { promise } from "../fable_modules/Fable.Promise.3.2.0/PromiseImpl.fs.js";
import { printf, toConsole } from "../fable_modules/fable-library-js.4.28.0/String.js";
import { some } from "../fable_modules/fable-library-js.4.28.0/Option.js";

/**
 * Check if service workers are supported
 */
export function isSupported() {
    return "serviceWorker" in (navigator);
}

/**
 * Register the service worker
 */
export function register() {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => {
        if (isSupported()) {
            return PromiseBuilder__Delay_62FBFDE1(promise, () => (((navigator).serviceWorker.register("/sw.js")).then((_arg) => {
                const registration = _arg;
                toConsole(printf("Service Worker registered successfully"));
                return Promise.resolve(some(registration));
            }))).catch((_arg_1) => {
                const exn = _arg_1;
                const arg = exn.message;
                toConsole(printf("Service Worker registration failed: %s"))(arg);
                return Promise.resolve(undefined);
            });
        }
        else {
            toConsole(printf("Service Workers not supported in this browser"));
            return Promise.resolve(undefined);
        }
    }));
}

/**
 * Unregister all service workers (useful for debugging)
 */
export function unregisterAll() {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (isSupported() ? (((navigator).serviceWorker.getRegistrations()).then((_arg) => {
        const registrations = _arg;
        const regsArray = registrations;
        return PromiseBuilder__For_1565554B(promise, regsArray, (_arg_1) => {
            const reg = _arg_1;
            return (reg.unregister()).then((_arg_2) => {
                return Promise.resolve();
            });
        }).then(() => PromiseBuilder__Delay_62FBFDE1(promise, () => {
            toConsole(printf("All Service Workers unregistered"));
            return Promise.resolve();
        }));
    })) : (Promise.resolve()))));
}

