import { Record } from "../fable_modules/fable-library-js.4.28.0/Types.js";
import { record_type, obj_type, option_type, string_type, int64_type } from "../fable_modules/fable-library-js.4.28.0/Reflection.js";
import { PromiseBuilder__Delay_62FBFDE1, PromiseBuilder__Run_212F1D4B } from "../fable_modules/Fable.Promise.3.2.0/Promise.fs.js";
import { promise } from "../fable_modules/Fable.Promise.3.2.0/PromiseImpl.fs.js";
import { supabase } from "./Client.js";
import { defaultOf, equals } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { FSharpResult$2 } from "../fable_modules/fable-library-js.4.28.0/Result.js";

export class AuditEntry extends Record {
    constructor(id, ts, op, user_email, table_name, record, old_record) {
        super();
        this.id = id;
        this.ts = ts;
        this.op = op;
        this.user_email = user_email;
        this.table_name = table_name;
        this.record = record;
        this.old_record = old_record;
    }
}

export function AuditEntry_$reflection() {
    return record_type("Supabase.Audit.AuditEntry", [], AuditEntry, () => [["id", int64_type], ["ts", string_type], ["op", string_type], ["user_email", option_type(string_type)], ["table_name", string_type], ["record", obj_type], ["old_record", option_type(obj_type)]]);
}

/**
 * Get recent audit log entries (admin only - RLS enforced)
 * Returns most recent changes first (ordered by timestamp descending)
 */
export function getRecentChanges(limit) {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (PromiseBuilder__Delay_62FBFDE1(promise, () => ((((((supabase.schema("audit")).from("record_version")).select("id, ts, op, user_email, table_name, record, old_record")).order("ts", {
        ascending: false,
    })).limit(limit)).then((_arg) => {
        const response = _arg;
        const error = response.error;
        const data = response.data;
        if (equals(error, defaultOf())) {
            return Promise.resolve(new FSharpResult$2(0, [data]));
        }
        else {
            const errorMsg = error.message;
            return Promise.resolve(new FSharpResult$2(1, [errorMsg]));
        }
    }))).catch((_arg_1) => (Promise.resolve(new FSharpResult$2(1, [_arg_1.message])))))));
}

/**
 * Get soft-deleted workout records (admin only - RLS allows viewing deleted_at IS NOT NULL)
 * Returns deleted records ordered by deletion time (most recent first)
 */
export function getDeletedWorkouts() {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (PromiseBuilder__Delay_62FBFDE1(promise, () => (((((supabase.from("workouts")).select("*")).not("deleted_at", "is", defaultOf())).order("deleted_at", {
        ascending: false,
    })).then((_arg) => {
        const response = _arg;
        const error = response.error;
        const data = response.data;
        if (equals(error, defaultOf())) {
            return Promise.resolve(new FSharpResult$2(0, [data]));
        }
        else {
            const errorMsg = error.message;
            return Promise.resolve(new FSharpResult$2(1, [errorMsg]));
        }
    }))).catch((_arg_1) => (Promise.resolve(new FSharpResult$2(1, [_arg_1.message])))))));
}

/**
 * Restore a soft-deleted workout record by setting deleted_at to NULL
 * Admin only - allows un-deleting records (ADM-08)
 */
export function restoreWorkout(workoutId) {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (PromiseBuilder__Delay_62FBFDE1(promise, () => ((((supabase.from("workouts")).update({
        deleted_at: defaultOf(),
    })).eq("id", workoutId)).then((_arg) => {
        const error = _arg.error;
        if (equals(error, defaultOf())) {
            return Promise.resolve(new FSharpResult$2(0, [undefined]));
        }
        else {
            const errorMsg = error.message;
            return Promise.resolve(new FSharpResult$2(1, [errorMsg]));
        }
    }))).catch((_arg_1) => (Promise.resolve(new FSharpResult$2(1, [_arg_1.message])))))));
}

/**
 * Get audit log entries filtered by table name
 * Useful for viewing history of specific table (e.g., only workouts changes)
 */
export function getChangesByTable(tableName, limit) {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (PromiseBuilder__Delay_62FBFDE1(promise, () => (((((((supabase.schema("audit")).from("record_version")).select("id, ts, op, user_email, table_name, record, old_record")).eq("table_name", tableName)).order("ts", {
        ascending: false,
    })).limit(limit)).then((_arg) => {
        const response = _arg;
        const error = response.error;
        const data = response.data;
        if (equals(error, defaultOf())) {
            return Promise.resolve(new FSharpResult$2(0, [data]));
        }
        else {
            const errorMsg = error.message;
            return Promise.resolve(new FSharpResult$2(1, [errorMsg]));
        }
    }))).catch((_arg_1) => (Promise.resolve(new FSharpResult$2(1, [_arg_1.message])))))));
}

/**
 * Get audit log entries for a specific user (by user_id)
 * Useful for viewing user activity history
 */
export function getChangesByUser(userId, limit) {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (PromiseBuilder__Delay_62FBFDE1(promise, () => (((((((supabase.schema("audit")).from("record_version")).select("id, ts, op, user_email, table_name, record, old_record")).eq("user_id", userId)).order("ts", {
        ascending: false,
    })).limit(limit)).then((_arg) => {
        const response = _arg;
        const error = response.error;
        const data = response.data;
        if (equals(error, defaultOf())) {
            return Promise.resolve(new FSharpResult$2(0, [data]));
        }
        else {
            const errorMsg = error.message;
            return Promise.resolve(new FSharpResult$2(1, [errorMsg]));
        }
    }))).catch((_arg_1) => (Promise.resolve(new FSharpResult$2(1, [_arg_1.message])))))));
}

