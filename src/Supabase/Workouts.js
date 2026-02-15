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
 * Get a single workout record for a user and date
 */
export function getWorkout(userId, date) {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => {
        const query = ((((supabase.from("workouts")).select("*")).eq("user_id", userId)).eq("workout_date", date)).maybeSingle();
        return query.then((_arg) => {
            const result = _arg;
            const data = result.data;
            return (data == null) ? (Promise.resolve(undefined)) : (Promise.resolve(data));
        });
    }));
}

/**
 * Upsert a workout record (idempotent - handles double-clicks)
 */
export function upsertWorkout(userId, date) {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => {
        const record = {
            user_id: userId,
            workout_date: date,
        };
        const options = {
            onConflict: "user_id,workout_date",
        };
        const query = ((supabase.from("workouts")).upsert(record, options)).select();
        return query.then((_arg) => {
            const result = _arg;
            return Promise.resolve(result);
        });
    }));
}

/**
 * Delete a workout record
 */
export function deleteWorkout(userId, date) {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => {
        const query = (((supabase.from("workouts")).delete()).eq("user_id", userId)).eq("workout_date", date);
        return query.then((_arg) => {
            const result = _arg;
            return Promise.resolve(result);
        });
    }));
}

/**
 * Update a workout record (for future editing features)
 */
export function updateWorkout(userId, date, updates) {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => {
        const query = ((((supabase.from("workouts")).update(updates)).eq("user_id", userId)).eq("workout_date", date)).select();
        return query.then((_arg) => {
            const result = _arg;
            return Promise.resolve(result);
        });
    }));
}

/**
 * Get workout records for a user with optional date range filtering
 */
export function getWorkouts(userId, startDate, endDate) {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => {
        let date;
        let query = ((supabase.from("workouts")).select("*")).eq("user_id", userId);
        return ((startDate == null) ? (Promise.resolve()) : ((date = startDate, (query = (query.gte("workout_date", date)), Promise.resolve())))).then(() => PromiseBuilder__Delay_62FBFDE1(promise, () => {
            let date_1;
            return ((endDate == null) ? (Promise.resolve()) : ((date_1 = endDate, (query = (query.lte("workout_date", date_1)), Promise.resolve())))).then(() => PromiseBuilder__Delay_62FBFDE1(promise, () => {
                query = (query.order("workout_date", {
                    ascending: false,
                }));
                return query.then((_arg) => {
                    const result = _arg;
                    const data = result.data;
                    return (data == null) ? (Promise.resolve([])) : (Promise.resolve(data));
                });
            }));
        }));
    }));
}

