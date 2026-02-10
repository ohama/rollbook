module Supabase.Workouts

open Fable.Core
open Fable.Core.JsInterop
open Supabase.Client
open Supabase.Types

/// Get today's date string in YYYY-MM-DD format (local timezone)
let getTodayDateString () : string =
    let now = System.DateTime.Now
    emitJsExpr now "$0.toLocaleDateString('en-CA')"

/// Get a single workout record for a user and date
let getWorkout (userId: string) (date: string) : JS.Promise<WorkoutRecord option> =
    promise {
        let query =
            supabase?from("workouts")?select("*")?eq("user_id", userId)?eq("workout_date", date)?maybeSingle()
        let! result = query
        let data = result?data
        if isNull data then
            return None
        else
            return Some (unbox<WorkoutRecord> data)
    }

/// Upsert a workout record (idempotent - handles double-clicks)
let upsertWorkout (userId: string) (date: string) : JS.Promise<WorkoutResponse> =
    promise {
        let record = createObj [
            "user_id" ==> userId
            "workout_date" ==> date
        ]
        let options = createObj [
            "onConflict" ==> "user_id,workout_date"
        ]
        let query = supabase?from("workouts")?upsert(record, options)?select()
        let! result = query
        return unbox<WorkoutResponse> result
    }

/// Delete a workout record
let deleteWorkout (userId: string) (date: string) : JS.Promise<obj> =
    promise {
        let query =
            supabase?from("workouts")?delete()?eq("user_id", userId)?eq("workout_date", date)
        let! result = query
        return result
    }

/// Update a workout record (for future editing features)
let updateWorkout (userId: string) (date: string) (updates: obj) : JS.Promise<WorkoutResponse> =
    promise {
        let query =
            supabase?from("workouts")?update(updates)?eq("user_id", userId)?eq("workout_date", date)?select()
        let! result = query
        return unbox<WorkoutResponse> result
    }

/// Get workout records for a user with optional date range filtering
let getWorkouts (userId: string) (startDate: string option) (endDate: string option) : JS.Promise<WorkoutRecord array> =
    promise {
        // Start with base query
        let mutable query = supabase?from("workouts")?select("*")?eq("user_id", userId)

        // Add optional date filters
        match startDate with
        | Some date -> query <- query?gte("workout_date", date)
        | None -> ()

        match endDate with
        | Some date -> query <- query?lte("workout_date", date)
        | None -> ()

        // Order by date descending
        query <- query?order("workout_date", createObj ["ascending" ==> false])

        let! result = query
        let data = result?data

        if isNull data then
            return [||]
        else
            return unbox<WorkoutRecord array> data
    }
