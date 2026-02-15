import { Union } from "../fable_modules/fable-library-js.4.28.0/Types.js";
import { union_type } from "../fable_modules/fable-library-js.4.28.0/Reflection.js";
import { createElement } from "react";
import React from "react";
import { reactApi } from "../fable_modules/Feliz.2.9.0/Interop.fs.js";
import { PromiseBuilder__Delay_62FBFDE1, PromiseBuilder__Run_212F1D4B } from "../fable_modules/Fable.Promise.3.2.0/Promise.fs.js";
import { promise } from "../fable_modules/Fable.Promise.3.2.0/PromiseImpl.fs.js";
import { upsertWorkout, deleteWorkout, getWorkout, getTodayDateString } from "../Supabase/Workouts.js";
import { isOnline } from "../offline/NetworkStatus.js";
import { OperationType } from "../offline/Types.js";
import { enqueue } from "../offline/Queue.js";
import { registerBackgroundSync } from "../offline/Sync.js";
import { equals, createObj } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { singleton, append, delay, toList } from "../fable_modules/fable-library-js.4.28.0/Seq.js";
import { defaultOf } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { singleton as singleton_1, ofArray } from "../fable_modules/fable-library-js.4.28.0/List.js";
import { month, now, year } from "../fable_modules/fable-library-js.4.28.0/Date.js";
import { signOut } from "../Supabase/Auth.js";
import { formatMonthYear } from "../Utils/DateHelpers.js";
import { ProgressViewPage } from "./ProgressView.js";
import { TeamViewPage } from "./TeamView.js";
import { AdminPage } from "./AdminPage.js";
import { defaultArg } from "../fable_modules/fable-library-js.4.28.0/Option.js";
import { PhotoUploadButton } from "../Components/PhotoUpload.js";
import { PhotoGallery } from "../Components/PhotoGallery.js";

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

