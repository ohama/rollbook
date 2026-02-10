module Supabase.Auth

open Fable.Core
open Fable.Core.JsInterop
open Supabase.Types
open Supabase.Client

/// Sign up with email and password
let signUp (email: string) (password: string) (redirectTo: string option) : JS.Promise<AuthResponse> =
    let options =
        match redirectTo with
        | Some url -> createObj [ "emailRedirectTo" ==> url ]
        | None -> createObj []

    promise {
        let! result = supabase.auth?signUp(createObj [
            "email" ==> email
            "password" ==> password
            "options" ==> options
        ])
        return unbox<AuthResponse> result
    }

/// Sign in with email and password
let signInWithPassword (email: string) (password: string) : JS.Promise<AuthResponse> =
    promise {
        let! result = supabase.auth?signInWithPassword(createObj [
            "email" ==> email
            "password" ==> password
        ])
        return unbox<AuthResponse> result
    }

/// Sign out the current user
let signOut () : JS.Promise<obj> =
    promise {
        let! result = supabase.auth?signOut()
        return result
    }

/// Request password reset email
let resetPasswordForEmail (email: string) (redirectTo: string) : JS.Promise<obj> =
    promise {
        let! result = supabase.auth?resetPasswordForEmail(
            email,
            createObj [ "redirectTo" ==> redirectTo ]
        )
        return result
    }

/// Update user password (after clicking reset link)
let updatePassword (newPassword: string) : JS.Promise<AuthResponse> =
    promise {
        let! result = supabase.auth?updateUser(createObj [
            "password" ==> newPassword
        ])
        return unbox<AuthResponse> result
    }

/// Get current session (may be null if not logged in)
let getSession () : JS.Promise<AuthResponse> =
    promise {
        let! result = supabase.auth?getSession()
        return unbox<AuthResponse> result
    }

/// Subscribe to auth state changes
/// Returns an unsubscribe function
let onAuthStateChange (callback: AuthChangeEvent -> Session option -> unit) : (unit -> unit) =
    let subscription =
        supabase.auth?onAuthStateChange(fun event session ->
            let typedEvent = unbox<AuthChangeEvent> event
            let typedSession =
                if isNull (box session) then None
                else Some (unbox<Session> session)
            callback typedEvent typedSession
        )

    // Return unsubscribe function
    fun () ->
        subscription?data?subscription?unsubscribe() |> ignore
