import { createElement } from "react";
import React from "react";
import { createObj } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { map, defaultArg } from "../fable_modules/fable-library-js.4.28.0/Option.js";
import { empty, singleton, append, delay, toList, tryHead } from "../fable_modules/fable-library-js.4.28.0/Seq.js";
import { reactApi } from "../fable_modules/Feliz.2.9.0/Interop.fs.js";
import { ofArray, singleton as singleton_1 } from "../fable_modules/fable-library-js.4.28.0/List.js";
import { printf, toText } from "../fable_modules/fable-library-js.4.28.0/String.js";

/**
 * Renders a team member card showing display name, email (if different), and workout count
 */
export function TeamMemberCard(member$0027) {
    let elems_3, elems_1, elems, elems_2;
    return createElement("div", createObj(ofArray([["className", "bg-white rounded-lg shadow-sm p-4 flex items-center justify-between"], (elems_3 = [createElement("div", createObj(ofArray([["className", "flex items-center gap-3"], (elems_1 = [createElement("div", {
        className: "w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold",
        children: defaultArg(map((value_6) => value_6, tryHead(member$0027.DisplayName.split(""))), "?"),
    }), createElement("div", createObj(singleton_1((elems = toList(delay(() => append(singleton(createElement("p", {
        className: "font-medium text-gray-800",
        children: member$0027.DisplayName,
    })), delay(() => (((member$0027.DisplayName !== member$0027.Email) && (member$0027.Email !== "")) ? singleton(createElement("p", {
        className: "text-sm text-gray-500",
        children: member$0027.Email,
    })) : empty()))))), ["children", reactApi.Children.toArray(Array.from(elems))]))))], ["children", reactApi.Children.toArray(Array.from(elems_1))])]))), createElement("div", createObj(ofArray([["className", "text-right"], (elems_2 = [createElement("span", {
        className: "text-2xl font-bold " + ((member$0027.WorkoutCount > 0) ? "text-indigo-600" : "text-gray-400"),
        children: toText(printf("%d"))(member$0027.WorkoutCount),
    }), createElement("span", {
        className: "text-sm text-gray-500 ml-1",
        children: "회",
    })], ["children", reactApi.Children.toArray(Array.from(elems_2))])])))], ["children", reactApi.Children.toArray(Array.from(elems_3))])])));
}

