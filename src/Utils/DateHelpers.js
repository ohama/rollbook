import { printf, toText } from "../fable_modules/fable-library-js.4.28.0/String.js";

/**
 * Returns the number of days in a given month (28-31)
 * Uses JavaScript Date: new Date(year, month, 0).getDate()
 * Note: JS months are 0-indexed, so passing month without adjustment gets last day of previous month at that index
 */
export function getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
}

/**
 * Returns the day of week for the first day of the month (0=Sunday, 6=Saturday)
 * Uses JavaScript Date: new Date(year, month-1, 1).getDay()
 * Note: JS months are 0-indexed (0=Jan, 11=Dec) so we subtract 1 from our 1-indexed month
 */
export function getFirstDayOfMonth(year, month) {
    return new Date(year, (month - 1), 1).getDay();
}

/**
 * Returns a date string in YYYY-MM-DD format (matches database DATE format)
 * Uses sprintf for consistent formatting with zero-padding
 */
export function formatDateString(year, month, day) {
    return toText(printf("%04d-%02d-%02d"))(year)(month)(day);
}

/**
 * Returns a formatted month/year string in Korean: "YYYY년 M월"
 */
export function formatMonthYear(year, month) {
    return toText(printf("%d년 %d월"))(year)(month);
}

/**
 * Checks if a given date (YYYY-MM-DD) exists in the workouts array
 */
export function hasWorkout(date, workouts) {
    return workouts.some((w) => (w.workout_date === date));
}

