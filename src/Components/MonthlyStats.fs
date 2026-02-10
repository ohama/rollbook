module Components.MonthlyStats

open Feliz
open Supabase.Types
open Utils.DateHelpers

[<ReactComponent>]
let MonthlyStatsView (workouts: WorkoutRecord array) (year: int) (month: int) =
    // Calculate statistics
    let totalWorkouts = workouts.Length
    let daysInMonth = getDaysInMonth year month

    // Calculate percentage (handle division by zero)
    let workoutPercentage =
        if daysInMonth = 0 then
            0.0
        else
            (float totalWorkouts / float daysInMonth) * 100.0

    Html.div [
        prop.className "bg-white rounded-lg p-6 shadow-sm"
        prop.children [
            // Title: formatted month/year
            Html.div [
                prop.className "text-lg font-semibold text-gray-800 mb-4"
                prop.text (formatMonthYear year month)
            ]

            // Grid with 2 columns for stats
            Html.div [
                prop.className "grid grid-cols-2 gap-4"
                prop.children [
                    // Left card: Total workouts
                    Html.div [
                        prop.className "text-center"
                        prop.children [
                            Html.div [
                                prop.className "text-3xl font-bold text-indigo-600"
                                prop.text (string totalWorkouts)
                            ]
                            Html.div [
                                prop.className "text-sm text-gray-600"
                                prop.text "운동 횟수"
                            ]
                        ]
                    ]

                    // Right card: Percentage
                    Html.div [
                        prop.className "text-center"
                        prop.children [
                            Html.div [
                                prop.className "text-3xl font-bold text-green-600"
                                prop.text (sprintf "%.0f%%" workoutPercentage)
                            ]
                            Html.div [
                                prop.className "text-sm text-gray-600"
                                prop.text "달성률"
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ]
