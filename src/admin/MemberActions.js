import { createElement } from "react";
import React from "react";
import { createObj } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { printf, toText } from "../fable_modules/fable-library-js.4.28.0/String.js";
import { reactApi } from "../fable_modules/Feliz.2.9.0/Interop.fs.js";
import { ofArray } from "../fable_modules/fable-library-js.4.28.0/List.js";

/**
 * Confirmation modal for delete action
 */
export function DeleteConfirmModal(deleteConfirmModalInputProps) {
    let elems_2, elems_1, elems;
    const onCancel = deleteConfirmModalInputProps.onCancel;
    const onConfirm = deleteConfirmModalInputProps.onConfirm;
    const memberName = deleteConfirmModalInputProps.memberName;
    return createElement("div", createObj(ofArray([["className", "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"], (elems_2 = [createElement("div", createObj(ofArray([["className", "bg-white rounded-lg p-6 max-w-sm mx-4"], (elems_1 = [createElement("h3", {
        className: "text-lg font-semibold mb-4",
        children: "회원 삭제",
    }), createElement("p", {
        className: "text-gray-600 mb-6",
        children: toText(printf("\'%s\' 회원을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."))(memberName),
    }), createElement("div", createObj(ofArray([["className", "flex justify-end gap-3"], (elems = [createElement("button", {
        className: "px-4 py-2 text-gray-600 hover:bg-gray-100 rounded",
        children: "취소",
        onClick: (_arg) => {
            onCancel();
        },
    }), createElement("button", {
        className: "px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded",
        children: "삭제",
        onClick: (_arg_1) => {
            onConfirm();
        },
    })], ["children", reactApi.Children.toArray(Array.from(elems))])])))], ["children", reactApi.Children.toArray(Array.from(elems_1))])])))], ["children", reactApi.Children.toArray(Array.from(elems_2))])])));
}

