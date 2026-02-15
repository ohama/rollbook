import { createElement } from "react";
import React from "react";
import { reactApi } from "../fable_modules/Feliz.2.9.0/Interop.fs.js";
import { isNullOrWhiteSpace } from "../fable_modules/fable-library-js.4.28.0/String.js";
import { createObj } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { ofArray } from "../fable_modules/fable-library-js.4.28.0/List.js";

export function RecordEditModal(recordEditModalInputProps) {
    let elems_2, elems_1, value_17, elems, value_31;
    const onCancel = recordEditModalInputProps.onCancel;
    const onSave = recordEditModalInputProps.onSave;
    const saving = recordEditModalInputProps.saving;
    const initialText = recordEditModalInputProps.initialText;
    const editingRecordId = recordEditModalInputProps.editingRecordId;
    const patternInput = reactApi.useState(initialText);
    const textContent = patternInput[0];
    const title = (editingRecordId != null) ? "메모 수정" : "메모 추가";
    const saveButtonText = saving ? "저장 중..." : "저장";
    const isSaveDisabled = saving ? true : isNullOrWhiteSpace(textContent);
    return createElement("div", createObj(ofArray([["className", "fixed inset-0 bg-black/50 flex items-center justify-center z-50"], ["onClick", (_arg) => {
        if (!saving) {
            onCancel();
        }
    }], (elems_2 = [createElement("div", createObj(ofArray([["className", "bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl"], ["onClick", (e) => {
        e.stopPropagation();
    }], (elems_1 = [createElement("h2", {
        className: "text-lg font-semibold mb-4",
        children: title,
    }), createElement("textarea", createObj(ofArray([["value", textContent], ["onChange", (ev) => {
        patternInput[1](ev.target.value);
    }], ["placeholder", "운동 메모를 입력하세요"], ["autoFocus", true], (value_17 = "w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 min-h-[120px] focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none", ["className", value_17]), ["disabled", saving]]))), createElement("div", createObj(ofArray([["className", "flex gap-2 justify-end"], (elems = [createElement("button", {
        onClick: (_arg_1) => {
            onCancel();
        },
        className: "px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors",
        disabled: saving,
        children: "취소",
    }), createElement("button", createObj(ofArray([["onClick", (_arg_2) => {
        onSave(textContent);
    }], (value_31 = "px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors", ["className", value_31]), ["disabled", isSaveDisabled], ["children", saveButtonText]])))], ["children", reactApi.Children.toArray(Array.from(elems))])])))], ["children", reactApi.Children.toArray(Array.from(elems_1))])])))], ["children", reactApi.Children.toArray(Array.from(elems_2))])])));
}

