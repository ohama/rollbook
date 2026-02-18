module Pages.Landing

open Feliz
open Fable.Core.JsInterop
open Supabase.Auth

[<ReactComponent>]
let LandingPage (onNavigate: string -> unit) (onLoginSuccess: unit -> unit) =
    let memberId, setMemberId = React.useState("")
    let password, setPassword = React.useState("")
    let loading, setLoading = React.useState(false)
    let error, setError = React.useState(None: string option)

    let handleLogin () =
        if memberId = "" || password = "" then
            setError (Some "아이디와 비밀번호를 입력하세요")
        else
            setLoading true
            setError None
            promise {
                let! result = signInWithMemberId memberId password
                match result.error with
                | Some err ->
                    setLoading false
                    setError (Some err.message)
                | None ->
                    setLoading false
                    onLoginSuccess()
            } |> Promise.start
    Html.div [
        prop.className "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col"
        prop.children [
            // 2x2 Sports photo grid
            Html.div [
                prop.className "grid grid-cols-2 w-full"
                prop.children [
                    Html.img [
                        prop.src "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&h=300&fit=crop"
                        prop.alt "달리기"
                        prop.className "w-full h-36 sm:h-48 object-cover"
                    ]
                    Html.img [
                        prop.src "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop"
                        prop.alt "헬스"
                        prop.className "w-full h-36 sm:h-48 object-cover"
                    ]
                    Html.img [
                        prop.src "https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?w=400&h=300&fit=crop"
                        prop.alt "축구"
                        prop.className "w-full h-36 sm:h-48 object-cover"
                    ]
                    Html.img [
                        prop.src "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=400&h=300&fit=crop"
                        prop.alt "수영"
                        prop.className "w-full h-36 sm:h-48 object-cover"
                    ]
                ]
            ]

            // Branding + Buttons
            Html.div [
                prop.className "flex flex-col items-center px-6 pb-8"
                prop.style [ style.paddingTop 60 ]
                prop.children [
                    Html.h1 [
                        prop.className "text-4xl font-bold text-indigo-600"
                        prop.text "픽제주 헬스 클럽"
                    ]

                    // Login form + Buttons
                    Html.div [
                        prop.className "w-full max-w-sm"
                        prop.style [ style.marginTop 40 ]
                        prop.children [
                            // Error message
                            match error with
                            | Some msg ->
                                Html.div [
                                    prop.className "mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center"
                                    prop.text msg
                                ]
                            | None -> Html.none

                            // ID input
                            Html.input [
                                prop.className "w-2/3 mx-auto block px-4 py-4 rounded-xl border border-gray-300 text-lg text-center focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                                prop.type' "text"
                                prop.placeholder "아이디"
                                prop.value memberId
                                prop.onChange setMemberId
                            ]

                            Html.div [ prop.className "h-4" ]

                            // Password input
                            Html.input [
                                prop.className "w-2/3 mx-auto block px-4 py-4 rounded-xl border border-gray-300 text-lg text-center focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                                prop.type' "password"
                                prop.placeholder "비밀번호"
                                prop.value password
                                prop.onChange setPassword
                                prop.onKeyDown (fun e -> if e.key = "Enter" then handleLogin())
                            ]

                            Html.div [ prop.className "h-4" ]

                            // 로그인 - big primary button
                            Html.button [
                                prop.className "w-full py-6 px-6 rounded-2xl font-bold text-white text-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50"
                                prop.disabled loading
                                prop.onClick (fun _ -> handleLogin())
                                prop.text (if loading then "로그인 중..." else "로그인")
                            ]

                            // 가입 + 패스워드 분실 - smaller buttons in a row
                            Html.div [
                                prop.className "flex gap-4"
                                prop.style [ style.marginTop 20 ]
                                prop.children [
                                    Html.button [
                                        prop.className "flex-1 py-5 px-4 rounded-2xl font-semibold text-indigo-600 text-lg border-2 border-indigo-300 hover:bg-indigo-50 active:scale-[0.98] transition-all"
                                        prop.onClick (fun _ -> onNavigate "signup")
                                        prop.text "회원가입"
                                    ]
                                    Html.button [
                                        prop.className "flex-1 py-5 px-4 rounded-2xl font-semibold text-gray-500 text-lg hover:text-gray-700 hover:bg-gray-100 active:scale-[0.98] transition-all"
                                        prop.onClick (fun _ -> onNavigate "forgot-password")
                                        prop.text "비밀번호 분실"
                                    ]
                                ]
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ]
