module Pages.Dashboard

open Feliz
open Fable.Core.JsInterop
open Supabase.Auth
open Supabase.Types
open Supabase.Workouts
open Pages.ProgressView
open Pages.TeamView
open Pages.AdminPage
open Components.PhotoUpload
open Components.PhotoGallery
open Offline.NetworkStatus
open Offline.Queue
open Offline.Types
open Offline.Sync

/// Tab mode for dashboard navigation
type TabMode = Home | Progress | Team | Admin

[<ReactComponent>]
let WorkoutToggle (userId: string) (refreshKey: int) =
    let (hasWorkedOut, setHasWorkedOut) = React.useState(false)
    let (loading, setLoading) = React.useState(true)
    let (error, setError) = React.useState<string option>(None)

    // Load initial state on mount AND when refreshKey changes
    React.useEffect((fun () ->
        promise {
            try
                setLoading true
                let today = getTodayDateString()
                let! workout = getWorkout userId today
                setHasWorkedOut (Option.isSome workout)
                setLoading false
            with ex ->
                setError (Some "운동 기록을 불러올 수 없습니다")
                setLoading false
        } |> Promise.start
    ), [| box refreshKey |])

    let handleToggle () =
        if not loading then
            setLoading true
            setError None

            let today = getTodayDateString()
            let newState = not hasWorkedOut

            // Check if online or offline
            if isOnline () then
                // Online: direct API call
                promise {
                    try
                        if hasWorkedOut then
                            let! _ = deleteWorkout userId today
                            ()
                        else
                            let! _ = upsertWorkout userId today
                            ()

                        setHasWorkedOut newState
                        setLoading false
                    with ex ->
                        setError (Some "저장 실패. 다시 시도해주세요.")
                        setLoading false
                } |> Promise.start
            else
                // Offline: queue for later sync
                promise {
                    try
                        let operationType =
                            if hasWorkedOut then DeleteWorkout else CreateWorkout
                        let! result = enqueue operationType userId today
                        match result with
                        | Queued _ ->
                            // Optimistically update UI
                            setHasWorkedOut newState
                            setLoading false
                            // Try to register background sync
                            let! _ = registerBackgroundSync ()
                            ()
                        | QueueError msg ->
                            setError (Some msg)
                            setLoading false
                    with ex ->
                        setError (Some "저장 실패. 다시 시도해주세요.")
                        setLoading false
                } |> Promise.start

    Html.div [
        prop.className "flex flex-col items-center gap-6 p-8"
        prop.children [
            // Large emoji button (visual indicator)
            Html.button [
                prop.onClick (fun _ -> handleToggle())
                prop.disabled loading
                prop.className (
                    "text-8xl transition-all duration-200 " +
                    if loading then "opacity-50 cursor-wait"
                    elif hasWorkedOut then "scale-110"
                    else "hover:scale-105"
                )
                prop.text (if hasWorkedOut then "💪" else "⭕")
            ]

            // Text button (main interaction)
            Html.button [
                prop.onClick (fun _ -> handleToggle())
                prop.disabled loading
                prop.className (
                    "px-8 py-4 rounded-xl text-xl font-semibold transition-all " +
                    if loading then
                        "bg-gray-300 text-gray-500 cursor-wait"
                    elif hasWorkedOut then
                        "bg-green-600 text-white hover:bg-green-700 active:scale-95"
                    else
                        "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95"
                )
                prop.text (
                    if loading then "..."
                    elif hasWorkedOut then "운동 완료!"
                    else "오늘 운동했다"
                )
            ]

            // Error message
            match error with
            | Some msg ->
                Html.p [
                    prop.className "text-sm text-red-600"
                    prop.text msg
                ]
            | None -> Html.none
        ]
    ]

[<ReactComponent>]
let DashboardPage (user: User) (onLogout: unit -> unit) =
    let loading, setLoading = React.useState(false)
    let (activeTab, setActiveTab) = React.useState(Home)
    let (refreshKey, setRefreshKey) = React.useState(0)

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
                    // Tab navigation
                    Html.div [
                        prop.className "flex gap-2 mb-6"
                        prop.children [
                            Html.button [
                                prop.onClick (fun _ -> setActiveTab Home)
                                prop.className (
                                    "px-6 py-3 rounded-lg font-medium transition-colors " +
                                    if activeTab = Home then
                                        "bg-indigo-600 text-white"
                                    else
                                        "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                )
                                prop.text "홈"
                            ]
                            Html.button [
                                prop.onClick (fun _ -> setActiveTab Progress)
                                prop.className (
                                    "px-6 py-3 rounded-lg font-medium transition-colors " +
                                    if activeTab = Progress then
                                        "bg-indigo-600 text-white"
                                    else
                                        "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                )
                                prop.text "내 기록"
                            ]
                            Html.button [
                                prop.onClick (fun _ -> setActiveTab Team)
                                prop.className (
                                    "px-6 py-3 rounded-lg font-medium transition-colors " +
                                    if activeTab = Team then
                                        "bg-indigo-600 text-white"
                                    else
                                        "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                )
                                prop.text "팀"
                            ]
                            Html.button [
                                prop.onClick (fun _ -> setActiveTab Admin)
                                prop.className (
                                    "px-6 py-3 rounded-lg font-medium transition-colors " +
                                    if activeTab = Admin then
                                        "bg-indigo-600 text-white"
                                    else
                                        "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                )
                                prop.text "관리자"
                            ]
                        ]
                    ]

                    // Conditional content based on active tab
                    match activeTab with
                    | Home ->
                        Html.div [
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

                                // Workout toggle (with refresh key)
                                Html.div [
                                    prop.className "bg-white rounded-2xl shadow-sm p-6 text-center mb-6"
                                    prop.children [
                                        WorkoutToggle user.id refreshKey
                                    ]
                                ]

                                // Photo upload (NEW)
                                Html.div [
                                    prop.className "bg-white rounded-2xl shadow-sm p-6 mb-6"
                                    prop.children [
                                        Html.h3 [
                                            prop.className "text-lg font-semibold text-gray-800 mb-4"
                                            prop.text "사진으로 운동 기록"
                                        ]
                                        Html.p [
                                            prop.className "text-sm text-gray-500 mb-4"
                                            prop.text "사진을 올리면 자동으로 오늘 운동 기록이 생성됩니다"
                                        ]
                                        PhotoUploadButton user.id (fun () ->
                                            // Increment refresh key to trigger re-fetch
                                            setRefreshKey (refreshKey + 1)
                                        )
                                    ]
                                ]

                                // Photo gallery (NEW)
                                Html.div [
                                    prop.className "bg-white rounded-2xl shadow-sm p-6"
                                    prop.children [
                                        PhotoGallery user.id
                                    ]
                                ]
                            ]
                        ]
                    | Progress ->
                        ProgressViewPage user.id
                    | Team ->
                        TeamViewPage()
                    | Admin ->
                        AdminPage()
                ]
            ]
        ]
    ]
