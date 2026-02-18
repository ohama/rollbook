module Supabase.Admin

open Fable.Core
open Fable.Core.JsInterop
open Supabase.Client
open Supabase.Types

/// Check if current user has admin role
let isAdmin () : JS.Promise<bool> =
    promise {
        try
            let! response =
                supabase
                    ?from("user_roles")
                    ?select("role")
                    ?eq("role", "admin")

            let data = response?data
            if isNull data then
                return false
            else
                let roles = unbox<obj array> data
                return roles.Length > 0
        with _ ->
            return false
    }

/// Get all profiles (admin only - RLS will enforce)
let getAllProfiles () : JS.Promise<Result<ProfileRecord array, string>> =
    promise {
        try
            let! response =
                supabase
                    ?from("profiles")
                    ?select("id, email, display_name, member_id, created_at")
                    ?order("created_at", createObj ["ascending" ==> false])

            let error = response?error
            let data = response?data

            match box error with
            | null ->
                let profiles = unbox<ProfileRecord array> data
                return Result.Ok profiles
            | _ ->
                let errorMsg = error?message |> unbox<string>
                return Result.Error errorMsg
        with exn ->
            return Result.Error exn.Message
    }

/// Delete a profile (admin only - RLS will enforce)
/// This also deletes the auth.users entry via CASCADE
let deleteProfile (userId: string) : JS.Promise<Result<unit, string>> =
    promise {
        try
            // Delete from profiles (CASCADE will handle user_roles)
            let! response =
                supabase
                    ?from("profiles")
                    ?delete()
                    ?eq("id", userId)

            let error = response?error

            match box error with
            | null -> return Result.Ok ()
            | _ ->
                let errorMsg = error?message |> unbox<string>
                return Result.Error errorMsg
        with exn ->
            return Result.Error exn.Message
    }

/// Get admin user count (for dashboard stats)
let getAdminCount () : JS.Promise<int> =
    promise {
        try
            let! response =
                supabase
                    ?from("user_roles")
                    ?select("user_id", createObj ["count" ==> "exact"; "head" ==> true])
                    ?eq("role", "admin")

            let count = response?count
            return unbox<int> count
        with _ ->
            return 0
    }

/// Grant admin role to user (admin-only operation via RLS)
let addAdminRole (userId: string) : JS.Promise<Result<unit, string>> =
    promise {
        try
            // Insert into user_roles (RLS policy checks is_admin())
            let! response =
                supabase
                    ?from("user_roles")
                    ?insert(createObj [
                        "user_id" ==> userId
                        "role" ==> "admin"
                    ])

            let error = response?error
            match box error with
            | null -> return Result.Ok ()
            | _ ->
                let errorMsg = error?message |> unbox<string>
                return Result.Error errorMsg
        with exn ->
            return Result.Error exn.Message
    }

/// Revoke admin role from user (admin-only operation via RLS)
let removeAdminRole (userId: string) : JS.Promise<Result<unit, string>> =
    promise {
        try
            let! response =
                supabase
                    ?from("user_roles")
                    ?delete()
                    ?eq("user_id", userId)
                    ?eq("role", "admin")

            let error = response?error
            match box error with
            | null -> return Result.Ok ()
            | _ ->
                let errorMsg = error?message |> unbox<string>
                return Result.Error errorMsg
        with exn ->
            return Result.Error exn.Message
    }
