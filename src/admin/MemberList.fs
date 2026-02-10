module Admin.MemberList

open Feliz
open Fable.Core.JsInterop
open Supabase.Types

[<ReactComponent>]
let MemberListItem (profile: ProfileRecord) (onDelete: string -> unit) =
    let displayName =
        profile.display_name
        |> Option.defaultValue profile.email

    Html.div [
        prop.className "flex items-center justify-between p-4 bg-white rounded-lg shadow mb-2"
        prop.children [
            Html.div [
                prop.className "flex-1"
                prop.children [
                    Html.p [
                        prop.className "font-medium text-gray-900"
                        prop.text displayName
                    ]
                    Html.p [
                        prop.className "text-sm text-gray-500"
                        prop.text profile.email
                    ]
                ]
            ]
            Html.button [
                prop.className "px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                prop.text "삭제"
                prop.onClick (fun _ -> onDelete profile.id)
            ]
        ]
    ]

[<ReactComponent>]
let MemberList (profiles: ProfileRecord array) (onDelete: string -> unit) =
    Html.div [
        prop.className "space-y-2"
        prop.children [
            Html.h2 [
                prop.className "text-lg font-semibold mb-4"
                prop.text (sprintf "회원 목록 (%d명)" profiles.Length)
            ]
            if profiles.Length = 0 then
                Html.p [
                    prop.className "text-gray-500 text-center py-4"
                    prop.text "등록된 회원이 없습니다."
                ]
            else
                for profile in profiles do
                    MemberListItem profile onDelete
        ]
    ]
