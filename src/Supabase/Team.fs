module Supabase.Team

open Fable.Core
open Fable.Core.JsInterop
open Supabase.Client
open Supabase.Types

/// Parse raw workout with profile into F# record
let parseWorkoutWithProfile (raw: WorkoutWithProfileRaw) : WorkoutWithProfile =
    let profile =
        if isNull raw.profiles then
            None
        else
            Some {
                id = raw.profiles.id
                email = raw.profiles.email
                display_name = raw.profiles.display_name
                member_id = raw.profiles.member_id
            }
    {
        user_id = raw.user_id
        workout_date = raw.workout_date
        profile = profile
    }

/// Get all team workouts for a date range with profile info
/// Uses Supabase nested select with foreign key join
let getTeamWorkouts (startDate: string) (endDate: string) : JS.Promise<WorkoutWithProfile array> =
    promise {
        // Query workouts with joined profile data via foreign key
        // profiles!workouts_user_id_fkey references the FK relationship
        let query =
            supabase
                ?from("workouts")
                ?select("user_id, workout_date, profiles!workouts_user_id_fkey(id, email, display_name, member_id)")
                ?gte("workout_date", startDate)
                ?lte("workout_date", endDate)
                ?order("workout_date", createObj ["ascending" ==> false])

        let! result = query
        let data = result?data

        if isNull data then
            return [||]
        else
            let rawWorkouts = unbox<WorkoutWithProfileRaw array> data
            return rawWorkouts |> Array.map parseWorkoutWithProfile
    }

/// Get all team member profiles
let getTeamProfiles () : JS.Promise<ProfileRecord array> =
    promise {
        let query =
            supabase
                ?from("profiles")
                ?select("id, email, display_name, member_id")
                ?order("email", createObj ["ascending" ==> true])

        let! result = query
        let data = result?data

        if isNull data then
            return [||]
        else
            return unbox<ProfileRecord array> data
    }

/// Get all team workouts for a specific date (for daily detail view)
let getTeamWorkoutsForDate (date: string) : JS.Promise<WorkoutRecord array> =
    promise {
        let query =
            supabase
                ?from("workouts")
                ?select("*")
                ?eq("workout_date", date)
                ?is("deleted_at", null)
                ?order("created_at", createObj ["ascending" ==> true])

        let! result = query
        let data = result?data

        if isNull data then
            return [||]
        else
            return unbox<WorkoutRecord array> data
    }

/// Group workouts by user and create team member summaries
/// Sorted by workout count descending (most active first)
let groupWorkoutsByUser (workouts: WorkoutWithProfile array) (allProfiles: ProfileRecord array) : TeamMemberSummary array =
    // Create lookup map for profiles
    let profileMap =
        allProfiles
        |> Array.map (fun p -> p.id, p)
        |> Map.ofArray

    // Group workouts by user_id
    let grouped =
        workouts
        |> Array.groupBy (fun w -> w.user_id)
        |> Array.map (fun (userId, userWorkouts) ->
            // Get profile from first workout or from allProfiles
            let profile =
                userWorkouts
                |> Array.tryHead
                |> Option.bind (fun w -> w.profile)
                |> Option.orElse (Map.tryFind userId profileMap)

            let displayName =
                profile
                |> Option.bind (fun p -> p.display_name)
                |> Option.defaultWith (fun () ->
                    profile
                    |> Option.map (fun p -> p.email)
                    |> Option.defaultValue "Unknown"
                )

            let email =
                profile
                |> Option.map (fun p -> p.email)
                |> Option.defaultValue ""

            {
                UserId = userId
                DisplayName = displayName
                Email = email
                WorkoutCount = userWorkouts.Length
                WorkoutDates = userWorkouts |> Array.map (fun w -> w.workout_date)
            }
        )

    // Include profiles with zero workouts
    let usersWithWorkouts = grouped |> Array.map (fun m -> m.UserId) |> Set.ofArray
    let usersWithoutWorkouts =
        allProfiles
        |> Array.filter (fun p -> not (Set.contains p.id usersWithWorkouts))
        |> Array.map (fun p ->
            {
                UserId = p.id
                DisplayName = p.display_name |> Option.defaultValue p.email
                Email = p.email
                WorkoutCount = 0
                WorkoutDates = [||]
            }
        )

    // Combine and sort by workout count descending
    Array.append grouped usersWithoutWorkouts
    |> Array.sortByDescending (fun m -> m.WorkoutCount)
