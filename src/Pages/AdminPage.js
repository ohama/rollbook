import { Record, Union } from "../fable_modules/fable-library-js.4.28.0/Types.js";
import { ProfileRecord_$reflection } from "../Supabase/Types.js";
import { record_type, union_type, class_type, int32_type, string_type, array_type } from "../fable_modules/fable-library-js.4.28.0/Reflection.js";
import { createElement } from "react";
import React from "react";
import { reactApi } from "../fable_modules/Feliz.2.9.0/Interop.fs.js";
import { PromiseBuilder__Delay_62FBFDE1, PromiseBuilder__Run_212F1D4B } from "../fable_modules/Fable.Promise.3.2.0/Promise.fs.js";
import { promise } from "../fable_modules/Fable.Promise.3.2.0/PromiseImpl.fs.js";
import { deleteProfile, getAllProfiles, isAdmin } from "../Supabase/Admin.js";
import { month, year, now as now_1 } from "../fable_modules/fable-library-js.4.28.0/Date.js";
import { getDaysInMonth, formatDateString } from "../Utils/DateHelpers.js";
import { getAllWorkouts } from "../Supabase/Workouts.js";
import { ofArray } from "../fable_modules/fable-library-js.4.28.0/Map.js";
import { tryFind, map } from "../fable_modules/fable-library-js.4.28.0/Array.js";
import { Array_groupBy, Array_distinct } from "../fable_modules/fable-library-js.4.28.0/Seq2.js";
import { createObj, comparePrimitives, stringHash } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { singleton, append, delay, toList } from "../fable_modules/fable-library-js.4.28.0/Seq.js";
import { ofArray as ofArray_1 } from "../fable_modules/fable-library-js.4.28.0/List.js";
import { MemberList } from "../admin/MemberList.js";
import { defaultArg } from "../fable_modules/fable-library-js.4.28.0/Option.js";
import { defaultOf } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { DeleteConfirmModal } from "../admin/MemberActions.js";
import { printf, toText } from "../fable_modules/fable-library-js.4.28.0/String.js";

export class AdminState extends Union {
    constructor(tag, fields) {
        super();
        this.tag = tag;
        this.fields = fields;
    }
    cases() {
        return ["Loading", "NotAdmin", "Ready", "Error"];
    }
}

export function AdminState_$reflection() {
    return union_type("Pages.AdminPage.AdminState", [], AdminState, () => [[], [], [["profiles", array_type(ProfileRecord_$reflection())], ["workoutCounts", class_type("Microsoft.FSharp.Collections.FSharpMap`2", [string_type, int32_type])]], [["message", string_type]]]);
}

export class DeleteTarget extends Record {
    constructor(userId, displayName) {
        super();
        this.userId = userId;
        this.displayName = displayName;
    }
}

export function DeleteTarget_$reflection() {
    return record_type("Pages.AdminPage.DeleteTarget", [], DeleteTarget, () => [["userId", string_type], ["displayName", string_type]]);
}

