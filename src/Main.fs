module Main

open Feliz
open Browser.Dom
open Supabase.Auth
open Supabase.Types
open Pages.Login
open Pages.Signup
open Pages.ForgotPassword
open Pages.ResetPassword
open Pages.Dashboard

/// Application auth state
type AuthState =
    | Loading
    | Anonymous
    | Authenticated of User

/// Current page for simple routing
type Page =
    | LoginPage
    | SignupPage
    | ForgotPasswordPage
    | ResetPasswordPage

/// Application state
type AppState = {
    authState: AuthState
    currentPage: Page
}

[<ReactComponent>]
let App () =
    let state, setState = React.useState({
        authState = Loading
        currentPage = LoginPage
    })

    // Subscribe to auth state changes on mount
    React.useEffectOnce(fun () ->
        // Check for password recovery mode (from email link)
        let hash = window.location.hash
        if hash.Contains("type=recovery") then
            setState { state with currentPage = ResetPasswordPage }

        // Subscribe to auth changes
        let unsubscribe = onAuthStateChange (fun event session ->
            match event with
            | SignedIn | TokenRefreshed | InitialSession ->
                match session with
                | Some s ->
                    setState { state with authState = Authenticated s.user }
                | None ->
                    setState { state with authState = Anonymous }
            | SignedOut ->
                setState { state with authState = Anonymous; currentPage = LoginPage }
            | PasswordRecovery ->
                setState { state with currentPage = ResetPasswordPage }
            | UserUpdated ->
                match session with
                | Some s ->
                    setState { state with authState = Authenticated s.user }
                | None -> ()
        )

        // Cleanup on unmount
        { new System.IDisposable with
            member _.Dispose() = unsubscribe() }
    )

    // Navigation helper
    let navigateTo (page: string) =
        let newPage =
            match page with
            | "signup" -> SignupPage
            | "forgot-password" -> ForgotPasswordPage
            | "reset-password" -> ResetPasswordPage
            | _ -> LoginPage
        setState { state with currentPage = newPage }

    // Handle successful login
    let onLoginSuccess () =
        // Auth state change will handle the redirect via onAuthStateChange
        ()

    // Handle logout
    let onLogout () =
        setState { state with authState = Anonymous; currentPage = LoginPage }

    // Render based on auth state
    match state.authState with
    | Loading ->
        Html.div [
            prop.className "min-h-screen bg-gray-100 flex items-center justify-center"
            prop.children [
                Html.div [
                    prop.className "text-center"
                    prop.children [
                        Html.div [
                            prop.className "animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"
                        ]
                        Html.p [
                            prop.className "text-gray-600"
                            prop.text "로딩 중..."
                        ]
                    ]
                ]
            ]
        ]

    | Anonymous ->
        match state.currentPage with
        | LoginPage -> Pages.Login.LoginPage navigateTo onLoginSuccess
        | SignupPage -> Pages.Signup.SignupPage navigateTo
        | ForgotPasswordPage -> Pages.ForgotPassword.ForgotPasswordPage navigateTo
        | ResetPasswordPage -> Pages.ResetPassword.ResetPasswordPage navigateTo

    | Authenticated user ->
        Pages.Dashboard.DashboardPage user onLogout

// Mount the app
let root = ReactDOM.createRoot(document.getElementById "app")
root.render(App())
