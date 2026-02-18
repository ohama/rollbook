module Pages.Landing

open Feliz

[<ReactComponent>]
let LandingPage (onNavigate: string -> unit) =
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

                    // Buttons
                    Html.div [
                        prop.className "w-full max-w-sm"
                        prop.style [ style.marginTop 80 ]
                        prop.children [
                            // 로그인 - big primary button
                            Html.button [
                                prop.className "w-full py-6 px-6 rounded-2xl font-bold text-white text-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all"
                                prop.onClick (fun _ -> onNavigate "login")
                                prop.text "로그인"
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
