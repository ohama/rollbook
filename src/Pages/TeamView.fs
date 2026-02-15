module Pages.TeamView

open Feliz
open Fable.Core.JsInterop
open Supabase.Types
open Supabase.Team
open Utils.DateHelpers
open Components.TeamMemberCard

/// Team roster view showing all team members and their monthly workout counts
[<ReactComponent>]
let TeamViewPage (year: int) (month: int) =
    // Data state
    let (members, setMembers) = React.useState<TeamMemberSummary array>([||])
    let (loading, setLoading) = React.useState(true)
    let (error, setError) = React.useState<string option>(None)

    // Load team data when month changes
    React.useEffect((fun () ->
        setLoading true
        setError None

        promise {
            try
                // Calculate date range for the month
                let startDate = formatDateString year month 1
                let lastDay = getDaysInMonth year month
                let endDate = formatDateString year month lastDay

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
    ), [| box year; box month |])

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
