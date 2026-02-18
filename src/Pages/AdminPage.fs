module Pages.AdminPage

open Feliz
open Fable.Core.JsInterop
open Fable.Core
open Supabase.Admin
open Supabase.Workouts
open Supabase.Types
open Admin.MemberList
open Admin.MemberActions
open Utils.DateHelpers

type AdminState =
    | Loading
    | NotAdmin
    | Ready of profiles: ProfileRecord array * workoutCounts: Map<string, int>
    | Error of message: string

type DeleteTarget = {
    userId: string
    displayName: string
}

[<ReactComponent>]
let AdminPage (onBack: unit -> unit) =
    let state, setState = React.useState(Loading)
    let deleteTarget, setDeleteTarget = React.useState<DeleteTarget option>(None)
    let refreshKey, setRefreshKey = React.useState(0)

    // Check admin status and load profiles
    React.useEffect((fun () ->
        promise {
            let! isAdminResult = isAdmin ()
            if not isAdminResult then
                setState NotAdmin
            else
                let! profilesResult = getAllProfiles ()

                // Get this month's workouts for counting
                let now = System.DateTime.Now
                let startDate = formatDateString now.Year now.Month 1
                let endDate = formatDateString now.Year now.Month (getDaysInMonth now.Year now.Month)
                let! monthWorkouts = getAllWorkouts startDate endDate

                // Count unique workout days per user
                let counts =
                    monthWorkouts
                    |> Array.groupBy (fun w -> w.user_id)
                    |> Array.map (fun (uid, records) ->
                        let uniqueDays = records |> Array.map (fun r -> r.workout_date) |> Array.distinct |> Array.length
                        (uid, uniqueDays))
                    |> Map.ofArray

                match profilesResult with
                | Result.Ok profiles ->
                    setState (Ready (profiles, counts))
                | Result.Error msg ->
                    setState (Error msg)
        } |> Promise.start
    ), [| box refreshKey |])

    // Handle delete click
    let handleDelete (userId: string) =
        match state with
        | Ready (profiles, _) ->
            match profiles |> Array.tryFind (fun p -> p.id = userId) with
            | Some profile ->
                let displayName = profile.display_name |> Option.defaultValue profile.email
                setDeleteTarget (Some { userId = userId; displayName = displayName })
            | None -> ()
        | _ -> ()

    let handleConfirmDelete () =
        match deleteTarget with
        | Some target ->
            promise {
                let! result = deleteProfile target.userId
                match result with
                | Result.Ok () ->
                    setDeleteTarget None
                    setRefreshKey (refreshKey + 1)
                | Result.Error msg ->
                    setState (Error (sprintf "삭제 실패: %s" msg))
                    setDeleteTarget None
            } |> Promise.start
        | None -> ()

    let handleCancelDelete () =
        setDeleteTarget None

    Html.div [
        prop.className "min-h-screen bg-gray-100 p-4"
        prop.children [
            Html.div [
                prop.className "max-w-2xl mx-auto"
                prop.children [
                    Html.button [
                        prop.onClick (fun _ -> onBack())
                        prop.className "mb-4 text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                        prop.children [
                            Html.span [ prop.text "<" ]
                            Html.span [ prop.text "돌아가기" ]
                        ]
                    ]
                    Html.h1 [
                        prop.className "text-2xl font-bold mb-6"
                        prop.text "관리자"
                    ]

                    match state with
                    | Loading ->
                        Html.div [
                            prop.className "text-center py-8"
                            prop.children [
                                Html.p [
                                    prop.className "text-gray-500"
                                    prop.text "로딩 중..."
                                ]
                            ]
                        ]
                    | NotAdmin ->
                        Html.div [
                            prop.className "bg-red-50 border border-red-200 rounded-lg p-6 text-center"
                            prop.children [
                                Html.p [
                                    prop.className "text-red-600 font-medium"
                                    prop.text "접근 권한이 없습니다."
                                ]
                            ]
                        ]
                    | Error msg ->
                        Html.div [
                            prop.className "bg-red-50 border border-red-200 rounded-lg p-4"
                            prop.children [
                                Html.p [
                                    prop.className "text-red-600"
                                    prop.text msg
                                ]
                            ]
                        ]
                    | Ready (profiles, workoutCounts) ->
                        MemberList profiles workoutCounts handleDelete

                    // Delete confirmation modal
                    match deleteTarget with
                    | Some target ->
                        DeleteConfirmModal target.displayName handleConfirmDelete handleCancelDelete
                    | None -> Html.none
                ]
            ]
        ]
    ]
