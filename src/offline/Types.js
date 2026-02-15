import { Record, Union } from "../fable_modules/fable-library-js.4.28.0/Types.js";
import { record_type, float64_type, string_type, option_type, int32_type, union_type } from "../fable_modules/fable-library-js.4.28.0/Reflection.js";

export class OperationType extends Union {
    constructor(tag, fields) {
        super();
        this.tag = tag;
        this.fields = fields;
    }
    cases() {
        return ["CreateWorkout", "DeleteWorkout"];
    }
}

export function OperationType_$reflection() {
    return union_type("Offline.Types.OperationType", [], OperationType, () => [[], []]);
}

export class QueuedOperation extends Record {
    constructor(id, operationType, recordId, userId, workoutDate, recordType, textContent, photoUrl, timestamp, retryCount) {
        super();
        this.id = id;
        this.operationType = operationType;
        this.recordId = recordId;
        this.userId = userId;
        this.workoutDate = workoutDate;
        this.recordType = recordType;
        this.textContent = textContent;
        this.photoUrl = photoUrl;
        this.timestamp = timestamp;
        this.retryCount = (retryCount | 0);
    }
}

export function QueuedOperation_$reflection() {
    return record_type("Offline.Types.QueuedOperation", [], QueuedOperation, () => [["id", option_type(int32_type)], ["operationType", string_type], ["recordId", option_type(int32_type)], ["userId", string_type], ["workoutDate", string_type], ["recordType", string_type], ["textContent", option_type(string_type)], ["photoUrl", option_type(string_type)], ["timestamp", float64_type], ["retryCount", int32_type]]);
}

export class QueueResult extends Union {
    constructor(tag, fields) {
        super();
        this.tag = tag;
        this.fields = fields;
    }
    cases() {
        return ["Queued", "QueueError"];
    }
}

export function QueueResult_$reflection() {
    return union_type("Offline.Types.QueueResult", [], QueueResult, () => [[["id", int32_type]], [["message", string_type]]]);
}

export class SyncResult extends Union {
    constructor(tag, fields) {
        super();
        this.tag = tag;
        this.fields = fields;
    }
    cases() {
        return ["Synced", "SyncFailed", "StillOffline"];
    }
}

export function SyncResult_$reflection() {
    return union_type("Offline.Types.SyncResult", [], SyncResult, () => [[["operationId", int32_type]], [["operationId", int32_type], ["message", string_type]], []]);
}

export class SyncStatus extends Union {
    constructor(tag, fields) {
        super();
        this.tag = tag;
        this.fields = fields;
    }
    cases() {
        return ["Idle", "Syncing", "SyncComplete", "Offline"];
    }
}

export function SyncStatus_$reflection() {
    return union_type("Offline.Types.SyncStatus", [], SyncStatus, () => [[], [["pending", int32_type]], [["synced", int32_type], ["failed", int32_type]], []]);
}

