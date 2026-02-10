module Offline.Types

/// Queued operation type
type OperationType =
    | CreateWorkout
    | DeleteWorkout

/// A queued offline operation
type QueuedOperation = {
    id: int option           // Auto-increment ID from IndexedDB
    operationType: string    // "CreateWorkout" | "DeleteWorkout"
    userId: string           // User ID
    workoutDate: string      // YYYY-MM-DD format
    timestamp: float         // Date.now() when queued
    retryCount: int          // Number of sync attempts
}

/// Queue operation result
type QueueResult =
    | Queued of id: int
    | QueueError of message: string

/// Sync result for a single operation
type SyncResult =
    | Synced of operationId: int
    | SyncFailed of operationId: int * message: string
    | StillOffline

/// Overall sync status
type SyncStatus =
    | Idle
    | Syncing of pending: int
    | SyncComplete of synced: int * failed: int
    | Offline
