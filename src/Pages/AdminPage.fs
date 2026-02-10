module Pages.AdminPage

open Feliz
open Fable.Core.JsInterop
open Fable.Core
open Supabase.Admin
open Supabase.Types
open Admin.MemberList
open Admin.MemberActions

type AdminState =
    | Loading
    | NotAdmin
    | Ready of profiles: ProfileRecord array
    | Error of message: string

type DeleteTarget = {
    userId: string
    displayName: string
}

[<ReactComponent>]
let AdminPage () =
    let state, setState = React.useState(Loading)
    let deleteTarget, setDeleteTarget = React.useState<DeleteTarget option>(None)
    let refreshKey, setRefreshKey = React.useState(0)

    // Check admin status and load profiles
    React.useEffect((fun () ->
        promise {
            // First check if user is admin
            let! isAdminResult = isAdmin ()
            if not isAdminResult then
                setState NotAdmin
            else
                // Load all profiles
                let! profilesResult = getAllProfiles ()
                match profilesResult with
                | Result.Ok profiles -> setState (Ready profiles)
                | Result.Error msg -> setState (Error msg)
        } |> Promise.start
    ), [| box refreshKey |])

    // Handle delete click - receives userId and needs to find profile for display name
    let handleDelete (userId: string) =
        match state with
        | Ready profiles ->
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
                    | Ready profiles ->
                        MemberList profiles handleDelete

                    // Delete confirmation modal
                    match deleteTarget with
                    | Some target ->
                        DeleteConfirmModal target.displayName handleConfirmDelete handleCancelDelete
                    | None -> Html.none
                ]
            ]
        ]
    ]
