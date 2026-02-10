module Pages.TeamView

open Feliz
open Fable.Core.JsInterop
open Supabase.Types
open Supabase.Team
open Utils.DateHelpers
open Components.TeamMemberCard

/// Team roster view showing all team members and their monthly workout counts
[<ReactComponent>]
let TeamViewPage () =
    // Date navigation state
    let (currentYear, setCurrentYear) = React.useState(System.DateTime.Now.Year)
    let (currentMonth, setCurrentMonth) = React.useState(System.DateTime.Now.Month)

    // Data state
    let (members, setMembers) = React.useState<TeamMemberSummary array>([||])
    let (loading, setLoading) = React.useState(true)
    let (error, setError) = React.useState<string option>(None)

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

    // Load team data when month changes
    React.useEffect((fun () ->
        setLoading true
        setError None

        promise {
            try
                // Calculate date range for the month
                let startDate = formatDateString currentYear currentMonth 1
                let lastDay = getDaysInMonth currentYear currentMonth
                let endDate = formatDateString currentYear currentMonth lastDay

                // Fetch team data in parallel
                let! workouts = getTeamWorkouts startDate endDate
                let! profiles = getTeamProfiles()

                // Aggregate by user
                let teamMembers = groupWorkoutsByUser workouts profiles
                setMembers teamMembers
                setLoading false
            with ex ->
                setError (Some "팀 데이터를 불러올 수 없습니다")
                setLoading false
        } |> Promise.start
    ), [| box currentYear; box currentMonth |])

    Html.div [
        prop.className "space-y-4"
        prop.children [
            // Month navigation header
            Html.div [
                prop.className "flex items-center justify-between bg-white rounded-lg shadow-sm p-4"
                prop.children [
                    Html.button [
                        prop.onClick (fun _ -> goToPrevMonth())
                        prop.className "p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        prop.text "<"
                    ]
                    Html.h2 [
                        prop.className "text-lg font-semibold text-gray-800"
                        prop.text (sprintf "%d년 %d월" currentYear currentMonth)
                    ]
                    Html.button [
                        prop.onClick (fun _ -> goToNextMonth())
                        prop.className "p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        prop.text ">"
                    ]
                ]
            ]

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
                    // Team member list
                    if members.Length = 0 then
                        Html.div [
                            prop.className "text-center py-8 text-gray-500"
                            prop.text "팀원이 없습니다"
                        ]
                    else
                        Html.div [
                            prop.className "space-y-2"
                            prop.children (
                                members
                                |> Array.map (fun m ->
                                    Html.div [
                                        prop.key m.UserId
                                        prop.children [ TeamMemberCard m ]
                                    ]
                                )
                                |> Array.toList
                            )
                        ]
        ]
    ]
