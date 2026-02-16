module Components.AuditLogList

open Feliz
open Fable.Core.JsInterop
open Fable.Core
open Supabase.Audit

type AuditListState =
    | Loading
    | Loaded of entries: AuditEntry array
    | Error of message: string

[<ReactComponent>]
let AuditLogList (limit: int) =
    let state, setState = React.useState(Loading)

    // Load audit entries on mount
    React.useEffect((fun () ->
        promise {
            let! result = getRecentChanges limit
            match result with
            | Result.Ok entries -> setState (Loaded entries)
            | Result.Error msg -> setState (Error msg)
        } |> Promise.start
    ), [| box limit |])

    // Helper to format Korean labels for table columns
    let formatOperation op =
        match op with
        | "INSERT" -> "추가"
        | "UPDATE" -> "수정"
        | "DELETE" -> "삭제"
        | _ -> op

    let formatTableName name =
        match name with
        | "workouts" -> "운동 기록"
        | "profiles" -> "프로필"
        | "user_roles" -> "역할"
        | _ -> name

    Html.div [
        prop.className "bg-white rounded-lg shadow p-4"
        prop.children [
            Html.h2 [
                prop.className "text-lg font-semibold mb-4"
                prop.text "최근 수정 내역"
            ]

            match state with
            | Loading ->
                Html.div [
                    prop.className "text-center py-8 text-gray-500"
                    prop.text "로딩 중..."
                ]
            | Error msg ->
                Html.div [
                    prop.className "bg-red-50 border border-red-200 rounded p-4 text-red-600"
                    prop.text (sprintf "오류: %s" msg)
                ]
            | Loaded entries when entries.Length = 0 ->
                Html.div [
                    prop.className "text-center py-8 text-gray-500"
                    prop.text "수정 내역이 없습니다."
                ]
            | Loaded entries ->
                Html.div [
                    prop.className "overflow-x-auto"
                    prop.children [
                        Html.table [
                            prop.className "w-full text-sm"
                            prop.children [
                                Html.thead [
                                    Html.tr [
                                        prop.className "border-b"
                                        prop.children [
                                            Html.th [
                                                prop.className "text-left py-2 px-2 font-medium"
                                                prop.text "시간"
                                            ]
                                            Html.th [
                                                prop.className "text-left py-2 px-2 font-medium"
                                                prop.text "작업"
                                            ]
                                            Html.th [
                                                prop.className "text-left py-2 px-2 font-medium"
                                                prop.text "대상"
                                            ]
                                            Html.th [
                                                prop.className "text-left py-2 px-2 font-medium"
                                                prop.text "사용자"
                                            ]
                                        ]
                                    ]
                                ]
                                Html.tbody [
                                    for entry in entries do
                                        Html.tr [
                                            prop.className "border-b hover:bg-gray-50"
                                            prop.children [
                                                Html.td [
                                                    prop.className "py-2 px-2"
                                                    // Format timestamp: "2026-02-16T..." -> "02/16 14:30"
                                                    prop.text (entry.ts.Substring(5, 11))
                                                ]
                                                Html.td [
                                                    prop.className "py-2 px-2"
                                                    prop.text (formatOperation entry.op)
                                                ]
                                                Html.td [
                                                    prop.className "py-2 px-2"
                                                    prop.text (formatTableName entry.table_name)
                                                ]
                                                Html.td [
                                                    prop.className "py-2 px-2"
                                                    prop.text (entry.user_email |> Option.defaultValue "시스템")
                                                ]
                                            ]
                                        ]
                                ]
                            ]
                        ]
                    ]
                ]
        ]
    ]
