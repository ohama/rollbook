import { Union } from "../fable_modules/fable-library-js.4.28.0/Types.js";
import { union_type, string_type } from "../fable_modules/fable-library-js.4.28.0/Reflection.js";
import { createElement } from "react";
import React from "react";
import { reactApi } from "../fable_modules/Feliz.2.9.0/Interop.fs.js";
import { createObj } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { map, delay, toList } from "../fable_modules/fable-library-js.4.28.0/Seq.js";
import { some, defaultArg } from "../fable_modules/fable-library-js.4.28.0/Option.js";
import { ofArray } from "../fable_modules/fable-library-js.4.28.0/List.js";
import { PromiseBuilder__Delay_62FBFDE1, PromiseBuilder__Run_212F1D4B } from "../fable_modules/Fable.Promise.3.2.0/Promise.fs.js";
import { promise } from "../fable_modules/Fable.Promise.3.2.0/PromiseImpl.fs.js";
import { removeAdminRole, addAdminRole } from "../Supabase/Admin.js";
import { printf, toText } from "../fable_modules/fable-library-js.4.28.0/String.js";

export class RoleAction extends Union {
    constructor(tag, fields) {
        super();
        this.tag = tag;
        this.fields = fields;
    }
    cases() {
        return ["GrantingRole", "RevokingRole", "Idle"];
    }
}

export function RoleAction_$reflection() {
    return union_type("Components.AdminRoleManager.RoleAction", [], RoleAction, () => [[["userId", string_type]], [["userId", string_type]], []]);
}

export function AdminRoleManager(adminRoleManagerInputProps) {
    let elems_3, elems_2;
    const onRoleChanged = adminRoleManagerInputProps.onRoleChanged;
    const profiles = adminRoleManagerInputProps.profiles;
    const patternInput = reactApi.useState(new RoleAction(2, []));
    const setActionState = patternInput[1];
    const actionState = patternInput[0];
    return createElement("div", createObj(ofArray([["className", "bg-white rounded-lg shadow p-4"], (elems_3 = [createElement("h2", {
        className: "text-lg font-semibold mb-4",
        children: "관리자 역할 관리",
    }), createElement("div", createObj(ofArray([["className", "space-y-2"], (elems_2 = toList(delay(() => map((profile) => {
        let elems_1, children, elems;
        return createElement("div", createObj(ofArray([["className", "flex items-center justify-between py-2 px-3 border rounded hover:bg-gray-50"], (elems_1 = [(children = ofArray([createElement("span", {
            className: "font-medium",
            children: defaultArg(profile.display_name, profile.email),
        }), createElement("span", {
            className: "text-xs text-gray-500 ml-2",
            children: profile.email,
        })]), createElement("div", {
            children: reactApi.Children.toArray(Array.from(children)),
        })), createElement("div", createObj(ofArray([["className", "flex gap-2"], (elems = [createElement("button", {
            className: "px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300",
            children: "관리자 지정",
            disabled: (actionState.tag === 0) && (actionState.fields[0] === profile.id),
            onClick: (_arg_2) => {
                const userId = profile.id;
                setActionState(new RoleAction(0, [userId]));
                const pr = PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (addAdminRole(userId).then((_arg) => {
                    const result = _arg;
                    if (result.tag === 1) {
                        window.alert(some(toText(printf("관리자 지정 실패: %s"))(result.fields[0])));
                        setActionState(new RoleAction(2, []));
                        return Promise.resolve();
                    }
                    else {
                        setActionState(new RoleAction(2, []));
                        onRoleChanged();
                        return Promise.resolve();
                    }
                }))));
                void pr;
            },
        }), createElement("button", {
            className: "px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300",
            children: "관리자 제거",
            disabled: (actionState.tag === 1) && (actionState.fields[0] === profile.id),
            onClick: (_arg_3) => {
                const userId_1 = profile.id;
                setActionState(new RoleAction(1, [userId_1]));
                const pr_1 = PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (removeAdminRole(userId_1).then((_arg_1) => {
                    const result_1 = _arg_1;
                    if (result_1.tag === 1) {
                        window.alert(some(toText(printf("관리자 제거 실패: %s"))(result_1.fields[0])));
                        setActionState(new RoleAction(2, []));
                        return Promise.resolve();
                    }
                    else {
                        setActionState(new RoleAction(2, []));
                        onRoleChanged();
                        return Promise.resolve();
                    }
                }))));
                void pr_1;
            },
        })], ["children", reactApi.Children.toArray(Array.from(elems))])])))], ["children", reactApi.Children.toArray(Array.from(elems_1))])])));
    }, profiles))), ["children", reactApi.Children.toArray(Array.from(elems_2))])])))], ["children", reactApi.Children.toArray(Array.from(elems_3))])])));
}

