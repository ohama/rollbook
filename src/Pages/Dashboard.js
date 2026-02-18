import { Union } from "../fable_modules/fable-library-js.4.28.0/Types.js";
import { union_type } from "../fable_modules/fable-library-js.4.28.0/Reflection.js";
import { createElement } from "react";
import React from "react";
import { reactApi } from "../fable_modules/Feliz.2.9.0/Interop.fs.js";
import { PromiseBuilder__Delay_62FBFDE1, PromiseBuilder__Run_212F1D4B } from "../fable_modules/Fable.Promise.3.2.0/Promise.fs.js";
import { promise } from "../fable_modules/Fable.Promise.3.2.0/PromiseImpl.fs.js";
import { createTextRecord, getAllWorkoutsForDate, getWorkouts, getAllWorkouts, getWorkoutsForDate, deleteWorkoutById, updateWorkoutById, upsertWorkout, deleteWorkout, getWorkout, getTodayDateString } from "../Supabase/Workouts.js";
import { isOnline } from "../offline/NetworkStatus.js";
import { OperationType } from "../offline/Types.js";
import { enqueue } from "../offline/Queue.js";
import { registerBackgroundSync } from "../offline/Sync.js";
import { stringHash, equals, comparePrimitives, int32ToString, createObj } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { collect, empty as empty_1, singleton, append, delay, toList } from "../fable_modules/fable-library-js.4.28.0/Seq.js";
import { defaultOf } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { singleton as singleton_1, ofArray } from "../fable_modules/fable-library-js.4.28.0/List.js";
import { unwrap, value as value_274, defaultArg } from "../fable_modules/fable-library-js.4.28.0/Option.js";
import { replace, split, printf, toText } from "../fable_modules/fable-library-js.4.28.0/String.js";
import { day, month, now, year } from "../fable_modules/fable-library-js.4.28.0/Date.js";
import { RecordEditState } from "../Supabase/Types.js";
import { tryFind as tryFind_1, ofArray as ofArray_1, empty } from "../fable_modules/fable-library-js.4.28.0/Map.js";
import { getDaysInMonth, formatDateString } from "../Utils/DateHelpers.js";
import { getTeamProfiles } from "../Supabase/Team.js";
import { item, tryFind, map as map_1 } from "../fable_modules/fable-library-js.4.28.0/Array.js";
import { isAdmin } from "../Supabase/Admin.js";
import { signOut } from "../Supabase/Auth.js";
import { parse } from "../fable_modules/fable-library-js.4.28.0/Int32.js";
import { TeamViewPage } from "./TeamView.js";
import { ProgressViewPage } from "./ProgressView.js";
import { AdminPage } from "./AdminPage.js";
import { ProfilePage } from "./ProfilePage.js";
import { CalendarGrid } from "../Components/Calendar.js";
import { Array_groupBy, Array_distinct } from "../fable_modules/fable-library-js.4.28.0/Seq2.js";
import { PhotoModal } from "../Components/PhotoModal.js";
import { RecordEditModal } from "../Components/RecordEditModal.js";

export class TabMode extends Union {
    constructor(tag, fields) {
        super();
        this.tag = tag;
        this.fields = fields;
    }
    cases() {
        return ["Home", "Progress", "Team", "Admin", "Profile"];
    }
}

