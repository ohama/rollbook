module Supabase.Audit

open Fable.Core
open Fable.Core.JsInterop
open Supabase.Client
open Supabase.Types

/// Audit log entry from audit.record_version table
/// Display type for UI consumption - keeps JSONB fields as obj for dynamic access
type AuditEntry = {
    id: int64
    ts: string                  // ISO timestamp
    op: string                  // "INSERT" | "UPDATE" | "DELETE"
    user_email: string option   // Email of user who made change
    table_name: string          // Table that was changed
    record: obj                 // Current/new record snapshot (JSONB)
    old_record: obj option      // Previous record snapshot for UPDATE/DELETE (JSONB)
}

/// Get recent audit log entries (admin only - RLS enforced)
/// Returns most recent changes first (ordered by timestamp descending)
let getRecentChanges (limit: int) : JS.Promise<Result<AuditEntry array, string>> =
    promise {
        try
            let! response =
                supabase
                    ?schema("audit")
                    ?from("record_version")
                    ?select("id, ts, op, user_email, table_name, record, old_record")
                    ?order("ts", createObj ["ascending" ==> false])
                    ?limit(limit)

            let error = response?error
            let data = response?data

            match box error with
            | null ->
                let entries = unbox<AuditEntry array> data
                return Result.Ok entries
            | _ ->
                let errorMsg = error?message |> unbox<string>
                return Result.Error errorMsg
        with exn ->
            return Result.Error exn.Message
    }

/// Get soft-deleted workout records (admin only - RLS allows viewing deleted_at IS NOT NULL)
/// Returns deleted records ordered by deletion time (most recent first)
let getDeletedWorkouts () : JS.Promise<Result<WorkoutRecord array, string>> =
    promise {
        try
            let! response =
                supabase
                    ?from("workouts")
                    ?select("*")
                    ?not("deleted_at", "is", null)
                    ?order("deleted_at", createObj ["ascending" ==> false])

            let error = response?error
            let data = response?data

            match box error with
            | null ->
                let workouts = unbox<WorkoutRecord array> data
                return Result.Ok workouts
            | _ ->
                let errorMsg = error?message |> unbox<string>
                return Result.Error errorMsg
        with exn ->
            return Result.Error exn.Message
    }

/// Restore a soft-deleted workout record by setting deleted_at to NULL
/// Admin only - allows un-deleting records (ADM-08)
let restoreWorkout (workoutId: int64) : JS.Promise<Result<unit, string>> =
    promise {
        try
            let! response =
                supabase
                    ?from("workouts")
                    ?update(createObj ["deleted_at" ==> null])
                    ?eq("id", workoutId)

            let error = response?error

            match box error with
            | null -> return Result.Ok ()
            | _ ->
                let errorMsg = error?message |> unbox<string>
                return Result.Error errorMsg
        with exn ->
            return Result.Error exn.Message
    }

/// Get audit log entries filtered by table name
/// Useful for viewing history of specific table (e.g., only workouts changes)
let getChangesByTable (tableName: string) (limit: int) : JS.Promise<Result<AuditEntry array, string>> =
    promise {
        try
            let! response =
                supabase
                    ?schema("audit")
                    ?from("record_version")
                    ?select("id, ts, op, user_email, table_name, record, old_record")
                    ?eq("table_name", tableName)
                    ?order("ts", createObj ["ascending" ==> false])
                    ?limit(limit)

            let error = response?error
            let data = response?data

            match box error with
            | null ->
                let entries = unbox<AuditEntry array> data
                return Result.Ok entries
            | _ ->
                let errorMsg = error?message |> unbox<string>
                return Result.Error errorMsg
        with exn ->
            return Result.Error exn.Message
    }

/// Get audit log entries for a specific user (by user_id)
/// Useful for viewing user activity history
let getChangesByUser (userId: string) (limit: int) : JS.Promise<Result<AuditEntry array, string>> =
    promise {
        try
            let! response =
                supabase
                    ?schema("audit")
                    ?from("record_version")
                    ?select("id, ts, op, user_email, table_name, record, old_record")
                    ?eq("user_id", userId)
                    ?order("ts", createObj ["ascending" ==> false])
                    ?limit(limit)

            let error = response?error
            let data = response?data

            match box error with
            | null ->
                let entries = unbox<AuditEntry array> data
                return Result.Ok entries
            | _ ->
                let errorMsg = error?message |> unbox<string>
                return Result.Error errorMsg
        with exn ->
            return Result.Error exn.Message
    }
