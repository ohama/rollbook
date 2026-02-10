module Pages.Dashboard

open Feliz
open Fable.Core.JsInterop
open Supabase.Auth
open Supabase.Types

[<ReactComponent>]
let DashboardPage (user: User) (onLogout: unit -> unit) =
    let loading, setLoading = React.useState(false)

    let handleLogout () =
        setLoading true
        promise {
            let! _ = signOut()
            onLogout()
        } |> Promise.start

    Html.div [
        prop.className "min-h-screen bg-gray-100"
        prop.children [
            // Header
            Html.header [
                prop.className "bg-white shadow-sm"
                prop.children [
                    Html.div [
                        prop.className "max-w-4xl mx-auto px-4 py-4 flex items-center justify-between"
                        prop.children [
                            Html.h1 [
                                prop.className "text-xl font-bold text-indigo-600"
                                prop.text "Rollbook"
                            ]
                            Html.button [
                                prop.onClick (fun _ -> handleLogout())
                                prop.disabled loading
                                prop.className (
                                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors " +
                                    if loading then
                                        "text-gray-400 cursor-not-allowed"
                                    else
                                        "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                                )
                                prop.text (if loading then "로그아웃 중..." else "로그아웃")
                            ]
                        ]
                    ]
                ]
            ]

            // Main content
            Html.main [
                prop.className "max-w-4xl mx-auto px-4 py-8"
                prop.children [
                    // Welcome card
                    Html.div [
                        prop.className "bg-white rounded-2xl shadow-sm p-6 mb-6"
                        prop.children [
                            Html.h2 [
                                prop.className "text-lg font-semibold text-gray-800 mb-2"
                                prop.text "환영합니다!"
                            ]
                            Html.p [
                                prop.className "text-gray-600"
                                prop.children [
                                    Html.text "로그인 이메일: "
                                    Html.span [
                                        prop.className "font-medium"
                                        prop.text (user.email |> Option.defaultValue "N/A")
                                    ]
                                ]
                            ]
                        ]
                    ]

                    // Placeholder for workout logging (Phase 2)
                    Html.div [
                        prop.className "bg-white rounded-2xl shadow-sm p-6 text-center"
                        prop.children [
                            Html.div [
                                prop.className "text-6xl mb-4"
                                prop.text "💪"
                            ]
                            Html.h3 [
                                prop.className "text-lg font-semibold text-gray-800 mb-2"
                                prop.text "운동 기록 준비 중"
                            ]
                            Html.p [
                                prop.className "text-gray-600"
                                prop.text "Phase 2에서 '오늘 운동했다' 원탭 기록 기능이 추가됩니다."
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ]
