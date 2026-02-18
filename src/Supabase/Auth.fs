module Supabase.Auth

open Fable.Core
open Fable.Core.JsInterop
open Supabase.Types
open Supabase.Client

/// Sign up with member_id, email and password
let signUp (memberId: string) (email: string) (password: string) (redirectTo: string option) : JS.Promise<AuthResponse> =
    let data = createObj [ "member_id" ==> memberId ]
    let options =
        match redirectTo with
        | Some url -> createObj [ "emailRedirectTo" ==> url; "data" ==> data ]
        | None -> createObj [ "data" ==> data ]

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

/// Get email by member_id using RPC
let getEmailByMemberId (memberId: string) : JS.Promise<string option> =
    promise {
        let! result = supabase?rpc("get_email_by_member_id", createObj [ "p_member_id" ==> memberId ])
        let error = result?error
        let data = result?data
        match box error with
        | null ->
            match box data with
            | null -> return None
            | _ -> return Some (unbox<string> data)
        | _ -> return None
    }

/// Sign in with member_id and password
let signInWithMemberId (memberId: string) (password: string) : JS.Promise<AuthResponse> =
    promise {
        let! emailOpt = getEmailByMemberId memberId
        match emailOpt with
        | Some email ->
            return! signInWithPassword email password
        | None ->
            // Return a fake error response - create via JS interop
            let errorResponse = emitJsExpr () """({ data: { user: null, session: null }, error: { message: "존재하지 않는 아이디입니다", status: 400 } })"""
            return unbox<AuthResponse> errorResponse
    }

/// Delete user account (profiles, workouts, user_roles, then auth user via RPC)
let deleteAccount (userId: string) : JS.Promise<Result<unit, string>> =
    promise {
        try
            // Delete workouts
            let! _ = supabase?from("workouts")?delete()?eq("user_id", userId)
            // Delete user_roles
            let! _ = supabase?from("user_roles")?delete()?eq("user_id", userId)
            // Delete profile
            let! _ = supabase?from("profiles")?delete()?eq("id", userId)
            // Delete auth user via RPC (requires server-side function)
            let! result = supabase?rpc("delete_own_account")
            let error = result?error
            match box error with
            | null -> return Ok ()
            | _ -> return Result.Error (string error?message)
        with ex ->
            return Result.Error ex.Message
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
