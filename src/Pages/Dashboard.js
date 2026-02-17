import { Union } from "../fable_modules/fable-library-js.4.28.0/Types.js";
import { union_type } from "../fable_modules/fable-library-js.4.28.0/Reflection.js";
import { createElement } from "react";
import React from "react";
import { reactApi } from "../fable_modules/Feliz.2.9.0/Interop.fs.js";
import { PromiseBuilder__Delay_62FBFDE1, PromiseBuilder__Run_212F1D4B } from "../fable_modules/Fable.Promise.3.2.0/Promise.fs.js";
import { promise } from "../fable_modules/Fable.Promise.3.2.0/PromiseImpl.fs.js";
import { createTextRecord, getAllWorkoutsForDate, getWorkouts, getAllWorkouts, getWorkoutsForDate, updateWorkoutById, deleteWorkoutById, upsertWorkout, deleteWorkout, getWorkout, getTodayDateString } from "../Supabase/Workouts.js";
import { isOnline } from "../offline/NetworkStatus.js";
import { OperationType } from "../offline/Types.js";
import { enqueue } from "../offline/Queue.js";
import { registerBackgroundSync } from "../offline/Sync.js";
import { equals, comparePrimitives, int32ToString, createObj } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { collect, singleton, append, delay, toList } from "../fable_modules/fable-library-js.4.28.0/Seq.js";
import { defaultOf } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { singleton as singleton_1, ofArray } from "../fable_modules/fable-library-js.4.28.0/List.js";
import { unwrap, value as value_170, defaultArg } from "../fable_modules/fable-library-js.4.28.0/Option.js";
import { split, printf, toText } from "../fable_modules/fable-library-js.4.28.0/String.js";
import { day, month, now, year } from "../fable_modules/fable-library-js.4.28.0/Date.js";
import { RecordEditState } from "../Supabase/Types.js";
import { tryFind, ofArray as ofArray_1, empty } from "../fable_modules/fable-library-js.4.28.0/Map.js";
import { getDaysInMonth, formatDateString } from "../Utils/DateHelpers.js";
import { getTeamProfiles } from "../Supabase/Team.js";
import { item, map as map_1 } from "../fable_modules/fable-library-js.4.28.0/Array.js";
import { signOut } from "../Supabase/Auth.js";
import { parse } from "../fable_modules/fable-library-js.4.28.0/Int32.js";
import { TeamViewPage } from "./TeamView.js";
import { ProgressViewPage } from "./ProgressView.js";
import { AdminPage } from "./AdminPage.js";
import { CalendarGrid } from "../Components/Calendar.js";
import { PhotoModal } from "../Components/PhotoModal.js";
import { RecordEditModal } from "../Components/RecordEditModal.js";

export class TabMode extends Union {
    constructor(tag, fields) {
        super();
        this.tag = tag;
        this.fields = fields;
    }
    cases() {
        return ["Home", "Progress", "Team", "Admin"];
    }
}

export function TabMode_$reflection() {
    return union_type("Pages.Dashboard.TabMode", [], TabMode, () => [[], [], [], []]);
}

export class ViewScope extends Union {
    constructor(tag, fields) {
        super();
        this.tag = tag;
        this.fields = fields;
    }
    cases() {
        return ["Personal", "TeamView"];
    }
}

export function ViewScope_$reflection() {
    return union_type("Pages.Dashboard.ViewScope", [], ViewScope, () => [[], []]);
}

