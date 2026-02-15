module Supabase.Workouts

open Fable.Core
open Fable.Core.JsInterop
open Supabase.Client
open Supabase.Types

/// Get today's date string in YYYY-MM-DD format (local timezone)
let getTodayDateString () : string =
    let now = System.DateTime.Now
    emitJsExpr now "$0.toLocaleDateString('en-CA')"

/// Get a single workout record for a user and date (first non-deleted)
let getWorkout (userId: string) (date: string) : JS.Promise<WorkoutRecord option> =
    promise {
        let query =
            supabase
                ?from("workouts")
                ?select("*")
                ?eq("user_id", userId)
                ?eq("workout_date", date)
                ?is("deleted_at", null)
                ?limit(1)
        let! result = query
        let data = result?data
        if isNull data then
            return None
        else
            let records = unbox<WorkoutRecord array> data
            if records.Length = 0 then
                return None
            else
                return Some records.[0]
    }

/// Get all non-deleted records for a user and date
let getWorkoutsForDate (userId: string) (date: string) : JS.Promise<WorkoutRecord array> =
    promise {
        let query =
            supabase
                ?from("workouts")
                ?select("*")
                ?eq("user_id", userId)
                ?eq("workout_date", date)
                ?is("deleted_at", null)
                ?order("created_at", createObj ["ascending" ==> true])
        let! result = query
        let data = result?data
        if isNull data then
            return [||]
        else
            return unbox<WorkoutRecord array> data
    }

/// Create a workout record (simple insert, no onConflict)
/// Backward compatible: same signature as old upsertWorkout
let upsertWorkout (userId: string) (date: string) : JS.Promise<WorkoutResponse> =
    promise {
        let record = createObj [
            "user_id" ==> userId
            "workout_date" ==> date
            "record_type" ==> "workout"
        ]
        let query = supabase?from("workouts")?insert(record)?select()
        let! result = query
        return unbox<WorkoutResponse> result
    }

/// Alias for upsertWorkout (Phase 10+ name)
let createWorkout = upsertWorkout

/// Soft-delete workout records for a user and date
/// Transitional: deletes ALL non-deleted records for user+date
/// Phase 10 will update to delete by individual record id
let deleteWorkout (userId: string) (date: string) : JS.Promise<obj> =
    promise {
        let nowIso : string = emitJsExpr () "new Date().toISOString()"
        let updates = createObj [
            "deleted_at" ==> nowIso
        ]
        let query =
            supabase
                ?from("workouts")
                ?update(updates)
                ?eq("user_id", userId)
                ?eq("workout_date", date)
                ?is("deleted_at", null)
        let! result = query
        return result
    }

/// Soft-delete a single workout record by id (Phase 10+)
let deleteWorkoutById (recordId: int) : JS.Promise<obj> =
    promise {
        let nowIso : string = emitJsExpr () "new Date().toISOString()"
        let updates = createObj [
            "deleted_at" ==> nowIso
        ]
        let query =
            supabase
                ?from("workouts")
                ?update(updates)
                ?eq("id", recordId)
        let! result = query
        return result
    }

/// Create a text record for a specific date
let createTextRecord (userId: string) (date: string) (textContent: string) : JS.Promise<WorkoutResponse> =
    promise {
        let record = createObj [
            "user_id" ==> userId
            "workout_date" ==> date
            "record_type" ==> "text"
            "text_content" ==> textContent
        ]
        let query = supabase?from("workouts")?insert(record)?select()
        let! result = query
        return unbox<WorkoutResponse> result
    }

/// Create a photo record for a specific date (with optional text caption)
let createPhotoRecord (userId: string) (date: string) (photoUrl: string) (textContent: string option) : JS.Promise<WorkoutResponse> =
    promise {
        let record = createObj [
            "user_id" ==> userId
            "workout_date" ==> date
            "record_type" ==> "photo"
            "photo_url" ==> photoUrl
            yield! match textContent with
                   | Some text -> [ "text_content" ==> text ]
                   | None -> []
        ]
        let query = supabase?from("workouts")?insert(record)?select()
        let! result = query
        return unbox<WorkoutResponse> result
    }

/// Update a specific workout record by id (for editing text content)
let updateWorkoutById (recordId: int) (textContent: string) : JS.Promise<WorkoutResponse> =
    promise {
        let nowIso : string = emitJsExpr () "new Date().toISOString()"
        let updates = createObj [
            "text_content" ==> textContent
            "updated_at" ==> nowIso
        ]
        let query =
            supabase
                ?from("workouts")
                ?update(updates)
                ?eq("id", recordId)
                ?is("deleted_at", null)
                ?select()
        let! result = query
        return unbox<WorkoutResponse> result
    }

/// Update a workout record (for future editing features)
let updateWorkout (userId: string) (date: string) (updates: obj) : JS.Promise<WorkoutResponse> =
    promise {
        let query =
            supabase
                ?from("workouts")
                ?update(updates)
                ?eq("user_id", userId)
                ?eq("workout_date", date)
                ?is("deleted_at", null)
                ?select()
        let! result = query
        return unbox<WorkoutResponse> result
    }

/// Get workout records for a user with optional date range filtering
let getWorkouts (userId: string) (startDate: string option) (endDate: string option) : JS.Promise<WorkoutRecord array> =
    promise {
        // Start with base query filtering soft-deleted records
        let mutable query = supabase?from("workouts")?select("*")?eq("user_id", userId)?is("deleted_at", null)

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
