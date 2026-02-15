import { Record } from "../fable_modules/fable-library-js.4.28.0/Types.js";
import { record_type, option_type, bool_type, string_type, int32_type } from "../fable_modules/fable-library-js.4.28.0/Reflection.js";
import { createElement } from "react";
import React from "react";
import { formatMonthYear, hasWorkout, formatDateString, getFirstDayOfMonth, getDaysInMonth } from "../Utils/DateHelpers.js";
import { getTodayDateString } from "../Supabase/Workouts.js";
import { mapIndexed } from "../fable_modules/fable-library-js.4.28.0/Array.js";
import { singleton, empty, append, map, delay, toList, toArray } from "../fable_modules/fable-library-js.4.28.0/Seq.js";
import { rangeDouble } from "../fable_modules/fable-library-js.4.28.0/Range.js";
import { int32ToString, createObj } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { reactApi } from "../fable_modules/Feliz.2.9.0/Interop.fs.js";
import { ofArray } from "../fable_modules/fable-library-js.4.28.0/List.js";

export class CalendarDay extends Record {
    constructor(Day, DateString, HasWorkout, IsToday, GridColumnStart) {
        super();
        this.Day = (Day | 0);
        this.DateString = DateString;
        this.HasWorkout = HasWorkout;
        this.IsToday = IsToday;
        this.GridColumnStart = GridColumnStart;
    }
}

export function CalendarDay_$reflection() {
    return record_type("Components.Calendar.CalendarDay", [], CalendarDay, () => [["Day", int32_type], ["DateString", string_type], ["HasWorkout", bool_type], ["IsToday", bool_type], ["GridColumnStart", option_type(int32_type)]]);
}

export function CalendarGrid(calendarGridInputProps) {
    let elems_3, elems, elems_1, elems_2;
    const onNextMonth = calendarGridInputProps.onNextMonth;
    const onPrevMonth = calendarGridInputProps.onPrevMonth;
    const workouts = calendarGridInputProps.workouts;
    const month = calendarGridInputProps.month;
    const year = calendarGridInputProps.year;
    const userId = calendarGridInputProps.userId;
    const daysInMonth = getDaysInMonth(year, month) | 0;
    const firstDayOfWeek = getFirstDayOfMonth(year, month) | 0;
    const todayString = getTodayDateString();
    const calendarDays = mapIndexed((i, day) => {
        const dateString = formatDateString(year, month, day);
        return new CalendarDay(day, dateString, hasWorkout(dateString, workouts), dateString === todayString, (i === 0) ? (firstDayOfWeek + 1) : undefined);
    }, toArray(rangeDouble(1, 1, daysInMonth)));
    return createElement("div", createObj(ofArray([["className", "space-y-2"], (elems_3 = [createElement("div", createObj(ofArray([["className", "flex justify-between items-center mb-4"], (elems = [createElement("button", {
        onClick: (_arg) => {
            onPrevMonth();
        },
        className: "px-3 py-1 rounded-lg text-gray-600 hover:bg-gray-100 font-medium",
        children: "← 이전",
    }), createElement("h2", {
        className: "text-lg font-semibold text-gray-800",
        children: formatMonthYear(year, month),
    }), createElement("button", {
        onClick: (_arg_1) => {
            onNextMonth();
        },
        className: "px-3 py-1 rounded-lg text-gray-600 hover:bg-gray-100 font-medium",
        children: "다음 →",
    })], ["children", reactApi.Children.toArray(Array.from(elems))])]))), createElement("div", createObj(ofArray([["className", "grid grid-cols-7 gap-1 text-center text-sm font-semibold text-gray-600 mb-2"], (elems_1 = [createElement("div", {
        children: "일",
    }), createElement("div", {
        children: "월",
    }), createElement("div", {
        children: "화",
    }), createElement("div", {
        children: "수",
    }), createElement("div", {
        children: "목",
    }), createElement("div", {
        children: "금",
    }), createElement("div", {
        children: "토",
    })], ["children", reactApi.Children.toArray(Array.from(elems_1))])]))), createElement("div", createObj(ofArray([["className", "grid grid-cols-7 gap-1"], (elems_2 = toList(delay(() => map((dayRecord) => createElement("div", createObj(toList(delay(() => {
        let matchValue, col;
        return append((matchValue = dayRecord.GridColumnStart, (matchValue == null) ? (empty()) : ((col = (matchValue | 0), singleton(["style", {
            gridColumnStart: col,
        }])))), delay(() => append(singleton(["className", ("aspect-square flex items-center justify-center rounded-lg " + (dayRecord.IsToday ? "border-2 border-indigo-600 font-bold " : "")) + (dayRecord.HasWorkout ? "bg-green-100 text-green-800" : "text-gray-700")]), delay(() => singleton(["children", int32ToString(dayRecord.Day)])))));
    })))), calendarDays))), ["children", reactApi.Children.toArray(Array.from(elems_2))])])))], ["children", reactApi.Children.toArray(Array.from(elems_3))])])));
}

