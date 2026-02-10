module Utils.DateHelpers

open Fable.Core
open Fable.Core.JsInterop
open Supabase.Types

/// Returns the number of days in a given month (28-31)
/// Uses JavaScript Date: new Date(year, month, 0).getDate()
/// Note: JS months are 0-indexed, so passing month without adjustment gets last day of previous month at that index
let getDaysInMonth (year: int) (month: int) : int =
    emitJsExpr (year, month) "new Date($0, $1, 0).getDate()"

/// Returns the day of week for the first day of the month (0=Sunday, 6=Saturday)
/// Uses JavaScript Date: new Date(year, month-1, 1).getDay()
/// Note: JS months are 0-indexed (0=Jan, 11=Dec) so we subtract 1 from our 1-indexed month
let getFirstDayOfMonth (year: int) (month: int) : int =
    emitJsExpr (year, month - 1) "new Date($0, $1, 1).getDay()"

/// Returns a date string in YYYY-MM-DD format (matches database DATE format)
/// Uses sprintf for consistent formatting with zero-padding
let formatDateString (year: int) (month: int) (day: int) : string =
    sprintf "%04d-%02d-%02d" year month day

/// Returns a formatted month/year string in Korean: "YYYY년 M월"
let formatMonthYear (year: int) (month: int) : string =
    sprintf "%d년 %d월" year month

/// Checks if a given date (YYYY-MM-DD) exists in the workouts array
let hasWorkout (date: string) (workouts: WorkoutRecord array) : bool =
    workouts
    |> Array.exists (fun w -> w.workout_date = date)