export function WorkoutToggle(workoutToggleInputProps) {
    let elems;
    const refreshKey = workoutToggleInputProps.refreshKey;
    const userId = workoutToggleInputProps.userId;
    const patternInput = reactApi.useState(false);
    const setHasWorkedOut = patternInput[1];
    const hasWorkedOut = patternInput[0];
    const patternInput_1 = reactApi.useState(true);
    const setLoading = patternInput_1[1];
    const loading = patternInput_1[0];
    const patternInput_2 = reactApi.useState(undefined);
    const setError = patternInput_2[1];
    const dependencies = [refreshKey];
    reactApi.useEffect(() => {
        const pr = PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (PromiseBuilder__Delay_62FBFDE1(promise, () => {
            setLoading(true);
            const today = getTodayDateString();
            return getWorkout(userId, today).then((_arg) => {
                setHasWorkedOut(_arg != null);
                setLoading(false);
                return Promise.resolve();
            });
        }).catch((_arg_1) => {
            setError("운동 기록을 불러올 수 없습니다");
            setLoading(false);
            return Promise.resolve();
        }))));
        void pr;
    }, dependencies);
    const handleToggle = () => {
        if (!loading) {
            setLoading(true);
            setError(undefined);
            const today_1 = getTodayDateString();
            const newState = !hasWorkedOut;
            if (isOnline()) {
                const pr_1 = PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (PromiseBuilder__Delay_62FBFDE1(promise, () => ((hasWorkedOut ? (deleteWorkout(userId, today_1).then((_arg_2) => {
                    return Promise.resolve();
                })) : (upsertWorkout(userId, today_1).then((_arg_3) => {
                    return Promise.resolve();
                }))).then(() => PromiseBuilder__Delay_62FBFDE1(promise, () => {
                    setHasWorkedOut(newState);
                    setLoading(false);
                    return Promise.resolve();
                })))).catch((_arg_4) => {
                    setError("저장 실패. 다시 시도해주세요.");
                    setLoading(false);
                    return Promise.resolve();
                }))));
                void pr_1;
            }
            else {
                const pr_2 = PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (PromiseBuilder__Delay_62FBFDE1(promise, () => {
                    const operationType = hasWorkedOut ? (new OperationType(1, [])) : (new OperationType(0, []));
                    return enqueue(operationType, userId, today_1).then((_arg_5) => {
                        const result = _arg_5;
                        if (result.tag === 1) {
                            setError(result.fields[0]);
                            setLoading(false);
                            return Promise.resolve();
                        }
                        else {
                            setHasWorkedOut(newState);
                            setLoading(false);
                            return registerBackgroundSync().then((_arg_6) => {
                                return Promise.resolve();
                            });
                        }
                    });
                }).catch((_arg_7) => {
                    setError("저장 실패. 다시 시도해주세요.");
                    setLoading(false);
                    return Promise.resolve();
                }))));
                void pr_2;
            }
        }
    };
    return createElement("div", createObj(ofArray([["className", "flex flex-col items-center gap-6 p-8"], (elems = toList(delay(() => append(singleton(createElement("button", {
        onClick: (_arg_8) => {
            handleToggle();
        },
        disabled: loading,
        className: "text-8xl transition-all duration-200 " + (loading ? "opacity-50 cursor-wait" : (hasWorkedOut ? "scale-110" : "hover:scale-105")),
        children: hasWorkedOut ? "💪" : "⭕",
    })), delay(() => append(singleton(createElement("button", {
        onClick: (_arg_9) => {
            handleToggle();
        },
        disabled: loading,
        className: "px-8 py-4 rounded-xl text-xl font-semibold transition-all " + (loading ? "bg-gray-300 text-gray-500 cursor-wait" : (hasWorkedOut ? "bg-green-600 text-white hover:bg-green-700 active:scale-95" : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95")),
        children: loading ? "..." : (hasWorkedOut ? "운동 완료!" : "오늘 운동했다"),
    })), delay(() => {
        const matchValue = patternInput_2[0];
        return (matchValue == null) ? singleton(defaultOf()) : singleton(createElement("p", {
            className: "text-sm text-red-600",
            children: matchValue,
        }));
    })))))), ["children", reactApi.Children.toArray(Array.from(elems))])])));
}

/**
 * Inline editable record row for calendar date records
 */
export function EditableRecordRow(editableRecordRowInputProps) {
    let elems_1, elements, elems_4;
    const onPhotoClick = editableRecordRowInputProps.onPhotoClick;
    const onSaved = editableRecordRowInputProps.onSaved;
    const currentUserId = editableRecordRowInputProps.currentUserId;
    const displayName = editableRecordRowInputProps.displayName;
    const record = editableRecordRowInputProps.record;
    let patternInput;
    const initial = defaultArg(record.text_content, "");
    patternInput = reactApi.useState(initial);
    const editText = patternInput[0];
    const patternInput_1 = reactApi.useState(false);
    const setSaving = patternInput_1[1];
    const saving = patternInput_1[0];
    const patternInput_2 = reactApi.useState(false);
    const setDeleting = patternInput_2[1];
    const deleting = patternInput_2[0];
    const deleteButton = (record.user_id === currentUserId) ? createElement("button", createObj(ofArray([["className", "text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"], ["disabled", saving ? true : deleting], ["title", "삭제"], ["onClick", (_arg) => {
        setDeleting(true);
        const pr = PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (PromiseBuilder__Delay_62FBFDE1(promise, () => (deleteWorkoutById(record.id).then((_arg_1) => {
            setDeleting(false);
            onSaved();
            return Promise.resolve();
        }))).catch((_arg_2) => {
            setDeleting(false);
            return Promise.resolve();
        }))));
        void pr;
    }], (elems_1 = [createElement("svg", createObj(ofArray([["width", 18], ["height", 18], ["viewBox", (((((0 + " ") + 0) + " ") + 24) + " ") + 24], ["fill", "none"], ["stroke", "currentColor"], ["strokeWidth", 2], ["strokeLinecap", "round"], ["strokeLinejoin", "round"], (elements = ofArray([createElement("polyline", {
        points: "3,6 5,6 21,6",
    }), createElement("path", {
        d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
    }), createElement("line", {
        x1: 10,
        y1: 11,
        x2: 10,
        y2: 17,
    }), createElement("line", {
        x1: 14,
        y1: 11,
        x2: 14,
        y2: 17,
    })]), ["children", reactApi.Children.toArray(Array.from(elements))])])))], ["children", reactApi.Children.toArray(Array.from(elems_1))])]))) : defaultOf();
    return createElement("div", createObj(ofArray([["key", int32ToString(record.id)], ["className", "flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 border"], (elems_4 = toList(delay(() => append(singleton(createElement("span", {
        className: "font-medium text-indigo-700 whitespace-nowrap",
        children: toText(printf("%s:"))(displayName),
    })), delay(() => {
        let value_50;
        const matchValue = record.record_type;
        switch (matchValue) {
            case "text":
                return (record.user_id === currentUserId) ? append(singleton(createElement("input", createObj(ofArray([(value_50 = "flex-1 min-w-0 px-2 py-1 border rounded text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-400", ["className", value_50]), ["value", editText], ["onChange", (ev) => {
                    patternInput[1](ev.target.value);
                }], ["disabled", saving ? true : deleting]])))), delay(() => {
                    let elems_3, elements_1;
                    return append(singleton(createElement("button", createObj(ofArray([["className", "text-gray-400 hover:text-blue-500 transition-colors disabled:opacity-50"], ["disabled", saving ? true : deleting], ["title", "수정"], ["onClick", (_arg_3) => {
                        setSaving(true);
                        const pr_1 = PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (PromiseBuilder__Delay_62FBFDE1(promise, () => (updateWorkoutById(record.id, editText).then((_arg_4) => {
                            setSaving(false);
                            onSaved();
                            return Promise.resolve();
                        }))).catch((_arg_5) => {
                            setSaving(false);
                            return Promise.resolve();
                        }))));
                        void pr_1;
                    }], (elems_3 = [createElement("svg", createObj(ofArray([["width", 18], ["height", 18], ["viewBox", (((((0 + " ") + 0) + " ") + 24) + " ") + 24], ["fill", "none"], ["stroke", "currentColor"], ["strokeWidth", 2], ["strokeLinecap", "round"], ["strokeLinejoin", "round"], (elements_1 = ofArray([createElement("path", {
                        d: "M12 20h9",
                    }), createElement("path", {
                        d: "M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z",
                    })]), ["children", reactApi.Children.toArray(Array.from(elements_1))])])))], ["children", reactApi.Children.toArray(Array.from(elems_3))])])))), delay(() => singleton(deleteButton)));
                })) : singleton(createElement("span", {
                    className: "flex-1 min-w-0 text-gray-800",
                    children: defaultArg(record.text_content, "(빈 메모)"),
                }));
            case "photo": {
                const matchValue_1 = record.photo_url;
                if (matchValue_1 == null) {
                    return singleton(createElement("span", {
                        className: "flex-1 text-gray-400",
                        children: "(사진)",
                    }));
                }
                else {
                    const url = matchValue_1;
                    return append(singleton(createElement("img", {
                        src: url,
                        alt: "사진",
                        className: "w-12 h-12 object-cover rounded cursor-pointer",
                        onClick: (_arg_6) => {
                            onPhotoClick(url);
                        },
                    })), delay(() => singleton(deleteButton)));
                }
            }
            default:
                return append(singleton(createElement("span", {
                    className: "flex-1 text-green-700",
                    children: "운동 완료",
                })), delay(() => singleton(deleteButton)));
        }
    })))), ["children", reactApi.Children.toArray(Array.from(elems_4))])])));
}