export function AdminPage(adminPageInputProps) {
    let elems_5, elems_4;
    const onBack = adminPageInputProps.onBack;
    const patternInput = reactApi.useState(new AdminState(0, []));
    const state = patternInput[0];
    const setState = patternInput[1];
    const patternInput_1 = reactApi.useState(undefined);
    const setDeleteTarget = patternInput_1[1];
    const deleteTarget = patternInput_1[0];
    const patternInput_2 = reactApi.useState(0);
    const refreshKey = patternInput_2[0] | 0;
    const dependencies = [refreshKey];
    reactApi.useEffect(() => {
        const pr = PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (isAdmin().then((_arg) => {
            if (!_arg) {
                setState(new AdminState(1, []));
                return Promise.resolve();
            }
            else {
                return getAllProfiles().then((_arg_1) => {
                    const profilesResult = _arg_1;
                    const now = now_1();
                    const startDate = formatDateString(year(now), month(now), 1);
                    const endDate = formatDateString(year(now), month(now), getDaysInMonth(year(now), month(now)));
                    return getAllWorkouts(startDate, endDate).then((_arg_2) => {
                        const counts = ofArray(map((tupledArg) => {
                            let array_3;
                            return [tupledArg[0], (array_3 = Array_distinct(map((r) => r.workout_date, tupledArg[1]), {
                                Equals: (x_1, y_1) => (x_1 === y_1),
                                GetHashCode: stringHash,
                            }), array_3.length)];
                        }, Array_groupBy((w) => w.user_id, _arg_2, {
                            Equals: (x, y) => (x === y),
                            GetHashCode: stringHash,
                        })), {
                            Compare: comparePrimitives,
                        });
                        if (profilesResult.tag === 1) {
                            setState(new AdminState(3, [profilesResult.fields[0]]));
                            return Promise.resolve();
                        }
                        else {
                            setState(new AdminState(2, [profilesResult.fields[0], counts]));
                            return Promise.resolve();
                        }
                    });
                });
            }
        }))));
        void pr;
    }, dependencies);
    return createElement("div", createObj(ofArray_1([["className", "min-h-screen bg-gray-100 p-4"], (elems_5 = [createElement("div", createObj(ofArray_1([["className", "max-w-2xl mx-auto"], (elems_4 = toList(delay(() => {
        let elems;
        return append(singleton(createElement("button", createObj(ofArray_1([["onClick", (_arg_4) => {
            onBack();
        }], ["className", "mb-4 text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"], (elems = [createElement("span", {
            children: "<",
        }), createElement("span", {
            children: "돌아가기",
        })], ["children", reactApi.Children.toArray(Array.from(elems))])])))), delay(() => append(singleton(createElement("h1", {
            className: "text-2xl font-bold mb-6",
            children: "관리자",
        })), delay(() => {
            let matchValue_1, elems_2, elems_3, elems_1;
            return append((matchValue_1 = state, (matchValue_1.tag === 1) ? singleton(createElement("div", createObj(ofArray_1([["className", "bg-red-50 border border-red-200 rounded-lg p-6 text-center"], (elems_2 = [createElement("p", {
                className: "text-red-600 font-medium",
                children: "접근 권한이 없습니다.",
            })], ["children", reactApi.Children.toArray(Array.from(elems_2))])])))) : ((matchValue_1.tag === 3) ? singleton(createElement("div", createObj(ofArray_1([["className", "bg-red-50 border border-red-200 rounded-lg p-4"], (elems_3 = [createElement("p", {
                className: "text-red-600",
                children: matchValue_1.fields[0],
            })], ["children", reactApi.Children.toArray(Array.from(elems_3))])])))) : ((matchValue_1.tag === 2) ? singleton(createElement(MemberList, {
                profiles: matchValue_1.fields[0],
                workoutCounts: matchValue_1.fields[1],
                onDelete: (userId) => {
                    if (state.tag === 2) {
                        const matchValue = tryFind((p) => (p.id === userId), state.fields[0]);
                        if (matchValue == null) {
                        }
                        else {
                            const profile = matchValue;
                            setDeleteTarget(new DeleteTarget(userId, defaultArg(profile.display_name, profile.email)));
                        }
                    }
                },
            })) : singleton(createElement("div", createObj(ofArray_1([["className", "text-center py-8"], (elems_1 = [createElement("p", {
                className: "text-gray-500",
                children: "로딩 중...",
            })], ["children", reactApi.Children.toArray(Array.from(elems_1))])]))))))), delay(() => {
                const matchValue_2 = deleteTarget;
                if (matchValue_2 == null) {
                    return singleton(defaultOf());
                }
                else {
                    const target_1 = matchValue_2;
                    return singleton(createElement(DeleteConfirmModal, {
                        memberName: target_1.displayName,
                        onConfirm: () => {
                            if (deleteTarget == null) {
                            }
                            else {
                                const target = deleteTarget;
                                const pr_1 = PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (deleteProfile(target.userId).then((_arg_3) => {
                                    const result = _arg_3;
                                    if (result.tag === 1) {
                                        setState(new AdminState(3, [toText(printf("삭제 실패: %s"))(result.fields[0])]));
                                        setDeleteTarget(undefined);
                                        return Promise.resolve();
                                    }
                                    else {
                                        setDeleteTarget(undefined);
                                        patternInput_2[1](refreshKey + 1);
                                        return Promise.resolve();
                                    }
                                }))));
                                void pr_1;
                            }
                        },
                        onCancel: () => {
                            setDeleteTarget(undefined);
                        },
                    }));
                }
            }));
        }))));
    })), ["children", reactApi.Children.toArray(Array.from(elems_4))])])))], ["children", reactApi.Children.toArray(Array.from(elems_5))])])));
}