export function TabMode_$reflection() {
    return union_type("Pages.Dashboard.TabMode", [], TabMode, () => [[], [], [], [], []]);
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
    let elems_1, elements, elems_2;
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
    const setEditing = patternInput_1[1];
    const patternInput_2 = reactApi.useState(false);
    const setSaving = patternInput_2[1];
    const saving = patternInput_2[0];
    const patternInput_3 = reactApi.useState(false);
    const setDeleting = patternInput_3[1];
    const deleting = patternInput_3[0];
    const saveText = () => {
        if (editText !== defaultArg(record.text_content, "")) {
            setSaving(true);
            const pr = PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (PromiseBuilder__Delay_62FBFDE1(promise, () => (updateWorkoutById(record.id, editText).then((_arg) => {
                setSaving(false);
                setEditing(false);
                onSaved();
                return Promise.resolve();
            }))).catch((_arg_1) => {
                setSaving(false);
                return Promise.resolve();
            }))));
            void pr;
        }
        else {
            setEditing(false);
        }
    };
    const deleteButton = (record.user_id === currentUserId) ? createElement("button", createObj(ofArray([["className", "text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"], ["disabled", saving ? true : deleting], ["title", "삭제"], ["onClick", (_arg_2) => {
        setDeleting(true);
        const pr_1 = PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (PromiseBuilder__Delay_62FBFDE1(promise, () => (deleteWorkoutById(record.id).then((_arg_3) => {
            setDeleting(false);
            onSaved();
            return Promise.resolve();
        }))).catch((_arg_4) => {
            setDeleting(false);
            return Promise.resolve();
        }))));
        void pr_1;
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
    return createElement("div", createObj(ofArray([["key", int32ToString(record.id)], ["className", "flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 border"], (elems_2 = toList(delay(() => append(singleton(createElement("span", {
        className: "font-medium text-indigo-700 whitespace-nowrap",
        children: toText(printf("%s:"))(displayName),
    })), delay(() => {
        let value_51;
        const matchValue = record.record_type;
        switch (matchValue) {
            case "text":
                return ((record.user_id === currentUserId) && patternInput_1[0]) ? append(singleton(createElement("input", createObj(ofArray([(value_51 = "flex-1 min-w-0 px-2 py-1 border rounded text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-400", ["className", value_51]), ["value", editText], ["autoFocus", true], ["onChange", (ev) => {
                    patternInput[1](ev.target.value);
                }], ["onBlur", (_arg_5) => {
                    saveText();
                }], ["onKeyDown", (e) => {
                    if (e.key === "Enter") {
                        saveText();
                    }
                }], ["disabled", saving ? true : deleting]])))), delay(() => singleton(deleteButton))) : ((record.user_id === currentUserId) ? append(singleton(createElement("span", {
                    className: "flex-1 min-w-0 text-gray-800 cursor-pointer hover:text-blue-600",
                    onClick: (_arg_6) => {
                        setEditing(true);
                    },
                    children: defaultArg(record.text_content, "(빈 메모)"),
                })), delay(() => singleton(deleteButton))) : singleton(createElement("span", {
                    className: "flex-1 min-w-0 text-gray-800",
                    children: defaultArg(record.text_content, "(빈 메모)"),
                })));
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
                        onClick: (_arg_7) => {
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
    })))), ["children", reactApi.Children.toArray(Array.from(elems_2))])])));
}

export function DashboardPage(dashboardPageInputProps) {
    let elems_27, elems_2, elems_1, elems, elems_26;
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
    const monthlyWorkouts = patternInput_10[0];
    const patternInput_11 = reactApi.useState(undefined);
    const patternInput_12 = reactApi.useState(undefined);
    const setSelectedDate = patternInput_12[1];
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
    const userDisplayName = patternInput_15[0];
    const setUserDisplayName = patternInput_15[1];
    const patternInput_16 = reactApi.useState("");
    const userMemberId = patternInput_16[0];
    const patternInput_17 = reactApi.useState(false);
    let patternInput_18;
    const initial_18 = empty({
        Compare: comparePrimitives,
    });
    patternInput_18 = reactApi.useState(initial_18);
    const profileMap = patternInput_18[0];
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
            let matchValue_2, myProfile;
            const profiles = _arg_7;
            patternInput_18[1](ofArray_1(map_1((p) => [p.id, ((p.display_name != null) && (value_274(p.display_name) !== "")) ? value_274(p.display_name) : p.member_id], profiles), {
                Compare: comparePrimitives,
            }));
            return ((matchValue_2 = tryFind((p_1) => (p_1.id === user.id), profiles), (matchValue_2 == null) ? ((setUserDisplayName(defaultArg(user.email, "사용자")), Promise.resolve())) : ((myProfile = matchValue_2, (setUserDisplayName(((myProfile.display_name != null) && (value_274(myProfile.display_name) !== "")) ? value_274(myProfile.display_name) : myProfile.member_id), (patternInput_16[1](myProfile.member_id), Promise.resolve())))))).then(() => PromiseBuilder__Delay_62FBFDE1(promise, () => (isAdmin().then((_arg_8) => {
                patternInput_17[1](_arg_8);
                return Promise.resolve();
            }))));
        }))).catch((_arg_9) => {
            return Promise.resolve();
        }))));
        void pr_2;
    }, []);
    const loadCalendarDateRecords = (date_1) => {
        const pr_3 = PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (PromiseBuilder__Delay_62FBFDE1(promise, () => {
            const matchValue_3 = viewScopeRef.current;
            return (matchValue_3.tag === 1) ? (getAllWorkoutsForDate(date_1).then((_arg_11) => {
                setCalendarDateRecords(_arg_11);
                return Promise.resolve();
            })) : (getWorkoutsForDate(user.id, date_1).then((_arg_10) => {
                setCalendarDateRecords(_arg_10);
                return Promise.resolve();
            }));
        }).catch((_arg_12) => {
            return Promise.resolve();
        }))));
        void pr_3;
    };
    const reloadMonthlyWorkouts = () => {
        const pr_4 = PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (PromiseBuilder__Delay_62FBFDE1(promise, () => {
            const startDate_1 = formatDateString(currentYear, currentMonth, 1);
            const endDate_1 = formatDateString(currentYear, currentMonth, getDaysInMonth(currentYear, currentMonth));
            const matchValue_4 = viewScopeRef.current;
            return (matchValue_4.tag === 1) ? (getAllWorkouts(startDate_1, endDate_1).then((_arg_14) => {
                setMonthlyWorkouts(_arg_14);
                return Promise.resolve();
            })) : (getWorkouts(user.id, startDate_1, endDate_1).then((_arg_13) => {
                setMonthlyWorkouts(_arg_13);
                return Promise.resolve();
            }));
        }).catch((_arg_15) => {
            return Promise.resolve();
        }))));
        void pr_4;
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
            return ((editState.tag === 3) ? (updateWorkoutById(editState.fields[0], text).then((_arg_20) => {
                return Promise.resolve();
            })) : (createTextRecord(user.id, targetDate, text).then((_arg_21) => {
                return Promise.resolve();
            }))).then(() => PromiseBuilder__Delay_62FBFDE1(promise, () => {
                setEditState(new RecordEditState(0, []));
                patternInput_2[1](refreshKey + 1);
                return ((selectedDate == null) ? (Promise.resolve()) : ((loadCalendarDateRecords(selectedDate), Promise.resolve()))).then(() => PromiseBuilder__Delay_62FBFDE1(promise, () => {
                    setSelectedDate(undefined);
                    return Promise.resolve();
                }));
            }));
        }).catch((_arg_22) => {
            setEditState(new RecordEditState(6, ["저장 실패. 다시 시도해주세요."]));
            return Promise.resolve();
        }))));
        void pr_6;
    };
    return createElement("div", createObj(ofArray([["className", "min-h-screen bg-gray-100"], (elems_27 = [createElement("header", createObj(ofArray([["className", "bg-white shadow-sm"], (elems_2 = [createElement("div", createObj(ofArray([["className", "max-w-4xl mx-auto px-4 py-4 pb-6 flex items-center"], (elems_1 = [createElement("div", {
        className: "flex-1",
    }), createElement("h1", {
        className: "text-2xl font-bold text-indigo-600 whitespace-nowrap",
        children: "픽제주 헬스 클럽",
    }), createElement("div", createObj(ofArray([["className", "flex-1 flex items-center justify-end gap-2"], (elems = toList(delay(() => append(patternInput_17[0] ? singleton(createElement("button", {
        onClick: (_arg_31) => {
            if (equals(activeTab, new TabMode(3, []))) {
                setActiveTab(new TabMode(0, []));
            }
            else {
                setActiveTab(new TabMode(3, []));
            }
        },
        className: "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors " + (equals(activeTab, new TabMode(3, [])) ? "bg-green-600 text-white" : "bg-green-100 text-green-700 hover:bg-green-200"),
        children: "관리",
    })) : empty_1(), delay(() => append(singleton(createElement("button", {
        onClick: (_arg_32) => {
            if (equals(activeTab, new TabMode(4, []))) {
                setActiveTab(new TabMode(0, []));
            }
            else {
                setActiveTab(new TabMode(4, []));
            }
        },
        className: "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors " + (equals(activeTab, new TabMode(4, [])) ? "bg-indigo-600 text-white" : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"),
        children: (userMemberId !== "") ? userMemberId : "프로필",
    })), delay(() => singleton(createElement("button", {
        onClick: (_arg_33) => {
            patternInput[1](true);
            const pr_9 = PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (signOut().then((_arg_30) => {
                onLogout();
                return Promise.resolve();
            }))));
            void pr_9;
        },
        disabled: loading,
        className: "px-4 py-2 rounded-lg text-sm font-medium transition-colors " + (loading ? "text-gray-400 cursor-not-allowed" : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"),
        children: loading ? "..." : "로그아웃",
    })))))))), ["children", reactApi.Children.toArray(Array.from(elems))])])))], ["children", reactApi.Children.toArray(Array.from(elems_1))])])))], ["children", reactApi.Children.toArray(Array.from(elems_2))])]))), createElement("main", createObj(ofArray([["className", "max-w-4xl mx-auto px-4 py-8"], (elems_26 = toList(delay(() => {
        let elems_14, value_42, elems_4, elements_1, elems_11, arg_9, d, parts, arg_4, arg_5, arg_6, value_68, elems_6, elements_2, value_95, elems_8, elements_3, value_136, elems_10, elements_4, value_158, elems_13, elements_5;
        return append((!equals(activeTab, new TabMode(3, [])) && !equals(activeTab, new TabMode(4, []))) ? singleton(createElement("div", createObj(ofArray([["className", "flex items-center justify-between bg-white rounded-lg shadow-sm p-4 mb-4"], (elems_14 = [createElement("button", createObj(ofArray([["onClick", (_arg_34) => {
            goToPrevMonth();
        }], (value_42 = "w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors", ["className", value_42]), (elems_4 = [createElement("svg", createObj(ofArray([["width", 20], ["height", 20], ["viewBox", (((((0 + " ") + 0) + " ") + 24) + " ") + 24], ["fill", "none"], ["stroke", "currentColor"], ["strokeWidth", 2.5], ["strokeLinecap", "round"], ["strokeLinejoin", "round"], (elements_1 = ofArray([createElement("polyline", {
            points: "14,18 8,12 14,6",
        }), createElement("polyline", {
            points: "8,18 2,12 8,6",
        })]), ["children", reactApi.Children.toArray(Array.from(elements_1))])])))], ["children", reactApi.Children.toArray(Array.from(elems_4))])]))), createElement("div", createObj(ofArray([["className", "flex items-center gap-2"], (elems_11 = [createElement("h2", {
            className: "text-lg font-semibold text-gray-800",
            children: (calendarSelectedDate == null) ? ((arg_9 = (day(now()) | 0), toText(printf("%d년 %d월 %d일"))(currentYear)(currentMonth)(arg_9))) : ((d = calendarSelectedDate, (parts = split(d, ["-"], undefined, 0), (parts.length === 3) ? ((arg_4 = item(0, parts), (arg_5 = (parse(item(1, parts), 511, false, 32) | 0), (arg_6 = (parse(item(2, parts), 511, false, 32) | 0), toText(printf("%s년 %d월 %d일"))(arg_4)(arg_5)(arg_6))))) : d))),
        }), createElement("button", createObj(ofArray([(value_68 = "w-8 h-8 rounded-full bg-indigo-100 hover:bg-indigo-200 flex items-center justify-center transition-colors text-indigo-600", ["className", value_68]), ["onClick", (_arg_35) => {
            const targetDate_1 = defaultArg(calendarSelectedDate, getTodayDateString());
            const userId = user.id;
                                                            (function(userId, targetDate, onDone) {
                                                    var inp = document.createElement('input');
                                                    inp.type = 'file';
                                                    inp.accept = 'image/*';
                                                    inp.capture = 'environment';
                                                    inp.onchange = async function() {
                                                        if (!inp.files || inp.files.length === 0) return;
                                                        try {
                                                            var compress = (await import('browser-image-compression')).default;
                                                            var compressed = await compress(inp.files[0], { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true, fileType: 'image/jpeg' });
                                                            var { supabase } = await import('/src/Supabase/Client.js');
                                                            var path = userId + '/' + targetDate + '_' + Date.now() + '.jpg';
                                                            var { data, error } = await supabase.storage.from('workout-photos').upload(path, compressed, { cacheControl: '3600', upsert: true });
                                                            if (error) { alert('업로드 실패: ' + error.message); return; }
                                                            var { data: urlData } = await supabase.storage.from('workout-photos').createSignedUrl(data.path, 3600);
                                                            var url = urlData ? urlData.signedUrl : '';
                                                            await supabase.from('workouts').insert({ user_id: userId, workout_date: targetDate, record_type: 'photo', photo_url: url });
                                                            onDone();
                                                        } catch(e) { alert('사진 오류: ' + e.message); }
                                                    };
                                                    inp.click();
                                                })(userId, targetDate_1, (() => {
                loadCalendarDateRecords(targetDate_1);
                reloadMonthlyWorkouts();
            }))
                                            ;
        }], (elems_6 = [createElement("svg", createObj(ofArray([["width", 16], ["height", 16], ["viewBox", (((((0 + " ") + 0) + " ") + 24) + " ") + 24], ["fill", "none"], ["stroke", "currentColor"], ["strokeWidth", 2], ["strokeLinecap", "round"], ["strokeLinejoin", "round"], (elements_2 = ofArray([createElement("path", {
            d: "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z",
        }), createElement("circle", {
            cx: 12,
            cy: 13,
            r: 4,
        })]), ["children", reactApi.Children.toArray(Array.from(elements_2))])])))], ["children", reactApi.Children.toArray(Array.from(elems_6))])]))), createElement("button", createObj(ofArray([(value_95 = "w-8 h-8 rounded-full bg-purple-100 hover:bg-purple-200 flex items-center justify-center transition-colors text-purple-600", ["className", value_95]), ["onClick", (_arg_36) => {
            const targetDate_2 = defaultArg(calendarSelectedDate, getTodayDateString());
            const userId_1 = user.id;
                                                            (function(userId, targetDate, onDone) {
                                                    var inp = document.createElement('input');
                                                    inp.type = 'file';
                                                    inp.accept = 'image/*';
                                                    inp.onchange = async function() {
                                                        if (!inp.files || inp.files.length === 0) return;
                                                        try {
                                                            var compress = (await import('browser-image-compression')).default;
                                                            var compressed = await compress(inp.files[0], { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true, fileType: 'image/jpeg' });
                                                            var { supabase } = await import('/src/Supabase/Client.js');
                                                            var path = userId + '/' + targetDate + '_' + Date.now() + '.jpg';
                                                            var { data, error } = await supabase.storage.from('workout-photos').upload(path, compressed, { cacheControl: '3600', upsert: true });
                                                            if (error) { alert('업로드 실패: ' + error.message); return; }
                                                            var { data: urlData } = await supabase.storage.from('workout-photos').createSignedUrl(data.path, 3600);
                                                            var url = urlData ? urlData.signedUrl : '';
                                                            await supabase.from('workouts').insert({ user_id: userId, workout_date: targetDate, record_type: 'photo', photo_url: url });
                                                            onDone();
                                                        } catch(e) { alert('사진 오류: ' + e.message); }
                                                    };
                                                    inp.click();
                                                })(userId_1, targetDate_2, (() => {
                loadCalendarDateRecords(targetDate_2);
                reloadMonthlyWorkouts();
            }))
                                            ;
        }], (elems_8 = [createElement("svg", createObj(ofArray([["width", 16], ["height", 16], ["viewBox", (((((0 + " ") + 0) + " ") + 24) + " ") + 24], ["fill", "none"], ["stroke", "currentColor"], ["strokeWidth", 2], ["strokeLinecap", "round"], ["strokeLinejoin", "round"], (elements_3 = ofArray([createElement("rect", {
            x: 3,
            y: 3,
            width: 18,
            height: 18,
            rx: 2,
            ry: 2,
        }), createElement("circle", {
            cx: 8.5,
            cy: 8.5,
            r: 1.5,
        }), createElement("path", {
            d: "M21 15l-5-5L5 21",
        })]), ["children", reactApi.Children.toArray(Array.from(elements_3))])])))], ["children", reactApi.Children.toArray(Array.from(elems_8))])]))), createElement("button", createObj(ofArray([["onClick", (_arg_37) => {
            setSelectedDate(defaultArg(calendarSelectedDate, getTodayDateString()));
            setEditState(new RecordEditState(1, []));
        }], (value_136 = "w-8 h-8 rounded-full bg-green-100 hover:bg-green-200 flex items-center justify-center transition-colors text-green-600", ["className", value_136]), (elems_10 = [createElement("svg", createObj(ofArray([["width", 16], ["height", 16], ["viewBox", (((((0 + " ") + 0) + " ") + 24) + " ") + 24], ["fill", "none"], ["stroke", "currentColor"], ["strokeWidth", 2], ["strokeLinecap", "round"], ["strokeLinejoin", "round"], (elements_4 = ofArray([createElement("path", {
            d: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7",
        }), createElement("path", {
            d: "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
        })]), ["children", reactApi.Children.toArray(Array.from(elements_4))])])))], ["children", reactApi.Children.toArray(Array.from(elems_10))])])))], ["children", reactApi.Children.toArray(Array.from(elems_11))])]))), createElement("button", createObj(ofArray([["onClick", (_arg_38) => {
            goToNextMonth();
        }], (value_158 = "w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors", ["className", value_158]), (elems_13 = [createElement("svg", createObj(ofArray([["width", 20], ["height", 20], ["viewBox", (((((0 + " ") + 0) + " ") + 24) + " ") + 24], ["fill", "none"], ["stroke", "currentColor"], ["strokeWidth", 2.5], ["strokeLinecap", "round"], ["strokeLinejoin", "round"], (elements_5 = ofArray([createElement("polyline", {
            points: "10,6 16,12 10,18",
        }), createElement("polyline", {
            points: "16,6 22,12 16,18",
        })]), ["children", reactApi.Children.toArray(Array.from(elements_5))])])))], ["children", reactApi.Children.toArray(Array.from(elems_13))])])))], ["children", reactApi.Children.toArray(Array.from(elems_14))])])))) : empty_1(), delay(() => {
            let elems_19, elems_16, elements_6, elems_18, elements_7;
            return append((!equals(activeTab, new TabMode(3, [])) && !equals(activeTab, new TabMode(4, []))) ? singleton(createElement("div", createObj(ofArray([["className", "flex gap-2 mb-6"], (elems_19 = [createElement("button", createObj(ofArray([["onClick", (_arg_39) => {
                setViewScope(new ViewScope(0, []));
            }], ["className", "flex-1 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 " + (equals(viewScope, new ViewScope(0, [])) ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300")], (elems_16 = [createElement("svg", createObj(ofArray([["width", 20], ["height", 20], ["viewBox", (((((0 + " ") + 0) + " ") + 24) + " ") + 24], ["fill", "none"], ["stroke", "currentColor"], ["strokeWidth", 2], ["strokeLinecap", "round"], ["strokeLinejoin", "round"], (elements_6 = ofArray([createElement("path", {
                d: "M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z",
            }), createElement("path", {
                d: "M4 22h-2a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h2",
            })]), ["children", reactApi.Children.toArray(Array.from(elements_6))])]))), createElement("span", {
                children: "나",
            })], ["children", reactApi.Children.toArray(Array.from(elems_16))])]))), createElement("button", createObj(ofArray([["onClick", (_arg_40) => {
                setViewScope(new ViewScope(1, []));
            }], ["className", "flex-1 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 " + (equals(viewScope, new ViewScope(1, [])) ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300")], (elems_18 = [createElement("svg", createObj(ofArray([["width", 20], ["height", 20], ["viewBox", (((((0 + " ") + 0) + " ") + 24) + " ") + 24], ["fill", "none"], ["stroke", "currentColor"], ["strokeWidth", 2], ["strokeLinecap", "round"], ["strokeLinejoin", "round"], (elements_7 = ofArray([createElement("path", {
                d: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2",
            }), createElement("circle", {
                cx: 9,
                cy: 7,
                r: 4,
            }), createElement("path", {
                d: "M23 21v-2a4 4 0 0 0-3-3.87",
            }), createElement("path", {
                d: "M16 3.13a4 4 0 0 1 0 7.75",
            })]), ["children", reactApi.Children.toArray(Array.from(elements_7))])]))), createElement("span", {
                children: "우리",
            })], ["children", reactApi.Children.toArray(Array.from(elems_18))])])))], ["children", reactApi.Children.toArray(Array.from(elems_19))])])))) : empty_1(), delay(() => {
                let matchValue_5, elems_24;
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
                })) : ((matchValue_5.tag === 3) ? singleton(createElement(AdminPage, {
                    onBack: () => {
                        setActiveTab(new TabMode(0, []));
                    },
                })) : ((matchValue_5.tag === 4) ? singleton(createElement(ProfilePage, {
                    user: user,
                    memberId: userMemberId,
                    onLogout: onLogout,
                    onBack: () => {
                        setActiveTab(new TabMode(0, []));
                    },
                })) : singleton(createElement("div", createObj(singleton_1((elems_24 = toList(delay(() => {
                    let elems_20;
                    return append(singleton(createElement("div", createObj(ofArray([["className", "bg-white rounded-xl shadow-sm p-4 mt-4"], (elems_20 = [createElement(CalendarGrid, {
                        userId: user.id,
                        year: currentYear,
                        month: currentMonth,
                        workouts: monthlyWorkouts,
                        onPrevMonth: goToPrevMonth,
                        onNextMonth: goToNextMonth,
                        onDateClick: (dateString) => {
                            setCalendarSelectedDate(dateString);
                            loadCalendarDateRecords(dateString);
                        },
                        onDateDoubleClick: (dateString_1) => {
                            setCalendarSelectedDate(dateString_1);
                            const pr_7 = PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (PromiseBuilder__Delay_62FBFDE1(promise, () => {
                                let arg, arg_1, arg_2, arg_3;
                                const storedMsg = window.localStorage.getItem((arg = user.id, toText(printf("rollbook-default-msg-%s"))(arg)));
                                const template = ((storedMsg == null) ? true : (storedMsg === "")) ? "운동했어" : storedMsg;
                                let workoutDaysCount;
                                const array_5 = Array_distinct(map_1((w_1) => w_1.workout_date, monthlyWorkouts.filter((w) => (w.user_id === user.id))), {
                                    Equals: (x_2, y_2) => (x_2 === y_2),
                                    GetHashCode: stringHash,
                                });
                                workoutDaysCount = array_5.length;
                                const storedGoal = window.localStorage.getItem((arg_1 = user.id, toText(printf("rollbook-monthly-goal-%s"))(arg_1)));
                                const goal = ((storedGoal == null) ? true : (storedGoal === "")) ? "20" : storedGoal;
                                const dateParts = split(dateString_1, ["-"], undefined, 0);
                                const msg = replace(replace(replace(template, "%DATE", (dateParts.length === 3) ? ((arg_2 = (parse(item(1, dateParts), 511, false, 32) | 0), (arg_3 = (parse(item(2, dateParts), 511, false, 32) | 0), toText(printf("%d월 %d일"))(arg_2)(arg_3)))) : dateString_1), "%COUNT", int32ToString(workoutDaysCount + 1)), "%GOAL", goal);
                                return createTextRecord(user.id, dateString_1, msg).then((_arg_23) => {
                                    const startDate_3 = formatDateString(currentYear, currentMonth, 1);
                                    const endDate_3 = formatDateString(currentYear, currentMonth, getDaysInMonth(currentYear, currentMonth));
                                    return getWorkouts(user.id, startDate_3, endDate_3).then((_arg_24) => {
                                        setMonthlyWorkouts(_arg_24);
                                        return getWorkoutsForDate(user.id, dateString_1).then((_arg_25) => {
                                            setCalendarDateRecords(_arg_25);
                                            return Promise.resolve();
                                        });
                                    });
                                });
                            }).catch((_arg_26) => {
                                return Promise.resolve();
                            }))));
                            void pr_7;
                        },
                        selectedDate: unwrap(calendarSelectedDate),
                    })], ["children", reactApi.Children.toArray(Array.from(elems_20))])])))), delay(() => {
                        let matchValue_6, date_4, grouped, elems_23;
                        return append((matchValue_6 = calendarSelectedDate, (matchValue_6 == null) ? singleton(defaultOf()) : ((date_4 = matchValue_6, (grouped = map_1((tupledArg) => {
                            const uid = tupledArg[0];
                            const records_8 = tupledArg[1];
                            return [uid, defaultArg(tryFind_1(uid, profileMap), userDisplayName), records_8, records_8.some((r_4) => (r_4.record_type === "text")), records_8.some((r_5) => (r_5.record_type === "photo")), records_8.some((r_6) => (r_6.record_type === "workout"))];
                        }, Array_groupBy((r_3) => r_3.user_id, calendarDateRecords, {
                            Equals: (x_3, y_3) => (x_3 === y_3),
                            GetHashCode: stringHash,
                        })), singleton(createElement("div", createObj(ofArray([["className", "bg-white rounded-xl shadow-sm p-4 mt-4"], (elems_23 = toList(delay(() => {
                            let elems_21;
                            return (calendarDateRecords.length === 0) ? singleton(createElement("div", {
                                className: "text-center text-gray-400 py-4",
                                children: "기록이 없습니다",
                            })) : append(singleton(createElement("div", createObj(ofArray([["className", "flex flex-wrap gap-2 mb-3"], (elems_21 = toList(delay(() => collect((matchValue_7) => {
                                const uid_1 = matchValue_7[0];
                                const icons = ((matchValue_7[5] ? " 💪" : "") + (matchValue_7[4] ? " 📷" : "")) + (matchValue_7[3] ? " ✏️" : "");
                                const isExpanded = equals(selectedDate, uid_1);
                                return singleton(createElement("button", {
                                    key: uid_1,
                                    onClick: (_arg_41) => {
                                        if (isExpanded) {
                                            setSelectedDate(undefined);
                                        }
                                        else {
                                            setSelectedDate(uid_1);
                                        }
                                    },
                                    className: "px-3 py-1.5 rounded-full text-sm font-medium transition-all " + (isExpanded ? "bg-indigo-600 text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"),
                                    children: toText(printf("%s%s"))(matchValue_7[1])(icons),
                                }));
                            }, grouped))), ["children", reactApi.Children.toArray(Array.from(elems_21))])])))), delay(() => {
                                let elems_22;
                                const matchValue_8 = selectedDate;
                                if (matchValue_8 == null) {
                                    return singleton(defaultOf());
                                }
                                else {
                                    const expandedUid = matchValue_8;
                                    const matchValue_9 = tryFind((tupledArg_1) => (tupledArg_1[0] === expandedUid), grouped);
                                    if (matchValue_9 == null) {
                                        return singleton(defaultOf());
                                    }
                                    else {
                                        const records_9 = matchValue_9[2];
                                        return singleton(createElement("div", createObj(ofArray([["className", "space-y-2 pt-2 border-t"], (elems_22 = toList(delay(() => collect((record_1) => {
                                            const recordDisplayName = defaultArg(tryFind_1(record_1.user_id, profileMap), userDisplayName);
                                            return singleton(createElement(EditableRecordRow, {
                                                record: record_1,
                                                displayName: recordDisplayName,
                                                currentUserId: user.id,
                                                onSaved: () => {
                                                    loadCalendarDateRecords(date_4);
                                                    reloadMonthlyWorkouts();
                                                },
                                                onPhotoClick: (url) => {
                                                    setExpandedPhotoUrl(url);
                                                },
                                            }));
                                        }, records_9))), ["children", reactApi.Children.toArray(Array.from(elems_22))])]))));
                                    }
                                }
                            }));
                        })), ["children", reactApi.Children.toArray(Array.from(elems_23))])])))))))), delay(() => {
                            const matchValue_10 = patternInput_9[0];
                            if (matchValue_10 == null) {
                                return singleton(defaultOf());
                            }
                            else {
                                const url_1 = matchValue_10;
                                return singleton(createElement(PhotoModal, {
                                    photoUrl: url_1,
                                    onClose: () => {
                                        setExpandedPhotoUrl(undefined);
                                    },
                                }));
                            }
                        }));
                    }));
                })), ["children", reactApi.Children.toArray(Array.from(elems_24))]))))))))), delay(() => {
                    let elems_25;
                    const matchValue_12 = editState;
                    return (matchValue_12.tag === 1) ? singleton(createElement(RecordEditModal, {
                        initialText: "",
                        saving: false,
                        onSave: handleSaveText,
                        onCancel: () => {
                            setEditState(new RecordEditState(0, []));
                        },
                    })) : ((matchValue_12.tag === 3) ? singleton(createElement(RecordEditModal, {
                        editingRecordId: matchValue_12.fields[0],
                        initialText: matchValue_12.fields[1],
                        saving: false,
                        onSave: handleSaveText,
                        onCancel: () => {
                            setEditState(new RecordEditState(0, []));
                        },
                    })) : ((matchValue_12.tag === 4) ? singleton(createElement(RecordEditModal, {
                        initialText: "",
                        saving: true,
                        onSave: (_arg_47) => {
                        },
                        onCancel: () => {
                        },
                    })) : ((matchValue_12.tag === 6) ? singleton(createElement("div", createObj(ofArray([["className", "fixed bottom-4 left-4 right-4 bg-red-100 text-red-700 p-3 rounded-lg shadow-lg z-50 text-center"], (elems_25 = [matchValue_12.fields[0], createElement("button", {
                        onClick: (_arg_48) => {
                            setEditState(new RecordEditState(0, []));
                        },
                        className: "ml-2 underline",
                        children: "닫기",
                    })], ["children", reactApi.Children.toArray(Array.from(elems_25))])])))) : singleton(defaultOf()))));
                }));
            }));
        }));
    })), ["children", reactApi.Children.toArray(Array.from(elems_26))])])))], ["children", reactApi.Children.toArray(Array.from(elems_27))])])));
}

