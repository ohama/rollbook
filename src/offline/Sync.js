import { PromiseBuilder__For_1565554B, PromiseBuilder__Delay_62FBFDE1, PromiseBuilder__Run_212F1D4B } from "../fable_modules/Fable.Promise.3.2.0/Promise.fs.js";
import { promise as promise_4 } from "../fable_modules/Fable.Promise.3.2.0/PromiseImpl.fs.js";
import { printf, toConsole } from "../fable_modules/fable-library-js.4.28.0/String.js";
import * as Client from "../Supabase/Client";
import { defaultOf, equals } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { getPendingCount, getAllPending, incrementRetry, dequeue } from "./Queue.js";
import { defaultArg } from "../fable_modules/fable-library-js.4.28.0/Option.js";
import { SyncStatus, SyncResult } from "./Types.js";
import { onStatusChange, onVisibilityChange, isOnline } from "./NetworkStatus.js";
import { awaitPromise, startImmediate } from "../fable_modules/fable-library-js.4.28.0/Async.js";
import { singleton } from "../fable_modules/fable-library-js.4.28.0/AsyncBuilder.js";

const syncTag = "sync-workouts";

/**
 * Check if Background Sync is supported
 */
export function isBackgroundSyncSupported() {
    return PromiseBuilder__Run_212F1D4B(promise_4, PromiseBuilder__Delay_62FBFDE1(promise_4, () => (PromiseBuilder__Delay_62FBFDE1(promise_4, () => ((navigator).serviceWorker.ready.then((_arg) => (Promise.resolve("sync" in _arg))))).catch((_arg_1) => (Promise.resolve(false))))));
}

/**
 * Register Background Sync (Chromium only)
 */
export function registerBackgroundSync() {
    return PromiseBuilder__Run_212F1D4B(promise_4, PromiseBuilder__Delay_62FBFDE1(promise_4, () => (PromiseBuilder__Delay_62FBFDE1(promise_4, () => ((navigator).serviceWorker.ready.then((_arg) => {
        const registration = _arg;
        return ("sync" in registration) ? ((registration.sync.register(syncTag)).then(() => {
            toConsole(printf("Background Sync registered: %s"))(syncTag);
            return Promise.resolve(true);
        })) : (Promise.resolve(false));
    }))).catch((_arg_2) => {
        const arg_1 = _arg_2.message;
        toConsole(printf("Background Sync registration failed: %s"))(arg_1);
        return Promise.resolve(false);
    }))));
}

function replayOperation(operation) {
    return PromiseBuilder__Run_212F1D4B(promise_4, PromiseBuilder__Delay_62FBFDE1(promise_4, () => (PromiseBuilder__Delay_62FBFDE1(promise_4, () => {
        const supabase = Client;
        const client = supabase.supabase;
        const matchValue = operation.operationType;
        return (matchValue === "CreateWorkout") ? (((client.from("workouts")).upsert({
            user_id: operation.userId,
            workout_date: operation.workoutDate,
        }, {
            onConflict: "user_id,workout_date",
        })).then((_arg) => {
            const error = _arg.error;
            return equals(error, defaultOf()) ? (dequeue(defaultArg(operation.id, 0)).then((_arg_1) => (Promise.resolve(new SyncResult(0, [defaultArg(operation.id, 0)]))))) : (incrementRetry(defaultArg(operation.id, 0)).then((_arg_2) => (Promise.resolve(new SyncResult(1, [defaultArg(operation.id, 0), error.message])))));
        })) : ((matchValue === "DeleteWorkout") ? (((((client.from("workouts")).delete()).eq("user_id", operation.userId)).eq("workout_date", operation.workoutDate)).then((_arg_3) => {
            const error_1 = _arg_3.error;
            return equals(error_1, defaultOf()) ? (dequeue(defaultArg(operation.id, 0)).then((_arg_4) => (Promise.resolve(new SyncResult(0, [defaultArg(operation.id, 0)]))))) : (incrementRetry(defaultArg(operation.id, 0)).then((_arg_5) => (Promise.resolve(new SyncResult(1, [defaultArg(operation.id, 0), error_1.message])))));
        })) : (Promise.resolve(new SyncResult(1, [defaultArg(operation.id, 0), "Unknown operation type"]))));
    }).catch((_arg_6) => (incrementRetry(defaultArg(operation.id, 0)).then((_arg_7) => (Promise.resolve(new SyncResult(1, [defaultArg(operation.id, 0), _arg_6.message])))))))));
}

/**
 * Replay all queued operations
 */
export function replayQueue() {
    return PromiseBuilder__Run_212F1D4B(promise_4, PromiseBuilder__Delay_62FBFDE1(promise_4, () => (!isOnline() ? (Promise.resolve(new SyncStatus(3, []))) : (getAllPending().then((_arg) => {
        const pending = _arg;
        if (pending.length === 0) {
            return Promise.resolve(new SyncStatus(2, [0, 0]));
        }
        else {
            let synced = 0;
            let failed = 0;
            return PromiseBuilder__For_1565554B(promise_4, pending, (_arg_1) => (replayOperation(_arg_1).then((_arg_2) => {
                const result = _arg_2;
                switch (result.tag) {
                    case 1: {
                        failed = ((failed + 1) | 0);
                        return Promise.resolve();
                    }
                    case 2: {
                        return Promise.resolve();
                    }
                    default: {
                        synced = ((synced + 1) | 0);
                        return Promise.resolve();
                    }
                }
            }))).then(() => PromiseBuilder__Delay_62FBFDE1(promise_4, () => (Promise.resolve(new SyncStatus(2, [synced, failed])))));
        }
    })))));
}

/**
 * Initialize sync with fallback for non-Chromium browsers
 */
export function initializeSync() {
    const cleanup = onVisibilityChange((isVisible) => {
        if (isVisible && isOnline()) {
            startImmediate(singleton.Delay(() => singleton.Bind(awaitPromise(getPendingCount()), (_arg) => {
                const count = _arg | 0;
                if (count > 0) {
                    toConsole(printf("Visibility change: attempting to sync %d pending operations"))(count);
                    return singleton.Bind(awaitPromise(replayQueue()), (_arg_1) => {
                        return singleton.Zero();
                    });
                }
                else {
                    return singleton.Zero();
                }
            })));
        }
    });
    const cleanupOnline = onStatusChange((isNowOnline) => {
        if (isNowOnline) {
            startImmediate(singleton.Delay(() => singleton.Bind(awaitPromise(getPendingCount()), (_arg_2) => {
                const count_1 = _arg_2 | 0;
                if (count_1 > 0) {
                    toConsole(printf("Connection restored: syncing %d pending operations"))(count_1);
                    return singleton.Bind(awaitPromise(replayQueue()), (_arg_3) => {
                        return singleton.Zero();
                    });
                }
                else {
                    return singleton.Zero();
                }
            })));
        }
    });
    toConsole(printf("Sync fallback listeners initialized"));
}

