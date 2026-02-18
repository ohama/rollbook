import { createElement } from "react";
import React from "react";
import { createObj } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { collect, empty, singleton, append, delay, toList } from "../fable_modules/fable-library-js.4.28.0/Seq.js";
import { printf, toText } from "../fable_modules/fable-library-js.4.28.0/String.js";
import { reactApi } from "../fable_modules/Feliz.2.9.0/Interop.fs.js";
import { ofArray } from "../fable_modules/fable-library-js.4.28.0/List.js";
import { defaultArg } from "../fable_modules/fable-library-js.4.28.0/Option.js";
import { tryFind } from "../fable_modules/fable-library-js.4.28.0/Map.js";

export function MemberListItem(memberListItemInputProps) {
    let elems_2;
    const onDelete = memberListItemInputProps.onDelete;
    const workoutCount = memberListItemInputProps.workoutCount;
    const profile = memberListItemInputProps.profile;
    return createElement("div", createObj(ofArray([["className", "flex items-center justify-between p-4 bg-white rounded-lg shadow mb-2"], (elems_2 = toList(delay(() => {
        let elems_1, elems;
        return append(singleton(createElement("div", createObj(ofArray([["className", "flex-1 min-w-0"], (elems_1 = [createElement("div", createObj(ofArray([["className", "flex items-center gap-2"], (elems = [createElement("span", {
            className: "font-bold text-gray-900",
            children: toText(printf("%s(%d)"))(profile.member_id)(workoutCount),
        }), createElement("span", {
            className: "text-sm text-gray-400",
            children: profile.email,
        })], ["children", reactApi.Children.toArray(Array.from(elems))])])))], ["children", reactApi.Children.toArray(Array.from(elems_1))])])))), delay(() => {
            let value_16;
            return (profile.member_id !== "root") ? singleton(createElement("button", createObj(ofArray([(value_16 = "ml-2 px-3 py-1.5 text-sm text-red-600 hover:text-white hover:bg-red-500 border border-red-300 rounded-lg transition-colors", ["className", value_16]), ["children", "탈퇴"], ["onClick", (_arg) => {
                onDelete(profile.id);
            }]])))) : empty();
        }));
    })), ["children", reactApi.Children.toArray(Array.from(elems_2))])])));
}

export function MemberList(memberListInputProps) {
    let elems_1;
    const onDelete = memberListInputProps.onDelete;
    const workoutCounts = memberListInputProps.workoutCounts;
    const profiles = memberListInputProps.profiles;
    return createElement("div", createObj(ofArray([["className", "bg-white rounded-lg shadow p-4"], (elems_1 = toList(delay(() => {
        let arg;
        return append(singleton(createElement("h2", {
            className: "text-lg font-semibold mb-4",
            children: (arg = (profiles.length | 0), toText(printf("회원 목록 (%d명)"))(arg)),
        })), delay(() => {
            let elems;
            return (profiles.length === 0) ? singleton(createElement("p", {
                className: "text-gray-500 text-center py-4",
                children: "등록된 회원이 없습니다.",
            })) : singleton(createElement("div", createObj(ofArray([["className", "space-y-2"], (elems = toList(delay(() => collect((profile) => {
                const count = defaultArg(tryFind(profile.id, workoutCounts), 0) | 0;
                return singleton(createElement(MemberListItem, {
                    profile: profile,
                    workoutCount: count,
                    onDelete: onDelete,
                }));
            }, profiles))), ["children", reactApi.Children.toArray(Array.from(elems))])]))));
        }));
    })), ["children", reactApi.Children.toArray(Array.from(elems_1))])])));
}

