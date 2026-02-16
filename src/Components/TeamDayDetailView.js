import { Record } from "../fable_modules/fable-library-js.4.28.0/Types.js";
import { record_type, array_type, tuple_type, int32_type, string_type } from "../fable_modules/fable-library-js.4.28.0/Reflection.js";
import { WorkoutRecord_$reflection } from "../Supabase/Types.js";
import { tryFind, ofArray } from "../fable_modules/fable-library-js.4.28.0/Map.js";
import { item, sortBy, map } from "../fable_modules/fable-library-js.4.28.0/Array.js";
import { createObj, stringHash, comparePrimitives } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { some, map as map_1, bind, orElse, defaultArg } from "../fable_modules/fable-library-js.4.28.0/Option.js";
import { Array_groupBy, Array_countBy } from "../fable_modules/fable-library-js.4.28.0/Seq2.js";
import { substring, trimStart, split, printf, toText } from "../fable_modules/fable-library-js.4.28.0/String.js";
import { createElement } from "react";
import React from "react";
import { reactApi } from "../fable_modules/Feliz.2.9.0/Interop.fs.js";
import { PromiseBuilder__Delay_62FBFDE1, PromiseBuilder__Run_212F1D4B } from "../fable_modules/Fable.Promise.3.2.0/Promise.fs.js";
import { promise } from "../fable_modules/Fable.Promise.3.2.0/PromiseImpl.fs.js";
import { getTeamProfiles } from "../Supabase/Team.js";
import { collect, map as map_2, singleton, append, delay, toList } from "../fable_modules/fable-library-js.4.28.0/Seq.js";
import { ofArray as ofArray_1 } from "../fable_modules/fable-library-js.4.28.0/List.js";

export class UserRecordGroup extends Record {
    constructor(UserId, DisplayName, RecordCount, RecordsByType, Records) {
        super();
        this.UserId = UserId;
        this.DisplayName = DisplayName;
        this.RecordCount = (RecordCount | 0);
        this.RecordsByType = RecordsByType;
        this.Records = Records;
    }
}

export function UserRecordGroup_$reflection() {
    return record_type("Components.TeamDayDetailView.UserRecordGroup", [], UserRecordGroup, () => [["UserId", string_type], ["DisplayName", string_type], ["RecordCount", int32_type], ["RecordsByType", array_type(tuple_type(string_type, int32_type))], ["Records", array_type(WorkoutRecord_$reflection())]]);
}

/**
 * Group records by user with type counts
 */
export function groupRecordsByUser(records, profiles) {
    const profileMap = ofArray(map((p) => [p.id, p], profiles), {
        Compare: comparePrimitives,
    });
    return sortBy((g) => g.DisplayName, map((tupledArg) => {
        const userId = tupledArg[0];
        const userRecords = tupledArg[1];
        const profile = tryFind(userId, profileMap);
        const displayName = defaultArg(orElse(bind((p_1) => p_1.display_name, profile), map_1((p_2) => p_2.email, profile)), "Unknown User");
        const recordsByType = sortBy((tuple) => tuple[0], Array_countBy((r_1) => r_1.record_type, userRecords, {
            Equals: (x_2, y_2) => (x_2 === y_2),
            GetHashCode: stringHash,
        }), {
            Compare: comparePrimitives,
        });
        return new UserRecordGroup(userId, displayName, userRecords.length, recordsByType, userRecords);
    }, Array_groupBy((r) => r.user_id, records, {
        Equals: (x_1, y_1) => (x_1 === y_1),
        GetHashCode: stringHash,
    })), {
        Compare: comparePrimitives,
    });
}

/**
 * Get badge color classes based on record type
 */
export function getBadgeColor(recordType) {
    switch (recordType) {
        case "workout":
            return ["bg-green-100 text-green-700", "운동"];
        case "text":
            return ["bg-blue-100 text-blue-700", "메모"];
        case "photo":
            return ["bg-purple-100 text-purple-700", "사진"];
        default:
            return ["bg-gray-100 text-gray-700", recordType];
    }
}

/**
 * Format count multiplier for display
 */
export function formatCountMultiplier(count) {
    if (count <= 1) {
        return "";
    }
    else if (count >= 100) {
        return " ×99+";
    }
    else {
        return toText(printf(" ×%d"))(count);
    }
}

/**
 * Team day detail view showing grouped user list with record type badges
 */
