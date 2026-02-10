module Pages.ForgotPassword

open Feliz
open Fable.Core.JsInterop
open Browser.Dom
open Components.Layout
open Supabase.Auth

type ForgotPasswordState = {
    email: string
    loading: bool
    error: string option
    success: bool
}

[<ReactComponent>]
let ForgotPasswordPage (onNavigate: string -> unit) =
    let state, setState = React.useState({
        email = ""
        loading = false
        error = None
        success = false
    })

    let handleReset () =
        if state.email.Length = 0 then
            setState { state with error = Some "이메일을 입력해주세요" }
        else
            setState { state with loading = true; error = None }

            promise {
                // Redirect to reset-password page after clicking email link
                let redirectTo = window.location.origin + "/reset-password"
                let! _ = resetPasswordForEmail state.email redirectTo
                setState { state with loading = false; success = true }
            } |> Promise.start

    AuthLayout [
        Html.h2 [
            prop.className "text-xl font-semibold text-gray-800 mb-2"
            prop.text "비밀번호 재설정"
        ]
        Html.p [
            prop.className "text-gray-600 mb-6"
            prop.text "가입하신 이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드립니다."
        ]

        if state.success then
            Html.div [
                Alert "비밀번호 재설정 이메일을 발송했습니다. 이메일을 확인해주세요." "success"
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
                        handleReset()
                    )
                    prop.children [
                        FormInput "이메일" "email" "your@email.com" state.email
                            (fun v -> setState { state with email = v }) None

                        PrimaryButton "재설정 링크 보내기" state.loading handleReset
                    ]
                ]

                Html.div [
                    prop.className "mt-6 text-center"
                    prop.children [
                        LinkButton "로그인으로 돌아가기" (fun () -> onNavigate "login")
                    ]
                ]
            ]
    ]
