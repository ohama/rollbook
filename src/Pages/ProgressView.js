import { Union } from "../fable_modules/fable-library-js.4.28.0/Types.js";
import { union_type } from "../fable_modules/fable-library-js.4.28.0/Reflection.js";
import { createElement } from "react";
import React from "react";
import { reactApi } from "../fable_modules/Feliz.2.9.0/Interop.fs.js";
import { PromiseBuilder__Delay_62FBFDE1, PromiseBuilder__Run_212F1D4B } from "../fable_modules/Fable.Promise.3.2.0/Promise.fs.js";
import { promise } from "../fable_modules/Fable.Promise.3.2.0/PromiseImpl.fs.js";
import { getDaysInMonth, formatDateString } from "../Utils/DateHelpers.js";
import { getWorkouts } from "../Supabase/Workouts.js";
import { equals, createObj } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { singleton, append, delay, toList } from "../fable_modules/fable-library-js.4.28.0/Seq.js";
import { ofArray } from "../fable_modules/fable-library-js.4.28.0/List.js";
import { MonthlyStatsView } from "../Components/MonthlyStats.js";
import { value as value_27 } from "../fable_modules/fable-library-js.4.28.0/Option.js";
import { WorkoutListView } from "../Components/WorkoutList.js";
import { CalendarGrid } from "../Components/Calendar.js";

export class ViewMode extends Union {
    constructor(tag, fields) {
        super();
        this.tag = tag;
        this.fields = fields;
    }
    cases() {
        return ["Calendar", "List"];
    }
}

export function ViewMode_$reflection() {
    return union_type("Pages.ProgressView.ViewMode", [], ViewMode, () => [[], []]);
}

export function ProgressViewPage(progressViewPageInputProps) {
    let elems_2;
    const month = progressViewPageInputProps.month;
    const year = progressViewPageInputProps.year;
    const userId = progressViewPageInputProps.userId;
    const patternInput = reactApi.useState(new ViewMode(0, []));
    const viewMode = patternInput[0];
    const setViewMode = patternInput[1];
    const patternInput_1 = reactApi.useState([]);
    const workouts = patternInput_1[0];
    const patternInput_2 = reactApi.useState(true);
    const setLoading = patternInput_2[1];
    const patternInput_3 = reactApi.useState(undefined);
    const setError = patternInput_3[1];
    const error = patternInput_3[0];
    const dependencies = [year, month];
    reactApi.useEffect(() => {
        const pr = PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (PromiseBuilder__Delay_62FBFDE1(promise, () => {
            setLoading(true);
            setError(undefined);
            const startDate = formatDateString(year, month, 1);
            const endDate = formatDateString(year, month, getDaysInMonth(year, month));
            return getWorkouts(userId, startDate, endDate).then((_arg) => {
                patternInput_1[1](_arg);
                setLoading(false);
                return Promise.resolve();
            });
        }).catch((_arg_1) => {
            setError("운동 기록을 불러올 수 없습니다");
            setLoading(false);
            return Promise.resolve();
        }))));
        void pr;
    }, dependencies);
    return createElement("div", createObj(ofArray([["className", "max-w-4xl mx-auto px-4 py-8"], (elems_2 = toList(delay(() => {
        let elems;
        return append(singleton(createElement("div", createObj(ofArray([["className", "flex gap-2 mb-4"], (elems = [createElement("button", {
            onClick: (_arg_2) => {
                setViewMode(new ViewMode(0, []));
            },
            className: "px-4 py-2 rounded-lg font-medium transition-colors " + (equals(viewMode, new ViewMode(0, [])) ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"),
            children: "달력",
        }), createElement("button", {
            onClick: (_arg_3) => {
                setViewMode(new ViewMode(1, []));
            },
            className: "px-4 py-2 rounded-lg font-medium transition-colors " + (equals(viewMode, new ViewMode(1, [])) ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"),
            children: "목록",
        })], ["children", reactApi.Children.toArray(Array.from(elems))])])))), delay(() => {
            let elems_1;
            return append(singleton(createElement("div", createObj(ofArray([["className", "mb-6"], (elems_1 = [createElement(MonthlyStatsView, {
                workouts: workouts,
                year: year,
                month: month,
            })], ["children", reactApi.Children.toArray(Array.from(elems_1))])])))), delay(() => (patternInput_2[0] ? singleton(createElement("div", {
                className: "text-center text-gray-600 py-8",
                children: "로딩 중...",
            })) : ((error != null) ? singleton(createElement("div", {
                className: "text-center text-red-600 py-8",
                children: value_27(error),
            })) : ((viewMode.tag === 1) ? singleton(createElement(WorkoutListView, {
                workouts: workouts,
            })) : singleton(createElement(CalendarGrid, {
                userId: userId,
                year: year,
                month: month,
                workouts: workouts,
                onPrevMonth: () => {
                },
                onNextMonth: () => {
                },
                onDateClick: (_arg_4) => {
                },
            })))))));
        }));
    })), ["children", reactApi.Children.toArray(Array.from(elems_2))])])));
}

