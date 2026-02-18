module Pages.Signup

open Feliz
open Fable.Core.JsInterop
open Components.Layout
open Supabase.Auth

type SignupState = {
    email: string
    password: string
    confirmPassword: string
    loading: bool
    error: string option
    success: bool
}

[<ReactComponent>]
let SignupPage (onNavigate: string -> unit) =
    let state, setState = React.useState({
        email = ""
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

    let handleSignup () =
        match validateForm() with
        | Some err ->
            setState { state with error = Some err }
        | None ->
            setState { state with loading = true; error = None }

            promise {
                let! result = signUp state.email state.password None

                match result.error with
                | Some err ->
                    setState { state with loading = false; error = Some err.message }
                | None ->
                    setState { state with loading = false; success = true }
            } |> Promise.start

    AuthLayout [
        Html.h2 [
            prop.className "text-xl font-semibold text-gray-800 mb-6"
            prop.text "회원가입"
        ]

        if state.success then
            Html.div [
                Alert "인증 이메일을 발송했습니다. 이메일을 확인해주세요." "success"
                Html.div [
                    prop.className "text-center mt-4"
                    prop.children [
                        LinkButton "로그인으로 돌아가기" (fun () -> onNavigate "login")
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
                        handleSignup()
                    )
                    prop.children [
                        FormInput "이메일" "email" "your@email.com" state.email
                            (fun v -> setState { state with email = v }) None

                        FormInput "비밀번호" "password" "6자 이상" state.password
                            (fun v -> setState { state with password = v }) None

                        FormInput "비밀번호 확인" "password" "비밀번호 재입력" state.confirmPassword
                            (fun v -> setState { state with confirmPassword = v }) None

                        PrimaryButton "가입하기" state.loading handleSignup
                    ]
                ]

                Html.div [
                    prop.className "mt-6 text-center text-gray-600"
                    prop.children [
                        Html.text "이미 계정이 있으신가요? "
                        LinkButton "로그인" (fun () -> onNavigate "login")
                    ]
                ]

                Html.div [
                    prop.className "mt-3 text-center"
                    prop.children [
                        LinkButton "← 처음으로" (fun () -> onNavigate "landing")
                    ]
                ]
            ]
    ]
