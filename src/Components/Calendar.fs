module Components.Calendar

open Feliz
open Supabase.Types
open Supabase.Workouts
open Utils.DateHelpers

/// Calendar day record for rendering
type CalendarDay = {
    Day: int
    DateString: string
    HasWorkout: bool
    IsToday: bool
    GridColumnStart: int option
}

[<ReactComponent>]
let CalendarGrid (userId: string) (year: int) (month: int) (workouts: WorkoutRecord array) (onPrevMonth: unit -> unit) (onNextMonth: unit -> unit) =
    // Calculate calendar data
    let daysInMonth = getDaysInMonth year month
    let firstDayOfWeek = getFirstDayOfMonth year month
    let todayString = getTodayDateString()

    // Build array of calendar days
    let calendarDays =
        [| 1 .. daysInMonth |]
        |> Array.mapi (fun i day ->
            let dateString = formatDateString year month day
            {
                Day = day
                DateString = dateString
                HasWorkout = hasWorkout dateString workouts
                IsToday = dateString = todayString
                // First day needs grid positioning (CSS is 1-indexed, add 1 to JS day)
                GridColumnStart = if i = 0 then Some (firstDayOfWeek + 1) else None
            }
        )

    Html.div [
        prop.className "space-y-2"
        prop.children [
            // Header with navigation
            Html.div [
                prop.className "flex justify-between items-center mb-4"
                prop.children [
                    Html.button [
                        prop.onClick (fun _ -> onPrevMonth())
                        prop.className "px-3 py-1 rounded-lg text-gray-600 hover:bg-gray-100 font-medium"
                        prop.text "← 이전"
                    ]
                    Html.h2 [
                        prop.className "text-lg font-semibold text-gray-800"
                        prop.text (formatMonthYear year month)
                    ]
                    Html.button [
                        prop.onClick (fun _ -> onNextMonth())
                        prop.className "px-3 py-1 rounded-lg text-gray-600 hover:bg-gray-100 font-medium"
                        prop.text "다음 →"
                    ]
                ]
            ]

            // Day of week headers
            Html.div [
                prop.className "grid grid-cols-7 gap-1 text-center text-sm font-semibold text-gray-600 mb-2"
                prop.children [
                    Html.div [ prop.text "일" ]
                    Html.div [ prop.text "월" ]
                    Html.div [ prop.text "화" ]
                    Html.div [ prop.text "수" ]
                    Html.div [ prop.text "목" ]
                    Html.div [ prop.text "금" ]
                    Html.div [ prop.text "토" ]
                ]
            ]

            // Calendar grid
            Html.div [
                prop.className "grid grid-cols-7 gap-1"
                prop.children [
                    for dayRecord in calendarDays do
                        Html.div [
                            // Apply grid-column-start for first day positioning
                            match dayRecord.GridColumnStart with
                            | Some col ->
                                prop.style [
                                    style.gridColumnStart col
                                ]
                            | None -> ()

                            // Styling based on state
                            prop.className (
                                "aspect-square flex items-center justify-center rounded-lg " +
                                if dayRecord.IsToday then
                                    "border-2 border-indigo-600 font-bold "
                                else
                                    ""
                                +
                                if dayRecord.HasWorkout then
                                    "bg-green-100 text-green-800"
                                else
                                    "text-gray-700"
                            )

                            prop.text (string dayRecord.Day)
                        ]
                ]
            ]
        ]
    ]
