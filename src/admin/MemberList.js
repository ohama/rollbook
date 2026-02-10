import { createElement } from "react";
import React from "react";
import { createObj } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { defaultArg } from "../fable_modules/fable-library-js.4.28.0/Option.js";
import { reactApi } from "../fable_modules/Feliz.2.9.0/Interop.fs.js";
import { ofArray } from "../fable_modules/fable-library-js.4.28.0/List.js";
import { map, singleton, append, delay, toList } from "../fable_modules/fable-library-js.4.28.0/Seq.js";
import { printf, toText } from "../fable_modules/fable-library-js.4.28.0/String.js";

export function MemberListItem(memberListItemInputProps) {
    let elems_1, elems;
    const onDelete = memberListItemInputProps.onDelete;
    const profile = memberListItemInputProps.profile;
    return createElement("div", createObj(ofArray([["className", "flex items-center justify-between p-4 bg-white rounded-lg shadow mb-2"], (elems_1 = [createElement("div", createObj(ofArray([["className", "flex-1"], (elems = [createElement("p", {
        className: "font-medium text-gray-900",
        children: defaultArg(profile.display_name, profile.email),
    }), createElement("p", {
        className: "text-sm text-gray-500",
        children: profile.email,
    })], ["children", reactApi.Children.toArray(Array.from(elems))])]))), createElement("button", {
        className: "px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded",
        children: "삭제",
        onClick: (_arg) => {
            onDelete(profile.id);
        },
    })], ["children", reactApi.Children.toArray(Array.from(elems_1))])])));
}

export function MemberList(memberListInputProps) {
    let elems;
    const onDelete = memberListInputProps.onDelete;
    const profiles = memberListInputProps.profiles;
    return createElement("div", createObj(ofArray([["className", "space-y-2"], (elems = toList(delay(() => {
        let arg;
        return append(singleton(createElement("h2", {
            className: "text-lg font-semibold mb-4",
            children: (arg = (profiles.length | 0), toText(printf("회원 목록 (%d명)"))(arg)),
        })), delay(() => ((profiles.length === 0) ? singleton(createElement("p", {
            className: "text-gray-500 text-center py-4",
            children: "등록된 회원이 없습니다.",
        })) : map((profile) => createElement(MemberListItem, {
            profile: profile,
            onDelete: onDelete,
        }), profiles))));
    })), ["children", reactApi.Children.toArray(Array.from(elems))])])));
}

