module Pages.TeamView

open Feliz
open Fable.Core.JsInterop
open Supabase.Types
open Supabase.Team
open Utils.DateHelpers
open Components.TeamMemberCard
open Components.Calendar
open Components.DailyDetailView

/// Calendar view state for drill-down navigation
type CalendarViewState =
    | CalendarView
    | DailyDetailView of selectedDate: string

/// Team roster view showing all team members and their monthly workout counts
[<ReactComponent>]
let TeamViewPage (year: int) (month: int) =
    // Data state
    let (members, setMembers) = React.useState<TeamMemberSummary array>([||])
    let (loading, setLoading) = React.useState(true)
    let (error, setError) = React.useState<string option>(None)

    // Calendar view state
    let (calendarViewState, setCalendarViewState) = React.useState(CalendarViewState.CalendarView)
    let (selectedDateRecords, setSelectedDateRecords) = React.useState<WorkoutRecord array>([||])
    let (allWorkouts, setAllWorkouts) = React.useState<WorkoutRecord array>([||])

    // Load team data when month changes
    React.useEffect((fun () ->
        setLoading true
        setError None
        setCalendarViewState CalendarViewState.CalendarView  // Reset to calendar on month change

        promise {
            try
                // Calculate date range for the month
                let startDate = formatDateString year month 1
                let lastDay = getDaysInMonth year month
                let endDate = formatDateString year month lastDay

                // Fetch team data - getTeamWorkouts returns date range, perfect for calendar
                let! workouts = getTeamWorkouts startDate endDate
                let! profiles = getTeamProfiles()

                // Convert WorkoutWithProfile array to WorkoutRecord array for CalendarGrid
                let workoutRecords =
                    workouts
                    |> Array.map (fun w ->
                        {
                            id = 0
                            user_id = w.user_id
                            workout_date = w.workout_date
                            record_type = "workout"
                            text_content = None
                            photo_url = None
                            created_at = None
                            updated_at = None
                            deleted_at = None
                        }
                    )

                setAllWorkouts workoutRecords
                let teamMembers = groupWorkoutsByUser workouts profiles
                setMembers teamMembers
                setLoading false
            with ex ->
                setError (Some "팀 데이터를 불러올 수 없습니다")
                setLoading false
        } |> Promise.start
    ), [| box year; box month |])

    let handleDateClick (dateString: string) =
        promise {
            try
                let! records = getTeamWorkoutsForDate dateString
                setSelectedDateRecords records
                setCalendarViewState (CalendarViewState.DailyDetailView dateString)
            with ex -> ()
        } |> Promise.start

    Html.div [
        prop.className "space-y-4"
        prop.children [
            // Team stats summary
            Html.div [
                prop.className "bg-white rounded-lg shadow-sm p-4"
                prop.children [
                    Html.div [
                        prop.className "flex justify-between text-sm text-gray-600"
                        prop.children [
                            Html.span [
                                prop.text (sprintf "팀원 %d명" members.Length)
                            ]
                            Html.span [
                                let totalWorkouts = members |> Array.sumBy (fun m -> m.WorkoutCount)
                                prop.text (sprintf "총 %d회 운동" totalWorkouts)
                            ]
                        ]
                    ]
                ]
            ]

            // Loading state
            if loading then
                Html.div [
                    prop.className "text-center py-8 text-gray-500"
                    prop.text "로딩 중..."
                ]
            else
                // Error state
                match error with
                | Some msg ->
                    Html.div [
                        prop.className "text-center py-8 text-red-600"
                        prop.text msg
                    ]
                | None ->
                    match calendarViewState with
                    | CalendarView ->
                        CalendarGrid "" year month allWorkouts (fun () -> ()) (fun () -> ()) handleDateClick
                    | DailyDetailView selectedDate ->
                        Components.DailyDetailView.DailyDetailView selectedDate selectedDateRecords ""
                            (fun () -> setCalendarViewState CalendarView)
                            (fun _ -> ())
                            (fun _ -> ())
        ]
    ]
