import { createElement } from "react";
import React from "react";
import { formatMonthYear, getDaysInMonth } from "../Utils/DateHelpers.js";
import { int32ToString, createObj } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { reactApi } from "../fable_modules/Feliz.2.9.0/Interop.fs.js";
import { ofArray } from "../fable_modules/fable-library-js.4.28.0/List.js";
import { printf, toText } from "../fable_modules/fable-library-js.4.28.0/String.js";

export function MonthlyStatsView(monthlyStatsViewInputProps) {
    let elems_3, elems_2, elems, elems_1;
    const month = monthlyStatsViewInputProps.month;
    const year = monthlyStatsViewInputProps.year;
    const workouts = monthlyStatsViewInputProps.workouts;
    const totalWorkouts = workouts.length | 0;
    const daysInMonth = getDaysInMonth(year, month) | 0;
    const workoutPercentage = (daysInMonth === 0) ? 0 : ((totalWorkouts / daysInMonth) * 100);
    return createElement("div", createObj(ofArray([["className", "bg-white rounded-lg p-6 shadow-sm"], (elems_3 = [createElement("div", {
        className: "text-lg font-semibold text-gray-800 mb-4",
        children: formatMonthYear(year, month),
    }), createElement("div", createObj(ofArray([["className", "grid grid-cols-2 gap-4"], (elems_2 = [createElement("div", createObj(ofArray([["className", "text-center"], (elems = [createElement("div", {
        className: "text-3xl font-bold text-indigo-600",
        children: int32ToString(totalWorkouts),
    }), createElement("div", {
        className: "text-sm text-gray-600",
        children: "운동 횟수",
    })], ["children", reactApi.Children.toArray(Array.from(elems))])]))), createElement("div", createObj(ofArray([["className", "text-center"], (elems_1 = [createElement("div", {
        className: "text-3xl font-bold text-green-600",
        children: toText(printf("%.0f%%"))(workoutPercentage),
    }), createElement("div", {
        className: "text-sm text-gray-600",
        children: "달성률",
    })], ["children", reactApi.Children.toArray(Array.from(elems_1))])])))], ["children", reactApi.Children.toArray(Array.from(elems_2))])])))], ["children", reactApi.Children.toArray(Array.from(elems_3))])])));
}

