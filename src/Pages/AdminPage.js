import { Record, Union } from "../fable_modules/fable-library-js.4.28.0/Types.js";
import { ProfileRecord_$reflection } from "../Supabase/Types.js";
import { record_type, union_type, string_type, array_type } from "../fable_modules/fable-library-js.4.28.0/Reflection.js";
import { createElement } from "react";
import React from "react";
import { reactApi } from "../fable_modules/Feliz.2.9.0/Interop.fs.js";
import { PromiseBuilder__Delay_62FBFDE1, PromiseBuilder__Run_212F1D4B } from "../fable_modules/Fable.Promise.3.2.0/Promise.fs.js";
import { promise } from "../fable_modules/Fable.Promise.3.2.0/PromiseImpl.fs.js";
import { deleteProfile, getAllProfiles, isAdmin } from "../Supabase/Admin.js";
import { createObj } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { singleton, append, delay, toList } from "../fable_modules/fable-library-js.4.28.0/Seq.js";
import { ofArray } from "../fable_modules/fable-library-js.4.28.0/List.js";
import { MemberList } from "../admin/MemberList.js";
import { tryFind } from "../fable_modules/fable-library-js.4.28.0/Array.js";
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
    return union_type("Pages.AdminPage.AdminState", [], AdminState, () => [[], [], [["profiles", array_type(ProfileRecord_$reflection())]], [["message", string_type]]]);
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
    let elems_4, elems_3;
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
                    if (profilesResult.tag === 1) {
                        setState(new AdminState(3, [profilesResult.fields[0]]));
                        return Promise.resolve();
                    }
                    else {
                        setState(new AdminState(2, [profilesResult.fields[0]]));
                        return Promise.resolve();
                    }
                });
            }
        }))));
        void pr;
    }, dependencies);
    return createElement("div", createObj(ofArray([["className", "min-h-screen bg-gray-100 p-4"], (elems_4 = [createElement("div", createObj(ofArray([["className", "max-w-2xl mx-auto"], (elems_3 = toList(delay(() => append(singleton(createElement("h1", {
        className: "text-2xl font-bold mb-6",
        children: "관리자",
    })), delay(() => {
        let matchValue_1, elems_1, elems_2, elems;
        return append((matchValue_1 = state, (matchValue_1.tag === 1) ? singleton(createElement("div", createObj(ofArray([["className", "bg-red-50 border border-red-200 rounded-lg p-6 text-center"], (elems_1 = [createElement("p", {
            className: "text-red-600 font-medium",
            children: "접근 권한이 없습니다.",
        }), createElement("p", {
            className: "text-red-500 text-sm mt-2",
            children: "관리자만 이 페이지에 접근할 수 있습니다.",
        })], ["children", reactApi.Children.toArray(Array.from(elems_1))])])))) : ((matchValue_1.tag === 3) ? singleton(createElement("div", createObj(ofArray([["className", "bg-red-50 border border-red-200 rounded-lg p-4"], (elems_2 = [createElement("p", {
            className: "text-red-600",
            children: matchValue_1.fields[0],
        })], ["children", reactApi.Children.toArray(Array.from(elems_2))])])))) : ((matchValue_1.tag === 2) ? singleton(createElement(MemberList, {
            profiles: matchValue_1.fields[0],
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
        })) : singleton(createElement("div", createObj(ofArray([["className", "text-center py-8"], (elems = [createElement("p", {
            className: "text-gray-500",
            children: "로딩 중...",
        })], ["children", reactApi.Children.toArray(Array.from(elems))])]))))))), delay(() => {
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
                            const pr_1 = PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (deleteProfile(target.userId).then((_arg_2) => {
                                const result = _arg_2;
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
    })))), ["children", reactApi.Children.toArray(Array.from(elems_3))])])))], ["children", reactApi.Children.toArray(Array.from(elems_4))])])));
}

