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
open Components.RecordItem
open Components.RecordEditModal
open Components.PhotoModal
open Offline.NetworkStatus
open Offline.Queue
open Offline.Types
open Offline.Sync
open Utils.DateHelpers

/// Tab mode for dashboard navigation
type TabMode = Home | Progress | Team | Admin

/// View scope for dashboard content (나 vs 우리)
type ViewScope = Personal | TeamView

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

    // Date navigation state
    let (currentYear, setCurrentYear) = React.useState(System.DateTime.Now.Year)
    let (currentMonth, setCurrentMonth) = React.useState(System.DateTime.Now.Month)

    // View scope state
    let (viewScope, setViewScope) = React.useState(Personal)  // Default to "나"

    // Multi-record state
    let (todayRecords, setTodayRecords) = React.useState<WorkoutRecord array>([||])
    let (recordsLoading, setRecordsLoading) = React.useState(true)
    let (editState, setEditState) = React.useState<RecordEditState>(RecordEditState.Idle)

    // Photo modal state
    let (expandedPhotoUrl, setExpandedPhotoUrl) = React.useState<string option>(None)

    // Load today's records
    React.useEffect((fun () ->
        promise {
            try
                setRecordsLoading true
                let today = getTodayDateString()
                let! records = getWorkoutsForDate user.id today
                setTodayRecords records
                setRecordsLoading false
            with ex ->
                setRecordsLoading false
        } |> Promise.start
    ), [| box refreshKey |])

    // Month navigation functions with year rollover
    let goToNextMonth () =
        if currentMonth = 12 then
            setCurrentYear (currentYear + 1)
            setCurrentMonth 1
        else
            setCurrentMonth (currentMonth + 1)

    let goToPrevMonth () =
        if currentMonth = 1 then
            setCurrentYear (currentYear - 1)
            setCurrentMonth 12
        else
            setCurrentMonth (currentMonth - 1)

    // Create workout record (simple, no modal)
    let handleCreateWorkout () =
        promise {
            try
                let today = getTodayDateString()
                let! _ = createWorkout user.id today
                setRefreshKey (refreshKey + 1)
            with ex -> ()
        } |> Promise.start

    // Save text record (create or update)
    let handleSaveText (text: string) =
        setEditState RecordEditState.Saving
        promise {
            try
                let today = getTodayDateString()
                match editState with
                | EditingText (recordId, _) ->
                    let! _ = updateWorkoutById recordId text
                    ()
                | _ ->
                    let! _ = createTextRecord user.id today text
                    ()
                setEditState RecordEditState.Idle
                setRefreshKey (refreshKey + 1)
            with ex ->
                setEditState (RecordEditState.Error "저장 실패. 다시 시도해주세요.")
        } |> Promise.start

    // Delete record
    let handleDelete (recordId: int) =
        promise {
            try
                // Optimistic: remove from local state
                let filtered = todayRecords |> Array.filter (fun r -> r.id <> recordId)
                setTodayRecords filtered
                let! _ = deleteWorkoutById recordId
                setRefreshKey (refreshKey + 1)
            with ex ->
                // Rollback: re-fetch
                let today = getTodayDateString()
                let! records = getWorkoutsForDate user.id today
                setTodayRecords records
        } |> Promise.start

    // Start editing a text record
    let handleStartEdit (recordId: int) =
        let record = todayRecords |> Array.tryFind (fun r -> r.id = recordId)
        match record with
        | Some r ->
            let currentText = r.text_content |> Option.defaultValue ""
            setEditState (EditingText (recordId, currentText))
        | None -> ()

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
                    // Row 1: Date navigation (single line, horizontal)
                    Html.div [
                        prop.className "flex items-center justify-between bg-white rounded-lg shadow-sm p-4 mb-4"
                        prop.children [
                            Html.button [
                                prop.onClick (fun _ -> goToPrevMonth())
                                prop.className "px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition-colors"
                                prop.text "< 이전"
                            ]
                            Html.h2 [
                                prop.className "text-lg font-semibold text-gray-800"
                                prop.text (formatMonthYear currentYear currentMonth)
                            ]
                            Html.button [
                                prop.onClick (fun _ -> goToNextMonth())
                                prop.className "px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition-colors"
                                prop.text "다음 >"
                            ]
                        ]
                    ]

                    // Row 2: View scope tabs (나/우리)
                    Html.div [
                        prop.className "flex gap-2 mb-6"
                        prop.children [
                            Html.button [
                                prop.onClick (fun _ -> setViewScope Personal)
                                prop.className (
                                    "flex-1 px-6 py-3 rounded-lg font-medium transition-colors " +
                                    if viewScope = Personal then
                                        "bg-indigo-600 text-white"
                                    else
                                        "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                )
                                prop.text "나"
                            ]
                            Html.button [
                                prop.onClick (fun _ -> setViewScope TeamView)
                                prop.className (
                                    "flex-1 px-6 py-3 rounded-lg font-medium transition-colors " +
                                    if viewScope = TeamView then
                                        "bg-indigo-600 text-white"
                                    else
                                        "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                )
                                prop.text "우리"
                            ]
                        ]
                    ]

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
                                // Record creation buttons row
                                Html.div [
                                    prop.className "bg-white rounded-xl shadow-sm p-4 mb-4"
                                    prop.children [
                                        Html.h3 [
                                            prop.className "text-sm font-medium text-gray-500 mb-3"
                                            prop.text "기록 추가"
                                        ]
                                        Html.div [
                                            prop.className "flex gap-2"
                                            prop.children [
                                                // Workout button (instant create, no modal)
                                                Html.button [
                                                    prop.onClick (fun _ -> handleCreateWorkout())
                                                    prop.className "flex-1 px-3 py-3 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200 transition-colors text-center"
                                                    prop.text "운동"
                                                ]
                                                // Text memo button (opens modal)
                                                Html.button [
                                                    prop.onClick (fun _ -> setEditState RecordEditState.CreatingText)
                                                    prop.className "flex-1 px-3 py-3 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-colors text-center"
                                                    prop.text "메모"
                                                ]
                                                // Photo button (uses existing PhotoUploadButton from Components.PhotoUpload)
                                                Html.div [
                                                    prop.className "flex-1"
                                                    prop.children [
                                                        PhotoUploadButton user.id (fun () ->
                                                            setRefreshKey (refreshKey + 1)
                                                        )
                                                    ]
                                                ]
                                            ]
                                        ]
                                    ]
                                ]

                                // Today's records list
                                Html.div [
                                    prop.className "bg-white rounded-xl shadow-sm p-4 mb-4"
                                    prop.children [
                                        Html.h3 [
                                            prop.className "text-sm font-medium text-gray-500 mb-3"
                                            prop.text (sprintf "오늘의 기록 (%d)" todayRecords.Length)
                                        ]
                                        if recordsLoading then
                                            Html.div [
                                                prop.className "text-center text-gray-400 py-4"
                                                prop.text "로딩 중..."
                                            ]
                                        elif todayRecords.Length = 0 then
                                            Html.div [
                                                prop.className "text-center text-gray-400 py-6"
                                                prop.text "아직 기록이 없습니다"
                                            ]
                                        else
                                            Html.div [
                                                prop.className "space-y-2"
                                                prop.children [
                                                    for record in todayRecords do
                                                        RecordItem record user.id handleStartEdit handleDelete (fun url -> setExpandedPhotoUrl (Some url))
                                                ]
                                            ]
                                    ]
                                ]

                                // Photo gallery (keep existing)
                                Html.div [
                                    prop.className "bg-white rounded-xl shadow-sm p-6"
                                    prop.children [
                                        PhotoGallery user.id
                                    ]
                                ]

                                // Photo modal (renders when photo clicked)
                                match expandedPhotoUrl with
                                | Some url -> PhotoModal url (fun () -> setExpandedPhotoUrl None)
                                | None -> Html.none
                            ]
                        ]
                    | Progress ->
                        // Progress tab: switches based on viewScope
                        match viewScope with
                        | Personal ->
                            ProgressViewPage user.id currentYear currentMonth
                        | TeamView ->
                            TeamViewPage currentYear currentMonth
                    | Team ->
                        // OLD Team tab (deprecated, show message)
                        Html.div [
                            prop.className "p-6 text-center text-gray-600"
                            prop.text "팀 뷰는 'Progress' 탭에서 '우리'를 선택하세요"
                        ]
                    | Admin ->
                        AdminPage()

                    // Text record edit modal (renders on top when active)
                    match editState with
                    | RecordEditState.CreatingText ->
                        RecordEditModal None "" false handleSaveText (fun () -> setEditState RecordEditState.Idle)
                    | RecordEditState.EditingText (recordId, currentText) ->
                        RecordEditModal (Some recordId) currentText false handleSaveText (fun () -> setEditState RecordEditState.Idle)
                    | RecordEditState.Saving ->
                        RecordEditModal None "" true (fun _ -> ()) (fun () -> ())
                    | RecordEditState.Error msg ->
                        Html.div [
                            prop.className "fixed bottom-4 left-4 right-4 bg-red-100 text-red-700 p-3 rounded-lg shadow-lg z-50 text-center"
                            prop.children [
                                Html.text msg
                                Html.button [
                                    prop.onClick (fun _ -> setEditState RecordEditState.Idle)
                                    prop.className "ml-2 underline"
                                    prop.text "닫기"
                                ]
                            ]
                        ]
                    | _ -> Html.none
                ]
            ]
        ]
    ]
