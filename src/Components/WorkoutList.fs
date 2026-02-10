module Components.WorkoutList

open Feliz
open Supabase.Types

[<ReactComponent>]
let WorkoutListView (workouts: WorkoutRecord array) =
    // Sort workouts by date descending (most recent first)
    let sortedWorkouts =
        workouts
        |> Array.sortByDescending (fun w -> w.workout_date)

    Html.div [
        prop.className "space-y-2"
        prop.children [
            // Check if empty
            if sortedWorkouts.Length = 0 then
                Html.div [
                    prop.className "text-center text-gray-500 py-8"
                    prop.text "운동 기록이 없습니다"
                ]
            else
                // Render workout items
                for workout in sortedWorkouts do
                    Html.div [
                        prop.key workout.workout_date
                        prop.className "bg-white rounded-lg p-4 shadow-sm flex items-center gap-3"
                        prop.children [
                            // Left: Emoji
                            Html.div [
                                prop.className "text-2xl"
                                prop.text "💪"
                            ]
                            // Center: Date
                            Html.div [
                                prop.className "text-gray-800 font-medium flex-1"
                                prop.text workout.workout_date
                            ]
                            // Right: Placeholder for future edit/delete buttons
                            Html.div [
                                prop.className "flex gap-2"
                                // Placeholder for Phase 3+ WORK-02
                            ]
                        ]
                    ]
        ]
    ]
