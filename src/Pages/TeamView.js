import { createElement } from "react";
import React from "react";
import { reactApi } from "../fable_modules/Feliz.2.9.0/Interop.fs.js";
import { PromiseBuilder__Delay_62FBFDE1, PromiseBuilder__Run_212F1D4B } from "../fable_modules/Fable.Promise.3.2.0/Promise.fs.js";
import { promise } from "../fable_modules/Fable.Promise.3.2.0/PromiseImpl.fs.js";
import { getDaysInMonth, formatDateString } from "../Utils/DateHelpers.js";
import { groupWorkoutsByUser, getTeamProfiles, getTeamWorkouts } from "../Supabase/Team.js";
import { createObj } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { singleton, append, delay, toList } from "../fable_modules/fable-library-js.4.28.0/Seq.js";
import { printf, toText } from "../fable_modules/fable-library-js.4.28.0/String.js";
import { map, sumBy } from "../fable_modules/fable-library-js.4.28.0/Array.js";
import { ofArray } from "../fable_modules/fable-library-js.4.28.0/List.js";
import { TeamMemberCard } from "../Components/TeamMemberCard.js";

/**
 * Team roster view showing all team members and their monthly workout counts
 */
export function TeamViewPage(teamViewPageInputProps) {
    let elems_4;
    const month = teamViewPageInputProps.month;
    const year = teamViewPageInputProps.year;
    const patternInput = reactApi.useState([]);
    const members = patternInput[0];
    const patternInput_1 = reactApi.useState(true);
    const setLoading = patternInput_1[1];
    const patternInput_2 = reactApi.useState(undefined);
    const setError = patternInput_2[1];
    const dependencies = [year, month];
    reactApi.useEffect(() => {
        setLoading(true);
        setError(undefined);
        const pr = PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (PromiseBuilder__Delay_62FBFDE1(promise, () => {
            const startDate = formatDateString(year, month, 1);
            const endDate = formatDateString(year, month, getDaysInMonth(year, month));
            return getTeamWorkouts(startDate, endDate).then((_arg) => (getTeamProfiles().then((_arg_1) => {
                patternInput[1](groupWorkoutsByUser(_arg, _arg_1));
                setLoading(false);
                return Promise.resolve();
            })));
        }).catch((_arg_2) => {
            setError("팀 데이터를 불러올 수 없습니다");
            setLoading(false);
            return Promise.resolve();
        }))));
        void pr;
    }, dependencies);
    return createElement("div", createObj(ofArray([["className", "space-y-4"], (elems_4 = toList(delay(() => {
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
            let elems_3;
            if (patternInput_1[0]) {
                return singleton(createElement("div", {
                    className: "text-center py-8 text-gray-500",
                    children: "로딩 중...",
                }));
            }
            else {
                const matchValue = patternInput_2[0];
                return (matchValue == null) ? ((members.length === 0) ? singleton(createElement("div", {
                    className: "text-center py-8 text-gray-500",
                    children: "팀원이 없습니다",
                })) : singleton(createElement("div", createObj(ofArray([["className", "space-y-2"], (elems_3 = ofArray(map((m_1) => {
                    let elems_2;
                    return createElement("div", createObj(ofArray([["key", m_1.UserId], (elems_2 = [createElement(TeamMemberCard, m_1)], ["children", reactApi.Children.toArray(Array.from(elems_2))])])));
                }, members)), ["children", reactApi.Children.toArray(Array.from(elems_3))])]))))) : singleton(createElement("div", {
                    className: "text-center py-8 text-red-600",
                    children: matchValue,
                }));
            }
        }));
    })), ["children", reactApi.Children.toArray(Array.from(elems_4))])])));
}

