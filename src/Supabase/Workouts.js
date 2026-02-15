import { now as now_1 } from "../fable_modules/fable-library-js.4.28.0/Date.js";
import { PromiseBuilder__Delay_62FBFDE1, PromiseBuilder__Run_212F1D4B } from "../fable_modules/Fable.Promise.3.2.0/Promise.fs.js";
import { supabase } from "./Client.js";
import { promise } from "../fable_modules/Fable.Promise.3.2.0/PromiseImpl.fs.js";

/**
 * Get today's date string in YYYY-MM-DD format (local timezone)
 */
export function getTodayDateString() {
    const now = now_1();
    return now.toLocaleDateString('en-CA');
}

/**
 * Get a single workout record for a user and date (returns first non-deleted record)
 */
export function getWorkout(userId, date) {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => {
        const query = (((((supabase.from("workouts")).select("*")).eq("user_id", userId)).eq("workout_date", date)).is("deleted_at", null)).maybeSingle();
        return query.then((_arg) => {
            const data = _arg.data;
            return (data == null) ? (Promise.resolve(undefined)) : (Promise.resolve(data));
        });
    }));
}

/**
 * Create a workout record (simple insert for new schema)
 */
export function createWorkout(userId, date, recordType = "workout", textContent = null, photoUrl = null) {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => {
        const record = {
            user_id: userId,
            workout_date: date,
            record_type: recordType,
            text_content: textContent,
            photo_url: photoUrl,
        };
        const query = ((supabase.from("workouts")).insert(record)).select();
        return query.then((_arg) => (Promise.resolve(_arg)));
    }));
}

/**
 * @deprecated Use createWorkout instead - kept for backward compatibility
 * Upsert a workout record (idempotent - handles double-clicks)
 */
export function upsertWorkout(userId, date) {
    return createWorkout(userId, date, "workout", null, null);
}

/**
 * Soft delete a workout record (sets deleted_at timestamp)
 */
export function deleteWorkout(userId, date) {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => {
        const updates = {
            deleted_at: new Date().toISOString(),
        };
        const query = ((((supabase.from("workouts")).update(updates)).eq("user_id", userId)).eq("workout_date", date)).select();
        return query.then((_arg) => (Promise.resolve(_arg)));
    }));
}

/**
 * Soft delete a specific workout record by ID
 */
export function deleteWorkoutById(workoutId) {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => {
        const updates = {
            deleted_at: new Date().toISOString(),
        };
        const query = (((supabase.from("workouts")).update(updates)).eq("id", workoutId)).select();
        return query.then((_arg) => (Promise.resolve(_arg)));
    }));
}

/**
 * Update a workout record (for future editing features)
 */
export function updateWorkout(userId, date, updates) {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => {
        const query = ((((supabase.from("workouts")).update(updates)).eq("user_id", userId)).eq("workout_date", date)).select();
        return query.then((_arg) => (Promise.resolve(_arg)));
    }));
}

/**
 * Get workout records for a user with optional date range filtering (excludes soft-deleted)
 */
export function getWorkouts(userId, startDate, endDate) {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => {
        let date;
        let query = (((supabase.from("workouts")).select("*")).eq("user_id", userId)).is("deleted_at", null);
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

/**
 * Get all workout records for a specific date (supports multiple records per day)
 */
export function getWorkoutsForDate(userId, date) {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => {
        const query = ((((((supabase.from("workouts")).select("*")).eq("user_id", userId)).eq("workout_date", date)).is("deleted_at", null)).order("created_at", {
            ascending: false,
        }));
        return query.then((_arg) => {
            const data = _arg.data;
            return (data == null) ? (Promise.resolve([])) : (Promise.resolve(data));
        });
    }));
}

