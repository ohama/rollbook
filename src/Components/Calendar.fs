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

/// Count records grouped by date (workout + text + photo)
let countRecordsByDate (workouts: WorkoutRecord array) : Map<string, int> =
    workouts
    |> Array.groupBy (fun w -> w.workout_date)
    |> Array.map (fun (date, records) -> (date, records.Length))
    |> Map.ofArray

[<ReactComponent>]
let CalendarGrid (userId: string) (year: int) (month: int) (workouts: WorkoutRecord array) (onPrevMonth: unit -> unit) (onNextMonth: unit -> unit) (onDateClick: string -> unit) (onDateDoubleClick: string -> unit) (selectedDate: string option) =
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

    // Compute count map
    let countMap = countRecordsByDate workouts

    Html.div [
        prop.className "space-y-2"
        prop.children [
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
                        Html.button [
                            // Apply grid-column-start for first day positioning
                            match dayRecord.GridColumnStart with
                            | Some col ->
                                prop.style [
                                    style.gridColumnStart col
                                ]
                            | None -> ()

                            // Click handlers
                            prop.onClick (fun _ -> onDateClick dayRecord.DateString)
                            prop.onDoubleClick (fun e -> e.preventDefault(); onDateDoubleClick dayRecord.DateString)

                            let isSelected = selectedDate = Some dayRecord.DateString

                            // Styling based on state
                            prop.className (
                                "aspect-square flex items-center justify-center rounded-lg relative transition-colors " +
                                if isSelected then
                                    "bg-blue-500 text-white font-bold"
                                elif dayRecord.IsToday && dayRecord.HasWorkout then
                                    "ring-2 ring-indigo-600 bg-green-200 text-green-900 font-bold hover:bg-green-300"
                                elif dayRecord.IsToday then
                                    "ring-2 ring-indigo-600 bg-indigo-100 text-indigo-800 font-bold hover:bg-indigo-200"
                                elif dayRecord.HasWorkout then
                                    "bg-green-100 text-green-800 hover:bg-green-200"
                                else
                                    "text-gray-700 hover:bg-gray-100"
                            )

                            prop.children [
                                // Day number
                                Html.span [
                                    prop.text (string dayRecord.Day)
                                ]

                                // Record count badge (if > 0)
                                let count = Map.tryFind dayRecord.DateString countMap |> Option.defaultValue 0
                                if count > 0 then
                                    Html.div [
                                        prop.className "absolute top-1 right-1 bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
                                        prop.text (string count)
                                    ]
                                else
                                    Html.none
                            ]
                        ]
                ]
            ]
        ]
    ]
