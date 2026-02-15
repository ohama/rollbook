module Offline.Sync

open Fable.Core
open Fable.Core.JsInterop
open Browser
open Offline.Types
open Offline.Queue
open Offline.NetworkStatus

/// Access to global navigator object
[<Emit("navigator")>]
let private navigator : obj = jsNative

/// Sync tag for Background Sync API
let private syncTag = "sync-workouts"

/// Check if Background Sync is supported
let isBackgroundSyncSupported () : JS.Promise<bool> =
    promise {
        try
            let! registration = navigator?serviceWorker?ready
            return jsIn "sync" registration
        with _ ->
            return false
    }

/// Register Background Sync (Chromium only)
let registerBackgroundSync () : JS.Promise<bool> =
    promise {
        try
            let! registration = navigator?serviceWorker?ready
            if jsIn "sync" registration then
                do! registration?sync?register(syncTag)
                printfn "Background Sync registered: %s" syncTag
                return true
            else
                return false
        with exn ->
            printfn "Background Sync registration failed: %s" exn.Message
            return false
    }

/// Replay a single queued operation
let private replayOperation (operation: QueuedOperation) : JS.Promise<SyncResult> =
    promise {
        try
            // Import Supabase workouts module dynamically to avoid circular dependency
            let supabase = importAll<obj> "../Supabase/Client"
            let client = supabase?supabase

            let opId = Option.defaultValue 0 operation.id

            match operation.operationType with
            | "CreateWorkout" ->
                // Simple insert (no onConflict - v2 schema allows multiple records per day)
                let! response =
                    client
                        ?from("workouts")
                        ?insert(
                            createObj [
                                "user_id" ==> operation.userId
                                "workout_date" ==> operation.workoutDate
                                "record_type" ==> (if isNull (box operation.recordType) then "workout" else operation.recordType)
                                "text_content" ==> operation.textContent
                                "photo_url" ==> operation.photoUrl
                            ]
                        )

                let error = response?error
                match box error with
                | null ->
                    let! _ = dequeue opId
                    return Synced opId
                | _ ->
                    let! _ = incrementRetry opId
                    return SyncFailed (opId, error?message |> unbox<string>)

            | "DeleteWorkout" ->
                // Soft delete: UPDATE deleted_at instead of hard DELETE
                // Transitional: soft-deletes all records for user+date
                // Phase 10 will update to delete by recordId
                let nowIso : string = emitJsExpr () "new Date().toISOString()"
                let! response =
                    client
                        ?from("workouts")
                        ?update(createObj ["deleted_at" ==> nowIso])
                        ?eq("user_id", operation.userId)
                        ?eq("workout_date", operation.workoutDate)
                        ?is("deleted_at", null)

                let error = response?error
                match box error with
                | null ->
                    let! _ = dequeue opId
                    return Synced opId
                | _ ->
                    let! _ = incrementRetry opId
                    return SyncFailed (opId, error?message |> unbox<string>)

            | _ ->
                return SyncFailed (opId, "Unknown operation type")
        with exn ->
            let! _ = incrementRetry (Option.defaultValue 0 operation.id)
            return SyncFailed (Option.defaultValue 0 operation.id, exn.Message)
    }

/// Replay all queued operations
let replayQueue () : JS.Promise<SyncStatus> =
    promise {
        if not (isOnline ()) then
            return Offline
        else
            let! pending = getAllPending ()
            if pending.Length = 0 then
                return SyncComplete (0, 0)
            else
                let mutable synced = 0
                let mutable failed = 0

                for operation in pending do
                    let! result = replayOperation operation
                    match result with
                    | Synced _ -> synced <- synced + 1
                    | SyncFailed _ -> failed <- failed + 1
                    | StillOffline -> ()

                return SyncComplete (synced, failed)
    }

/// Initialize sync with fallback for non-Chromium browsers
let initializeSync () : unit =
    // Set up visibility change listener as fallback
    let cleanup = onVisibilityChange (fun isVisible ->
        if isVisible && isOnline () then
            async {
                let! count = getPendingCount () |> Async.AwaitPromise
                if count > 0 then
                    printfn "Visibility change: attempting to sync %d pending operations" count
                    let! _ = replayQueue () |> Async.AwaitPromise
                    ()
            } |> Async.StartImmediate
    )

    // Set up online listener to sync when connection restored
    let cleanupOnline = onStatusChange (fun isNowOnline ->
        if isNowOnline then
            async {
                let! count = getPendingCount () |> Async.AwaitPromise
                if count > 0 then
                    printfn "Connection restored: syncing %d pending operations" count
                    let! _ = replayQueue () |> Async.AwaitPromise
                    ()
            } |> Async.StartImmediate
    )

    printfn "Sync fallback listeners initialized"
