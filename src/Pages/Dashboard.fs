module Pages.Dashboard

open Feliz
open Fable.Core.JsInterop
open Fable.Core
open Supabase.Auth
open Supabase.Client
open Supabase.Types
open Supabase.Workouts
open Supabase.Team
open Pages.ProgressView
open Pages.TeamView
open Pages.AdminPage
open Pages.ProfilePage
open Supabase.Admin
open Components.PhotoUpload
open Components.PhotoGallery
open Components.RecordItem
open Components.RecordEditModal
open Components.PhotoModal
open Components.Calendar
open Offline.NetworkStatus
open Offline.Queue
open Offline.Types
open Offline.Sync
open Utils.DateHelpers

/// Tab mode for dashboard navigation
type TabMode = Home | Progress | Team | Admin | Profile

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

/// Inline editable record row for calendar date records
[<ReactComponent>]
let EditableRecordRow (record: WorkoutRecord) (displayName: string) (currentUserId: string) (onSaved: unit -> unit) (onPhotoClick: string -> unit) =
    let (editText, setEditText) = React.useState(record.text_content |> Option.defaultValue "")
    let (editing, setEditing) = React.useState(false)
    let (saving, setSaving) = React.useState(false)
    let (deleting, setDeleting) = React.useState(false)

    let saveText () =
        if editText <> (record.text_content |> Option.defaultValue "") then
            setSaving true
            promise {
                try
                    let! _ = updateWorkoutById record.id editText
                    setSaving false
                    setEditing false
                    onSaved()
                with ex ->
                    setSaving false
            } |> Promise.start
        else
            setEditing false

    let deleteButton =
        if record.user_id = currentUserId then
            Html.button [
                prop.className "text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                prop.disabled (saving || deleting)
                prop.title "삭제"
                prop.onClick (fun _ ->
                    setDeleting true
                    promise {
                        try
                            let! _ = deleteWorkoutById record.id
                            setDeleting false
                            onSaved()
                        with ex ->
                            setDeleting false
                    } |> Promise.start
                )
                prop.children [
                    Svg.svg [
                        svg.width 18; svg.height 18
                        svg.viewBox(0, 0, 24, 24)
                        svg.fill "none"
                        svg.stroke "currentColor"
                        svg.custom("strokeWidth", 2)
                        svg.custom("strokeLinecap", "round")
                        svg.custom("strokeLinejoin", "round")
                        svg.children [
                            Svg.polyline [ svg.points "3,6 5,6 21,6" ]
                            Svg.path [ svg.d "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" ]
                            Svg.line [ svg.x1 10; svg.y1 11; svg.x2 10; svg.y2 17 ]
                            Svg.line [ svg.x1 14; svg.y1 11; svg.x2 14; svg.y2 17 ]
                        ]
                    ]
                ]
            ]
        else Html.none

    Html.div [
        prop.key (string record.id)
        prop.className "flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 border"
        prop.children [
            // 별명
            Html.span [
                prop.className "font-medium text-indigo-700 whitespace-nowrap"
                prop.text (sprintf "%s:" displayName)
            ]
            // 내용
            match record.record_type with
            | "text" ->
                if record.user_id = currentUserId && editing then
                    Html.input [
                        prop.className "flex-1 min-w-0 px-2 py-1 border rounded text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-400"
                        prop.value editText
                        prop.autoFocus true
                        prop.onChange (fun (v: string) -> setEditText v)
                        prop.onBlur (fun _ -> saveText())
                        prop.onKeyDown (fun e -> if e.key = "Enter" then saveText())
                        prop.disabled (saving || deleting)
                    ]
                    deleteButton
                elif record.user_id = currentUserId then
                    Html.span [
                        prop.className "flex-1 min-w-0 text-gray-800 cursor-pointer hover:text-blue-600"
                        prop.onClick (fun _ -> setEditing true)
                        prop.text (record.text_content |> Option.defaultValue "(빈 메모)")
                    ]
                    deleteButton
                else
                    Html.span [
                        prop.className "flex-1 min-w-0 text-gray-800"
                        prop.text (record.text_content |> Option.defaultValue "(빈 메모)")
                    ]
            | "photo" ->
                match record.photo_url with
                | Some url ->
                    Html.img [
                        prop.src url
                        prop.alt "사진"
                        prop.className "w-12 h-12 object-cover rounded cursor-pointer"
                        prop.onClick (fun _ -> onPhotoClick url)
                    ]
                    deleteButton
                | None ->
                    Html.span [
                        prop.className "flex-1 text-gray-400"
                        prop.text "(사진)"
                    ]
            | _ ->
                Html.span [
                    prop.className "flex-1 text-green-700"
                    prop.text "운동 완료"
                ]
                deleteButton
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
    let (viewScope, setViewScope) = React.useState(TeamView)  // Default to "우리"
    let viewScopeRef = React.useRef(viewScope)
    React.useEffect((fun () -> viewScopeRef.current <- viewScope), [| box viewScope |])

    // Multi-record state
    let (todayRecords, setTodayRecords) = React.useState<WorkoutRecord array>([||])
    let (recordsLoading, setRecordsLoading) = React.useState(true)
    let (editState, setEditState) = React.useState<RecordEditState>(RecordEditState.Idle)

    // Photo modal state
    let (expandedPhotoUrl, setExpandedPhotoUrl) = React.useState<string option>(None)

    // Monthly workouts for calendar
    let (monthlyWorkouts, setMonthlyWorkouts) = React.useState<WorkoutRecord array>([||])

    // Calendar click state (single vs double click detection)
    let (calendarClickTimer, setCalendarClickTimer) = React.useState<float option>(None)
    let (selectedDate, setSelectedDate) = React.useState<string option>(None)

    // Calendar selected date records (output)
    let (calendarSelectedDate, setCalendarSelectedDate) = React.useState<string option>(Some (getTodayDateString()))
    let (calendarDateRecords, setCalendarDateRecords) = React.useState<WorkoutRecord array>([||])
    let (userDisplayName, setUserDisplayName) = React.useState<string>("")
    let (userMemberId, setUserMemberId) = React.useState<string>("")
    let (userIsAdmin, setUserIsAdmin) = React.useState(false)
    let (profileMap, setProfileMap) = React.useState<Map<string, string>>(Map.empty)

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

    // Load monthly workouts for calendar (switches between personal and team)
    React.useEffect((fun () ->
        let today = getTodayDateString()
        let todayYear = System.DateTime.Now.Year
        let todayMonth = System.DateTime.Now.Month
        // If viewing current month, select today; otherwise reset
        let selectedDate =
            if currentYear = todayYear && currentMonth = todayMonth then Some today
            else None
        setCalendarSelectedDate selectedDate
        setCalendarDateRecords [||]
        promise {
            try
                let startDate = formatDateString currentYear currentMonth 1
                let endDate = formatDateString currentYear currentMonth (getDaysInMonth currentYear currentMonth)
                match viewScopeRef.current with
                | Personal ->
                    let! workouts = getWorkouts user.id (Some startDate) (Some endDate)
                    setMonthlyWorkouts workouts
                | TeamView ->
                    let! allWorkouts = getAllWorkouts startDate endDate
                    setMonthlyWorkouts allWorkouts
                // Load selected date records
                match selectedDate with
                | Some date ->
                    match viewScopeRef.current with
                    | Personal ->
                        let! records = getWorkoutsForDate user.id date
                        setCalendarDateRecords records
                    | TeamView ->
                        let! records = getAllWorkoutsForDate date
                        setCalendarDateRecords records
                | None -> ()
            with ex -> ()
        } |> Promise.start
    ), [| box currentYear; box currentMonth; box refreshKey; box viewScope |])

    // Load all team profiles on mount (for display names)
    React.useEffect((fun () ->
        promise {
            try
                let! profiles = getTeamProfiles()
                let map =
                    profiles
                    |> Array.map (fun p ->
                        let name =
                            if p.display_name.IsSome && p.display_name.Value <> "" then p.display_name.Value
                            else p.member_id
                        (p.id, name))
                    |> Map.ofArray
                setProfileMap map
                // Set own display name and member_id
                match profiles |> Array.tryFind (fun p -> p.id = user.id) with
                | Some myProfile ->
                    setUserDisplayName (
                        if myProfile.display_name.IsSome && myProfile.display_name.Value <> "" then myProfile.display_name.Value
                        else myProfile.member_id
                    )
                    setUserMemberId myProfile.member_id
                | None ->
                    setUserDisplayName (user.email |> Option.defaultValue "사용자")
                // Check admin role
                let! adminCheck = isAdmin()
                setUserIsAdmin adminCheck
            with ex -> ()
        } |> Promise.start
    ), [||])

    // Reload calendar date records helper
    let loadCalendarDateRecords (date: string) =
        promise {
            try
                match viewScopeRef.current with
                | Personal ->
                    let! records = getWorkoutsForDate user.id date
                    setCalendarDateRecords records
                | TeamView ->
                    let! records = getAllWorkoutsForDate date
                    setCalendarDateRecords records
            with ex -> ()
        } |> Promise.start

    // Reload monthly workouts for calendar badge update
    let reloadMonthlyWorkouts () =
        promise {
            try
                let startDate = formatDateString currentYear currentMonth 1
                let endDate = formatDateString currentYear currentMonth (getDaysInMonth currentYear currentMonth)
                match viewScopeRef.current with
                | Personal ->
                    let! workouts = getWorkouts user.id (Some startDate) (Some endDate)
                    setMonthlyWorkouts workouts
                | TeamView ->
                    let! allWorkouts = getAllWorkouts startDate endDate
                    setMonthlyWorkouts allWorkouts
            with ex -> ()
        } |> Promise.start

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

    // Create workout record for a specific date, then reload
    let handleCreateWorkoutForDate (date: string) =
        promise {
            try
                let! _ = createWorkout user.id date
                // Reload monthly workouts
                let startDate = formatDateString currentYear currentMonth 1
                let endDate = formatDateString currentYear currentMonth (getDaysInMonth currentYear currentMonth)
                let! workouts = getWorkouts user.id (Some startDate) (Some endDate)
                setMonthlyWorkouts workouts
                // Reload selected date records
                let! records = getWorkoutsForDate user.id date
                setCalendarDateRecords records
            with ex -> ()
        } |> Promise.start

    // Create workout record (today)
    let handleCreateWorkout () =
        handleCreateWorkoutForDate (getTodayDateString())

    // Save text record (create or update)
    let handleSaveText (text: string) =
        setEditState RecordEditState.Saving
        promise {
            try
                let targetDate = selectedDate |> Option.defaultValue (getTodayDateString())
                match editState with
                | EditingText (recordId, _) ->
                    let! _ = updateWorkoutById recordId text
                    ()
                | _ ->
                    let! _ = createTextRecord user.id targetDate text
                    ()
                setEditState RecordEditState.Idle
                setRefreshKey (refreshKey + 1)
                // Reload calendar date records if a date is selected
                match selectedDate with
                | Some date -> loadCalendarDateRecords date
                | None -> ()
                setSelectedDate None
            with ex ->
                setEditState (RecordEditState.Error "저장 실패. 다시 시도해주세요.")
        } |> Promise.start

    // Calendar single click: select date + show records
    let handleCalendarClick (dateString: string) =
        setCalendarSelectedDate (Some dateString)
        loadCalendarDateRecords dateString

    // Calendar double click: add default message text record
    let handleCalendarDoubleClick (dateString: string) =
        setCalendarSelectedDate (Some dateString)
        promise {
            try
                let storedMsg = Browser.Dom.window.localStorage.getItem(sprintf "rollbook-default-msg-%s" user.id)
                let template = if isNull storedMsg || storedMsg = "" then "운동했어" else storedMsg

                // Count unique workout days this month for current user
                let workoutDaysCount =
                    monthlyWorkouts
                    |> Array.filter (fun w -> w.user_id = user.id)
                    |> Array.map (fun w -> w.workout_date)
                    |> Array.distinct
                    |> Array.length

                let storedGoal = Browser.Dom.window.localStorage.getItem(sprintf "rollbook-monthly-goal-%s" user.id)
                let goal = if isNull storedGoal || storedGoal = "" then "20" else storedGoal

                // Format date: "2026-02-18" -> "2월 18일"
                let dateParts = dateString.Split('-')
                let dateFormatted =
                    if dateParts.Length = 3 then
                        sprintf "%d월 %d일" (int dateParts.[1]) (int dateParts.[2])
                    else dateString

                let msg =
                    template
                        .Replace("%DATE", dateFormatted)
                        .Replace("%COUNT", string (workoutDaysCount + 1))
                        .Replace("%GOAL", goal)

                let! _ = createTextRecord user.id dateString msg
                // Reload
                let startDate = formatDateString currentYear currentMonth 1
                let endDate = formatDateString currentYear currentMonth (getDaysInMonth currentYear currentMonth)
                let! workouts = getWorkouts user.id (Some startDate) (Some endDate)
                setMonthlyWorkouts workouts
                let! records = getWorkoutsForDate user.id dateString
                setCalendarDateRecords records
            with ex -> ()
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
                        prop.className "max-w-4xl mx-auto px-4 py-4 pb-6 flex items-center"
                        prop.children [
                            // Left: empty spacer
                            Html.div [
                                prop.className "flex-1"
                            ]
                            // Center: 픽제주 헬스 클럽
                            Html.h1 [
                                prop.className "text-2xl font-bold text-indigo-600 whitespace-nowrap"
                                prop.text "픽제주 헬스 클럽"
                            ]
                            // Right: 관리 + member_id + 로그아웃
                            Html.div [
                                prop.className "flex-1 flex items-center justify-end gap-2"
                                prop.children [
                                    if userIsAdmin then
                                        Html.button [
                                            prop.onClick (fun _ ->
                                                if activeTab = Admin then setActiveTab Home
                                                else setActiveTab Admin
                                            )
                                            prop.className (
                                                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors " +
                                                if activeTab = Admin then
                                                    "bg-green-600 text-white"
                                                else
                                                    "bg-green-100 text-green-700 hover:bg-green-200"
                                            )
                                            prop.text "관리"
                                        ]
                                    Html.button [
                                        prop.onClick (fun _ ->
                                            if activeTab = Profile then setActiveTab Home
                                            else setActiveTab Profile
                                        )
                                        prop.className (
                                            "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors " +
                                            if activeTab = Profile then
                                                "bg-indigo-600 text-white"
                                            else
                                                "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                                        )
                                        prop.text (if userMemberId <> "" then userMemberId else "프로필")
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
                                        prop.text (if loading then "..." else "로그아웃")
                                    ]
                                ]
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
                                prop.className "w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                                prop.children [
                                    Svg.svg [
                                        svg.width 20; svg.height 20
                                        svg.viewBox(0, 0, 24, 24)
                                        svg.fill "none"
                                        svg.stroke "currentColor"
                                        svg.custom("strokeWidth", 2.5)
                                        svg.custom("strokeLinecap", "round")
                                        svg.custom("strokeLinejoin", "round")
                                        svg.children [
                                            Svg.polyline [ svg.points "14,18 8,12 14,6" ]
                                            Svg.polyline [ svg.points "8,18 2,12 8,6" ]
                                        ]
                                    ]
                                ]
                            ]
                            Html.div [
                                prop.className "flex items-center gap-2"
                                prop.children [
                                    Html.h2 [
                                        prop.className "text-lg font-semibold text-gray-800"
                                        prop.text (
                                            match calendarSelectedDate with
                                            | Some d ->
                                                let parts = d.Split('-')
                                                if parts.Length = 3 then
                                                    sprintf "%s년 %d월 %d일" parts.[0] (int parts.[1]) (int parts.[2])
                                                else d
                                            | None ->
                                                let today = System.DateTime.Now
                                                sprintf "%d년 %d월 %d일" currentYear currentMonth today.Day
                                        )
                                    ]
                                    // Camera icon (photo record) - uses JS interop for file handling
                                    Html.button [
                                        prop.className "w-8 h-8 rounded-full bg-indigo-100 hover:bg-indigo-200 flex items-center justify-center transition-colors text-indigo-600"
                                        prop.onClick (fun _ ->
                                            let targetDate = calendarSelectedDate |> Option.defaultValue (getTodayDateString())
                                            let userId = user.id
                                            let onDone = fun () ->
                                                loadCalendarDateRecords targetDate
                                                reloadMonthlyWorkouts()
                                            emitJsExpr (userId, targetDate, onDone) """
                                                (function(userId, targetDate, onDone) {
                                                    var inp = document.createElement('input');
                                                    inp.type = 'file';
                                                    inp.accept = 'image/*';
                                                    inp.capture = 'environment';
                                                    inp.onchange = async function() {
                                                        if (!inp.files || inp.files.length === 0) return;
                                                        try {
                                                            var compress = (await import('browser-image-compression')).default;
                                                            var compressed = await compress(inp.files[0], { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true, fileType: 'image/jpeg' });
                                                            var { supabase } = await import('/src/Supabase/Client.js');
                                                            var path = userId + '/' + targetDate + '_' + Date.now() + '.jpg';
                                                            var { data, error } = await supabase.storage.from('workout-photos').upload(path, compressed, { cacheControl: '3600', upsert: true });
                                                            if (error) { alert('업로드 실패: ' + error.message); return; }
                                                            var { data: urlData } = await supabase.storage.from('workout-photos').createSignedUrl(data.path, 3600);
                                                            var url = urlData ? urlData.signedUrl : '';
                                                            await supabase.from('workouts').insert({ user_id: userId, workout_date: targetDate, record_type: 'photo', photo_url: url });
                                                            onDone();
                                                        } catch(e) { alert('사진 오류: ' + e.message); }
                                                    };
                                                    inp.click();
                                                })($0, $1, $2)
                                            """
                                        )
                                        prop.children [
                                            Svg.svg [
                                                svg.width 16; svg.height 16
                                                svg.viewBox(0, 0, 24, 24)
                                                svg.fill "none"
                                                svg.stroke "currentColor"
                                                svg.custom("strokeWidth", 2)
                                                svg.custom("strokeLinecap", "round")
                                                svg.custom("strokeLinejoin", "round")
                                                svg.children [
                                                    Svg.path [ svg.d "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" ]
                                                    Svg.circle [ svg.cx 12; svg.cy 13; svg.r 4 ]
                                                ]
                                            ]
                                        ]
                                    ]
                                    // Text icon (text record)
                                    Html.button [
                                        prop.onClick (fun _ ->
                                            let targetDate = calendarSelectedDate |> Option.defaultValue (getTodayDateString())
                                            setSelectedDate (Some targetDate)
                                            setEditState RecordEditState.CreatingText
                                        )
                                        prop.className "w-8 h-8 rounded-full bg-green-100 hover:bg-green-200 flex items-center justify-center transition-colors text-green-600"
                                        prop.children [
                                            Svg.svg [
                                                svg.width 16; svg.height 16
                                                svg.viewBox(0, 0, 24, 24)
                                                svg.fill "none"
                                                svg.stroke "currentColor"
                                                svg.custom("strokeWidth", 2)
                                                svg.custom("strokeLinecap", "round")
                                                svg.custom("strokeLinejoin", "round")
                                                svg.children [
                                                    Svg.path [ svg.d "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" ]
                                                    Svg.path [ svg.d "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" ]
                                                ]
                                            ]
                                        ]
                                    ]
                                ]
                            ]
                            Html.button [
                                prop.onClick (fun _ -> goToNextMonth())
                                prop.className "w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                                prop.children [
                                    Svg.svg [
                                        svg.width 20; svg.height 20
                                        svg.viewBox(0, 0, 24, 24)
                                        svg.fill "none"
                                        svg.stroke "currentColor"
                                        svg.custom("strokeWidth", 2.5)
                                        svg.custom("strokeLinecap", "round")
                                        svg.custom("strokeLinejoin", "round")
                                        svg.children [
                                            Svg.polyline [ svg.points "10,6 16,12 10,18" ]
                                            Svg.polyline [ svg.points "16,6 22,12 16,18" ]
                                        ]
                                    ]
                                ]
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
                                    "flex-1 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 " +
                                    if viewScope = Personal then
                                        "bg-indigo-600 text-white"
                                    else
                                        "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                )
                                prop.children [
                                    Svg.svg [
                                        svg.width 20; svg.height 20
                                        svg.viewBox(0, 0, 24, 24)
                                        svg.fill "none"
                                        svg.stroke "currentColor"
                                        svg.custom("strokeWidth", 2)
                                        svg.custom("strokeLinecap", "round")
                                        svg.custom("strokeLinejoin", "round")
                                        svg.children [
                                            // Thumbs up icon
                                            Svg.path [ svg.d "M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" ]
                                            Svg.path [ svg.d "M4 22h-2a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h2" ]
                                        ]
                                    ]
                                    Html.span [ prop.text "나" ]
                                ]
                            ]
                            Html.button [
                                prop.onClick (fun _ -> setViewScope TeamView)
                                prop.className (
                                    "flex-1 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 " +
                                    if viewScope = TeamView then
                                        "bg-indigo-600 text-white"
                                    else
                                        "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                )
                                prop.children [
                                    Svg.svg [
                                        svg.width 20; svg.height 20
                                        svg.viewBox(0, 0, 24, 24)
                                        svg.fill "none"
                                        svg.stroke "currentColor"
                                        svg.custom("strokeWidth", 2)
                                        svg.custom("strokeLinecap", "round")
                                        svg.custom("strokeLinejoin", "round")
                                        svg.children [
                                            // Handshake / two hands icon
                                            Svg.path [ svg.d "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" ]
                                            Svg.circle [ svg.cx 9; svg.cy 7; svg.r 4 ]
                                            Svg.path [ svg.d "M23 21v-2a4 4 0 0 0-3-3.87" ]
                                            Svg.path [ svg.d "M16 3.13a4 4 0 0 1 0 7.75" ]
                                        ]
                                    ]
                                    Html.span [ prop.text "우리" ]
                                ]
                            ]
                        ]
                    ]

                    // Tab navigation removed - Admin accessed from top bar

                    // Conditional content based on active tab
                    match activeTab with
                    | Home ->
                        Html.div [
                            prop.children [
                                // Calendar
                                Html.div [
                                    prop.className "bg-white rounded-xl shadow-sm p-4 mt-4"
                                    prop.children [
                                        CalendarGrid user.id currentYear currentMonth monthlyWorkouts goToPrevMonth goToNextMonth handleCalendarClick handleCalendarDoubleClick calendarSelectedDate
                                    ]
                                ]

                                // Selected date records (compact chips + expand)
                                match calendarSelectedDate with
                                | Some date ->
                                    let grouped =
                                        calendarDateRecords
                                        |> Array.groupBy (fun r -> r.user_id)
                                        |> Array.map (fun (uid, records) ->
                                            let name = Map.tryFind uid profileMap |> Option.defaultValue userDisplayName
                                            let hasText = records |> Array.exists (fun r -> r.record_type = "text")
                                            let hasPhoto = records |> Array.exists (fun r -> r.record_type = "photo")
                                            let hasWorkout = records |> Array.exists (fun r -> r.record_type = "workout")
                                            (uid, name, records, hasText, hasPhoto, hasWorkout))
                                    Html.div [
                                        prop.className "bg-white rounded-xl shadow-sm p-4 mt-4"
                                        prop.children [
                                            if calendarDateRecords.Length = 0 then
                                                Html.div [
                                                    prop.className "text-center text-gray-400 py-4"
                                                    prop.text "기록이 없습니다"
                                                ]
                                            else
                                                // Chips row
                                                Html.div [
                                                    prop.className "flex flex-wrap gap-2 mb-3"
                                                    prop.children [
                                                        for (uid, name, _, hasText, hasPhoto, hasWorkout) in grouped do
                                                            let icons =
                                                                (if hasWorkout then " 💪" else "") +
                                                                (if hasPhoto then " 📷" else "") +
                                                                (if hasText then " ✏️" else "")
                                                            let isExpanded = selectedDate = Some uid
                                                            Html.button [
                                                                prop.key uid
                                                                prop.onClick (fun _ ->
                                                                    if isExpanded then setSelectedDate None
                                                                    else setSelectedDate (Some uid)
                                                                )
                                                                prop.className (
                                                                    "px-3 py-1.5 rounded-full text-sm font-medium transition-all " +
                                                                    if isExpanded then
                                                                        "bg-indigo-600 text-white shadow-md"
                                                                    else
                                                                        "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                                )
                                                                prop.text (sprintf "%s%s" name icons)
                                                            ]
                                                    ]
                                                ]
                                                // Expanded detail for selected user
                                                match selectedDate with
                                                | Some expandedUid ->
                                                    match grouped |> Array.tryFind (fun (uid, _, _, _, _, _) -> uid = expandedUid) with
                                                    | Some (_, _, records, _, _, _) ->
                                                        Html.div [
                                                            prop.className "space-y-2 pt-2 border-t"
                                                            prop.children [
                                                                for record in records do
                                                                    let recordDisplayName = Map.tryFind record.user_id profileMap |> Option.defaultValue userDisplayName
                                                                    EditableRecordRow record recordDisplayName user.id (fun () -> loadCalendarDateRecords date; reloadMonthlyWorkouts()) (fun url -> setExpandedPhotoUrl (Some url))
                                                            ]
                                                        ]
                                                    | None -> Html.none
                                                | None -> Html.none
                                        ]
                                    ]
                                | None -> Html.none

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
                        AdminPage (fun () -> setActiveTab Home)
                    | Profile ->
                        ProfilePage user userMemberId onLogout (fun () -> setActiveTab Home)

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
