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
import { map as map_1, singleton, append, delay, toList } from "../fable_modules/fable-library-js.4.28.0/Seq.js";
import { printf, toText } from "../fable_modules/fable-library-js.4.28.0/String.js";
import { ofArray } from "../fable_modules/fable-library-js.4.28.0/List.js";
import { TeamDayDetailView } from "../Components/TeamDayDetailView.js";
import { RecordItem } from "../Components/RecordItem.js";
import { defaultOf } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { PhotoModal } from "../Components/PhotoModal.js";
import { CalendarGrid } from "../Components/Calendar.js";

export class CalendarViewState extends Union {
    constructor(tag, fields) {
        super();
        this.tag = tag;
        this.fields = fields;
    }
    cases() {
        return ["CalendarView", "DailyDetailView", "UserDetailView"];
    }
}

export function CalendarViewState_$reflection() {
    return union_type("Pages.TeamView.CalendarViewState", [], CalendarViewState, () => [[], [["selectedDate", string_type]], [["selectedDate", string_type], ["userId", string_type]]]);
}

/**
 * Team roster view showing all team members and their monthly workout counts
 */
export function TeamViewPage(teamViewPageInputProps) {
    let elems_5;
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
    const selectedDateRecords = patternInput_4[0];
    const patternInput_5 = reactApi.useState([]);
    const patternInput_6 = reactApi.useState(undefined);
    const setExpandedPhotoUrl = patternInput_6[1];
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
    return createElement("div", createObj(ofArray([["className", "space-y-4"], (elems_5 = toList(delay(() => {
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
            let elems_4;
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
                    switch (matchValue_1.tag) {
                        case 1: {
                            const selectedDate = matchValue_1.fields[0];
                            return singleton(createElement(TeamDayDetailView, {
                                selectedDate: selectedDate,
                                records: selectedDateRecords,
                                onBack: () => {
                                    setCalendarViewState(new CalendarViewState(0, []));
                                },
                                onUserClick: (userId) => {
                                    setCalendarViewState(new CalendarViewState(2, [selectedDate, userId]));
                                },
                            }));
                        }
                        case 2: {
                            const selectedDate_1 = matchValue_1.fields[0];
                            const userRecords = selectedDateRecords.filter((r) => (r.user_id === matchValue_1.fields[1]));
                            return singleton(createElement("div", createObj(ofArray([["className", "space-y-4"], (elems_4 = toList(delay(() => {
                                let elems_2, value_25;
                                return append(singleton(createElement("div", createObj(ofArray([["className", "flex items-center gap-3 mb-4"], (elems_2 = [createElement("button", createObj(ofArray([["onClick", (_arg_6) => {
                                    setCalendarViewState(new CalendarViewState(1, [selectedDate_1]));
                                }], (value_25 = "w-11 h-11 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition-colors", ["className", value_25]), ["children", "←"]]))), createElement("h2", {
                                    className: "text-lg font-semibold text-gray-800",
                                    children: toText(printf("%s - 상세 기록"))(selectedDate_1),
                                })], ["children", reactApi.Children.toArray(Array.from(elems_2))])])))), delay(() => {
                                    let elems_3;
                                    return append((userRecords.length === 0) ? singleton(createElement("div", {
                                        className: "text-center text-gray-400 py-8",
                                        children: "기록이 없습니다",
                                    })) : singleton(createElement("div", createObj(ofArray([["className", "space-y-2"], (elems_3 = toList(delay(() => map_1((record) => createElement(RecordItem, {
                                        record: record,
                                        currentUserId: "",
                                        onEdit: (_arg_7) => {
                                        },
                                        onDelete: (_arg_8) => {
                                        },
                                        onPhotoClick: (url) => {
                                            setExpandedPhotoUrl(url);
                                        },
                                    }), userRecords))), ["children", reactApi.Children.toArray(Array.from(elems_3))])])))), delay(() => {
                                        const matchValue_2 = patternInput_6[0];
                                        if (matchValue_2 == null) {
                                            return singleton(defaultOf());
                                        }
                                        else {
                                            const url_1 = matchValue_2;
                                            return singleton(createElement(PhotoModal, {
                                                photoUrl: url_1,
                                                onClose: () => {
                                                    setExpandedPhotoUrl(undefined);
                                                },
                                            }));
                                        }
                                    }));
                                }));
                            })), ["children", reactApi.Children.toArray(Array.from(elems_4))])]))));
                        }
                        default:
                            return singleton(createElement(CalendarGrid, {
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
                                onDateDoubleClick: (_arg_5) => {
                                },
                            }));
                    }
                }
                else {
                    return singleton(createElement("div", {
                        className: "text-center py-8 text-red-600",
                        children: matchValue,
                    }));
                }
            }
        }));
    })), ["children", reactApi.Children.toArray(Array.from(elems_5))])])));
}

