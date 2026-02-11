import { createElement } from "react";
import React from "react";
import { sortByDescending } from "../fable_modules/fable-library-js.4.28.0/Array.js";
import { createObj, comparePrimitives } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { map, singleton, delay, toList } from "../fable_modules/fable-library-js.4.28.0/Seq.js";
import { reactApi } from "../fable_modules/Feliz.2.9.0/Interop.fs.js";
import { ofArray } from "../fable_modules/fable-library-js.4.28.0/List.js";

export function WorkoutListView(workoutListViewInputProps) {
    let elems_1;
    const workouts = workoutListViewInputProps.workouts;
    const sortedWorkouts = sortByDescending((w) => w.workout_date, workouts, {
        Compare: comparePrimitives,
    });
    return createElement("div", createObj(ofArray([["className", "space-y-2"], (elems_1 = toList(delay(() => ((sortedWorkouts.length === 0) ? singleton(createElement("div", {
        className: "text-center text-gray-500 py-8",
        children: "운동 기록이 없습니다",
    })) : map((workout) => {
        let elems;
        return createElement("div", createObj(ofArray([["key", workout.workout_date], ["className", "bg-white rounded-lg p-4 shadow-sm flex items-center gap-3"], (elems = [createElement("div", {
            className: "text-2xl",
            children: "💪",
        }), createElement("div", {
            className: "text-gray-800 font-medium flex-1",
            children: workout.workout_date,
        }), createElement("div", {
            className: "flex gap-2",
        })], ["children", reactApi.Children.toArray(Array.from(elems))])])));
    }, sortedWorkouts)))), ["children", reactApi.Children.toArray(Array.from(elems_1))])])));
}

