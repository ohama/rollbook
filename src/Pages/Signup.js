import { Record } from "../fable_modules/fable-library-js.4.28.0/Types.js";
import { record_type, option_type, bool_type, string_type } from "../fable_modules/fable-library-js.4.28.0/Reflection.js";
import { createElement } from "react";
import React from "react";
import { reactApi } from "../fable_modules/Feliz.2.9.0/Interop.fs.js";
import { PromiseBuilder__Delay_62FBFDE1, PromiseBuilder__Run_212F1D4B } from "../fable_modules/Fable.Promise.3.2.0/Promise.fs.js";
import { promise } from "../fable_modules/Fable.Promise.3.2.0/PromiseImpl.fs.js";
import { signUp } from "../Supabase/Auth.js";
import { PrimaryButton, FormInput, LinkButton, Alert, AuthLayout } from "../Components/Layout.js";
import { singleton, append, delay, toList } from "../fable_modules/fable-library-js.4.28.0/Seq.js";
import { createObj } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { ofArray } from "../fable_modules/fable-library-js.4.28.0/List.js";
import { defaultOf } from "../fable_modules/fable-library-js.4.28.0/Util.js";

export class SignupState extends Record {
    constructor(email, password, confirmPassword, loading, error, success) {
        super();
        this.email = email;
        this.password = password;
        this.confirmPassword = confirmPassword;
        this.loading = loading;
        this.error = error;
        this.success = success;
    }
}

export function SignupState_$reflection() {
    return record_type("Pages.Signup.SignupState", [], SignupState, () => [["email", string_type], ["password", string_type], ["confirmPassword", string_type], ["loading", bool_type], ["error", option_type(string_type)], ["success", bool_type]]);
}

export function SignupPage(signupPageInputProps) {
    const onNavigate = signupPageInputProps.onNavigate;
    let patternInput;
    const initial = new SignupState("", "", "", false, undefined, false);
    patternInput = reactApi.useState(initial);
    const state = patternInput[0];
    const setState = patternInput[1];
    const handleSignup = () => {
        const matchValue = (state.password.length < 6) ? "비밀번호는 6자 이상이어야 합니다" : ((state.password !== state.confirmPassword) ? "비밀번호가 일치하지 않습니다" : undefined);
        if (matchValue == null) {
            setState(new SignupState(state.email, state.password, state.confirmPassword, true, undefined, state.success));
            const pr = PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (signUp(state.email, state.password, undefined).then((_arg) => {
                const matchValue_1 = _arg.error;
                if (matchValue_1 == null) {
                    setState(new SignupState(state.email, state.password, state.confirmPassword, false, state.error, true));
                    return Promise.resolve();
                }
                else {
                    const err_1 = matchValue_1;
                    setState(new SignupState(state.email, state.password, state.confirmPassword, false, err_1.message, state.success));
                    return Promise.resolve();
                }
            }))));
            void pr;
        }
        else {
            setState(new SignupState(state.email, state.password, state.confirmPassword, state.loading, matchValue, state.success));
        }
    };
    return createElement(AuthLayout, {
        children: toList(delay(() => append(singleton(createElement("h2", {
            className: "text-xl font-semibold text-gray-800 mb-6",
            children: "회원가입",
        })), delay(() => {
            let children, elems, children_2;
            return state.success ? singleton((children = ofArray([createElement(Alert, {
                message: "인증 이메일을 발송했습니다. 이메일을 확인해주세요.",
                alertType: "success",
            }), createElement("div", createObj(ofArray([["className", "text-center mt-4"], (elems = [createElement(LinkButton, {
                text: "로그인으로 돌아가기",
                onClick: () => {
                    onNavigate("login");
                },
            })], ["children", reactApi.Children.toArray(Array.from(elems))])])))]), createElement("div", {
                children: reactApi.Children.toArray(Array.from(children)),
            }))) : singleton((children_2 = toList(delay(() => {
                let matchValue_2, msg;
                return append((matchValue_2 = state.error, (matchValue_2 == null) ? singleton(defaultOf()) : ((msg = matchValue_2, singleton(createElement(Alert, {
                    message: msg,
                    alertType: "error",
                }))))), delay(() => {
                    let elems_1;
                    return append(singleton(createElement("form", createObj(ofArray([["onSubmit", (e) => {
                        e.preventDefault();
                        handleSignup();
                    }], (elems_1 = [createElement(FormInput, {
                        label: "이메일",
                        inputType: "email",
                        placeholder: "your@email.com",
                        value: state.email,
                        onChange: (v) => {
                            setState(new SignupState(v, state.password, state.confirmPassword, state.loading, state.error, state.success));
                        },
                    }), createElement(FormInput, {
                        label: "비밀번호",
                        inputType: "password",
                        placeholder: "6자 이상",
                        value: state.password,
                        onChange: (v_1) => {
                            setState(new SignupState(state.email, v_1, state.confirmPassword, state.loading, state.error, state.success));
                        },
                    }), createElement(FormInput, {
                        label: "비밀번호 확인",
                        inputType: "password",
                        placeholder: "비밀번호 재입력",
                        value: state.confirmPassword,
                        onChange: (v_2) => {
                            setState(new SignupState(state.email, state.password, v_2, state.loading, state.error, state.success));
                        },
                    }), createElement(PrimaryButton, {
                        text: "가입하기",
                        loading: state.loading,
                        onClick: handleSignup,
                    })], ["children", reactApi.Children.toArray(Array.from(elems_1))])])))), delay(() => {
                        let elems_2;
                        return append(singleton(createElement("div", createObj(ofArray([["className", "mt-6 text-center text-gray-600"], (elems_2 = ["이미 계정이 있으신가요? ", createElement(LinkButton, {
                            text: "로그인",
                            onClick: () => {
                                onNavigate("login");
                            },
                        })], ["children", reactApi.Children.toArray(Array.from(elems_2))])])))), delay(() => {
                            let elems_3;
                            return singleton(createElement("div", createObj(ofArray([["className", "mt-3 text-center"], (elems_3 = [createElement(LinkButton, {
                                text: "← 처음으로",
                                onClick: () => {
                                    onNavigate("landing");
                                },
                            })], ["children", reactApi.Children.toArray(Array.from(elems_3))])]))));
                        }));
                    }));
                }));
            })), createElement("div", {
                children: reactApi.Children.toArray(Array.from(children_2)),
            })));
        })))),
    });
}

