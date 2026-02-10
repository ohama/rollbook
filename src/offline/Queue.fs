module Offline.Queue

open Fable.Core
open Fable.Core.JsInterop
open Offline.Types

/// Database name and version
let private dbName = "rollbook-offline"
let private dbVersion = 1
let private storeName = "queue"

/// Import idb library
[<Import("openDB", from="idb")>]
let private openDB: string -> int -> obj -> JS.Promise<obj> = jsNative

/// Get or create the database
let private getDb () : JS.Promise<obj> =
    let upgradeConfig =
        createObj [
            "upgrade" ==> fun (db: obj) ->
                // Create queue store with auto-increment key
                if not (db?objectStoreNames?contains(storeName)) then
                    db?createObjectStore(storeName, createObj [
                        "keyPath" ==> "id"
                        "autoIncrement" ==> true
                    ]) |> ignore
        ]
    openDB dbName dbVersion upgradeConfig

/// Enqueue a workout operation for offline sync
let enqueue (operationType: OperationType) (userId: string) (workoutDate: string) : JS.Promise<QueueResult> =
    promise {
        try
            let! db = getDb ()
            let operation = {
                id = None
                operationType =
                    match operationType with
                    | CreateWorkout -> "CreateWorkout"
                    | DeleteWorkout -> "DeleteWorkout"
                userId = userId
                workoutDate = workoutDate
                timestamp = JS.Constructors.Date.now()
                retryCount = 0
            }
            let! id = db?add(storeName, operation)
            return Queued (unbox<int> id)
        with exn ->
            return QueueError exn.Message
    }

/// Get all pending operations
let getAllPending () : JS.Promise<QueuedOperation array> =
    promise {
        try
            let! db = getDb ()
            let! items = db?getAll(storeName)
            return unbox<QueuedOperation array> items
        with _ ->
            return [||]
    }

/// Remove an operation from the queue (after successful sync)
let dequeue (operationId: int) : JS.Promise<bool> =
    promise {
        try
            let! db = getDb ()
            do! db?delete(storeName, operationId)
            return true
        with _ ->
            return false
    }

/// Update retry count for a failed operation
let incrementRetry (operationId: int) : JS.Promise<bool> =
    promise {
        try
            let! db = getDb ()
            let! operation = db?get(storeName, operationId)
            match box operation with
            | null -> return false
            | _ ->
                let updated =
                    createObj [
                        "id" ==> operationId
                        "operationType" ==> operation?operationType
                        "userId" ==> operation?userId
                        "workoutDate" ==> operation?workoutDate
                        "timestamp" ==> operation?timestamp
                        "retryCount" ==> (unbox<int> operation?retryCount + 1)
                    ]
                do! db?put(storeName, updated)
                return true
        with _ ->
            return false
    }

/// Get count of pending operations
let getPendingCount () : JS.Promise<int> =
    promise {
        try
            let! db = getDb ()
            let! count = db?count(storeName)
            return unbox<int> count
        with _ ->
            return 0
    }

/// Clear all queued operations (use with caution)
let clear () : JS.Promise<bool> =
    promise {
        try
            let! db = getDb ()
            do! db?clear(storeName)
            return true
        with _ ->
            return false
    }
