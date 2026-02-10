import { Record } from "../fable_modules/fable-library-js.4.28.0/Types.js";
import { record_type, option_type, bool_type, string_type } from "../fable_modules/fable-library-js.4.28.0/Reflection.js";
import { createElement } from "react";
import React from "react";
import { reactApi } from "../fable_modules/Feliz.2.9.0/Interop.fs.js";
import { PromiseBuilder__Delay_62FBFDE1, PromiseBuilder__Run_212F1D4B } from "../fable_modules/Fable.Promise.3.2.0/Promise.fs.js";
import { promise } from "../fable_modules/Fable.Promise.3.2.0/PromiseImpl.fs.js";
import { resetPasswordForEmail } from "../Supabase/Auth.js";
import { PrimaryButton, FormInput, LinkButton, Alert, AuthLayout } from "../Components/Layout.js";
import { singleton, append, delay, toList } from "../fable_modules/fable-library-js.4.28.0/Seq.js";
import { createObj } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { ofArray } from "../fable_modules/fable-library-js.4.28.0/List.js";
import { defaultOf } from "../fable_modules/fable-library-js.4.28.0/Util.js";

export class ForgotPasswordState extends Record {
    constructor(email, loading, error, success) {
        super();
        this.email = email;
        this.loading = loading;
        this.error = error;
        this.success = success;
    }
}

export function ForgotPasswordState_$reflection() {
    return record_type("Pages.ForgotPassword.ForgotPasswordState", [], ForgotPasswordState, () => [["email", string_type], ["loading", bool_type], ["error", option_type(string_type)], ["success", bool_type]]);
}

export function ForgotPasswordPage(forgotPasswordPageInputProps) {
    const onNavigate = forgotPasswordPageInputProps.onNavigate;
    let patternInput;
    const initial = new ForgotPasswordState("", false, undefined, false);
    patternInput = reactApi.useState(initial);
    const state = patternInput[0];
    const setState = patternInput[1];
    const handleReset = () => {
        if (state.email.length === 0) {
            setState(new ForgotPasswordState(state.email, state.loading, "이메일을 입력해주세요", state.success));
        }
        else {
            setState(new ForgotPasswordState(state.email, true, undefined, state.success));
            const pr = PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => {
                const redirectTo = window.location.origin + "/reset-password";
                return resetPasswordForEmail(state.email, redirectTo).then((_arg) => {
                    setState(new ForgotPasswordState(state.email, false, state.error, true));
                    return Promise.resolve();
                });
            }));
            void pr;
        }
    };
    return createElement(AuthLayout, {
        children: toList(delay(() => append(singleton(createElement("h2", {
            className: "text-xl font-semibold text-gray-800 mb-2",
            children: "비밀번호 재설정",
        })), delay(() => append(singleton(createElement("p", {
            className: "text-gray-600 mb-6",
            children: "가입하신 이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드립니다.",
        })), delay(() => {
            let children, elems, children_2;
            return state.success ? singleton((children = ofArray([createElement(Alert, {
                message: "비밀번호 재설정 이메일을 발송했습니다. 이메일을 확인해주세요.",
                alertType: "success",
            }), createElement("div", createObj(ofArray([["className", "text-center mt-4"], (elems = [createElement(LinkButton, {
                text: "로그인으로 돌아가기",
                onClick: () => {
                    onNavigate("login");
                },
            })], ["children", reactApi.Children.toArray(Array.from(elems))])])))]), createElement("div", {
                children: reactApi.Children.toArray(Array.from(children)),
            }))) : singleton((children_2 = toList(delay(() => {
                let matchValue, msg;
                return append((matchValue = state.error, (matchValue == null) ? singleton(defaultOf()) : ((msg = matchValue, singleton(createElement(Alert, {
                    message: msg,
                    alertType: "error",
                }))))), delay(() => {
                    let elems_1;
                    return append(singleton(createElement("form", createObj(ofArray([["onSubmit", (e) => {
                        e.preventDefault();
                        handleReset();
                    }], (elems_1 = [createElement(FormInput, {
                        label: "이메일",
                        inputType: "email",
                        placeholder: "your@email.com",
                        value: state.email,
                        onChange: (v) => {
                            setState(new ForgotPasswordState(v, state.loading, state.error, state.success));
                        },
                    }), createElement(PrimaryButton, {
                        text: "재설정 링크 보내기",
                        loading: state.loading,
                        onClick: handleReset,
                    })], ["children", reactApi.Children.toArray(Array.from(elems_1))])])))), delay(() => {
                        let elems_2;
                        return singleton(createElement("div", createObj(ofArray([["className", "mt-6 text-center"], (elems_2 = [createElement(LinkButton, {
                            text: "로그인으로 돌아가기",
                            onClick: () => {
                                onNavigate("login");
                            },
                        })], ["children", reactApi.Children.toArray(Array.from(elems_2))])]))));
                    }));
                }));
            })), createElement("div", {
                children: reactApi.Children.toArray(Array.from(children_2)),
            })));
        })))))),
    });
}

