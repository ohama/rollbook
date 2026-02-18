import { Record } from "../fable_modules/fable-library-js.4.28.0/Types.js";
import { record_type, string_type, int64_type } from "../fable_modules/fable-library-js.4.28.0/Reflection.js";
import { createElement } from "react";
import React from "react";
import { reactApi } from "../fable_modules/Feliz.2.9.0/Interop.fs.js";
import { createObj } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { printf, toText } from "../fable_modules/fable-library-js.4.28.0/String.js";
import { PromiseBuilder__Delay_62FBFDE1, PromiseBuilder__Run_212F1D4B } from "../fable_modules/Fable.Promise.3.2.0/Promise.fs.js";
import { promise } from "../fable_modules/Fable.Promise.3.2.0/PromiseImpl.fs.js";
import { restoreWorkout } from "../Supabase/Audit.js";
import { some } from "../fable_modules/fable-library-js.4.28.0/Option.js";
import { ofArray } from "../fable_modules/fable-library-js.4.28.0/List.js";

export class RestoreTarget extends Record {
    constructor(workoutId, workoutDate) {
        super();
        this.workoutId = workoutId;
        this.workoutDate = workoutDate;
    }
}

export function RestoreTarget_$reflection() {
    return record_type("Components.RestoreConfirmModal.RestoreTarget", [], RestoreTarget, () => [["workoutId", int64_type], ["workoutDate", string_type]]);
}

export function RestoreConfirmModal(restoreConfirmModalInputProps) {
    let elems_2, elems_1, elems;
    const onCancel = restoreConfirmModalInputProps.onCancel;
    const onConfirm = restoreConfirmModalInputProps.onConfirm;
    const target = restoreConfirmModalInputProps.target;
    const patternInput = reactApi.useState(false);
    const setIsRestoring = patternInput[1];
    const isRestoring = patternInput[0];
    return createElement("div", createObj(ofArray([["className", "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"], (elems_2 = [createElement("div", createObj(ofArray([["className", "bg-white rounded-lg p-6 max-w-sm mx-4"], (elems_1 = [createElement("h3", {
        className: "text-lg font-semibold mb-4",
        children: "기록 복구 확인",
    }), createElement("p", {
        className: "text-gray-600 mb-6",
        children: toText(printf("%s 기록을 복구하시겠습니까?"))(target.workoutDate),
    }), createElement("div", createObj(ofArray([["className", "flex gap-3 justify-end"], (elems = [createElement("button", {
        className: "px-4 py-2 border rounded hover:bg-gray-100",
        children: "취소",
        disabled: isRestoring,
        onClick: (_arg_1) => {
            onCancel();
        },
    }), createElement("button", {
        className: "px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300",
        children: isRestoring ? "복구 중..." : "복구",
        disabled: isRestoring,
        onClick: (_arg_2) => {
            setIsRestoring(true);
            const pr = PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (restoreWorkout(target.workoutId).then((_arg) => {
                const result = _arg;
                if (result.tag === 1) {
                    window.alert(some(toText(printf("복구 실패: %s"))(result.fields[0])));
                    setIsRestoring(false);
                    return Promise.resolve();
                }
                else {
                    setIsRestoring(false);
                    onConfirm();
                    return Promise.resolve();
                }
            }))));
            void pr;
        },
    })], ["children", reactApi.Children.toArray(Array.from(elems))])])))], ["children", reactApi.Children.toArray(Array.from(elems_1))])])))], ["children", reactApi.Children.toArray(Array.from(elems_2))])])));
}

