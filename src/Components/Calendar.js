import { Record } from "../fable_modules/fable-library-js.4.28.0/Types.js";
import { record_type, option_type, bool_type, string_type, int32_type } from "../fable_modules/fable-library-js.4.28.0/Reflection.js";
import { tryFind, ofArray } from "../fable_modules/fable-library-js.4.28.0/Map.js";
import { mapIndexed, map } from "../fable_modules/fable-library-js.4.28.0/Array.js";
import { Array_groupBy } from "../fable_modules/fable-library-js.4.28.0/Seq2.js";
import { int32ToString, createObj, comparePrimitives, stringHash } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { createElement } from "react";
import React from "react";
import { formatMonthYear, hasWorkout, formatDateString, getFirstDayOfMonth, getDaysInMonth } from "../Utils/DateHelpers.js";
import { getTodayDateString } from "../Supabase/Workouts.js";
import { singleton, empty, append, map as map_1, delay, toList, toArray } from "../fable_modules/fable-library-js.4.28.0/Seq.js";
import { rangeDouble } from "../fable_modules/fable-library-js.4.28.0/Range.js";
import { reactApi } from "../fable_modules/Feliz.2.9.0/Interop.fs.js";
import { ofArray as ofArray_1 } from "../fable_modules/fable-library-js.4.28.0/List.js";
import { defaultArg } from "../fable_modules/fable-library-js.4.28.0/Option.js";
import { defaultOf } from "../fable_modules/fable-library-js.4.28.0/Util.js";

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

/**
 * Count records grouped by date (workout + text + photo)
 */
export function countRecordsByDate(workouts) {
    return ofArray(map((tupledArg) => [tupledArg[0], tupledArg[1].length], Array_groupBy((w) => w.workout_date, workouts, {
        Equals: (x, y) => (x === y),
        GetHashCode: stringHash,
    })), {
        Compare: comparePrimitives,
    });
}

export function CalendarGrid(calendarGridInputProps) {
    let elems_4, elems, elems_1, elems_3;
    const onDateClick = calendarGridInputProps.onDateClick;
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
    const countMap = countRecordsByDate(workouts);
    return createElement("div", createObj(ofArray_1([["className", "space-y-2"], (elems_4 = [createElement("div", createObj(ofArray_1([["className", "flex justify-between items-center mb-4"], (elems = [createElement("button", {
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
    })], ["children", reactApi.Children.toArray(Array.from(elems))])]))), createElement("div", createObj(ofArray_1([["className", "grid grid-cols-7 gap-1 text-center text-sm font-semibold text-gray-600 mb-2"], (elems_1 = [createElement("div", {
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
    })], ["children", reactApi.Children.toArray(Array.from(elems_1))])]))), createElement("div", createObj(ofArray_1([["className", "grid grid-cols-7 gap-1"], (elems_3 = toList(delay(() => map_1((dayRecord) => createElement("button", createObj(toList(delay(() => {
        let matchValue;
        return append((matchValue = dayRecord.GridColumnStart, (matchValue == null) ? (empty()) : singleton(["style", {
            gridColumnStart: matchValue,
        }])), delay(() => append(singleton(["onClick", (_arg_2) => {
            onDateClick(dayRecord.DateString);
        }]), delay(() => append(singleton(["className", ("aspect-square flex items-center justify-center rounded-lg relative transition-colors " + (dayRecord.IsToday ? "border-2 border-indigo-600 font-bold " : "")) + (dayRecord.HasWorkout ? "bg-green-100 text-green-800 hover:bg-green-200" : "text-gray-700 hover:bg-gray-100")]), delay(() => {
            let elems_2;
            return singleton((elems_2 = toList(delay(() => append(singleton(createElement("span", {
                children: int32ToString(dayRecord.Day),
            })), delay(() => {
                let value_47;
                const count = defaultArg(tryFind(dayRecord.DateString, countMap), 0) | 0;
                return (count > 0) ? singleton(createElement("div", createObj(ofArray_1([(value_47 = "absolute top-1 right-1 bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold", ["className", value_47]), ["children", int32ToString(count)]])))) : singleton(defaultOf());
            })))), ["children", reactApi.Children.toArray(Array.from(elems_2))]));
        }))))));
    })))), calendarDays))), ["children", reactApi.Children.toArray(Array.from(elems_3))])])))], ["children", reactApi.Children.toArray(Array.from(elems_4))])])));
}

