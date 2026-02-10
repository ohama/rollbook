module Supabase.Types

open Fable.Core

/// User object returned by Supabase Auth
[<AllowNullLiteral>]
type User =
    abstract id: string
    abstract email: string option
    abstract created_at: string
    abstract updated_at: string
    abstract email_confirmed_at: string option

/// Session object containing user and tokens
[<AllowNullLiteral>]
type Session =
    abstract access_token: string
    abstract refresh_token: string
    abstract expires_in: int
    abstract expires_at: int option
    abstract user: User

/// Auth error from Supabase
[<AllowNullLiteral>]
type AuthError =
    abstract message: string
    abstract status: int option

/// Response from auth operations
[<AllowNullLiteral>]
type AuthResponse =
    abstract data: AuthResponseData option
    abstract error: AuthError option

and [<AllowNullLiteral>] AuthResponseData =
    abstract user: User option
    abstract session: Session option

/// Auth state change event types
[<StringEnum>]
type AuthChangeEvent =
    | [<CompiledName("SIGNED_IN")>] SignedIn
    | [<CompiledName("SIGNED_OUT")>] SignedOut
    | [<CompiledName("TOKEN_REFRESHED")>] TokenRefreshed
    | [<CompiledName("USER_UPDATED")>] UserUpdated
    | [<CompiledName("PASSWORD_RECOVERY")>] PasswordRecovery
    | [<CompiledName("INITIAL_SESSION")>] InitialSession

/// Workout record from workouts table
type WorkoutRecord = {
    user_id: string
    workout_date: string  // YYYY-MM-DD format (ISO date string)
    created_at: string option
}

/// Response from workout operations
type WorkoutResponse = {
    data: WorkoutRecord array option
    error: obj option
}

/// Profile record from profiles table
type ProfileRecord = {
    id: string           // user_id (UUID)
    email: string
    display_name: string option
}

/// Nested profile data from Supabase join (uses "profiles" key from foreign key join)
[<AllowNullLiteral>]
type NestedProfile =
    abstract id: string
    abstract email: string
    abstract display_name: string option

/// Workout record with nested profile from join query
[<AllowNullLiteral>]
type WorkoutWithProfileRaw =
    abstract user_id: string
    abstract workout_date: string
    abstract profiles: NestedProfile

/// Parsed workout with profile for F# consumption
type WorkoutWithProfile = {
    user_id: string
    workout_date: string
    profile: ProfileRecord option
}

/// Team member summary for display (aggregated data)
type TeamMemberSummary = {
    UserId: string
    DisplayName: string
    Email: string
    WorkoutCount: int
    WorkoutDates: string array  // YYYY-MM-DD format
}

/// Photo upload progress state
type PhotoUploadState =
    | Idle
    | Compressing
    | Uploading of progress: float  // 0.0 to 100.0
    | Success of url: string
    | Error of message: string

/// Storage upload result
type StorageUploadResult = {
    path: string option
    error: string option
}

/// Signed URL result
type SignedUrlResult = {
    signedUrl: string option
    error: string option
}

/// User role record from user_roles table
type UserRole = {
    user_id: string
    role: string  // "admin" | "member"
    created_at: string option
}

/// Admin operations result
type AdminResult<'T> =
    | Success of 'T
    | NotAdmin
    | Error of message: string
