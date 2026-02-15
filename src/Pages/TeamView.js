import { createElement } from "react";
import React from "react";
import { month, now, year } from "../fable_modules/fable-library-js.4.28.0/Date.js";
import { reactApi } from "../fable_modules/Feliz.2.9.0/Interop.fs.js";
import { PromiseBuilder__Delay_62FBFDE1, PromiseBuilder__Run_212F1D4B } from "../fable_modules/Fable.Promise.3.2.0/Promise.fs.js";
import { promise } from "../fable_modules/Fable.Promise.3.2.0/PromiseImpl.fs.js";
import { getDaysInMonth, formatDateString } from "../Utils/DateHelpers.js";
import { groupWorkoutsByUser, getTeamProfiles, getTeamWorkouts } from "../Supabase/Team.js";
import { createObj } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { singleton, append, delay, toList } from "../fable_modules/fable-library-js.4.28.0/Seq.js";
import { printf, toText } from "../fable_modules/fable-library-js.4.28.0/String.js";
import { ofArray } from "../fable_modules/fable-library-js.4.28.0/List.js";
import { map, sumBy } from "../fable_modules/fable-library-js.4.28.0/Array.js";
import { TeamMemberCard } from "../Components/TeamMemberCard.js";

/**
 * Team roster view showing all team members and their monthly workout counts
 */
export function TeamViewPage() {
    let elems_5;
    let patternInput;
    const initial = year(now()) | 0;
    patternInput = reactApi.useState(initial);
    const setCurrentYear = patternInput[1];
    const currentYear = patternInput[0] | 0;
    let patternInput_1;
    const initial_1 = month(now()) | 0;
    patternInput_1 = reactApi.useState(initial_1);
    const setCurrentMonth = patternInput_1[1];
    const currentMonth = patternInput_1[0] | 0;
    const patternInput_2 = reactApi.useState([]);
    const setMembers = patternInput_2[1];
    const members = patternInput_2[0];
    const patternInput_3 = reactApi.useState(true);
    const setLoading = patternInput_3[1];
    const loading = patternInput_3[0];
    const patternInput_4 = reactApi.useState(undefined);
    const setError = patternInput_4[1];
    const error = patternInput_4[0];
    const goToNextMonth = () => {
        if (currentMonth === 12) {
            setCurrentYear(currentYear + 1);
            setCurrentMonth(1);
        }
        else {
            setCurrentMonth(currentMonth + 1);
        }
    };
    const goToPrevMonth = () => {
        if (currentMonth === 1) {
            setCurrentYear(currentYear - 1);
            setCurrentMonth(12);
        }
        else {
            setCurrentMonth(currentMonth - 1);
        }
    };
    const dependencies = [currentYear, currentMonth];
    reactApi.useEffect(() => {
        setLoading(true);
        setError(undefined);
        const pr = PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (PromiseBuilder__Delay_62FBFDE1(promise, () => {
            const startDate = formatDateString(currentYear, currentMonth, 1);
            const lastDay = getDaysInMonth(currentYear, currentMonth) | 0;
            const endDate = formatDateString(currentYear, currentMonth, lastDay);
            return getTeamWorkouts(startDate, endDate).then((_arg) => {
                const workouts = _arg;
                return getTeamProfiles().then((_arg_1) => {
                    const profiles = _arg_1;
                    const teamMembers = groupWorkoutsByUser(workouts, profiles);
                    setMembers(teamMembers);
                    setLoading(false);
                    return Promise.resolve();
                });
            });
        }).catch((_arg_2) => {
            const ex = _arg_2;
            setError("팀 데이터를 불러올 수 없습니다");
            setLoading(false);
            return Promise.resolve();
        }))));
        void pr;
    }, dependencies);
    return createElement("div", createObj(ofArray([["className", "space-y-4"], (elems_5 = toList(delay(() => {
        let elems;
        return append(singleton(createElement("div", createObj(ofArray([["className", "flex items-center justify-between bg-white rounded-lg shadow-sm p-4"], (elems = [createElement("button", {
            onClick: (_arg_3) => {
                goToPrevMonth();
            },
            className: "p-2 hover:bg-gray-100 rounded-lg transition-colors",
            children: "<",
        }), createElement("h2", {
            className: "text-lg font-semibold text-gray-800",
            children: toText(printf("%d년 %d월"))(currentYear)(currentMonth),
        }), createElement("button", {
            onClick: (_arg_4) => {
                goToNextMonth();
            },
            className: "p-2 hover:bg-gray-100 rounded-lg transition-colors",
            children: ">",
        })], ["children", reactApi.Children.toArray(Array.from(elems))])])))), delay(() => {
            let elems_2, elems_1, arg_2;
            return append(singleton(createElement("div", createObj(ofArray([["className", "bg-white rounded-lg shadow-sm p-4"], (elems_2 = [createElement("div", createObj(ofArray([["className", "flex justify-between text-sm text-gray-600"], (elems_1 = [createElement("span", {
                children: (arg_2 = (members.length | 0), toText(printf("팀원 %d명"))(arg_2)),
            }), createElement("span", createObj(toList(delay(() => {
                const totalWorkouts = sumBy((m) => m.WorkoutCount, members, {
                    GetZero: () => 0,
                    Add: (x, y) => (x + y),
                }) | 0;
                return singleton(["children", toText(printf("총 %d회 운동"))(totalWorkouts)]);
            }))))], ["children", reactApi.Children.toArray(Array.from(elems_1))])])))], ["children", reactApi.Children.toArray(Array.from(elems_2))])])))), delay(() => {
                let elems_4;
                if (loading) {
                    return singleton(createElement("div", {
                        className: "text-center py-8 text-gray-500",
                        children: "로딩 중...",
                    }));
                }
                else {
                    const matchValue = error;
                    if (matchValue == null) {
                        return (members.length === 0) ? singleton(createElement("div", {
                            className: "text-center py-8 text-gray-500",
                            children: "팀원이 없습니다",
                        })) : singleton(createElement("div", createObj(ofArray([["className", "space-y-2"], (elems_4 = ofArray(map((m_1) => {
                            let elems_3;
                            return createElement("div", createObj(ofArray([["key", m_1.UserId], (elems_3 = [createElement(TeamMemberCard, m_1)], ["children", reactApi.Children.toArray(Array.from(elems_3))])])));
                        }, members)), ["children", reactApi.Children.toArray(Array.from(elems_4))])]))));
                    }
                    else {
                        const msg = matchValue;
                        return singleton(createElement("div", {
                            className: "text-center py-8 text-red-600",
                            children: msg,
                        }));
                    }
                }
            }));
        }));
    })), ["children", reactApi.Children.toArray(Array.from(elems_5))])])));
}

