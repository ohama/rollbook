module Admin.MemberList

open Feliz
open Fable.Core.JsInterop
open Supabase.Types

[<ReactComponent>]
let MemberListItem (profile: ProfileRecord) (workoutCount: int) (onDelete: string -> unit) =
    Html.div [
        prop.className "flex items-center justify-between p-4 bg-white rounded-lg shadow mb-2"
        prop.children [
            Html.div [
                prop.className "flex-1 min-w-0"
                prop.children [
                    Html.div [
                        prop.className "flex items-center gap-2"
                        prop.children [
                            Html.span [
                                prop.className "font-bold text-gray-900"
                                prop.text (sprintf "%s(%d)" profile.member_id workoutCount)
                            ]
                            Html.span [
                                prop.className "text-sm text-gray-400"
                                prop.text profile.email
                            ]
                        ]
                    ]
                ]
            ]
            if profile.member_id <> "root" then
                Html.button [
                    prop.className "ml-2 px-3 py-1.5 text-sm text-red-600 hover:text-white hover:bg-red-500 border border-red-300 rounded-lg transition-colors"
                    prop.text "탈퇴"
                    prop.onClick (fun _ -> onDelete profile.id)
                ]
        ]
    ]

[<ReactComponent>]
let MemberList (profiles: ProfileRecord array) (workoutCounts: Map<string, int>) (onDelete: string -> unit) =
    Html.div [
        prop.className "bg-white rounded-lg shadow p-4"
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
                Html.div [
                    prop.className "space-y-2"
                    prop.children [
                        for profile in profiles do
                            let count = Map.tryFind profile.id workoutCounts |> Option.defaultValue 0
                            MemberListItem profile count onDelete
                    ]
                ]
        ]
    ]
