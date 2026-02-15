module Offline.Types

/// Queued operation type
type OperationType =
    | CreateWorkout
    | DeleteWorkout

/// A queued offline operation (v2 schema)
type QueuedOperation = {
    id: int option           // Auto-increment ID from IndexedDB
    operationType: string    // "CreateWorkout" | "DeleteWorkout"
    recordId: int option     // For update/delete by record id (Phase 10+)
    userId: string           // User ID
    workoutDate: string      // YYYY-MM-DD format
    recordType: string       // "workout" | "text" | "photo"
    textContent: string option // For text records
    photoUrl: string option  // For photo records
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
