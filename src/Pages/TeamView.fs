module Pages.TeamView

open Feliz
open Fable.Core.JsInterop
open Supabase.Types
open Supabase.Team
open Utils.DateHelpers
open Components.TeamMemberCard
open Components.Calendar
open Components.DailyDetailView
open Components.TeamDayDetailView
open Components.RecordItem
open Components.PhotoModal

/// Calendar view state for drill-down navigation
type CalendarViewState =
    | CalendarView
    | DailyDetailView of selectedDate: string
    | UserDetailView of selectedDate: string * userId: string

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

    // Photo modal state
    let (expandedPhotoUrl, setExpandedPhotoUrl) = React.useState<string option>(None)

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
                        Components.TeamDayDetailView.TeamDayDetailView selectedDate selectedDateRecords
                            (fun () -> setCalendarViewState CalendarView)
                            (fun userId -> setCalendarViewState (UserDetailView (selectedDate, userId)))
                    | UserDetailView (selectedDate, userId) ->
                        let userRecords = selectedDateRecords |> Array.filter (fun r -> r.user_id = userId)
                        Html.div [
                            prop.className "space-y-4"
                            prop.children [
                                Html.div [
                                    prop.className "flex items-center gap-3 mb-4"
                                    prop.children [
                                        Html.button [
                                            prop.onClick (fun _ -> setCalendarViewState (DailyDetailView selectedDate))
                                            prop.className "w-11 h-11 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition-colors"
                                            prop.text "←"
                                        ]
                                        Html.h2 [
                                            prop.className "text-lg font-semibold text-gray-800"
                                            prop.text (sprintf "%s - 상세 기록" selectedDate)
                                        ]
                                    ]
                                ]
                                if userRecords.Length = 0 then
                                    Html.div [
                                        prop.className "text-center text-gray-400 py-8"
                                        prop.text "기록이 없습니다"
                                    ]
                                else
                                    Html.div [
                                        prop.className "space-y-2"
                                        prop.children [
                                            for record in userRecords do
                                                // INTENTIONAL: Empty userId ("") hides edit/delete buttons in team view
                                                Components.RecordItem.RecordItem record "" (fun _ -> ()) (fun _ -> ()) (fun url -> setExpandedPhotoUrl (Some url))
                                        ]
                                    ]

                                // Photo modal (renders when photo clicked)
                                match expandedPhotoUrl with
                                | Some url -> Components.PhotoModal.PhotoModal url (fun () -> setExpandedPhotoUrl None)
                                | None -> Html.none
                            ]
                        ]
        ]
    ]
