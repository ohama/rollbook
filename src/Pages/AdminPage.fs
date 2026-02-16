module Pages.AdminPage

open Feliz
open Fable.Core.JsInterop
open Fable.Core
open Supabase.Admin
open Supabase.Audit
open Supabase.Types
open Admin.MemberList
open Admin.MemberActions
open Components.AuditLogList
open Components.AdminRoleManager
open Components.RestoreConfirmModal

type AdminState =
    | Loading
    | NotAdmin
    | Ready of profiles: ProfileRecord array * deletedWorkouts: WorkoutRecord array
    | Error of message: string

type DeleteTarget = {
    userId: string
    displayName: string
}

type RestoreTarget = Components.RestoreConfirmModal.RestoreTarget

[<ReactComponent>]
let AdminPage () =
    let state, setState = React.useState(Loading)
    let deleteTarget, setDeleteTarget = React.useState<DeleteTarget option>(None)
    let restoreTarget, setRestoreTarget = React.useState<RestoreTarget option>(None)
    let refreshKey, setRefreshKey = React.useState(0)

    // Check admin status and load profiles + deleted workouts
    React.useEffect((fun () ->
        promise {
            // First check if user is admin
            let! isAdminResult = isAdmin ()
            if not isAdminResult then
                setState NotAdmin
            else
                // Load profiles and deleted workouts in parallel
                let! profilesResult = getAllProfiles ()
                let! deletedResult = getDeletedWorkouts ()

                match profilesResult, deletedResult with
                | Result.Ok profiles, Result.Ok deleted ->
                    setState (Ready (profiles, deleted))
                | Result.Error msg, _ | _, Result.Error msg ->
                    setState (Error msg)
        } |> Promise.start
    ), [| box refreshKey |])

    // Handle delete click - receives userId and needs to find profile for display name
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
                    setRefreshKey (refreshKey + 1)  // Reload profiles
                | Result.Error msg ->
                    setState (Error (sprintf "삭제 실패: %s" msg))
                    setDeleteTarget None
            } |> Promise.start
        | None -> ()

    let handleCancelDelete () =
        setDeleteTarget None

    // Restore handlers
    let handleRestoreClick (workoutId: int64) (workoutDate: string) =
        setRestoreTarget (Some { workoutId = workoutId; workoutDate = workoutDate })

    let handleRestoreConfirm () =
        setRestoreTarget None
        setRefreshKey (refreshKey + 1)  // Reload data

    let handleRestoreCancel () =
        setRestoreTarget None

    Html.div [
        prop.className "min-h-screen bg-gray-100 p-4"
        prop.children [
            Html.div [
                prop.className "max-w-2xl mx-auto"
                prop.children [
                    // Header
                    Html.h1 [
                        prop.className "text-2xl font-bold mb-6"
                        prop.text "관리자"
                    ]

                    // Content based on state
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
                                Html.p [
                                    prop.className "text-red-500 text-sm mt-2"
                                    prop.text "관리자만 이 페이지에 접근할 수 있습니다."
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
                    | Ready (profiles, deletedWorkouts) ->
                        Html.div [
                            prop.className "space-y-6"
                            prop.children [
                                // Section 1: Member list (existing)
                                MemberList profiles handleDelete

                                // Section 2: Admin role manager (new)
                                AdminRoleManager profiles (fun () -> setRefreshKey (refreshKey + 1))

                                // Section 3: Audit log (new)
                                AuditLogList 20  // Show last 20 changes

                                // Section 4: Deleted workouts (new)
                                Html.div [
                                    prop.className "bg-white rounded-lg shadow p-4"
                                    prop.children [
                                        Html.h2 [
                                            prop.className "text-lg font-semibold mb-4"
                                            prop.text "삭제된 기록"
                                        ]
                                        if deletedWorkouts.Length = 0 then
                                            Html.p [
                                                prop.className "text-gray-500 text-center py-4"
                                                prop.text "삭제된 기록이 없습니다."
                                            ]
                                        else
                                            Html.div [
                                                prop.className "space-y-2"
                                                prop.children [
                                                    for workout in deletedWorkouts do
                                                        Html.div [
                                                            prop.className "flex items-center justify-between py-2 px-3 border rounded"
                                                            prop.children [
                                                                Html.div [
                                                                    Html.span [
                                                                        prop.className "font-medium"
                                                                        prop.text workout.workout_date
                                                                    ]
                                                                    Html.span [
                                                                        prop.className "text-xs text-gray-500 ml-2"
                                                                        prop.text (sprintf "ID: %d" workout.id)
                                                                    ]
                                                                ]
                                                                Html.button [
                                                                    prop.className "px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                                                                    prop.text "복구"
                                                                    prop.onClick (fun _ -> handleRestoreClick workout.id workout.workout_date)
                                                                ]
                                                            ]
                                                        ]
                                                ]
                                            ]
                                    ]
                                ]
                            ]
                        ]

                    // Delete confirmation modal
                    match deleteTarget with
                    | Some target ->
                        DeleteConfirmModal target.displayName handleConfirmDelete handleCancelDelete
                    | None -> Html.none

                    // Restore confirmation modal
                    match restoreTarget with
                    | Some target ->
                        RestoreConfirmModal target handleRestoreConfirm handleRestoreCancel
                    | None -> Html.none
                ]
            ]
        ]
    ]
