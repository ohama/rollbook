import { openDB } from "idb";
import { PromiseBuilder__Delay_62FBFDE1, PromiseBuilder__Run_212F1D4B } from "../fable_modules/Fable.Promise.3.2.0/Promise.fs.js";
import { promise } from "../fable_modules/Fable.Promise.3.2.0/PromiseImpl.fs.js";
import { QueueResult, QueuedOperation } from "./Types.js";
import { defaultOf, equals } from "../fable_modules/fable-library-js.4.28.0/Util.js";

const dbName = "rollbook-offline";

const dbVersion = 1;

const storeName = "queue";

function getDb() {
    const upgradeConfig = {
        upgrade: (db) => {
            if (!(db.objectStoreNames.contains(storeName))) {
                db.createObjectStore(storeName, {
                    keyPath: "id",
                    autoIncrement: true,
                });
            }
        },
    };
    return openDB(dbName)(dbVersion)(upgradeConfig);
}

/**
 * Enqueue a workout operation for offline sync
 */
export function enqueue(operationType, userId, workoutDate) {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (PromiseBuilder__Delay_62FBFDE1(promise, () => (getDb().then((_arg) => {
        const db = _arg;
        const operation = new QueuedOperation(undefined, (operationType.tag === 1) ? "DeleteWorkout" : "CreateWorkout", userId, workoutDate, Date.now(), 0);
        return (db.add(storeName, operation)).then((_arg_1) => {
            const id = _arg_1;
            return Promise.resolve(new QueueResult(0, [id]));
        });
    }))).catch((_arg_2) => {
        const exn = _arg_2;
        return Promise.resolve(new QueueResult(1, [exn.message]));
    }))));
}

/**
 * Get all pending operations
 */
export function getAllPending() {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (PromiseBuilder__Delay_62FBFDE1(promise, () => (getDb().then((_arg) => {
        const db = _arg;
        return (db.getAll(storeName)).then((_arg_1) => {
            const items = _arg_1;
            return Promise.resolve(items);
        });
    }))).catch((_arg_2) => (Promise.resolve([]))))));
}

/**
 * Remove an operation from the queue (after successful sync)
 */
export function dequeue(operationId) {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (PromiseBuilder__Delay_62FBFDE1(promise, () => (getDb().then((_arg) => {
        const db = _arg;
        return (db.delete(storeName, operationId)).then(() => (Promise.resolve(true)));
    }))).catch((_arg_2) => (Promise.resolve(false))))));
}

/**
 * Update retry count for a failed operation
 */
export function incrementRetry(operationId) {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (PromiseBuilder__Delay_62FBFDE1(promise, () => (getDb().then((_arg) => {
        const db = _arg;
        return (db.get(storeName, operationId)).then((_arg_1) => {
            const operation = _arg_1;
            if (equals(operation, defaultOf())) {
                return Promise.resolve(false);
            }
            else {
                const updated = {
                    id: operationId,
                    operationType: operation.operationType,
                    userId: operation.userId,
                    workoutDate: operation.workoutDate,
                    timestamp: operation.timestamp,
                    retryCount: operation.retryCount + 1,
                };
                return (db.put(storeName, updated)).then(() => (Promise.resolve(true)));
            }
        });
    }))).catch((_arg_3) => (Promise.resolve(false))))));
}

/**
 * Get count of pending operations
 */
export function getPendingCount() {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (PromiseBuilder__Delay_62FBFDE1(promise, () => (getDb().then((_arg) => {
        const db = _arg;
        return (db.count(storeName)).then((_arg_1) => {
            const count = _arg_1;
            return Promise.resolve(count);
        });
    }))).catch((_arg_2) => (Promise.resolve(0))))));
}

/**
 * Clear all queued operations (use with caution)
 */
export function clear() {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (PromiseBuilder__Delay_62FBFDE1(promise, () => (getDb().then((_arg) => {
        const db = _arg;
        return (db.clear(storeName)).then(() => (Promise.resolve(true)));
    }))).catch((_arg_2) => (Promise.resolve(false))))));
}

