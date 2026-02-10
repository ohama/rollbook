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