export function DashboardPage(dashboardPageInputProps) {
    let elems_11, elems_1, elems, elems_10;
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
    const patternInput_5 = reactApi.useState(new ViewScope(0, []));
    return createElement("div", createObj(ofArray([["className", "min-h-screen bg-gray-100"], (elems_11 = [createElement("header", createObj(ofArray([["className", "bg-white shadow-sm"], (elems_1 = [createElement("div", createObj(ofArray([["className", "max-w-4xl mx-auto px-4 py-4 flex items-center justify-between"], (elems = [createElement("h1", {
        className: "text-xl font-bold text-indigo-600",
        children: "Rollbook",
    }), createElement("button", {
        onClick: (_arg_1) => {
            patternInput[1](true);
            const pr = PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (signOut().then((_arg) => {
                onLogout();
                return Promise.resolve();
            }))));
            void pr;
        },
        disabled: loading,
        className: "px-4 py-2 rounded-lg text-sm font-medium transition-colors " + (loading ? "text-gray-400 cursor-not-allowed" : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"),
        children: loading ? "로그아웃 중..." : "로그아웃",
    })], ["children", reactApi.Children.toArray(Array.from(elems))])])))], ["children", reactApi.Children.toArray(Array.from(elems_1))])]))), createElement("main", createObj(ofArray([["className", "max-w-4xl mx-auto px-4 py-8"], (elems_10 = toList(delay(() => {
        let elems_2;
        return append(singleton(createElement("div", createObj(ofArray([["className", "flex items-center justify-between bg-white rounded-lg shadow-sm p-4 mb-4"], (elems_2 = [createElement("button", {
            onClick: (_arg_2) => {
                if (currentMonth === 1) {
                    setCurrentYear(currentYear - 1);
                    setCurrentMonth(12);
                }
                else {
                    setCurrentMonth(currentMonth - 1);
                }
            },
            className: "px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition-colors",
            children: "< 이전",
        }), createElement("h2", {
            className: "text-lg font-semibold text-gray-800",
            children: formatMonthYear(currentYear, currentMonth),
        }), createElement("button", {
            onClick: (_arg_3) => {
                if (currentMonth === 12) {
                    setCurrentYear(currentYear + 1);
                    setCurrentMonth(1);
                }
                else {
                    setCurrentMonth(currentMonth + 1);
                }
            },
            className: "px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition-colors",
            children: "다음 >",
        })], ["children", reactApi.Children.toArray(Array.from(elems_2))])])))), delay(() => {
            let elems_3;
            return append(singleton(createElement("div", createObj(ofArray([["className", "flex gap-2 mb-6"], (elems_3 = [createElement("button", {
                onClick: (_arg_4) => {
                    setActiveTab(new TabMode(0, []));
                },
                className: "px-6 py-3 rounded-lg font-medium transition-colors " + (equals(activeTab, new TabMode(0, [])) ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"),
                children: "홈",
            }), createElement("button", {
                onClick: (_arg_5) => {
                    setActiveTab(new TabMode(1, []));
                },
                className: "px-6 py-3 rounded-lg font-medium transition-colors " + (equals(activeTab, new TabMode(1, [])) ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"),
                children: "내 기록",
            }), createElement("button", {
                onClick: (_arg_6) => {
                    setActiveTab(new TabMode(2, []));
                },
                className: "px-6 py-3 rounded-lg font-medium transition-colors " + (equals(activeTab, new TabMode(2, [])) ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"),
                children: "팀",
            }), createElement("button", {
                onClick: (_arg_7) => {
                    setActiveTab(new TabMode(3, []));
                },
                className: "px-6 py-3 rounded-lg font-medium transition-colors " + (equals(activeTab, new TabMode(3, [])) ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"),
                children: "관리자",
            })], ["children", reactApi.Children.toArray(Array.from(elems_3))])])))), delay(() => {
                let elems_9, elems_5, elems_4, elems_6, elems_7, elems_8;
                const matchValue = activeTab;
                return (matchValue.tag === 1) ? singleton(createElement(ProgressViewPage, {
                    userId: user.id,
                })) : ((matchValue.tag === 2) ? singleton(createElement(TeamViewPage, null)) : ((matchValue.tag === 3) ? singleton(createElement(AdminPage, null)) : singleton(createElement("div", createObj(singleton_1((elems_9 = [createElement("div", createObj(ofArray([["className", "bg-white rounded-2xl shadow-sm p-6 mb-6"], (elems_5 = [createElement("h2", {
                    className: "text-lg font-semibold text-gray-800 mb-2",
                    children: "환영합니다!",
                }), createElement("p", createObj(ofArray([["className", "text-gray-600"], (elems_4 = ["로그인 이메일: ", createElement("span", {
                    className: "font-medium",
                    children: defaultArg(user.email, "N/A"),
                })], ["children", reactApi.Children.toArray(Array.from(elems_4))])])))], ["children", reactApi.Children.toArray(Array.from(elems_5))])]))), createElement("div", createObj(ofArray([["className", "bg-white rounded-2xl shadow-sm p-6 text-center mb-6"], (elems_6 = [createElement(WorkoutToggle, {
                    userId: user.id,
                    refreshKey: refreshKey,
                })], ["children", reactApi.Children.toArray(Array.from(elems_6))])]))), createElement("div", createObj(ofArray([["className", "bg-white rounded-2xl shadow-sm p-6 mb-6"], (elems_7 = [createElement("h3", {
                    className: "text-lg font-semibold text-gray-800 mb-4",
                    children: "사진으로 운동 기록",
                }), createElement("p", {
                    className: "text-sm text-gray-500 mb-4",
                    children: "사진을 올리면 자동으로 오늘 운동 기록이 생성됩니다",
                }), createElement(PhotoUploadButton, {
                    userId: user.id,
                    onUploadComplete: () => {
                        patternInput_2[1](refreshKey + 1);
                    },
                })], ["children", reactApi.Children.toArray(Array.from(elems_7))])]))), createElement("div", createObj(ofArray([["className", "bg-white rounded-2xl shadow-sm p-6"], (elems_8 = [createElement(PhotoGallery, {
                    userId: user.id,
                })], ["children", reactApi.Children.toArray(Array.from(elems_8))])])))], ["children", reactApi.Children.toArray(Array.from(elems_9))])))))));
            }));
        }));
    })), ["children", reactApi.Children.toArray(Array.from(elems_10))])])))], ["children", reactApi.Children.toArray(Array.from(elems_11))])])));
}

