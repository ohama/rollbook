import { Union } from "../fable_modules/fable-library-js.4.28.0/Types.js";
import { getRecentChanges, AuditEntry_$reflection } from "../Supabase/Audit.js";
import { union_type, string_type, array_type } from "../fable_modules/fable-library-js.4.28.0/Reflection.js";
import { createElement } from "react";
import React from "react";
import { reactApi } from "../fable_modules/Feliz.2.9.0/Interop.fs.js";
import { PromiseBuilder__Delay_62FBFDE1, PromiseBuilder__Run_212F1D4B } from "../fable_modules/Fable.Promise.3.2.0/Promise.fs.js";
import { promise } from "../fable_modules/Fable.Promise.3.2.0/PromiseImpl.fs.js";
import { createObj } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { map, singleton, append, delay, toList } from "../fable_modules/fable-library-js.4.28.0/Seq.js";
import { substring, printf, toText } from "../fable_modules/fable-library-js.4.28.0/String.js";
import { singleton as singleton_1, ofArray } from "../fable_modules/fable-library-js.4.28.0/List.js";
import { defaultArg } from "../fable_modules/fable-library-js.4.28.0/Option.js";

export class AuditListState extends Union {
    constructor(tag, fields) {
        super();
        this.tag = tag;
        this.fields = fields;
    }
    cases() {
        return ["Loading", "Loaded", "Error"];
    }
}

export function AuditListState_$reflection() {
    return union_type("Components.AuditLogList.AuditListState", [], AuditListState, () => [[], [["entries", array_type(AuditEntry_$reflection())]], [["message", string_type]]]);
}

export function AuditLogList(auditLogListInputProps) {
    let elems_4;
    const limit = auditLogListInputProps.limit;
    const patternInput = reactApi.useState(new AuditListState(0, []));
    const setState = patternInput[1];
    const dependencies = [limit];
    reactApi.useEffect(() => {
        const pr = PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (getRecentChanges(limit).then((_arg) => {
            const result = _arg;
            if (result.tag === 1) {
                setState(new AuditListState(2, [result.fields[0]]));
                return Promise.resolve();
            }
            else {
                setState(new AuditListState(1, [result.fields[0]]));
                return Promise.resolve();
            }
        }))));
        void pr;
    }, dependencies);
    return createElement("div", createObj(ofArray([["className", "bg-white rounded-lg shadow p-4"], (elems_4 = toList(delay(() => append(singleton(createElement("h2", {
        className: "text-lg font-semibold mb-4",
        children: "최근 수정 내역",
    })), delay(() => {
        let elems_3, elems_2, children, elems, children_2;
        const matchValue = patternInput[0];
        return (matchValue.tag === 2) ? singleton(createElement("div", {
            className: "bg-red-50 border border-red-200 rounded p-4 text-red-600",
            children: toText(printf("오류: %s"))(matchValue.fields[0]),
        })) : ((matchValue.tag === 1) ? ((matchValue.fields[0].length === 0) ? singleton(createElement("div", {
            className: "text-center py-8 text-gray-500",
            children: "수정 내역이 없습니다.",
        })) : singleton(createElement("div", createObj(ofArray([["className", "overflow-x-auto"], (elems_3 = [createElement("table", createObj(ofArray([["className", "w-full text-sm"], (elems_2 = [(children = singleton_1(createElement("tr", createObj(ofArray([["className", "border-b"], (elems = [createElement("th", {
            className: "text-left py-2 px-2 font-medium",
            children: "시간",
        }), createElement("th", {
            className: "text-left py-2 px-2 font-medium",
            children: "작업",
        }), createElement("th", {
            className: "text-left py-2 px-2 font-medium",
            children: "대상",
        }), createElement("th", {
            className: "text-left py-2 px-2 font-medium",
            children: "사용자",
        })], ["children", reactApi.Children.toArray(Array.from(elems))])])))), createElement("thead", {
            children: reactApi.Children.toArray(Array.from(children)),
        })), (children_2 = toList(delay(() => map((entry) => {
            let elems_1, op, name;
            return createElement("tr", createObj(ofArray([["className", "border-b hover:bg-gray-50"], (elems_1 = [createElement("td", {
                className: "py-2 px-2",
                children: substring(entry.ts, 5, 11),
            }), createElement("td", {
                className: "py-2 px-2",
                children: (op = entry.op, (op === "INSERT") ? "추가" : ((op === "UPDATE") ? "수정" : ((op === "DELETE") ? "삭제" : op))),
            }), createElement("td", {
                className: "py-2 px-2",
                children: (name = entry.table_name, (name === "workouts") ? "운동 기록" : ((name === "profiles") ? "프로필" : ((name === "user_roles") ? "역할" : name))),
            }), createElement("td", {
                className: "py-2 px-2",
                children: defaultArg(entry.user_email, "시스템"),
            })], ["children", reactApi.Children.toArray(Array.from(elems_1))])])));
        }, matchValue.fields[0]))), createElement("tbody", {
            children: reactApi.Children.toArray(Array.from(children_2)),
        }))], ["children", reactApi.Children.toArray(Array.from(elems_2))])])))], ["children", reactApi.Children.toArray(Array.from(elems_3))])]))))) : singleton(createElement("div", {
            className: "text-center py-8 text-gray-500",
            children: "로딩 중...",
        })));
    })))), ["children", reactApi.Children.toArray(Array.from(elems_4))])])));
}

