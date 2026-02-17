import { Record, Union } from "../fable_modules/fable-library-js.4.28.0/Types.js";
import { WorkoutRecord_$reflection, ProfileRecord_$reflection } from "../Supabase/Types.js";
import { record_type, union_type, string_type, array_type } from "../fable_modules/fable-library-js.4.28.0/Reflection.js";
import { createElement } from "react";
import React from "react";
import { reactApi } from "../fable_modules/Feliz.2.9.0/Interop.fs.js";
import { PromiseBuilder__Delay_62FBFDE1, PromiseBuilder__Run_212F1D4B } from "../fable_modules/Fable.Promise.3.2.0/Promise.fs.js";
import { promise } from "../fable_modules/Fable.Promise.3.2.0/PromiseImpl.fs.js";
import { deleteProfile, getAllProfiles, isAdmin } from "../Supabase/Admin.js";
import { getDeletedWorkouts } from "../Supabase/Audit.js";
import { createObj } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { map, singleton, append, delay, toList } from "../fable_modules/fable-library-js.4.28.0/Seq.js";
import { ofArray } from "../fable_modules/fable-library-js.4.28.0/List.js";
import { MemberList } from "../admin/MemberList.js";
import { tryFind } from "../fable_modules/fable-library-js.4.28.0/Array.js";
import { defaultArg } from "../fable_modules/fable-library-js.4.28.0/Option.js";
import { AdminRoleManager } from "../Components/AdminRoleManager.js";
import { AuditLogList } from "../Components/AuditLogList.js";
import { printf, toText } from "../fable_modules/fable-library-js.4.28.0/String.js";
import { fromInt32, toInt64 } from "../fable_modules/fable-library-js.4.28.0/BigInt.js";
import { RestoreConfirmModal, RestoreTarget } from "../Components/RestoreConfirmModal.js";
import { defaultOf } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { DeleteConfirmModal } from "../admin/MemberActions.js";

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
    return union_type("Pages.AdminPage.AdminState", [], AdminState, () => [[], [], [["profiles", array_type(ProfileRecord_$reflection())], ["deletedWorkouts", array_type(WorkoutRecord_$reflection())]], [["message", string_type]]]);
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

