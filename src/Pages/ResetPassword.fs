module Pages.ResetPassword

open Feliz
open Fable.Core.JsInterop
open Components.Layout
open Supabase.Auth

type ResetPasswordState = {
    password: string
    confirmPassword: string
    loading: bool
    error: string option
    success: bool
}

[<ReactComponent>]
let ResetPasswordPage (onNavigate: string -> unit) =
    let state, setState = React.useState({
        password = ""
        confirmPassword = ""
        loading = false
        error = None
        success = false
    })

    let validateForm () =
        if state.password.Length < 6 then
            Some "비밀번호는 6자 이상이어야 합니다"
        elif state.password <> state.confirmPassword then
            Some "비밀번호가 일치하지 않습니다"
        else
            None

    let handleUpdate () =
        match validateForm() with
        | Some err ->
            setState { state with error = Some err }
        | None ->
            setState { state with loading = true; error = None }

            promise {
                let! result = updatePassword state.password

                match result.error with
                | Some err ->
                    setState { state with loading = false; error = Some err.message }
                | None ->
                    setState { state with loading = false; success = true }
            } |> Promise.start

    AuthLayout [
        Html.h2 [
            prop.className "text-xl font-semibold text-gray-800 mb-2"
            prop.text "새 비밀번호 설정"
        ]
        Html.p [
            prop.className "text-gray-600 mb-6"
            prop.text "새로운 비밀번호를 입력해주세요."
        ]

        if state.success then
            Html.div [
                Alert "비밀번호가 변경되었습니다." "success"
                Html.div [
                    prop.className "text-center mt-4"
                    prop.children [
                        LinkButton "로그인하기" (fun () -> onNavigate "login")
                    ]
                ]
            ]
        else
            Html.div [
                match state.error with
                | Some msg -> Alert msg "error"
                | None -> Html.none

                Html.form [
                    prop.onSubmit (fun e ->
                        e.preventDefault()
                        handleUpdate()
                    )
                    prop.children [
                        FormInput "새 비밀번호" "password" "6자 이상" state.password
                            (fun v -> setState { state with password = v }) None

                        FormInput "비밀번호 확인" "password" "비밀번호 재입력" state.confirmPassword
                            (fun v -> setState { state with confirmPassword = v }) None

                        PrimaryButton "비밀번호 변경" state.loading handleUpdate
                    ]
                ]
            ]
    ]
