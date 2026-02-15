import { Record } from "../fable_modules/fable-library-js.4.28.0/Types.js";
import { record_type, option_type, bool_type, string_type } from "../fable_modules/fable-library-js.4.28.0/Reflection.js";
import { createElement } from "react";
import React from "react";
import { reactApi } from "../fable_modules/Feliz.2.9.0/Interop.fs.js";
import { PromiseBuilder__Delay_62FBFDE1, PromiseBuilder__Run_212F1D4B } from "../fable_modules/Fable.Promise.3.2.0/Promise.fs.js";
import { promise } from "../fable_modules/Fable.Promise.3.2.0/PromiseImpl.fs.js";
import { updatePassword } from "../Supabase/Auth.js";
import { PrimaryButton, FormInput, LinkButton, Alert, AuthLayout } from "../Components/Layout.js";
import { singleton, append, delay, toList } from "../fable_modules/fable-library-js.4.28.0/Seq.js";
import { createObj } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { ofArray } from "../fable_modules/fable-library-js.4.28.0/List.js";
import { defaultOf } from "../fable_modules/fable-library-js.4.28.0/Util.js";

export class ResetPasswordState extends Record {
    constructor(password, confirmPassword, loading, error, success) {
        super();
        this.password = password;
        this.confirmPassword = confirmPassword;
        this.loading = loading;
        this.error = error;
        this.success = success;
    }
}

export function ResetPasswordState_$reflection() {
    return record_type("Pages.ResetPassword.ResetPasswordState", [], ResetPasswordState, () => [["password", string_type], ["confirmPassword", string_type], ["loading", bool_type], ["error", option_type(string_type)], ["success", bool_type]]);
}

export function ResetPasswordPage(resetPasswordPageInputProps) {
    const onNavigate = resetPasswordPageInputProps.onNavigate;
    let patternInput;
    const initial = new ResetPasswordState("", "", false, undefined, false);
    patternInput = reactApi.useState(initial);
    const state = patternInput[0];
    const setState = patternInput[1];
    const validateForm = () => {
        if (state.password.length < 6) {
            return "비밀번호는 6자 이상이어야 합니다";
        }
        else if (state.password !== state.confirmPassword) {
            return "비밀번호가 일치하지 않습니다";
        }
        else {
            return undefined;
        }
    };
    const handleUpdate = () => {
        const matchValue = validateForm();
        if (matchValue == null) {
            setState(new ResetPasswordState(state.password, state.confirmPassword, true, undefined, state.success));
            const pr = PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (updatePassword(state.password).then((_arg) => {
                const result = _arg;
                const matchValue_1 = result.error;
                if (matchValue_1 == null) {
                    setState(new ResetPasswordState(state.password, state.confirmPassword, false, state.error, true));
                    return Promise.resolve();
                }
                else {
                    const err_1 = matchValue_1;
                    setState(new ResetPasswordState(state.password, state.confirmPassword, false, err_1.message, state.success));
                    return Promise.resolve();
                }
            }))));
            void pr;
        }
        else {
            const err = matchValue;
            setState(new ResetPasswordState(state.password, state.confirmPassword, state.loading, err, state.success));
        }
    };
    return createElement(AuthLayout, {
        children: toList(delay(() => append(singleton(createElement("h2", {
            className: "text-xl font-semibold text-gray-800 mb-2",
            children: "새 비밀번호 설정",
        })), delay(() => append(singleton(createElement("p", {
            className: "text-gray-600 mb-6",
            children: "새로운 비밀번호를 입력해주세요.",
        })), delay(() => {
            let children, elems, children_2;
            return state.success ? singleton((children = ofArray([createElement(Alert, {
                message: "비밀번호가 변경되었습니다.",
                alertType: "success",
            }), createElement("div", createObj(ofArray([["className", "text-center mt-4"], (elems = [createElement(LinkButton, {
                text: "로그인하기",
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
                    return singleton(createElement("form", createObj(ofArray([["onSubmit", (e) => {
                        e.preventDefault();
                        handleUpdate();
                    }], (elems_1 = [createElement(FormInput, {
                        label: "새 비밀번호",
                        inputType: "password",
                        placeholder: "6자 이상",
                        value: state.password,
                        onChange: (v) => {
                            setState(new ResetPasswordState(v, state.confirmPassword, state.loading, state.error, state.success));
                        },
                    }), createElement(FormInput, {
                        label: "비밀번호 확인",
                        inputType: "password",
                        placeholder: "비밀번호 재입력",
                        value: state.confirmPassword,
                        onChange: (v_1) => {
                            setState(new ResetPasswordState(state.password, v_1, state.loading, state.error, state.success));
                        },
                    }), createElement(PrimaryButton, {
                        text: "비밀번호 변경",
                        loading: state.loading,
                        onClick: handleUpdate,
                    })], ["children", reactApi.Children.toArray(Array.from(elems_1))])]))));
                }));
            })), createElement("div", {
                children: reactApi.Children.toArray(Array.from(children_2)),
            })));
        })))))),
    });
}

