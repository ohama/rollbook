module Pages.ProfilePage

open Feliz
open Fable.Core.JsInterop
open Fable.Core
open Supabase.Auth
open Supabase.Types

[<ReactComponent>]
let ProfilePage (user: User) (memberId: string) (onLogout: unit -> unit) (onBack: unit -> unit) =
    let (currentPassword, setCurrentPassword) = React.useState("")
    let (newPassword, setNewPassword) = React.useState("")
    let (confirmPassword, setConfirmPassword) = React.useState("")
    let (passwordMsg, setPasswordMsg) = React.useState<(string * bool) option>(None) // (message, isError)
    let (passwordLoading, setPasswordLoading) = React.useState(false)

    let msgKey = sprintf "rollbook-default-msg-%s" user.id
    let goalKey = sprintf "rollbook-monthly-goal-%s" user.id

    let (defaultMsg, setDefaultMsg) = React.useState(
        let stored = Browser.Dom.window.localStorage.getItem(msgKey)
        if isNull stored then "운동했어" else stored
    )
    let (defaultMsgSaved, setDefaultMsgSaved) = React.useState(false)

    let (monthlyGoal, setMonthlyGoal) = React.useState(
        let stored = Browser.Dom.window.localStorage.getItem(goalKey)
        if isNull stored then "20" else stored
    )
    let (goalSaved, setGoalSaved) = React.useState(false)

    let (deleteConfirm, setDeleteConfirm) = React.useState(false)
    let (deleteLoading, setDeleteLoading) = React.useState(false)
    let (deleteMsg, setDeleteMsg) = React.useState<string option>(None)

    let handleChangePassword () =
        if newPassword.Length < 6 then
            setPasswordMsg (Some ("비밀번호는 6자 이상이어야 합니다", true))
        elif newPassword <> confirmPassword then
            setPasswordMsg (Some ("새 비밀번호가 일치하지 않습니다", true))
        else
            setPasswordLoading true
            setPasswordMsg None
            promise {
                try
                    // Verify current password by re-signing in
                    let email = user.email |> Option.defaultValue ""
                    let! signInResult = signInWithPassword email currentPassword
                    match signInResult.error with
                    | Some err ->
                        setPasswordMsg (Some ("현재 비밀번호가 올바르지 않습니다", true))
                        setPasswordLoading false
                    | None ->
                        let! result = updatePassword newPassword
                        match result.error with
                        | Some err ->
                            setPasswordMsg (Some (err.message, true))
                            setPasswordLoading false
                        | None ->
                            setPasswordMsg (Some ("비밀번호가 변경되었습니다", false))
                            setCurrentPassword ""
                            setNewPassword ""
                            setConfirmPassword ""
                            setPasswordLoading false
                with ex ->
                    setPasswordMsg (Some ("오류가 발생했습니다", true))
                    setPasswordLoading false
            } |> Promise.start

    let handleDeleteAccount () =
        setDeleteLoading true
        setDeleteMsg None
        promise {
            try
                let! result = deleteAccount user.id
                match result with
                | Ok () ->
                    onLogout()
                | Result.Error msg ->
                    setDeleteMsg (Some (sprintf "탈퇴 실패: %s" msg))
                    setDeleteLoading false
            with ex ->
                setDeleteMsg (Some "탈퇴 중 오류가 발생했습니다")
                setDeleteLoading false
        } |> Promise.start

    Html.div [
        prop.className "max-w-md mx-auto"
        prop.children [
            // Back button
            Html.button [
                prop.onClick (fun _ -> onBack())
                prop.className "mb-4 text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                prop.children [
                    Html.span [ prop.text "<" ]
                    Html.span [ prop.text "돌아가기" ]
                ]
            ]

            // Profile info card
            Html.div [
                prop.className "bg-white rounded-xl shadow-sm p-6 mb-4"
                prop.children [
                    Html.h2 [
                        prop.className "text-lg font-bold text-gray-800 mb-4"
                        prop.text "내 정보"
                    ]
                    Html.div [
                        prop.className "space-y-3"
                        prop.children [
                            Html.div [
                                prop.className "flex justify-between"
                                prop.children [
                                    Html.span [ prop.className "text-gray-500"; prop.text "아이디" ]
                                    Html.span [ prop.className "font-medium text-gray-800"; prop.text memberId ]
                                ]
                            ]
                            Html.div [
                                prop.className "flex justify-between"
                                prop.children [
                                    Html.span [ prop.className "text-gray-500"; prop.text "이메일" ]
                                    Html.span [ prop.className "font-medium text-gray-800"; prop.text (user.email |> Option.defaultValue "-") ]
                                ]
                            ]
                            Html.div [
                                prop.className "flex justify-between"
                                prop.children [
                                    Html.span [ prop.className "text-gray-500"; prop.text "가입일" ]
                                    Html.span [
                                        prop.className "font-medium text-gray-800"
                                        prop.text (
                                            let raw = user.created_at
                                            if raw.Length >= 10 then raw.Substring(0, 10) else raw
                                        )
                                    ]
                                ]
                            ]
                        ]
                    ]
                ]
            ]

            // Default message + Goal card
            Html.div [
                prop.className "bg-white rounded-xl shadow-sm p-6 mb-4"
                prop.children [
                    Html.h2 [
                        prop.className "text-lg font-bold text-gray-800 mb-4"
                        prop.text "기본 입력 메시지"
                    ]
                    Html.p [
                        prop.className "text-sm text-gray-500 mb-2"
                        prop.text "날짜를 더블 클릭하면 이 메시지가 자동으로 입력됩니다"
                    ]
                    // Template variables explanation
                    Html.div [
                        prop.className "text-xs text-gray-400 mb-3 space-y-0.5"
                        prop.children [
                            Html.div [ prop.text "%DATE  - 선택한 날짜 (예: 2월 18일)" ]
                            Html.div [ prop.text "%COUNT - 이번 달 운동한 일수" ]
                            Html.div [ prop.text "%GOAL  - 이번 달 목표" ]
                        ]
                    ]
                    Html.div [
                        prop.className "flex gap-2"
                        prop.children [
                            Html.input [
                                prop.className "flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                prop.value defaultMsg
                                prop.placeholder "예: %DATE 운동 완료! (%COUNT/%GOAL)"
                                prop.onChange (fun (v: string) ->
                                    setDefaultMsg v
                                    setDefaultMsgSaved false
                                )
                            ]
                            Html.button [
                                prop.onClick (fun _ ->
                                    Browser.Dom.window.localStorage.setItem(msgKey, defaultMsg)
                                    setDefaultMsgSaved true
                                )
                                prop.className "px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                                prop.text "저장"
                            ]
                        ]
                    ]
                    if defaultMsgSaved then
                        Html.p [
                            prop.className "text-sm text-green-600 mt-2"
                            prop.text "저장되었습니다"
                        ]

                    // Monthly goal
                    Html.div [
                        prop.className "mt-5 pt-4 border-t"
                        prop.children [
                            Html.h3 [
                                prop.className "text-base font-bold text-gray-800 mb-2"
                                prop.text "이번 달 목표"
                            ]
                            Html.div [
                                prop.className "flex items-center gap-2"
                                prop.children [
                                    Html.input [
                                        prop.className "w-20 px-3 py-2 border rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                        prop.type' "number"
                                        prop.value monthlyGoal
                                        prop.onChange (fun (v: string) ->
                                            setMonthlyGoal v
                                            setGoalSaved false
                                        )
                                    ]
                                    Html.span [
                                        prop.className "text-gray-600"
                                        prop.text "일"
                                    ]
                                    Html.button [
                                        prop.onClick (fun _ ->
                                            Browser.Dom.window.localStorage.setItem(goalKey, monthlyGoal)
                                            setGoalSaved true
                                        )
                                        prop.className "px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                                        prop.text "저장"
                                    ]
                                    if goalSaved then
                                        Html.span [
                                            prop.className "text-sm text-green-600"
                                            prop.text "저장됨"
                                        ]
                                ]
                            ]
                        ]
                    ]
                ]
            ]

            // Password change card
            Html.div [
                prop.className "bg-white rounded-xl shadow-sm p-6 mb-4"
                prop.children [
                    Html.h2 [
                        prop.className "text-lg font-bold text-gray-800 mb-4"
                        prop.text "비밀번호 변경"
                    ]
                    Html.div [
                        prop.className "space-y-3"
                        prop.children [
                            Html.input [
                                prop.type' "password"
                                prop.placeholder "현재 비밀번호"
                                prop.value currentPassword
                                prop.onChange (fun (v: string) -> setCurrentPassword v)
                                prop.className "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            ]
                            Html.input [
                                prop.type' "password"
                                prop.placeholder "새 비밀번호"
                                prop.value newPassword
                                prop.onChange (fun (v: string) -> setNewPassword v)
                                prop.className "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            ]
                            Html.input [
                                prop.type' "password"
                                prop.placeholder "새 비밀번호 확인"
                                prop.value confirmPassword
                                prop.onChange (fun (v: string) -> setConfirmPassword v)
                                prop.className "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            ]
                            // Message
                            match passwordMsg with
                            | Some (msg, isError) ->
                                Html.p [
                                    prop.className (if isError then "text-sm text-red-600" else "text-sm text-green-600")
                                    prop.text msg
                                ]
                            | None -> Html.none
                            Html.button [
                                prop.onClick (fun _ -> handleChangePassword())
                                prop.disabled passwordLoading
                                prop.className "w-full py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                prop.text (if passwordLoading then "변경 중..." else "비밀번호 변경")
                            ]
                        ]
                    ]
                ]
            ]

            // Account deletion card (hidden for root)
            if memberId <> "root" then
                Html.div [
                    prop.className "bg-white rounded-xl shadow-sm p-6"
                    prop.children [
                        Html.h2 [
                            prop.className "text-lg font-bold text-red-600 mb-4"
                            prop.text "회원 탈퇴"
                        ]
                        if not deleteConfirm then
                            Html.button [
                                prop.onClick (fun _ -> setDeleteConfirm true)
                                prop.className "w-full py-2 border-2 border-red-400 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors"
                                prop.text "탈퇴하기"
                            ]
                        else
                            Html.div [
                                prop.className "space-y-3"
                                prop.children [
                                    Html.p [
                                        prop.className "text-sm text-gray-600"
                                        prop.text "정말 탈퇴하시겠습니까? 모든 데이터가 삭제되며 복구할 수 없습니다."
                                    ]
                                    match deleteMsg with
                                    | Some msg ->
                                        Html.p [
                                            prop.className "text-sm text-red-600"
                                            prop.text msg
                                        ]
                                    | None -> Html.none
                                    Html.div [
                                        prop.className "flex gap-2"
                                        prop.children [
                                            Html.button [
                                                prop.onClick (fun _ -> setDeleteConfirm false)
                                                prop.className "flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                                                prop.text "취소"
                                            ]
                                            Html.button [
                                                prop.onClick (fun _ -> handleDeleteAccount())
                                                prop.disabled deleteLoading
                                                prop.className "flex-1 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                                                prop.text (if deleteLoading then "처리 중..." else "탈퇴 확인")
                                            ]
                                        ]
                                    ]
                                ]
                            ]
                    ]
                ]
        ]
    ]
