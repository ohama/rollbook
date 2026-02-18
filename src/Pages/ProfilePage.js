import { createElement } from "react";
import React from "react";
import { reactApi } from "../fable_modules/Feliz.2.9.0/Interop.fs.js";
import { createObj } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { empty, singleton, append, delay, toList } from "../fable_modules/fable-library-js.4.28.0/Seq.js";
import { ofArray } from "../fable_modules/fable-library-js.4.28.0/List.js";
import { defaultArg } from "../fable_modules/fable-library-js.4.28.0/Option.js";
import { printf, toText, substring } from "../fable_modules/fable-library-js.4.28.0/String.js";
import { defaultOf } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { PromiseBuilder__Delay_62FBFDE1, PromiseBuilder__Run_212F1D4B } from "../fable_modules/Fable.Promise.3.2.0/Promise.fs.js";
import { promise } from "../fable_modules/Fable.Promise.3.2.0/PromiseImpl.fs.js";
import { deleteAccount, updatePassword, signInWithPassword } from "../Supabase/Auth.js";

export function ProfilePage(profilePageInputProps) {
    let elems_16;
    const onBack = profilePageInputProps.onBack;
    const onLogout = profilePageInputProps.onLogout;
    const memberId = profilePageInputProps.memberId;
    const user = profilePageInputProps.user;
    const patternInput = reactApi.useState("");
    const setCurrentPassword = patternInput[1];
    const currentPassword = patternInput[0];
    const patternInput_1 = reactApi.useState("");
    const setNewPassword = patternInput_1[1];
    const newPassword = patternInput_1[0];
    const patternInput_2 = reactApi.useState("");
    const setConfirmPassword = patternInput_2[1];
    const confirmPassword = patternInput_2[0];
    const patternInput_3 = reactApi.useState(undefined);
    const setPasswordMsg = patternInput_3[1];
    const patternInput_4 = reactApi.useState(false);
    const setPasswordLoading = patternInput_4[1];
    const passwordLoading = patternInput_4[0];
    let patternInput_5;
    let initial_5;
    const stored = window.localStorage.getItem("rollbook-default-msg");
    initial_5 = ((stored == null) ? "운동했어" : stored);
    patternInput_5 = reactApi.useState(initial_5);
    const defaultMsg = patternInput_5[0];
    const patternInput_6 = reactApi.useState(false);
    const setDefaultMsgSaved = patternInput_6[1];
    let patternInput_7;
    let initial_7;
    const stored_1 = window.localStorage.getItem("rollbook-monthly-goal");
    initial_7 = ((stored_1 == null) ? "20" : stored_1);
    patternInput_7 = reactApi.useState(initial_7);
    const monthlyGoal = patternInput_7[0];
    const patternInput_8 = reactApi.useState(false);
    const setGoalSaved = patternInput_8[1];
    const patternInput_9 = reactApi.useState(false);
    const setDeleteConfirm = patternInput_9[1];
    const patternInput_10 = reactApi.useState(false);
    const setDeleteLoading = patternInput_10[1];
    const deleteLoading = patternInput_10[0];
    const patternInput_11 = reactApi.useState(undefined);
    const setDeleteMsg = patternInput_11[1];
    return createElement("div", createObj(ofArray([["className", "max-w-md mx-auto"], (elems_16 = toList(delay(() => {
        let elems;
        return append(singleton(createElement("button", createObj(ofArray([["onClick", (_arg_5) => {
            onBack();
        }], ["className", "mb-4 text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"], (elems = [createElement("span", {
            children: "<",
        }), createElement("span", {
            children: "돌아가기",
        })], ["children", reactApi.Children.toArray(Array.from(elems))])])))), delay(() => {
            let elems_5, elems_4, elems_1, elems_2, elems_3, raw;
            return append(singleton(createElement("div", createObj(ofArray([["className", "bg-white rounded-xl shadow-sm p-6 mb-4"], (elems_5 = [createElement("h2", {
                className: "text-lg font-bold text-gray-800 mb-4",
                children: "내 정보",
            }), createElement("div", createObj(ofArray([["className", "space-y-3"], (elems_4 = [createElement("div", createObj(ofArray([["className", "flex justify-between"], (elems_1 = [createElement("span", {
                className: "text-gray-500",
                children: "아이디",
            }), createElement("span", {
                className: "font-medium text-gray-800",
                children: memberId,
            })], ["children", reactApi.Children.toArray(Array.from(elems_1))])]))), createElement("div", createObj(ofArray([["className", "flex justify-between"], (elems_2 = [createElement("span", {
                className: "text-gray-500",
                children: "이메일",
            }), createElement("span", {
                className: "font-medium text-gray-800",
                children: defaultArg(user.email, "-"),
            })], ["children", reactApi.Children.toArray(Array.from(elems_2))])]))), createElement("div", createObj(ofArray([["className", "flex justify-between"], (elems_3 = [createElement("span", {
                className: "text-gray-500",
                children: "가입일",
            }), createElement("span", {
                className: "font-medium text-gray-800",
                children: (raw = user.created_at, (raw.length >= 10) ? substring(raw, 0, 10) : raw),
            })], ["children", reactApi.Children.toArray(Array.from(elems_3))])])))], ["children", reactApi.Children.toArray(Array.from(elems_4))])])))], ["children", reactApi.Children.toArray(Array.from(elems_5))])])))), delay(() => {
                let elems_10;
                return append(singleton(createElement("div", createObj(ofArray([["className", "bg-white rounded-xl shadow-sm p-6 mb-4"], (elems_10 = toList(delay(() => append(singleton(createElement("h2", {
                    className: "text-lg font-bold text-gray-800 mb-4",
                    children: "기본 입력 메시지",
                })), delay(() => append(singleton(createElement("p", {
                    className: "text-sm text-gray-500 mb-2",
                    children: "날짜를 더블 클릭하면 이 메시지가 자동으로 입력됩니다",
                })), delay(() => {
                    let elems_6;
                    return append(singleton(createElement("div", createObj(ofArray([["className", "text-xs text-gray-400 mb-3 space-y-0.5"], (elems_6 = [createElement("div", {
                        children: "%DATE  - 선택한 날짜 (예: 2월 18일)",
                    }), createElement("div", {
                        children: "%COUNT - 이번 달 운동한 일수",
                    }), createElement("div", {
                        children: "%GOAL  - 이번 달 목표",
                    })], ["children", reactApi.Children.toArray(Array.from(elems_6))])])))), delay(() => {
                        let elems_7;
                        return append(singleton(createElement("div", createObj(ofArray([["className", "flex gap-2"], (elems_7 = [createElement("input", {
                            className: "flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400",
                            value: defaultMsg,
                            placeholder: "예: %DATE 운동 완료! (%COUNT/%GOAL)",
                            onChange: (ev) => {
                                patternInput_5[1](ev.target.value);
                                setDefaultMsgSaved(false);
                            },
                        }), createElement("button", {
                            onClick: (_arg_6) => {
                                window.localStorage.setItem("rollbook-default-msg", defaultMsg);
                                setDefaultMsgSaved(true);
                            },
                            className: "px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors",
                            children: "저장",
                        })], ["children", reactApi.Children.toArray(Array.from(elems_7))])])))), delay(() => append(patternInput_6[0] ? singleton(createElement("p", {
                            className: "text-sm text-green-600 mt-2",
                            children: "저장되었습니다",
                        })) : empty(), delay(() => {
                            let elems_9, elems_8;
                            return singleton(createElement("div", createObj(ofArray([["className", "mt-5 pt-4 border-t"], (elems_9 = [createElement("h3", {
                                className: "text-base font-bold text-gray-800 mb-2",
                                children: "이번 달 목표",
                            }), createElement("div", createObj(ofArray([["className", "flex items-center gap-2"], (elems_8 = toList(delay(() => append(singleton(createElement("input", {
                                className: "w-20 px-3 py-2 border rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-indigo-400",
                                type: "number",
                                value: monthlyGoal,
                                onChange: (ev_1) => {
                                    patternInput_7[1](ev_1.target.value);
                                    setGoalSaved(false);
                                },
                            })), delay(() => append(singleton(createElement("span", {
                                className: "text-gray-600",
                                children: "일",
                            })), delay(() => append(singleton(createElement("button", {
                                onClick: (_arg_7) => {
                                    window.localStorage.setItem("rollbook-monthly-goal", monthlyGoal);
                                    setGoalSaved(true);
                                },
                                className: "px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors",
                                children: "저장",
                            })), delay(() => (patternInput_8[0] ? singleton(createElement("span", {
                                className: "text-sm text-green-600",
                                children: "저장됨",
                            })) : empty()))))))))), ["children", reactApi.Children.toArray(Array.from(elems_8))])])))], ["children", reactApi.Children.toArray(Array.from(elems_9))])]))));
                        }))));
                    }));
                })))))), ["children", reactApi.Children.toArray(Array.from(elems_10))])])))), delay(() => {
                    let elems_12, elems_11;
                    return append(singleton(createElement("div", createObj(ofArray([["className", "bg-white rounded-xl shadow-sm p-6 mb-4"], (elems_12 = [createElement("h2", {
                        className: "text-lg font-bold text-gray-800 mb-4",
                        children: "비밀번호 변경",
                    }), createElement("div", createObj(ofArray([["className", "space-y-3"], (elems_11 = toList(delay(() => append(singleton(createElement("input", {
                        type: "password",
                        placeholder: "현재 비밀번호",
                        value: currentPassword,
                        onChange: (ev_2) => {
                            setCurrentPassword(ev_2.target.value);
                        },
                        className: "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400",
                    })), delay(() => append(singleton(createElement("input", {
                        type: "password",
                        placeholder: "새 비밀번호",
                        value: newPassword,
                        onChange: (ev_3) => {
                            setNewPassword(ev_3.target.value);
                        },
                        className: "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400",
                    })), delay(() => append(singleton(createElement("input", {
                        type: "password",
                        placeholder: "새 비밀번호 확인",
                        value: confirmPassword,
                        onChange: (ev_4) => {
                            setConfirmPassword(ev_4.target.value);
                        },
                        className: "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400",
                    })), delay(() => {
                        let matchValue_2;
                        return append((matchValue_2 = patternInput_3[0], (matchValue_2 == null) ? singleton(defaultOf()) : singleton(createElement("p", {
                            className: matchValue_2[1] ? "text-sm text-red-600" : "text-sm text-green-600",
                            children: matchValue_2[0],
                        }))), delay(() => {
                            let value_166;
                            return singleton(createElement("button", createObj(ofArray([["onClick", (_arg_8) => {
                                if (newPassword.length < 6) {
                                    setPasswordMsg(["비밀번호는 6자 이상이어야 합니다", true]);
                                }
                                else if (newPassword !== confirmPassword) {
                                    setPasswordMsg(["새 비밀번호가 일치하지 않습니다", true]);
                                }
                                else {
                                    setPasswordLoading(true);
                                    setPasswordMsg(undefined);
                                    const pr = PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (PromiseBuilder__Delay_62FBFDE1(promise, () => {
                                        const email = defaultArg(user.email, "");
                                        return signInWithPassword(email, currentPassword).then((_arg) => {
                                            const matchValue = _arg.error;
                                            if (matchValue == null) {
                                                return updatePassword(newPassword).then((_arg_1) => {
                                                    const matchValue_1 = _arg_1.error;
                                                    if (matchValue_1 == null) {
                                                        setPasswordMsg(["비밀번호가 변경되었습니다", false]);
                                                        setCurrentPassword("");
                                                        setNewPassword("");
                                                        setConfirmPassword("");
                                                        setPasswordLoading(false);
                                                        return Promise.resolve();
                                                    }
                                                    else {
                                                        const err_1 = matchValue_1;
                                                        setPasswordMsg([err_1.message, true]);
                                                        setPasswordLoading(false);
                                                        return Promise.resolve();
                                                    }
                                                });
                                            }
                                            else {
                                                const err = matchValue;
                                                setPasswordMsg(["현재 비밀번호가 올바르지 않습니다", true]);
                                                setPasswordLoading(false);
                                                return Promise.resolve();
                                            }
                                        });
                                    }).catch((_arg_2) => {
                                        setPasswordMsg(["오류가 발생했습니다", true]);
                                        setPasswordLoading(false);
                                        return Promise.resolve();
                                    }))));
                                    void pr;
                                }
                            }], ["disabled", passwordLoading], (value_166 = "w-full py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors", ["className", value_166]), ["children", passwordLoading ? "변경 중..." : "비밀번호 변경"]]))));
                        }));
                    })))))))), ["children", reactApi.Children.toArray(Array.from(elems_11))])])))], ["children", reactApi.Children.toArray(Array.from(elems_12))])])))), delay(() => {
                        let elems_15;
                        return (memberId !== "root") ? singleton(createElement("div", createObj(ofArray([["className", "bg-white rounded-xl shadow-sm p-6"], (elems_15 = toList(delay(() => append(singleton(createElement("h2", {
                            className: "text-lg font-bold text-red-600 mb-4",
                            children: "회원 탈퇴",
                        })), delay(() => {
                            let value_179, elems_14;
                            return !patternInput_9[0] ? singleton(createElement("button", createObj(ofArray([["onClick", (_arg_9) => {
                                setDeleteConfirm(true);
                            }], (value_179 = "w-full py-2 border-2 border-red-400 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors", ["className", value_179]), ["children", "탈퇴하기"]])))) : singleton(createElement("div", createObj(ofArray([["className", "space-y-3"], (elems_14 = toList(delay(() => append(singleton(createElement("p", {
                                className: "text-sm text-gray-600",
                                children: "정말 탈퇴하시겠습니까? 모든 데이터가 삭제되며 복구할 수 없습니다.",
                            })), delay(() => {
                                let matchValue_3;
                                return append((matchValue_3 = patternInput_11[0], (matchValue_3 == null) ? singleton(defaultOf()) : singleton(createElement("p", {
                                    className: "text-sm text-red-600",
                                    children: matchValue_3,
                                }))), delay(() => {
                                    let elems_13, value_203;
                                    return singleton(createElement("div", createObj(ofArray([["className", "flex gap-2"], (elems_13 = [createElement("button", {
                                        onClick: (_arg_10) => {
                                            setDeleteConfirm(false);
                                        },
                                        className: "flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors",
                                        children: "취소",
                                    }), createElement("button", createObj(ofArray([["onClick", (_arg_11) => {
                                        setDeleteLoading(true);
                                        setDeleteMsg(undefined);
                                        const pr_1 = PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (PromiseBuilder__Delay_62FBFDE1(promise, () => (deleteAccount(user.id).then((_arg_3) => {
                                            const result_1 = _arg_3;
                                            if (result_1.tag === 1) {
                                                setDeleteMsg(toText(printf("탈퇴 실패: %s"))(result_1.fields[0]));
                                                setDeleteLoading(false);
                                                return Promise.resolve();
                                            }
                                            else {
                                                onLogout();
                                                return Promise.resolve();
                                            }
                                        }))).catch((_arg_4) => {
                                            setDeleteMsg("탈퇴 중 오류가 발생했습니다");
                                            setDeleteLoading(false);
                                            return Promise.resolve();
                                        }))));
                                        void pr_1;
                                    }], ["disabled", deleteLoading], (value_203 = "flex-1 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors", ["className", value_203]), ["children", deleteLoading ? "처리 중..." : "탈퇴 확인"]])))], ["children", reactApi.Children.toArray(Array.from(elems_13))])]))));
                                }));
                            })))), ["children", reactApi.Children.toArray(Array.from(elems_14))])]))));
                        })))), ["children", reactApi.Children.toArray(Array.from(elems_15))])])))) : empty();
                    }));
                }));
            }));
        }));
    })), ["children", reactApi.Children.toArray(Array.from(elems_16))])])));
}

