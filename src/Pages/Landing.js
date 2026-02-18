import { createElement } from "react";
import React from "react";
import { reactApi } from "../fable_modules/Feliz.2.9.0/Interop.fs.js";
import { PromiseBuilder__Delay_62FBFDE1, PromiseBuilder__Run_212F1D4B } from "../fable_modules/Fable.Promise.3.2.0/Promise.fs.js";
import { promise } from "../fable_modules/Fable.Promise.3.2.0/PromiseImpl.fs.js";
import { signInWithMemberId } from "../Supabase/Auth.js";
import { createObj } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { ofArray } from "../fable_modules/fable-library-js.4.28.0/List.js";
import { singleton, append, delay, toList } from "../fable_modules/fable-library-js.4.28.0/Seq.js";
import { defaultOf } from "../fable_modules/fable-library-js.4.28.0/Util.js";

export function LandingPage(landingPageInputProps) {
    let elems_4, elems, elems_3, elems_2;
    const onLoginSuccess = landingPageInputProps.onLoginSuccess;
    const onNavigate = landingPageInputProps.onNavigate;
    const patternInput = reactApi.useState("");
    const memberId = patternInput[0];
    const patternInput_1 = reactApi.useState("");
    const password = patternInput_1[0];
    const patternInput_2 = reactApi.useState(false);
    const setLoading = patternInput_2[1];
    const loading = patternInput_2[0];
    const patternInput_3 = reactApi.useState(undefined);
    const setError = patternInput_3[1];
    const handleLogin = () => {
        if ((memberId === "") ? true : (password === "")) {
            setError("아이디와 비밀번호를 입력하세요");
        }
        else {
            setLoading(true);
            setError(undefined);
            const pr = PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (signInWithMemberId(memberId, password).then((_arg) => {
                const matchValue = _arg.error;
                if (matchValue == null) {
                    setLoading(false);
                    onLoginSuccess();
                    return Promise.resolve();
                }
                else {
                    const err = matchValue;
                    setLoading(false);
                    setError(err.message);
                    return Promise.resolve();
                }
            }))));
            void pr;
        }
    };
    return createElement("div", createObj(ofArray([["className", "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col"], (elems_4 = [createElement("div", createObj(ofArray([["className", "grid grid-cols-2 w-full"], (elems = [createElement("img", {
        src: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&h=300&fit=crop",
        alt: "달리기",
        className: "w-full h-36 sm:h-48 object-cover",
    }), createElement("img", {
        src: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop",
        alt: "헬스",
        className: "w-full h-36 sm:h-48 object-cover",
    }), createElement("img", {
        src: "https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?w=400&h=300&fit=crop",
        alt: "축구",
        className: "w-full h-36 sm:h-48 object-cover",
    }), createElement("img", {
        src: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=400&h=300&fit=crop",
        alt: "수영",
        className: "w-full h-36 sm:h-48 object-cover",
    })], ["children", reactApi.Children.toArray(Array.from(elems))])]))), createElement("div", createObj(ofArray([["className", "flex flex-col items-center px-6 pb-8"], ["style", {
        paddingTop: 60,
    }], (elems_3 = [createElement("h1", {
        className: "text-4xl font-bold text-indigo-600",
        children: "픽제주 헬스 클럽",
    }), createElement("div", createObj(ofArray([["className", "w-full max-w-sm"], ["style", {
        marginTop: 40,
    }], (elems_2 = toList(delay(() => {
        let matchValue_1;
        return append((matchValue_1 = patternInput_3[0], (matchValue_1 == null) ? singleton(defaultOf()) : singleton(createElement("div", {
            className: "mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center",
            children: matchValue_1,
        }))), delay(() => {
            let value_47;
            return append(singleton(createElement("input", createObj(ofArray([(value_47 = "w-full px-4 py-4 rounded-xl border border-gray-300 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent", ["className", value_47]), ["type", "text"], ["placeholder", "아이디"], ["value", memberId], ["onChange", (ev) => {
                patternInput[1](ev.target.value);
            }]])))), delay(() => append(singleton(createElement("div", {
                className: "h-4",
            })), delay(() => {
                let value_58;
                return append(singleton(createElement("input", createObj(ofArray([(value_58 = "w-full px-4 py-4 rounded-xl border border-gray-300 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent", ["className", value_58]), ["type", "password"], ["placeholder", "패스워드"], ["value", password], ["onChange", (ev_1) => {
                    patternInput_1[1](ev_1.target.value);
                }], ["onKeyDown", (e) => {
                    if (e.key === "Enter") {
                        handleLogin();
                    }
                }]])))), delay(() => append(singleton(createElement("div", {
                    className: "h-4",
                })), delay(() => {
                    let value_70;
                    return append(singleton(createElement("button", createObj(ofArray([(value_70 = "w-full py-6 px-6 rounded-2xl font-bold text-white text-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50", ["className", value_70]), ["disabled", loading], ["onClick", (_arg_1) => {
                        handleLogin();
                    }], ["children", loading ? "로그인 중..." : "로그인"]])))), delay(() => {
                        let elems_1, value_82, value_87;
                        return singleton(createElement("div", createObj(ofArray([["className", "flex gap-4"], ["style", {
                            marginTop: 20,
                        }], (elems_1 = [createElement("button", createObj(ofArray([(value_82 = "flex-1 py-5 px-4 rounded-2xl font-semibold text-indigo-600 text-lg border-2 border-indigo-300 hover:bg-indigo-50 active:scale-[0.98] transition-all", ["className", value_82]), ["onClick", (_arg_2) => {
                            onNavigate("signup");
                        }], ["children", "회원가입"]]))), createElement("button", createObj(ofArray([(value_87 = "flex-1 py-5 px-4 rounded-2xl font-semibold text-gray-500 text-lg hover:text-gray-700 hover:bg-gray-100 active:scale-[0.98] transition-all", ["className", value_87]), ["onClick", (_arg_3) => {
                            onNavigate("forgot-password");
                        }], ["children", "비밀번호 분실"]])))], ["children", reactApi.Children.toArray(Array.from(elems_1))])]))));
                    }));
                }))));
            }))));
        }));
    })), ["children", reactApi.Children.toArray(Array.from(elems_2))])])))], ["children", reactApi.Children.toArray(Array.from(elems_3))])])))], ["children", reactApi.Children.toArray(Array.from(elems_4))])])));
}

