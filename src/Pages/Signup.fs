module Pages.Signup

open Feliz
open Fable.Core.JsInterop
open Components.Layout
open Supabase.Auth

type SignupState = {
    memberId: string
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
        memberId = ""
        email = ""
        password = ""
        confirmPassword = ""
        loading = false
        error = None
        success = false
    })

    let validateForm () =
        if state.memberId.Length < 3 then
            Some "아이디는 3자 이상이어야 합니다"
        elif state.password.Length < 6 then
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
                let! result = signUp state.memberId state.email state.password None

                match result.error with
                | Some err ->
                    setState { state with loading = false; error = Some err.message }
                | None ->
                    setState { state with loading = false; success = true }
            } |> Promise.start

    AuthLayout [
        Html.div [ prop.className "h-8" ]

        Html.h2 [
            prop.className "text-2xl font-semibold text-gray-800 mb-6 text-center"
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
                        Html.div [ prop.className "h-4" ]

                        FormInput "아이디" "text" "영문, 숫자 3자 이상" state.memberId
                            (fun v -> setState { state with memberId = v }) None

                        Html.div [ prop.className "h-4" ]

                        FormInput "이메일" "email" "your@email.com" state.email
                            (fun v -> setState { state with email = v }) None

                        Html.div [ prop.className "h-4" ]

                        FormInput "비밀번호 입력" "password" "6자 이상" state.password
                            (fun v -> setState { state with password = v }) None

                        Html.div [ prop.className "h-4" ]

                        FormInput "비밀번호 확인" "password" "비밀번호 재입력" state.confirmPassword
                            (fun v -> setState { state with confirmPassword = v }) None

                        Html.div [ prop.className "h-4" ]

                        PrimaryButton "가입하기" state.loading handleSignup
                    ]
                ]
            ]

        Html.div [ prop.className "h-6" ]

        Html.div [
            prop.className "text-center"
            prop.children [
                Html.button [
                    prop.type' "button"
                    prop.onClick (fun _ -> onNavigate "landing")
                    prop.className "text-indigo-600 hover:text-indigo-800 text-base font-medium"
                    prop.text "← 처음으로"
                ]
            ]
        ]
    ]
