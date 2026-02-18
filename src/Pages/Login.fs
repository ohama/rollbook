module Pages.Login

open Feliz
open Fable.Core.JsInterop
open Components.Layout
open Supabase.Auth

type LoginState = {
    email: string
    password: string
    loading: bool
    error: string option
}

[<ReactComponent>]
let LoginPage (onNavigate: string -> unit) (onLoginSuccess: unit -> unit) =
    let state, setState = React.useState({
        email = ""
        password = ""
        loading = false
        error = None
    })

    let handleLogin () =
        setState { state with loading = true; error = None }

        promise {
            let! result = signInWithPassword state.email state.password

            match result.error with
            | Some err ->
                setState { state with loading = false; error = Some err.message }
            | None ->
                setState { state with loading = false }
                onLoginSuccess()
        } |> Promise.start

    AuthLayout [
        Html.h2 [
            prop.className "text-xl font-semibold text-gray-800 mb-6"
            prop.text "로그인"
        ]

        match state.error with
        | Some msg -> Alert msg "error"
        | None -> Html.none

        Html.form [
            prop.onSubmit (fun e ->
                e.preventDefault()
                handleLogin()
            )
            prop.children [
                FormInput "이메일" "email" "your@email.com" state.email
                    (fun v -> setState { state with email = v }) None

                FormInput "비밀번호" "password" "" state.password
                    (fun v -> setState { state with password = v }) None

                Html.div [
                    prop.className "flex justify-end mb-4"
                    prop.children [
                        LinkButton "비밀번호를 잊으셨나요?" (fun () -> onNavigate "forgot-password")
                    ]
                ]

                PrimaryButton "로그인" state.loading handleLogin
            ]
        ]

        Html.div [
            prop.className "mt-6 text-center text-gray-600"
            prop.children [
                Html.text "계정이 없으신가요? "
                LinkButton "회원가입" (fun () -> onNavigate "signup")
            ]
        ]

        Html.div [
            prop.className "mt-3 text-center"
            prop.children [
                LinkButton "← 처음으로" (fun () -> onNavigate "landing")
            ]
        ]
    ]