export function TeamDayDetailView(teamDayDetailViewInputProps) {
    let elems_5;
    const onUserClick = teamDayDetailViewInputProps.onUserClick;
    const onBack = teamDayDetailViewInputProps.onBack;
    const records = teamDayDetailViewInputProps.records;
    const selectedDate = teamDayDetailViewInputProps.selectedDate;
    const patternInput = reactApi.useState([]);
    const userGroups = patternInput[0];
    const setUserGroups = patternInput[1];
    const patternInput_1 = reactApi.useState(true);
    const setLoading = patternInput_1[1];
    const dependencies = [records];
    reactApi.useEffect(() => {
        const pr = PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (PromiseBuilder__Delay_62FBFDE1(promise, () => (getTeamProfiles().then((_arg) => {
            setUserGroups(groupRecordsByUser(records, _arg));
            setLoading(false);
            return Promise.resolve();
        }))).catch((_arg_1) => {
            console.error(some("Failed to fetch team profiles:"), _arg_1.message);
            setUserGroups(groupRecordsByUser(records, []));
            setLoading(false);
            return Promise.resolve();
        }))));
        void pr;
    }, dependencies);
    let displayDate;
    const parts = split(selectedDate, ["-"], undefined, 0);
    if (parts.length === 3) {
        const arg = item(0, parts);
        const arg_1 = trimStart(item(1, parts), "0");
        const arg_2 = trimStart(item(2, parts), "0");
        displayDate = toText(printf("%s년 %s월 %s일 - 팀 기록"))(arg)(arg_1)(arg_2);
    }
    else {
        displayDate = (selectedDate + " - 팀 기록");
    }
    return createElement("div", createObj(ofArray_1([["className", "space-y-4"], (elems_5 = toList(delay(() => {
        let elems, value_5;
        return append(singleton(createElement("div", createObj(ofArray_1([["className", "flex items-center gap-3 mb-4"], (elems = [createElement("button", createObj(ofArray_1([["onClick", (_arg_2) => {
            onBack();
        }], (value_5 = "w-11 h-11 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition-colors", ["className", value_5]), ["children", "←"]]))), createElement("h2", {
            className: "text-lg font-semibold text-gray-800",
            children: displayDate,
        })], ["children", reactApi.Children.toArray(Array.from(elems))])])))), delay(() => {
            let elems_4;
            return patternInput_1[0] ? singleton(createElement("div", {
                className: "text-center text-gray-400 py-8",
                children: "로딩 중...",
            })) : ((userGroups.length === 0) ? singleton(createElement("div", {
                className: "text-center text-gray-400 py-8",
                children: "이 날의 기록이 없습니다",
            })) : singleton(createElement("div", createObj(ofArray_1([["className", "space-y-2"], (elems_4 = toList(delay(() => map_2((group) => {
                let value_25, elems_3, elems_1, elems_2;
                return createElement("button", createObj(ofArray_1([["onClick", (_arg_3) => {
                    onUserClick(group.UserId);
                }], (value_25 = "w-full flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all", ["className", value_25]), (elems_3 = [createElement("div", createObj(ofArray_1([["className", "flex items-center gap-3"], (elems_1 = [createElement("div", {
                    className: "w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-semibold text-indigo-700",
                    children: (group.DisplayName.length > 0) ? substring(group.DisplayName, 0, 1) : "?",
                }), createElement("span", {
                    className: "font-medium text-gray-800",
                    children: group.DisplayName,
                })], ["children", reactApi.Children.toArray(Array.from(elems_1))])]))), createElement("div", createObj(ofArray_1([["className", "flex gap-2 flex-wrap justify-end"], (elems_2 = toList(delay(() => collect((matchValue) => {
                    const patternInput_2 = getBadgeColor(matchValue[0]);
                    const multiplier = formatCountMultiplier(matchValue[1]);
                    return singleton(createElement("span", {
                        className: toText(printf("px-2 py-1 rounded-full text-xs font-medium %s"))(patternInput_2[0]),
                        children: patternInput_2[1] + multiplier,
                    }));
                }, group.RecordsByType))), ["children", reactApi.Children.toArray(Array.from(elems_2))])])))], ["children", reactApi.Children.toArray(Array.from(elems_3))])])));
            }, userGroups))), ["children", reactApi.Children.toArray(Array.from(elems_4))])])))));
        }));
    })), ["children", reactApi.Children.toArray(Array.from(elems_5))])])));
}

