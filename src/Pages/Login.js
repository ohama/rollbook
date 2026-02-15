import { Record } from "../fable_modules/fable-library-js.4.28.0/Types.js";
import { record_type, option_type, bool_type, string_type } from "../fable_modules/fable-library-js.4.28.0/Reflection.js";
import { createElement } from "react";
import React from "react";
import { reactApi } from "../fable_modules/Feliz.2.9.0/Interop.fs.js";
import { PromiseBuilder__Delay_62FBFDE1, PromiseBuilder__Run_212F1D4B } from "../fable_modules/Fable.Promise.3.2.0/Promise.fs.js";
import { promise } from "../fable_modules/Fable.Promise.3.2.0/PromiseImpl.fs.js";
import { signInWithPassword } from "../Supabase/Auth.js";
import { PrimaryButton, LinkButton, FormInput, Alert, AuthLayout } from "../Components/Layout.js";
import { singleton, append, delay, toList } from "../fable_modules/fable-library-js.4.28.0/Seq.js";
import { defaultOf } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { createObj } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { ofArray } from "../fable_modules/fable-library-js.4.28.0/List.js";

export class LoginState extends Record {
    constructor(email, password, loading, error) {
        super();
        this.email = email;
        this.password = password;
        this.loading = loading;
        this.error = error;
    }
}

export function LoginState_$reflection() {
    return record_type("Pages.Login.LoginState", [], LoginState, () => [["email", string_type], ["password", string_type], ["loading", bool_type], ["error", option_type(string_type)]]);
}

export function LoginPage(loginPageInputProps) {
    const onLoginSuccess = loginPageInputProps.onLoginSuccess;
    const onNavigate = loginPageInputProps.onNavigate;
    let patternInput;
    const initial = new LoginState("", "", false, undefined);
    patternInput = reactApi.useState(initial);
    const state = patternInput[0];
    const setState = patternInput[1];
    const handleLogin = () => {
        setState(new LoginState(state.email, state.password, true, undefined));
        const pr = PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (signInWithPassword(state.email, state.password).then((_arg) => {
            const result = _arg;
            const matchValue = result.error;
            if (matchValue == null) {
                setState(new LoginState(state.email, state.password, false, state.error));
                onLoginSuccess();
                return Promise.resolve();
            }
            else {
                const err = matchValue;
                setState(new LoginState(state.email, state.password, false, err.message));
                return Promise.resolve();
            }
        }))));
        void pr;
    };
    return createElement(AuthLayout, {
        children: toList(delay(() => append(singleton(createElement("h2", {
            className: "text-xl font-semibold text-gray-800 mb-6",
            children: "로그인",
        })), delay(() => {
            let matchValue_1, msg;
            return append((matchValue_1 = state.error, (matchValue_1 == null) ? singleton(defaultOf()) : ((msg = matchValue_1, singleton(createElement(Alert, {
                message: msg,
                alertType: "error",
            }))))), delay(() => {
                let elems_1, elems;
                return append(singleton(createElement("form", createObj(ofArray([["onSubmit", (e) => {
                    e.preventDefault();
                    handleLogin();
                }], (elems_1 = [createElement(FormInput, {
                    label: "이메일",
                    inputType: "email",
                    placeholder: "your@email.com",
                    value: state.email,
                    onChange: (v) => {
                        setState(new LoginState(v, state.password, state.loading, state.error));
                    },
                }), createElement(FormInput, {
                    label: "비밀번호",
                    inputType: "password",
                    placeholder: "",
                    value: state.password,
                    onChange: (v_1) => {
                        setState(new LoginState(state.email, v_1, state.loading, state.error));
                    },
                }), createElement("div", createObj(ofArray([["className", "flex justify-end mb-4"], (elems = [createElement(LinkButton, {
                    text: "비밀번호를 잊으셨나요?",
                    onClick: () => {
                        onNavigate("forgot-password");
                    },
                })], ["children", reactApi.Children.toArray(Array.from(elems))])]))), createElement(PrimaryButton, {
                    text: "로그인",
                    loading: state.loading,
                    onClick: handleLogin,
                })], ["children", reactApi.Children.toArray(Array.from(elems_1))])])))), delay(() => {
                    let elems_2;
                    return singleton(createElement("div", createObj(ofArray([["className", "mt-6 text-center text-gray-600"], (elems_2 = ["계정이 없으신가요? ", createElement(LinkButton, {
                        text: "회원가입",
                        onClick: () => {
                            onNavigate("signup");
                        },
                    })], ["children", reactApi.Children.toArray(Array.from(elems_2))])]))));
                }));
            }));
        })))),
    });
}

