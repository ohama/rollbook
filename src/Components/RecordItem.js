import { createElement } from "react";
import React from "react";
import { int32ToString, createObj } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { singleton, append, delay, toList } from "../fable_modules/fable-library-js.4.28.0/Seq.js";
import { reactApi } from "../fable_modules/Feliz.2.9.0/Interop.fs.js";
import { ofArray } from "../fable_modules/fable-library-js.4.28.0/List.js";
import { isNullOrWhiteSpace } from "../fable_modules/fable-library-js.4.28.0/String.js";
import { defaultOf } from "../fable_modules/fable-library-js.4.28.0/Util.js";

export function RecordItem(recordItemInputProps) {
    let elems_3;
    const onPhotoClick = recordItemInputProps.onPhotoClick;
    const onDelete = recordItemInputProps.onDelete;
    const onEdit = recordItemInputProps.onEdit;
    const currentUserId = recordItemInputProps.currentUserId;
    const record = recordItemInputProps.record;
    let timeDisplay;
    const matchValue = record.created_at;
    if (matchValue == null) {
        timeDisplay = "";
    }
    else {
        const timestamp = matchValue;
        timeDisplay = (new Date(timestamp).toLocaleTimeString('ko-KR', {hour: '2-digit', minute: '2-digit'}));
    }
    let recordTypeLabel;
    const matchValue_1 = record.record_type;
    recordTypeLabel = ((matchValue_1 === "workout") ? "운동" : ((matchValue_1 === "text") ? "메모" : ((matchValue_1 === "photo") ? "사진" : "기록")));
    const isOwner = record.user_id === currentUserId;
    return createElement("div", createObj(ofArray([["key", int32ToString(record.id)], ["className", "bg-white rounded-lg p-3 shadow-sm flex items-start gap-3"], (elems_3 = toList(delay(() => {
        let elems;
        return append(singleton(createElement("div", createObj(ofArray([["className", "flex-shrink-0 w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center"], (elems = [createElement("span", {
            className: "text-xs font-semibold text-indigo-700",
            children: recordTypeLabel,
        })], ["children", reactApi.Children.toArray(Array.from(elems))])])))), delay(() => {
            let elems_1;
            return append(singleton(createElement("div", createObj(ofArray([["className", "flex-1 min-w-0"], (elems_1 = toList(delay(() => append(singleton(createElement("div", {
                className: "text-xs text-gray-500 mb-1",
                children: timeDisplay,
            })), delay(() => {
                let matchValue_2, text_1;
                return append((matchValue_2 = record.text_content, (matchValue_2 != null) ? (!isNullOrWhiteSpace(matchValue_2) ? ((text_1 = matchValue_2, singleton(createElement("div", {
                    className: "text-sm text-gray-800 whitespace-pre-wrap break-words",
                    children: text_1,
                })))) : singleton(defaultOf())) : singleton(defaultOf())), delay(() => {
                    const matchValue_3 = record.photo_url;
                    if (matchValue_3 == null) {
                        return singleton(defaultOf());
                    }
                    else {
                        const url = matchValue_3;
                        return singleton(createElement("img", {
                            src: url,
                            alt: "운동 사진",
                            className: "w-16 h-16 object-cover rounded mt-1 cursor-pointer hover:opacity-80 transition-opacity",
                            onClick: (_arg) => {
                                onPhotoClick(url);
                            },
                        }));
                    }
                }));
            })))), ["children", reactApi.Children.toArray(Array.from(elems_1))])])))), delay(() => {
                let elems_2;
                return isOwner ? singleton(createElement("div", createObj(ofArray([["className", "flex-shrink-0 flex items-start gap-2"], (elems_2 = [createElement("button", {
                    onClick: (_arg_1) => {
                        onEdit(record.id);
                    },
                    className: "text-sm text-blue-600 hover:text-blue-800 transition-colors",
                    children: "수정",
                }), createElement("button", {
                    onClick: (_arg_2) => {
                        onDelete(record.id);
                    },
                    className: "text-sm text-red-600 hover:text-red-800 transition-colors",
                    children: "삭제",
                })], ["children", reactApi.Children.toArray(Array.from(elems_2))])])))) : singleton(defaultOf());
            }));
        }));
    })), ["children", reactApi.Children.toArray(Array.from(elems_3))])])));
}

