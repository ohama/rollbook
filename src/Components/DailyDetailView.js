import { createElement } from "react";
import React from "react";
import { reactApi } from "../fable_modules/Feliz.2.9.0/Interop.fs.js";
import { printf, toText, trimStart, split } from "../fable_modules/fable-library-js.4.28.0/String.js";
import { item } from "../fable_modules/fable-library-js.4.28.0/Array.js";
import { createObj } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { map, singleton, append, delay, toList } from "../fable_modules/fable-library-js.4.28.0/Seq.js";
import { ofArray } from "../fable_modules/fable-library-js.4.28.0/List.js";
import { RecordItem } from "./RecordItem.js";
import { defaultOf } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { PhotoModal } from "./PhotoModal.js";

/**
 * Daily detail view showing all records for a specific date
 */
export function DailyDetailView(dailyDetailViewInputProps) {
    let elems_2;
    const onDelete = dailyDetailViewInputProps.onDelete;
    const onEdit = dailyDetailViewInputProps.onEdit;
    const onBack = dailyDetailViewInputProps.onBack;
    const currentUserId = dailyDetailViewInputProps.currentUserId;
    const records = dailyDetailViewInputProps.records;
    const selectedDate = dailyDetailViewInputProps.selectedDate;
    const patternInput = reactApi.useState(undefined);
    const setExpandedPhotoUrl = patternInput[1];
    let displayDate;
    const parts = split(selectedDate, ["-"], undefined, 0);
    if (parts.length === 3) {
        const arg = item(0, parts);
        const arg_1 = trimStart(item(1, parts), "0");
        const arg_2 = trimStart(item(2, parts), "0");
        displayDate = toText(printf("%s년 %s월 %s일"))(arg)(arg_1)(arg_2);
    }
    else {
        displayDate = selectedDate;
    }
    return createElement("div", createObj(ofArray([["className", "space-y-4"], (elems_2 = toList(delay(() => {
        let elems, value_5;
        return append(singleton(createElement("div", createObj(ofArray([["className", "flex items-center gap-3 mb-4"], (elems = [createElement("button", createObj(ofArray([["onClick", (_arg) => {
            onBack();
        }], (value_5 = "w-11 h-11 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition-colors", ["className", value_5]), ["children", "←"]]))), createElement("h2", {
            className: "text-lg font-semibold text-gray-800",
            children: displayDate,
        })], ["children", reactApi.Children.toArray(Array.from(elems))])])))), delay(() => {
            let elems_1;
            return append((records.length === 0) ? singleton(createElement("div", {
                className: "text-center text-gray-400 py-8",
                children: "이 날의 기록이 없습니다",
            })) : singleton(createElement("div", createObj(ofArray([["className", "space-y-2"], (elems_1 = toList(delay(() => map((record) => createElement(RecordItem, {
                record: record,
                currentUserId: currentUserId,
                onEdit: onEdit,
                onDelete: onDelete,
                onPhotoClick: (url) => {
                    setExpandedPhotoUrl(url);
                },
            }), records))), ["children", reactApi.Children.toArray(Array.from(elems_1))])])))), delay(() => {
                const matchValue = patternInput[0];
                if (matchValue == null) {
                    return singleton(defaultOf());
                }
                else {
                    const url_1 = matchValue;
                    return singleton(createElement(PhotoModal, {
                        photoUrl: url_1,
                        onClose: () => {
                            setExpandedPhotoUrl(undefined);
                        },
                    }));
                }
            }));
        }));
    })), ["children", reactApi.Children.toArray(Array.from(elems_2))])])));
}

