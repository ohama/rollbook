import { Union, Record } from "../fable_modules/fable-library-js.4.28.0/Types.js";
import { union_type, float64_type, int32_type, obj_type, array_type, record_type, option_type, string_type } from "../fable_modules/fable-library-js.4.28.0/Reflection.js";

export class WorkoutRecord extends Record {
    constructor(user_id, workout_date, created_at) {
        super();
        this.user_id = user_id;
        this.workout_date = workout_date;
        this.created_at = created_at;
    }
}

export function WorkoutRecord_$reflection() {
    return record_type("Supabase.Types.WorkoutRecord", [], WorkoutRecord, () => [["user_id", string_type], ["workout_date", string_type], ["created_at", option_type(string_type)]]);
}

export class WorkoutResponse extends Record {
    constructor(data, error) {
        super();
        this.data = data;
        this.error = error;
    }
}

export function WorkoutResponse_$reflection() {
    return record_type("Supabase.Types.WorkoutResponse", [], WorkoutResponse, () => [["data", option_type(array_type(WorkoutRecord_$reflection()))], ["error", option_type(obj_type)]]);
}

export class ProfileRecord extends Record {
    constructor(id, email, display_name) {
        super();
        this.id = id;
        this.email = email;
        this.display_name = display_name;
    }
}

export function ProfileRecord_$reflection() {
    return record_type("Supabase.Types.ProfileRecord", [], ProfileRecord, () => [["id", string_type], ["email", string_type], ["display_name", option_type(string_type)]]);
}

export class WorkoutWithProfile extends Record {
    constructor(user_id, workout_date, profile) {
        super();
        this.user_id = user_id;
        this.workout_date = workout_date;
        this.profile = profile;
    }
}

export function WorkoutWithProfile_$reflection() {
    return record_type("Supabase.Types.WorkoutWithProfile", [], WorkoutWithProfile, () => [["user_id", string_type], ["workout_date", string_type], ["profile", option_type(ProfileRecord_$reflection())]]);
}

export class TeamMemberSummary extends Record {
    constructor(UserId, DisplayName, Email, WorkoutCount, WorkoutDates) {
        super();
        this.UserId = UserId;
        this.DisplayName = DisplayName;
        this.Email = Email;
        this.WorkoutCount = (WorkoutCount | 0);
        this.WorkoutDates = WorkoutDates;
    }
}

export function TeamMemberSummary_$reflection() {
    return record_type("Supabase.Types.TeamMemberSummary", [], TeamMemberSummary, () => [["UserId", string_type], ["DisplayName", string_type], ["Email", string_type], ["WorkoutCount", int32_type], ["WorkoutDates", array_type(string_type)]]);
}

export class PhotoUploadState extends Union {
    constructor(tag, fields) {
        super();
        this.tag = tag;
        this.fields = fields;
    }
    cases() {
        return ["Idle", "Compressing", "Uploading", "Success", "Error"];
    }
}

export function PhotoUploadState_$reflection() {
    return union_type("Supabase.Types.PhotoUploadState", [], PhotoUploadState, () => [[], [], [["progress", float64_type]], [["url", string_type]], [["message", string_type]]]);
}

export class StorageUploadResult extends Record {
    constructor(path, error) {
        super();
        this.path = path;
        this.error = error;
    }
}

export function StorageUploadResult_$reflection() {
    return record_type("Supabase.Types.StorageUploadResult", [], StorageUploadResult, () => [["path", option_type(string_type)], ["error", option_type(string_type)]]);
}

export class SignedUrlResult extends Record {
    constructor(signedUrl, error) {
        super();
        this.signedUrl = signedUrl;
        this.error = error;
    }
}

export function SignedUrlResult_$reflection() {
    return record_type("Supabase.Types.SignedUrlResult", [], SignedUrlResult, () => [["signedUrl", option_type(string_type)], ["error", option_type(string_type)]]);
}

export class UserRole extends Record {
    constructor(user_id, role, created_at) {
        super();
        this.user_id = user_id;
        this.role = role;
        this.created_at = created_at;
    }
}

export function UserRole_$reflection() {
    return record_type("Supabase.Types.UserRole", [], UserRole, () => [["user_id", string_type], ["role", string_type], ["created_at", option_type(string_type)]]);
}

export class AdminResult$1 extends Union {
    constructor(tag, fields) {
        super();
        this.tag = tag;
        this.fields = fields;
    }
    cases() {
        return ["Success", "NotAdmin", "Error"];
    }
}

export function AdminResult$1_$reflection(gen0) {
    return union_type("Supabase.Types.AdminResult`1", [gen0], AdminResult$1, () => [[["Item", gen0]], [], [["message", string_type]]]);
}

