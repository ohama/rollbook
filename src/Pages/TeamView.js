import { Union } from "../fable_modules/fable-library-js.4.28.0/Types.js";
import { union_type, string_type } from "../fable_modules/fable-library-js.4.28.0/Reflection.js";
import { createElement } from "react";
import React from "react";
import { reactApi } from "../fable_modules/Feliz.2.9.0/Interop.fs.js";
import { PromiseBuilder__Delay_62FBFDE1, PromiseBuilder__Run_212F1D4B } from "../fable_modules/Fable.Promise.3.2.0/Promise.fs.js";
import { promise } from "../fable_modules/Fable.Promise.3.2.0/PromiseImpl.fs.js";
import { getDaysInMonth, formatDateString } from "../Utils/DateHelpers.js";
import { getTeamWorkoutsForDate, groupWorkoutsByUser, getTeamProfiles, getTeamWorkouts } from "../Supabase/Team.js";
import { sumBy, map } from "../fable_modules/fable-library-js.4.28.0/Array.js";
import { WorkoutRecord } from "../Supabase/Types.js";
import { createObj } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { singleton, append, delay, toList } from "../fable_modules/fable-library-js.4.28.0/Seq.js";
import { printf, toText } from "../fable_modules/fable-library-js.4.28.0/String.js";
import { ofArray } from "../fable_modules/fable-library-js.4.28.0/List.js";
import { DailyDetailView } from "../Components/DailyDetailView.js";
import { CalendarGrid } from "../Components/Calendar.js";

export class CalendarViewState extends Union {
    constructor(tag, fields) {
        super();
        this.tag = tag;
        this.fields = fields;
    }
    cases() {
        return ["CalendarView", "DailyDetailView"];
    }
}

export function CalendarViewState_$reflection() {
    return union_type("Pages.TeamView.CalendarViewState", [], CalendarViewState, () => [[], [["selectedDate", string_type]]]);
}

/**
 * Team roster view showing all team members and their monthly workout counts
 */
export function TeamViewPage(teamViewPageInputProps) {
    let elems_2;
    const month = teamViewPageInputProps.month;
    const year = teamViewPageInputProps.year;
    const patternInput = reactApi.useState([]);
    const members = patternInput[0];
    const patternInput_1 = reactApi.useState(true);
    const setLoading = patternInput_1[1];
    const patternInput_2 = reactApi.useState(undefined);
    const setError = patternInput_2[1];
    const patternInput_3 = reactApi.useState(new CalendarViewState(0, []));
    const setCalendarViewState = patternInput_3[1];
    const patternInput_4 = reactApi.useState([]);
    const patternInput_5 = reactApi.useState([]);
    const dependencies = [year, month];
    reactApi.useEffect(() => {
        setLoading(true);
        setError(undefined);
        setCalendarViewState(new CalendarViewState(0, []));
        const pr = PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (PromiseBuilder__Delay_62FBFDE1(promise, () => {
            const startDate = formatDateString(year, month, 1);
            const endDate = formatDateString(year, month, getDaysInMonth(year, month));
            return getTeamWorkouts(startDate, endDate).then((_arg) => {
                const workouts = _arg;
                return getTeamProfiles().then((_arg_1) => {
                    patternInput_5[1](map((w) => (new WorkoutRecord(0, w.user_id, w.workout_date, "workout", undefined, undefined, undefined, undefined, undefined)), workouts));
                    patternInput[1](groupWorkoutsByUser(workouts, _arg_1));
                    setLoading(false);
                    return Promise.resolve();
                });
            });
        }).catch((_arg_2) => {
            setError("팀 데이터를 불러올 수 없습니다");
            setLoading(false);
            return Promise.resolve();
        }))));
        void pr;
    }, dependencies);
    return createElement("div", createObj(ofArray([["className", "space-y-4"], (elems_2 = toList(delay(() => {
        let elems_1, elems, arg;
        return append(singleton(createElement("div", createObj(ofArray([["className", "bg-white rounded-lg shadow-sm p-4"], (elems_1 = [createElement("div", createObj(ofArray([["className", "flex justify-between text-sm text-gray-600"], (elems = [createElement("span", {
            children: (arg = (members.length | 0), toText(printf("팀원 %d명"))(arg)),
        }), createElement("span", createObj(toList(delay(() => {
            const totalWorkouts = sumBy((m) => m.WorkoutCount, members, {
                GetZero: () => 0,
                Add: (x, y) => (x + y),
            }) | 0;
            return singleton(["children", toText(printf("총 %d회 운동"))(totalWorkouts)]);
        }))))], ["children", reactApi.Children.toArray(Array.from(elems))])])))], ["children", reactApi.Children.toArray(Array.from(elems_1))])])))), delay(() => {
            if (patternInput_1[0]) {
                return singleton(createElement("div", {
                    className: "text-center py-8 text-gray-500",
                    children: "로딩 중...",
                }));
            }
            else {
                const matchValue = patternInput_2[0];
                if (matchValue == null) {
                    const matchValue_1 = patternInput_3[0];
                    return (matchValue_1.tag === 1) ? singleton(createElement(DailyDetailView, {
                        selectedDate: matchValue_1.fields[0],
                        records: patternInput_4[0],
                        currentUserId: "",
                        onBack: () => {
                            setCalendarViewState(new CalendarViewState(0, []));
                        },
                        onEdit: (_arg_5) => {
                        },
                        onDelete: (_arg_6) => {
                        },
                    })) : singleton(createElement(CalendarGrid, {
                        userId: "",
                        year: year,
                        month: month,
                        workouts: patternInput_5[0],
                        onPrevMonth: () => {
                        },
                        onNextMonth: () => {
                        },
                        onDateClick: (dateString) => {
                            const pr_1 = PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (PromiseBuilder__Delay_62FBFDE1(promise, () => (getTeamWorkoutsForDate(dateString).then((_arg_3) => {
                                patternInput_4[1](_arg_3);
                                setCalendarViewState(new CalendarViewState(1, [dateString]));
                                return Promise.resolve();
                            }))).catch((_arg_4) => {
                                return Promise.resolve();
                            }))));
                            void pr_1;
                        },
                    }));
                }
                else {
                    return singleton(createElement("div", {
                        className: "text-center py-8 text-red-600",
                        children: matchValue,
                    }));
                }
            }
        }));
    })), ["children", reactApi.Children.toArray(Array.from(elems_2))])])));
}