export function AdminPage() {
    let elems_8, elems_7;
    const patternInput = reactApi.useState(new AdminState(0, []));
    const state = patternInput[0];
    const setState = patternInput[1];
    const patternInput_1 = reactApi.useState(undefined);
    const setDeleteTarget = patternInput_1[1];
    const deleteTarget = patternInput_1[0];
    const patternInput_2 = reactApi.useState(undefined);
    const setRestoreTarget = patternInput_2[1];
    const patternInput_3 = reactApi.useState(0);
    const setRefreshKey = patternInput_3[1];
    const refreshKey = patternInput_3[0] | 0;
    const dependencies = [refreshKey];
    reactApi.useEffect(() => {
        const pr = PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (isAdmin().then((_arg) => {
            if (!_arg) {
                setState(new AdminState(1, []));
                return Promise.resolve();
            }
            else {
                return getAllProfiles().then((_arg_1) => (getDeletedWorkouts().then((_arg_2) => {
                    let matchResult, deleted, profiles, msg;
                    const copyOfStruct = _arg_1;
                    if (copyOfStruct.tag === 1) {
                        matchResult = 1;
                        msg = copyOfStruct.fields[0];
                    }
                    else {
                        const copyOfStruct_1 = _arg_2;
                        if (copyOfStruct_1.tag === 1) {
                            matchResult = 1;
                            msg = copyOfStruct_1.fields[0];
                        }
                        else {
                            matchResult = 0;
                            deleted = copyOfStruct_1.fields[0];
                            profiles = copyOfStruct.fields[0];
                        }
                    }
                    switch (matchResult) {
                        case 0: {
                            setState(new AdminState(2, [profiles, deleted]));
                            return Promise.resolve();
                        }
                        default: {
                            setState(new AdminState(3, [msg]));
                            return Promise.resolve();
                        }
                    }
                })));
            }
        }))));
        void pr;
    }, dependencies);
    return createElement("div", createObj(ofArray([["className", "min-h-screen bg-gray-100 p-4"], (elems_8 = [createElement("div", createObj(ofArray([["className", "max-w-2xl mx-auto"], (elems_7 = toList(delay(() => append(singleton(createElement("h1", {
        className: "text-2xl font-bold mb-6",
        children: "관리자",
    })), delay(() => {
        let matchValue_2, elems_1, elems_2, profiles_2, deletedWorkouts, elems_6, elems_5, elems;
        return append((matchValue_2 = state, (matchValue_2.tag === 1) ? singleton(createElement("div", createObj(ofArray([["className", "bg-red-50 border border-red-200 rounded-lg p-6 text-center"], (elems_1 = [createElement("p", {
            className: "text-red-600 font-medium",
            children: "접근 권한이 없습니다.",
        }), createElement("p", {
            className: "text-red-500 text-sm mt-2",
            children: "관리자만 이 페이지에 접근할 수 있습니다.",
        })], ["children", reactApi.Children.toArray(Array.from(elems_1))])])))) : ((matchValue_2.tag === 3) ? singleton(createElement("div", createObj(ofArray([["className", "bg-red-50 border border-red-200 rounded-lg p-4"], (elems_2 = [createElement("p", {
            className: "text-red-600",
            children: matchValue_2.fields[0],
        })], ["children", reactApi.Children.toArray(Array.from(elems_2))])])))) : ((matchValue_2.tag === 2) ? ((profiles_2 = matchValue_2.fields[0], (deletedWorkouts = matchValue_2.fields[1], singleton(createElement("div", createObj(ofArray([["className", "space-y-6"], (elems_6 = [createElement(MemberList, {
            profiles: profiles_2,
            onDelete: (userId) => {
                if (state.tag === 2) {
                    const matchValue_1 = tryFind((p) => (p.id === userId), state.fields[0]);
                    if (matchValue_1 == null) {
                    }
                    else {
                        const profile = matchValue_1;
                        setDeleteTarget(new DeleteTarget(userId, defaultArg(profile.display_name, profile.email)));
                    }
                }
            },
        }), createElement(AdminRoleManager, {
            profiles: profiles_2,
            onRoleChanged: () => {
                setRefreshKey(refreshKey + 1);
            },
        }), createElement(AuditLogList, {
            limit: 20,
        }), createElement("div", createObj(ofArray([["className", "bg-white rounded-lg shadow p-4"], (elems_5 = toList(delay(() => append(singleton(createElement("h2", {
            className: "text-lg font-semibold mb-4",
            children: "삭제된 기록",
        })), delay(() => {
            let elems_4;
            return (deletedWorkouts.length === 0) ? singleton(createElement("p", {
                className: "text-gray-500 text-center py-4",
                children: "삭제된 기록이 없습니다.",
            })) : singleton(createElement("div", createObj(ofArray([["className", "space-y-2"], (elems_4 = toList(delay(() => map((workout) => {
                let elems_3, children;
                return createElement("div", createObj(ofArray([["className", "flex items-center justify-between py-2 px-3 border rounded"], (elems_3 = [(children = ofArray([createElement("span", {
                    className: "font-medium",
                    children: workout.workout_date,
                }), createElement("span", {
                    className: "text-xs text-gray-500 ml-2",
                    children: toText(printf("ID: %d"))(workout.id),
                })]), createElement("div", {
                    children: reactApi.Children.toArray(Array.from(children)),
                })), createElement("button", {
                    className: "px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600",
                    children: "복구",
                    onClick: (_arg_4) => {
                        setRestoreTarget(new RestoreTarget(toInt64(fromInt32(workout.id)), workout.workout_date));
                    },
                })], ["children", reactApi.Children.toArray(Array.from(elems_3))])])));
            }, deletedWorkouts))), ["children", reactApi.Children.toArray(Array.from(elems_4))])]))));
        })))), ["children", reactApi.Children.toArray(Array.from(elems_5))])])))], ["children", reactApi.Children.toArray(Array.from(elems_6))])]))))))) : singleton(createElement("div", createObj(ofArray([["className", "text-center py-8"], (elems = [createElement("p", {
            className: "text-gray-500",
            children: "로딩 중...",
        })], ["children", reactApi.Children.toArray(Array.from(elems))])]))))))), delay(() => {
            let matchValue_3, target_1;
            return append((matchValue_3 = deleteTarget, (matchValue_3 == null) ? singleton(defaultOf()) : ((target_1 = matchValue_3, singleton(createElement(DeleteConfirmModal, {
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
                                setRefreshKey(refreshKey + 1);
                                return Promise.resolve();
                            }
                        }))));
                        void pr_1;
                    }
                },
                onCancel: () => {
                    setDeleteTarget(undefined);
                },
            }))))), delay(() => {
                const matchValue_4 = patternInput_2[0];
                if (matchValue_4 == null) {
                    return singleton(defaultOf());
                }
                else {
                    const target_2 = matchValue_4;
                    return singleton(createElement(RestoreConfirmModal, {
                        target: target_2,
                        onConfirm: () => {
                            setRestoreTarget(undefined);
                            setRefreshKey(refreshKey + 1);
                        },
                        onCancel: () => {
                            setRestoreTarget(undefined);
                        },
                    }));
                }
            }));
        }));
    })))), ["children", reactApi.Children.toArray(Array.from(elems_7))])])))], ["children", reactApi.Children.toArray(Array.from(elems_8))])])));
}