export function DashboardPage(dashboardPageInputProps) {
    let elems_19, elems_2, elems_1, elems, elems_18;
    const onLogout = dashboardPageInputProps.onLogout;
    const user = dashboardPageInputProps.user;
    const patternInput = reactApi.useState(false);
    const loading = patternInput[0];
    const patternInput_1 = reactApi.useState(new TabMode(0, []));
    const setActiveTab = patternInput_1[1];
    const activeTab = patternInput_1[0];
    const patternInput_2 = reactApi.useState(0);
    const refreshKey = patternInput_2[0] | 0;
    let patternInput_3;
    const initial_3 = year(now()) | 0;
    patternInput_3 = reactApi.useState(initial_3);
    const setCurrentYear = patternInput_3[1];
    const currentYear = patternInput_3[0] | 0;
    let patternInput_4;
    const initial_4 = month(now()) | 0;
    patternInput_4 = reactApi.useState(initial_4);
    const setCurrentMonth = patternInput_4[1];
    const currentMonth = patternInput_4[0] | 0;
    const patternInput_5 = reactApi.useState(new ViewScope(1, []));
    const viewScope = patternInput_5[0];
    const setViewScope = patternInput_5[1];
    const viewScopeRef = reactApi.useRef(viewScope);
    const dependencies = [viewScope];
    reactApi.useEffect(() => {
        viewScopeRef.current = viewScope;
    }, dependencies);
    const patternInput_6 = reactApi.useState([]);
    const setRecordsLoading = reactApi.useState(true)[1];
    const patternInput_8 = reactApi.useState(new RecordEditState(0, []));
    const setEditState = patternInput_8[1];
    const editState = patternInput_8[0];
    const patternInput_9 = reactApi.useState(undefined);
    const setExpandedPhotoUrl = patternInput_9[1];
    const patternInput_10 = reactApi.useState([]);
    const setMonthlyWorkouts = patternInput_10[1];
    const patternInput_11 = reactApi.useState(undefined);
    const patternInput_12 = reactApi.useState(undefined);
    const selectedDate = patternInput_12[0];
    let patternInput_13;
    const initial_13 = getTodayDateString();
    patternInput_13 = reactApi.useState(initial_13);
    const setCalendarSelectedDate = patternInput_13[1];
    const calendarSelectedDate = patternInput_13[0];
    const patternInput_14 = reactApi.useState([]);
    const setCalendarDateRecords = patternInput_14[1];
    const calendarDateRecords = patternInput_14[0];
    const patternInput_15 = reactApi.useState("");
    const setUserDisplayName = patternInput_15[1];
    let patternInput_16;
    const initial_16 = empty({
        Compare: comparePrimitives,
    });
    patternInput_16 = reactApi.useState(initial_16);
    const dependencies_2 = [refreshKey];
    reactApi.useEffect(() => {
        const pr = PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (PromiseBuilder__Delay_62FBFDE1(promise, () => {
            setRecordsLoading(true);
            const today = getTodayDateString();
            return getWorkoutsForDate(user.id, today).then((_arg) => {
                patternInput_6[1](_arg);
                setRecordsLoading(false);
                return Promise.resolve();
            });
        }).catch((_arg_1) => {
            setRecordsLoading(false);
            return Promise.resolve();
        }))));
        void pr;
    }, dependencies_2);
    const dependencies_4 = [currentYear, currentMonth, refreshKey, viewScope];
    reactApi.useEffect(() => {
        const today_1 = getTodayDateString();
        const selectedDate_1 = ((currentYear === year(now())) && (currentMonth === month(now()))) ? today_1 : undefined;
        setCalendarSelectedDate(selectedDate_1);
        setCalendarDateRecords([]);
        const pr_1 = PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (PromiseBuilder__Delay_62FBFDE1(promise, () => {
            let matchValue;
            const startDate = formatDateString(currentYear, currentMonth, 1);
            const endDate = formatDateString(currentYear, currentMonth, getDaysInMonth(currentYear, currentMonth));
            return ((matchValue = viewScopeRef.current, (matchValue.tag === 1) ? (getAllWorkouts(startDate, endDate).then((_arg_3) => {
                setMonthlyWorkouts(_arg_3);
                return Promise.resolve();
            })) : (getWorkouts(user.id, startDate, endDate).then((_arg_2) => {
                setMonthlyWorkouts(_arg_2);
                return Promise.resolve();
            })))).then(() => PromiseBuilder__Delay_62FBFDE1(promise, () => {
                if (selectedDate_1 == null) {
                    return Promise.resolve();
                }
                else {
                    const date = selectedDate_1;
                    const matchValue_1 = viewScopeRef.current;
                    return (matchValue_1.tag === 1) ? (getAllWorkoutsForDate(date).then((_arg_5) => {
                        setCalendarDateRecords(_arg_5);
                        return Promise.resolve();
                    })) : (getWorkoutsForDate(user.id, date).then((_arg_4) => {
                        setCalendarDateRecords(_arg_4);
                        return Promise.resolve();
                    }));
                }
            }));
        }).catch((_arg_6) => {
            return Promise.resolve();
        }))));
        void pr_1;
    }, dependencies_4);
    reactApi.useEffect(() => {
        const pr_2 = PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (PromiseBuilder__Delay_62FBFDE1(promise, () => (getTeamProfiles().then((_arg_7) => {
            const map = ofArray_1(map_1((p) => [p.id, ((p.display_name != null) && (value_170(p.display_name) !== "")) ? value_170(p.display_name) : p.email], _arg_7), {
                Compare: comparePrimitives,
            });
            patternInput_16[1](map);
            const matchValue_2 = tryFind(user.id, map);
            if (matchValue_2 == null) {
                setUserDisplayName(defaultArg(user.email, "사용자"));
                return Promise.resolve();
            }
            else {
                setUserDisplayName(matchValue_2);
                return Promise.resolve();
            }
        }))).catch((_arg_8) => {
            return Promise.resolve();
        }))));
        void pr_2;
    }, []);
    const loadCalendarDateRecords = (date_1) => {
        const pr_3 = PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (PromiseBuilder__Delay_62FBFDE1(promise, () => {
            const matchValue_3 = viewScopeRef.current;
            return (matchValue_3.tag === 1) ? (getAllWorkoutsForDate(date_1).then((_arg_10) => {
                setCalendarDateRecords(_arg_10);
                return Promise.resolve();
            })) : (getWorkoutsForDate(user.id, date_1).then((_arg_9) => {
                setCalendarDateRecords(_arg_9);
                return Promise.resolve();
            }));
        }).catch((_arg_11) => {
            return Promise.resolve();
        }))));
        void pr_3;
    };
    const goToNextMonth = () => {
        if (currentMonth === 12) {
            setCurrentYear(currentYear + 1);
            setCurrentMonth(1);
        }
        else {
            setCurrentMonth(currentMonth + 1);
        }
    };
    const goToPrevMonth = () => {
        if (currentMonth === 1) {
            setCurrentYear(currentYear - 1);
            setCurrentMonth(12);
        }
        else {
            setCurrentMonth(currentMonth - 1);
        }
    };
    const handleSaveText = (text) => {
        setEditState(new RecordEditState(4, []));
        const pr_6 = PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (PromiseBuilder__Delay_62FBFDE1(promise, () => {
            const targetDate = defaultArg(selectedDate, getTodayDateString());
            return ((editState.tag === 3) ? (updateWorkoutById(editState.fields[0], text).then((_arg_19) => {
                return Promise.resolve();
            })) : (createTextRecord(user.id, targetDate, text).then((_arg_20) => {
                return Promise.resolve();
            }))).then(() => PromiseBuilder__Delay_62FBFDE1(promise, () => {
                setEditState(new RecordEditState(0, []));
                patternInput_2[1](refreshKey + 1);
                return ((selectedDate == null) ? (Promise.resolve()) : ((loadCalendarDateRecords(selectedDate), Promise.resolve()))).then(() => PromiseBuilder__Delay_62FBFDE1(promise, () => {
                    patternInput_12[1](undefined);
                    return Promise.resolve();
                }));
            }));
        }).catch((_arg_21) => {
            setEditState(new RecordEditState(6, ["저장 실패. 다시 시도해주세요."]));
            return Promise.resolve();
        }))));
        void pr_6;
    };
    return createElement("div", createObj(ofArray([["className", "min-h-screen bg-gray-100"], (elems_19 = [createElement("header", createObj(ofArray([["className", "bg-white shadow-sm"], (elems_2 = [createElement("div", createObj(ofArray([["className", "max-w-4xl mx-auto px-4 py-4 flex items-center justify-between"], (elems_1 = [createElement("h1", {
        className: "text-xl font-bold text-indigo-600",
        children: "Rollbook",
    }), createElement("div", createObj(ofArray([["className", "flex items-center gap-2"], (elems = [createElement("button", {
        onClick: (_arg_30) => {
            if (equals(activeTab, new TabMode(3, []))) {
                setActiveTab(new TabMode(0, []));
            }
            else {
                setActiveTab(new TabMode(3, []));
            }
        },
        className: "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors " + (equals(activeTab, new TabMode(3, [])) ? "bg-green-600 text-white" : "bg-green-100 text-green-700 hover:bg-green-200"),
        children: "관리",
    }), createElement("button", {
        onClick: (_arg_31) => {
            patternInput[1](true);
            const pr_9 = PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (signOut().then((_arg_29) => {
                onLogout();
                return Promise.resolve();
            }))));
            void pr_9;
        },
        disabled: loading,
        className: "px-4 py-2 rounded-lg text-sm font-medium transition-colors " + (loading ? "text-gray-400 cursor-not-allowed" : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"),
        children: loading ? "로그아웃 중..." : "로그아웃",
    })], ["children", reactApi.Children.toArray(Array.from(elems))])])))], ["children", reactApi.Children.toArray(Array.from(elems_1))])])))], ["children", reactApi.Children.toArray(Array.from(elems_2))])]))), createElement("main", createObj(ofArray([["className", "max-w-4xl mx-auto px-4 py-8"], (elems_18 = toList(delay(() => {
        let elems_7, value_35, elems_4, elements_1, arg_5, d, parts, arg, arg_1, arg_2, value_60, elems_6, elements_2;
        return append(singleton(createElement("div", createObj(ofArray([["className", "flex items-center justify-between bg-white rounded-lg shadow-sm p-4 mb-4"], (elems_7 = [createElement("button", createObj(ofArray([["onClick", (_arg_32) => {
            goToPrevMonth();
        }], (value_35 = "w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors", ["className", value_35]), (elems_4 = [createElement("svg", createObj(ofArray([["width", 20], ["height", 20], ["viewBox", (((((0 + " ") + 0) + " ") + 24) + " ") + 24], ["fill", "none"], ["stroke", "currentColor"], ["strokeWidth", 2.5], ["strokeLinecap", "round"], ["strokeLinejoin", "round"], (elements_1 = ofArray([createElement("polyline", {
            points: "14,18 8,12 14,6",
        }), createElement("polyline", {
            points: "8,18 2,12 8,6",
        })]), ["children", reactApi.Children.toArray(Array.from(elements_1))])])))], ["children", reactApi.Children.toArray(Array.from(elems_4))])]))), createElement("h2", {
            className: "text-lg font-semibold text-gray-800",
            children: (calendarSelectedDate == null) ? ((arg_5 = (day(now()) | 0), toText(printf("%d년 %d월 %d일"))(currentYear)(currentMonth)(arg_5))) : ((d = calendarSelectedDate, (parts = split(d, ["-"], undefined, 0), (parts.length === 3) ? ((arg = item(0, parts), (arg_1 = (parse(item(1, parts), 511, false, 32) | 0), (arg_2 = (parse(item(2, parts), 511, false, 32) | 0), toText(printf("%s년 %d월 %d일"))(arg)(arg_1)(arg_2))))) : d))),
        }), createElement("button", createObj(ofArray([["onClick", (_arg_33) => {
            goToNextMonth();
        }], (value_60 = "w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors", ["className", value_60]), (elems_6 = [createElement("svg", createObj(ofArray([["width", 20], ["height", 20], ["viewBox", (((((0 + " ") + 0) + " ") + 24) + " ") + 24], ["fill", "none"], ["stroke", "currentColor"], ["strokeWidth", 2.5], ["strokeLinecap", "round"], ["strokeLinejoin", "round"], (elements_2 = ofArray([createElement("polyline", {
            points: "10,6 16,12 10,18",
        }), createElement("polyline", {
            points: "16,6 22,12 16,18",
        })]), ["children", reactApi.Children.toArray(Array.from(elements_2))])])))], ["children", reactApi.Children.toArray(Array.from(elems_6))])])))], ["children", reactApi.Children.toArray(Array.from(elems_7))])])))), delay(() => {
            let elems_12, elems_9, elements_3, elems_11, elements_4;
            return append(singleton(createElement("div", createObj(ofArray([["className", "flex gap-2 mb-6"], (elems_12 = [createElement("button", createObj(ofArray([["onClick", (_arg_34) => {
                setViewScope(new ViewScope(0, []));
            }], ["className", "flex-1 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 " + (equals(viewScope, new ViewScope(0, [])) ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300")], (elems_9 = [createElement("svg", createObj(ofArray([["width", 20], ["height", 20], ["viewBox", (((((0 + " ") + 0) + " ") + 24) + " ") + 24], ["fill", "none"], ["stroke", "currentColor"], ["strokeWidth", 2], ["strokeLinecap", "round"], ["strokeLinejoin", "round"], (elements_3 = ofArray([createElement("path", {
                d: "M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z",
            }), createElement("path", {
                d: "M4 22h-2a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h2",
            })]), ["children", reactApi.Children.toArray(Array.from(elements_3))])]))), createElement("span", {
                children: "나",
            })], ["children", reactApi.Children.toArray(Array.from(elems_9))])]))), createElement("button", createObj(ofArray([["onClick", (_arg_35) => {
                setViewScope(new ViewScope(1, []));
            }], ["className", "flex-1 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 " + (equals(viewScope, new ViewScope(1, [])) ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300")], (elems_11 = [createElement("svg", createObj(ofArray([["width", 20], ["height", 20], ["viewBox", (((((0 + " ") + 0) + " ") + 24) + " ") + 24], ["fill", "none"], ["stroke", "currentColor"], ["strokeWidth", 2], ["strokeLinecap", "round"], ["strokeLinejoin", "round"], (elements_4 = ofArray([createElement("path", {
                d: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2",
            }), createElement("circle", {
                cx: 9,
                cy: 7,
                r: 4,
            }), createElement("path", {
                d: "M23 21v-2a4 4 0 0 0-3-3.87",
            }), createElement("path", {
                d: "M16 3.13a4 4 0 0 1 0 7.75",
            })]), ["children", reactApi.Children.toArray(Array.from(elements_4))])]))), createElement("span", {
                children: "우리",
            })], ["children", reactApi.Children.toArray(Array.from(elems_11))])])))], ["children", reactApi.Children.toArray(Array.from(elems_12))])])))), delay(() => {
                let matchValue_5, elems_16;
                return append((matchValue_5 = activeTab, (matchValue_5.tag === 1) ? ((viewScope.tag === 1) ? singleton(createElement(TeamViewPage, {
                    year: currentYear,
                    month: currentMonth,
                })) : singleton(createElement(ProgressViewPage, {
                    userId: user.id,
                    year: currentYear,
                    month: currentMonth,
                }))) : ((matchValue_5.tag === 2) ? singleton(createElement("div", {
                    className: "p-6 text-center text-gray-600",
                    children: "팀 뷰는 \'Progress\' 탭에서 \'우리\'를 선택하세요",
                })) : ((matchValue_5.tag === 3) ? singleton(createElement(AdminPage, null)) : singleton(createElement("div", createObj(singleton_1((elems_16 = toList(delay(() => {
                    let elems_13;
                    return append(singleton(createElement("div", createObj(ofArray([["className", "bg-white rounded-xl shadow-sm p-4 mt-4"], (elems_13 = [createElement(CalendarGrid, {
                        userId: user.id,
                        year: currentYear,
                        month: currentMonth,
                        workouts: patternInput_10[0],
                        onPrevMonth: goToPrevMonth,
                        onNextMonth: goToNextMonth,
                        onDateClick: (dateString) => {
                            setCalendarSelectedDate(dateString);
                            loadCalendarDateRecords(dateString);
                        },
                        onDateDoubleClick: (dateString_1) => {
                            setCalendarSelectedDate(dateString_1);
                            const pr_7 = PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (PromiseBuilder__Delay_62FBFDE1(promise, () => (createTextRecord(user.id, dateString_1, "운동했어").then((_arg_22) => {
                                const startDate_3 = formatDateString(currentYear, currentMonth, 1);
                                const endDate_3 = formatDateString(currentYear, currentMonth, getDaysInMonth(currentYear, currentMonth));
                                return getWorkouts(user.id, startDate_3, endDate_3).then((_arg_23) => {
                                    setMonthlyWorkouts(_arg_23);
                                    return getWorkoutsForDate(user.id, dateString_1).then((_arg_24) => {
                                        setCalendarDateRecords(_arg_24);
                                        return Promise.resolve();
                                    });
                                });
                            }))).catch((_arg_25) => {
                                return Promise.resolve();
                            }))));
                            void pr_7;
                        },
                        selectedDate: unwrap(calendarSelectedDate),
                    })], ["children", reactApi.Children.toArray(Array.from(elems_13))])])))), delay(() => {
                        let matchValue_6, date_4, elems_15;
                        return append((matchValue_6 = calendarSelectedDate, (matchValue_6 == null) ? singleton(defaultOf()) : ((date_4 = matchValue_6, singleton(createElement("div", createObj(ofArray([["className", "bg-white rounded-xl shadow-sm p-4 mt-4"], (elems_15 = toList(delay(() => {
                            let arg_7;
                            return append(singleton(createElement("h3", {
                                className: "text-sm font-semibold text-gray-600 mb-3",
                                children: (arg_7 = (calendarDateRecords.length | 0), toText(printf("%s 기록 (%d)"))(date_4)(arg_7)),
                            })), delay(() => {
                                let elems_14;
                                return (calendarDateRecords.length === 0) ? singleton(createElement("div", {
                                    className: "text-center text-gray-400 py-4",
                                    children: "기록이 없습니다",
                                })) : singleton(createElement("div", createObj(ofArray([["className", "space-y-2"], (elems_14 = toList(delay(() => collect((record_1) => {
                                    const recordDisplayName = defaultArg(tryFind(record_1.user_id, patternInput_16[0]), patternInput_15[0]);
                                    return singleton(createElement(EditableRecordRow, {
                                        record: record_1,
                                        displayName: recordDisplayName,
                                        currentUserId: user.id,
                                        onSaved: () => {
                                            loadCalendarDateRecords(date_4);
                                            const pr_4 = PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (PromiseBuilder__Delay_62FBFDE1(promise, () => {
                                                const startDate_1 = formatDateString(currentYear, currentMonth, 1);
                                                const endDate_1 = formatDateString(currentYear, currentMonth, getDaysInMonth(currentYear, currentMonth));
                                                const matchValue_4 = viewScopeRef.current;
                                                return (matchValue_4.tag === 1) ? (getAllWorkouts(startDate_1, endDate_1).then((_arg_13) => {
                                                    setMonthlyWorkouts(_arg_13);
                                                    return Promise.resolve();
                                                })) : (getWorkouts(user.id, startDate_1, endDate_1).then((_arg_12) => {
                                                    setMonthlyWorkouts(_arg_12);
                                                    return Promise.resolve();
                                                }));
                                            }).catch((_arg_14) => {
                                                return Promise.resolve();
                                            }))));
                                            void pr_4;
                                        },
                                        onPhotoClick: (url) => {
                                            setExpandedPhotoUrl(url);
                                        },
                                    }));
                                }, calendarDateRecords))), ["children", reactApi.Children.toArray(Array.from(elems_14))])]))));
                            }));
                        })), ["children", reactApi.Children.toArray(Array.from(elems_15))])]))))))), delay(() => {
                            const matchValue_7 = patternInput_9[0];
                            if (matchValue_7 == null) {
                                return singleton(defaultOf());
                            }
                            else {
                                const url_1 = matchValue_7;
                                return singleton(createElement(PhotoModal, {
                                    photoUrl: url_1,
                                    onClose: () => {
                                        setExpandedPhotoUrl(undefined);
                                    },
                                }));
                            }
                        }));
                    }));
                })), ["children", reactApi.Children.toArray(Array.from(elems_16))])))))))), delay(() => {
                    let elems_17;
                    const matchValue_9 = editState;
                    return (matchValue_9.tag === 1) ? singleton(createElement(RecordEditModal, {
                        initialText: "",
                        saving: false,
                        onSave: handleSaveText,
                        onCancel: () => {
                            setEditState(new RecordEditState(0, []));
                        },
                    })) : ((matchValue_9.tag === 3) ? singleton(createElement(RecordEditModal, {
                        editingRecordId: matchValue_9.fields[0],
                        initialText: matchValue_9.fields[1],
                        saving: false,
                        onSave: handleSaveText,
                        onCancel: () => {
                            setEditState(new RecordEditState(0, []));
                        },
                    })) : ((matchValue_9.tag === 4) ? singleton(createElement(RecordEditModal, {
                        initialText: "",
                        saving: true,
                        onSave: (_arg_36) => {
                        },
                        onCancel: () => {
                        },
                    })) : ((matchValue_9.tag === 6) ? singleton(createElement("div", createObj(ofArray([["className", "fixed bottom-4 left-4 right-4 bg-red-100 text-red-700 p-3 rounded-lg shadow-lg z-50 text-center"], (elems_17 = [matchValue_9.fields[0], createElement("button", {
                        onClick: (_arg_37) => {
                            setEditState(new RecordEditState(0, []));
                        },
                        className: "ml-2 underline",
                        children: "닫기",
                    })], ["children", reactApi.Children.toArray(Array.from(elems_17))])])))) : singleton(defaultOf()))));
                }));
            }));
        }));
    })), ["children", reactApi.Children.toArray(Array.from(elems_18))])])))], ["children", reactApi.Children.toArray(Array.from(elems_19))])])));
}

