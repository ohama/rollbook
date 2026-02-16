module Components.AdminRoleManager

open Feliz
open Fable.Core.JsInterop
open Fable.Core
open Supabase.Admin
open Supabase.Types

type RoleAction =
    | GrantingRole of userId: string
    | RevokingRole of userId: string
    | Idle

[<ReactComponent>]
let AdminRoleManager (profiles: ProfileRecord array) (onRoleChanged: unit -> unit) =
    let actionState, setActionState = React.useState(Idle)

    let handleGrantAdmin userId =
        setActionState (GrantingRole userId)
        promise {
            let! result = addAdminRole userId
            match result with
            | Result.Ok () ->
                setActionState Idle
                onRoleChanged ()  // Trigger parent refresh
            | Result.Error msg ->
                Browser.Dom.window.alert(sprintf "관리자 지정 실패: %s" msg)
                setActionState Idle
        } |> Promise.start

    let handleRevokeAdmin userId =
        setActionState (RevokingRole userId)
        promise {
            let! result = removeAdminRole userId
            match result with
            | Result.Ok () ->
                setActionState Idle
                onRoleChanged ()  // Trigger parent refresh
            | Result.Error msg ->
                Browser.Dom.window.alert(sprintf "관리자 제거 실패: %s" msg)
                setActionState Idle
        } |> Promise.start

    Html.div [
        prop.className "bg-white rounded-lg shadow p-4"
        prop.children [
            Html.h2 [
                prop.className "text-lg font-semibold mb-4"
                prop.text "관리자 역할 관리"
            ]
            Html.div [
                prop.className "space-y-2"
                prop.children [
                    for profile in profiles do
                        Html.div [
                            prop.className "flex items-center justify-between py-2 px-3 border rounded hover:bg-gray-50"
                            prop.children [
                                Html.div [
                                    Html.span [
                                        prop.className "font-medium"
                                        prop.text (profile.display_name |> Option.defaultValue profile.email)
                                    ]
                                    Html.span [
                                        prop.className "text-xs text-gray-500 ml-2"
                                        prop.text profile.email
                                    ]
                                ]
                                Html.div [
                                    prop.className "flex gap-2"
                                    prop.children [
                                        // Grant admin button
                                        Html.button [
                                            prop.className "px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
                                            prop.text "관리자 지정"
                                            prop.disabled (match actionState with GrantingRole id when id = profile.id -> true | _ -> false)
                                            prop.onClick (fun _ -> handleGrantAdmin profile.id)
                                        ]
                                        // Revoke admin button
                                        Html.button [
                                            prop.className "px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300"
                                            prop.text "관리자 제거"
                                            prop.disabled (match actionState with RevokingRole id when id = profile.id -> true | _ -> false)
                                            prop.onClick (fun _ -> handleRevokeAdmin profile.id)
                                        ]
                                    ]
                                ]
                            ]
                        ]
                ]
            ]
        ]
    ]
