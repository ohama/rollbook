import { createElement } from "react";
import React from "react";
import { useEffectWithDeps } from "../fable_modules/Feliz.2.9.0/ReactInterop.js";
import { createDisposable } from "../fable_modules/Feliz.2.9.0/Internal.fs.js";
import { createObj } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { reactApi } from "../fable_modules/Feliz.2.9.0/Interop.fs.js";
import { ofArray } from "../fable_modules/fable-library-js.4.28.0/List.js";

export function PhotoModal(photoModalInputProps) {
    let elems;
    const onClose = photoModalInputProps.onClose;
    const photoUrl = photoModalInputProps.photoUrl;
    useEffectWithDeps(() => {
        const body = document.body;
        const originalOverflow = body.style.overflow;
        body.style.overflow = "hidden";
        return createDisposable(() => {
            body.style.overflow = originalOverflow;
        });
    }, []);
    useEffectWithDeps(() => {
        const handleEscape = (e) => {
            const ke = e;
            if (ke.key === "Escape") {
                onClose();
            }
        };
        document.addEventListener("keydown", handleEscape);
        return createDisposable(() => {
            document.removeEventListener("keydown", handleEscape);
        });
    }, []);
    return createElement("div", createObj(ofArray([["className", "fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4"], ["onClick", (_arg) => {
        onClose();
    }], (elems = [createElement("button", {
        className: "absolute top-4 right-4 text-white text-3xl font-bold hover:text-gray-300 transition-colors",
        onClick: (e_1) => {
            e_1.stopPropagation();
            onClose();
        },
        title: "닫기 (ESC)",
        children: "×",
    }), createElement("img", {
        src: photoUrl,
        alt: "확대된 운동 사진",
        className: "max-w-full max-h-full object-contain",
        onClick: (e_2) => {
            e_2.stopPropagation();
        },
    })], ["children", reactApi.Children.toArray(Array.from(elems))])])));
}

