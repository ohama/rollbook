module Pages.ProgressView

open Feliz
open Fable.Core.JsInterop
open Supabase.Types
open Supabase.Workouts
open Utils.DateHelpers
open Components.Calendar
open Components.WorkoutList
open Components.MonthlyStats
open Components.DailyDetailView

/// View mode for progress tracking
type ViewMode = Calendar | List

/// Calendar view state for drill-down navigation
type CalendarViewState =
    | CalendarView
    | DailyDetailView of selectedDate: string

[<ReactComponent>]
let ProgressViewPage (userId: string) (year: int) (month: int) =
    // View mode state
    let (viewMode, setViewMode) = React.useState(Calendar)

    // Data state
    let (workouts, setWorkouts) = React.useState<WorkoutRecord array>([||])
    let (loading, setLoading) = React.useState(true)
    let (error, setError) = React.useState<string option>(None)

    // Calendar view state
    let (calendarViewState, setCalendarViewState) = React.useState(CalendarViewState.CalendarView)
    let (selectedDateRecords, setSelectedDateRecords) = React.useState<WorkoutRecord array>([||])

    // Load workouts when month changes
    React.useEffect((fun () ->
        promise {
            try
                setLoading true
                setError None
                setCalendarViewState CalendarViewState.CalendarView  // Reset to calendar on month change

                // Calculate date range for current month
                let startDate = formatDateString year month 1
                let daysInMonth = getDaysInMonth year month
                let endDate = formatDateString year month daysInMonth

                // Fetch workouts for this month
                let! monthWorkouts = getWorkouts userId (Some startDate) (Some endDate)
                setWorkouts monthWorkouts
                setLoading false
            with ex ->
                setError (Some "운동 기록을 불러올 수 없습니다")
                setLoading false
        } |> Promise.start
    ), [| box year; box month |])

    let handleDateClick (dateString: string) =
        promise {
            try
                let! records = getWorkoutsForDate userId dateString
                setSelectedDateRecords records
                setCalendarViewState (CalendarViewState.DailyDetailView dateString)
            with ex -> ()
        } |> Promise.start

    Html.div [
        prop.className "max-w-4xl mx-auto px-4 py-8"
        prop.children [
            // View toggle buttons
            Html.div [
                prop.className "flex gap-2 mb-4"
                prop.children [
                    Html.button [
                        prop.onClick (fun _ -> setViewMode Calendar)
                        prop.className (
                            "px-4 py-2 rounded-lg font-medium transition-colors " +
                            if viewMode = Calendar then
                                "bg-indigo-600 text-white"
                            else
                                "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        )
                        prop.text "달력"
                    ]
                    Html.button [
                        prop.onClick (fun _ -> setViewMode List)
                        prop.className (
                            "px-4 py-2 rounded-lg font-medium transition-colors " +
                            if viewMode = List then
                                "bg-indigo-600 text-white"
                            else
                                "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        )
                        prop.text "목록"
                    ]
                ]
            ]

            // Monthly stats (always visible)
            Html.div [
                prop.className "mb-6"
                prop.children [
                    MonthlyStatsView workouts year month
                ]
            ]

            // Loading state
            if loading then
                Html.div [
                    prop.className "text-center text-gray-600 py-8"
                    prop.text "로딩 중..."
                ]
            // Error state
            elif error.IsSome then
                Html.div [
                    prop.className "text-center text-red-600 py-8"
                    prop.text error.Value
                ]
            // Content based on view mode
            else
                match viewMode with
                | Calendar ->
                    match calendarViewState with
                    | CalendarView ->
                        CalendarGrid userId year month workouts (fun () -> ()) (fun () -> ()) handleDateClick
                    | DailyDetailView selectedDate ->
                        Components.DailyDetailView.DailyDetailView selectedDate selectedDateRecords userId
                            (fun () -> setCalendarViewState CalendarView)
                            (fun _ -> ())  // Empty edit handler
                            (fun _ -> ())  // Empty delete handler
                | List ->
                    WorkoutListView workouts
        ]
    ]
