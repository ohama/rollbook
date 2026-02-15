import { createElement } from "react";
import React from "react";
import { createObj } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { reactApi } from "../fable_modules/Feliz.2.9.0/Interop.fs.js";
import { ofArray } from "../fable_modules/fable-library-js.4.28.0/List.js";
import { singleton, append, delay, toList } from "../fable_modules/fable-library-js.4.28.0/Seq.js";
import { defaultOf } from "../fable_modules/fable-library-js.4.28.0/Util.js";

/**
 * Centered card layout for auth pages
 */
export function AuthLayout(authLayoutInputProps) {
    let elems_3, elems_2, elems;
    const children = authLayoutInputProps.children;
    return createElement("div", createObj(ofArray([["className", "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4"], (elems_3 = [createElement("div", createObj(ofArray([["className", "w-full max-w-md"], (elems_2 = [createElement("div", createObj(ofArray([["className", "text-center mb-8"], (elems = [createElement("h1", {
        className: "text-3xl font-bold text-indigo-600",
        children: "Rollbook",
    }), createElement("p", {
        className: "text-gray-600 mt-2",
        children: "원탭 운동 기록",
    })], ["children", reactApi.Children.toArray(Array.from(elems))])]))), createElement("div", {
        className: "bg-white rounded-2xl shadow-xl p-6 sm:p-8",
        children: reactApi.Children.toArray(Array.from(children)),
    })], ["children", reactApi.Children.toArray(Array.from(elems_2))])])))], ["children", reactApi.Children.toArray(Array.from(elems_3))])])));
}

/**
 * Input field component with label and error state
 */
export function FormInput(formInputInputProps) {
    let elems;
    const error = formInputInputProps.error;
    const onChange = formInputInputProps.onChange;
    const value = formInputInputProps.value;
    const placeholder = formInputInputProps.placeholder;
    const inputType = formInputInputProps.inputType;
    const label = formInputInputProps.label;
    return createElement("div", createObj(ofArray([["className", "mb-4"], (elems = toList(delay(() => append(singleton(createElement("label", {
        className: "block text-sm font-medium text-gray-700 mb-1",
        children: label,
    })), delay(() => append(singleton(createElement("input", {
        type: inputType,
        placeholder: placeholder,
        value: value,
        onChange: (ev) => {
            onChange(ev.target.value);
        },
        className: "w-full px-4 py-3 rounded-lg border focus:ring-2 focus:outline-none transition-colors " + ((error == null) ? "border-gray-300 focus:ring-indigo-200 focus:border-indigo-500" : "border-red-500 focus:ring-red-200"),
    })), delay(() => {
        const matchValue = error;
        if (matchValue == null) {
            return singleton(defaultOf());
        }
        else {
            const msg = matchValue;
            return singleton(createElement("p", {
                className: "mt-1 text-sm text-red-600",
                children: msg,
            }));
        }
    })))))), ["children", reactApi.Children.toArray(Array.from(elems))])])));
}

/**
 * Primary button component
 */
export function PrimaryButton(primaryButtonInputProps) {
    let elems_1;
    const onClick = primaryButtonInputProps.onClick;
    const loading = primaryButtonInputProps.loading;
    const text = primaryButtonInputProps.text;
    return createElement("button", createObj(ofArray([["type", "submit"], ["disabled", loading], ["onClick", (e) => {
        e.preventDefault();
        onClick();
    }], ["className", "w-full py-3 px-4 rounded-lg font-medium text-white transition-all " + (loading ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]")], (elems_1 = toList(delay(() => {
        let elems;
        return loading ? singleton(createElement("span", createObj(ofArray([["className", "inline-flex items-center"], (elems = [createElement("span", {
            className: "animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2",
        }), "처리 중..."], ["children", reactApi.Children.toArray(Array.from(elems))])])))) : singleton(text);
    })), ["children", reactApi.Children.toArray(Array.from(elems_1))])])));
}

/**
 * Link styled as button
 */
export function LinkButton(linkButtonInputProps) {
    const onClick = linkButtonInputProps.onClick;
    const text = linkButtonInputProps.text;
    return createElement("button", {
        type: "button",
        onClick: (_arg) => {
            onClick();
        },
        className: "text-indigo-600 hover:text-indigo-800 text-sm font-medium",
        children: text,
    });
}

/**
 * Alert/message component
 */
export function Alert(alertInputProps) {
    const alertType = alertInputProps.alertType;
    const message = alertInputProps.message;
    const patternInput = (alertType === "success") ? ["bg-green-50", "text-green-800", "border-green-200"] : ((alertType === "error") ? ["bg-red-50", "text-red-800", "border-red-200"] : ((alertType === "info") ? ["bg-blue-50", "text-blue-800", "border-blue-200"] : ["bg-gray-50", "text-gray-800", "border-gray-200"]));
    const textColor = patternInput[1];
    const borderColor = patternInput[2];
    const bgColor = patternInput[0];
    return createElement("div", {
        className: `p-4 rounded-lg border ${bgColor} ${textColor} ${borderColor} mb-4`,
        children: message,
    });
}

