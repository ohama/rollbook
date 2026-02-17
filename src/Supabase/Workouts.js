import { now as now_1 } from "../fable_modules/fable-library-js.4.28.0/Date.js";
import { PromiseBuilder__Delay_62FBFDE1, PromiseBuilder__Run_212F1D4B } from "../fable_modules/Fable.Promise.3.2.0/Promise.fs.js";
import { supabase } from "./Client.js";
import { createObj, defaultOf } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { promise } from "../fable_modules/Fable.Promise.3.2.0/PromiseImpl.fs.js";
import { item } from "../fable_modules/fable-library-js.4.28.0/Array.js";
import { singleton, append, delay, toList } from "../fable_modules/fable-library-js.4.28.0/Seq.js";
import { singleton as singleton_1, empty } from "../fable_modules/fable-library-js.4.28.0/List.js";

/**
 * Get today's date string in YYYY-MM-DD format (local timezone)
 */
export function getTodayDateString() {
    const now = now_1();
    return now.toLocaleDateString('en-CA');
}

/**
 * Get a single workout record for a user and date (first non-deleted)
 */
export function getWorkout(userId, date) {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => {
        const query = (((((supabase.from("workouts")).select("*")).eq("user_id", userId)).eq("workout_date", date)).is("deleted_at", defaultOf())).limit(1);
        return query.then((_arg) => {
            const data = _arg.data;
            if (data == null) {
                return Promise.resolve(undefined);
            }
            else {
                const records = data;
                return (records.length === 0) ? (Promise.resolve(undefined)) : (Promise.resolve(item(0, records)));
            }
        });
    }));
}

/**
 * Get all non-deleted records for a user and date
 */
export function getWorkoutsForDate(userId, date) {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => {
        const query = (((((supabase.from("workouts")).select("*")).eq("user_id", userId)).eq("workout_date", date)).is("deleted_at", defaultOf())).order("created_at", {
            ascending: true,
        });
        return query.then((_arg) => {
            const data = _arg.data;
            return (data == null) ? (Promise.resolve([])) : (Promise.resolve(data));
        });
    }));
}

/**
 * Create a workout record (simple insert, no onConflict)
 * Backward compatible: same signature as old upsertWorkout
 */
export function upsertWorkout(userId, date) {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => {
        const record = {
            user_id: userId,
            workout_date: date,
            record_type: "workout",
        };
        const query = ((supabase.from("workouts")).insert(record)).select();
        return query.then((_arg) => (Promise.resolve(_arg)));
    }));
}

export const createWorkout = (userId) => ((date) => upsertWorkout(userId, date));

/**
 * Soft-delete workout records for a user and date
 * Transitional: deletes ALL non-deleted records for user+date
 * Phase 10 will update to delete by individual record id
 */
export function deleteWorkout(userId, date) {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => {
        const updates = {
            deleted_at: new Date().toISOString(),
        };
        const query = ((((supabase.from("workouts")).update(updates)).eq("user_id", userId)).eq("workout_date", date)).is("deleted_at", defaultOf());
        return query.then((_arg) => (Promise.resolve(_arg)));
    }));
}

/**
 * Soft-delete a single workout record by id (Phase 10+)
 */
export function deleteWorkoutById(recordId) {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => {
        const updates = {
            deleted_at: new Date().toISOString(),
        };
        const query = ((supabase.from("workouts")).update(updates)).eq("id", recordId);
        return query.then((_arg) => (Promise.resolve(_arg)));
    }));
}

/**
 * Create a text record for a specific date
 */
export function createTextRecord(userId, date, textContent) {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => {
        const record = {
            user_id: userId,
            workout_date: date,
            record_type: "text",
            text_content: textContent,
        };
        const query = ((supabase.from("workouts")).insert(record)).select();
        return query.then((_arg) => (Promise.resolve(_arg)));
    }));
}

/**
 * Create a photo record for a specific date (with optional text caption)
 */
export function createPhotoRecord(userId, date, photoUrl, textContent) {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => {
        const record = createObj(toList(delay(() => append(singleton(["user_id", userId]), delay(() => append(singleton(["workout_date", date]), delay(() => append(singleton(["record_type", "photo"]), delay(() => append(singleton(["photo_url", photoUrl]), delay(() => ((textContent == null) ? empty() : singleton_1(["text_content", textContent])))))))))))));
        const query = ((supabase.from("workouts")).insert(record)).select();
        return query.then((_arg) => (Promise.resolve(_arg)));
    }));
}

/**
 * Update a specific workout record by id (for editing text content)
 */
export function updateWorkoutById(recordId, textContent) {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => {
        const updates = {
            text_content: textContent,
            updated_at: new Date().toISOString(),
        };
        const query = ((((supabase.from("workouts")).update(updates)).eq("id", recordId)).is("deleted_at", defaultOf())).select();
        return query.then((_arg) => (Promise.resolve(_arg)));
    }));
}

/**
 * Update a workout record (for future editing features)
 */
export function updateWorkout(userId, date, updates) {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => {
        const query = (((((supabase.from("workouts")).update(updates)).eq("user_id", userId)).eq("workout_date", date)).is("deleted_at", defaultOf())).select();
        return query.then((_arg) => (Promise.resolve(_arg)));
    }));
}

/**
 * Get workout records for a user with optional date range filtering
 * Get all users' workouts for a date range (no user filter, relies on RLS)
 */
export function getAllWorkouts(startDate, endDate) {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => {
        const query = (((((supabase.from("workouts")).select("*")).gte("workout_date", startDate)).lte("workout_date", endDate)).is("deleted_at", defaultOf())).order("workout_date", {
            ascending: false,
        });
        return query.then((_arg) => {
            const data = _arg.data;
            return (data == null) ? (Promise.resolve([])) : (Promise.resolve(data));
        });
    }));
}

/**
 * Get all users' workouts for a specific date (no user filter)
 */
export function getAllWorkoutsForDate(date) {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => {
        const query = ((((supabase.from("workouts")).select("*")).eq("workout_date", date)).is("deleted_at", defaultOf())).order("created_at", {
            ascending: true,
        });
        return query.then((_arg) => {
            const data = _arg.data;
            return (data == null) ? (Promise.resolve([])) : (Promise.resolve(data));
        });
    }));
}

export function getWorkouts(userId, startDate, endDate) {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => {
        let date;
        let query = (((supabase.from("workouts")).select("*")).eq("user_id", userId)).is("deleted_at", defaultOf());
        return ((startDate == null) ? (Promise.resolve()) : ((date = startDate, (query = (query.gte("workout_date", date)), Promise.resolve())))).then(() => PromiseBuilder__Delay_62FBFDE1(promise, () => {
            let date_1;
            return ((endDate == null) ? (Promise.resolve()) : ((date_1 = endDate, (query = (query.lte("workout_date", date_1)), Promise.resolve())))).then(() => PromiseBuilder__Delay_62FBFDE1(promise, () => {
                query = (query.order("workout_date", {
                    ascending: false,
                }));
                return query.then((_arg) => {
                    const data = _arg.data;
                    return (data == null) ? (Promise.resolve([])) : (Promise.resolve(data));
                });
            }));
        }));
    }));
}

