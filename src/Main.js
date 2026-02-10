import { Record, Union } from "./fable_modules/fable-library-js.4.28.0/Types.js";
import { record_type, union_type, class_type } from "./fable_modules/fable-library-js.4.28.0/Reflection.js";
import { createElement } from "react";
import React from "react";
import { reactApi } from "./fable_modules/Feliz.2.9.0/Interop.fs.js";
import { useEffectDisposableOnce } from "./fable_modules/Feliz.2.9.0/Internal.fs.js";
import { onAuthStateChange } from "./Supabase/Auth.js";
import { SignupPage } from "./Pages/Signup.js";
import { ForgotPasswordPage } from "./Pages/ForgotPassword.js";
import { ResetPasswordPage } from "./Pages/ResetPassword.js";
import { LoginPage } from "./Pages/Login.js";
import { DashboardPage } from "./Pages/Dashboard.js";
import { createObj } from "./fable_modules/fable-library-js.4.28.0/Util.js";
import { ofArray } from "./fable_modules/fable-library-js.4.28.0/List.js";
import { createRoot } from "react-dom/client";

export class AuthState extends Union {
    constructor(tag, fields) {
        super();
        this.tag = tag;
        this.fields = fields;
    }
    cases() {
        return ["Loading", "Anonymous", "Authenticated"];
    }
}

export function AuthState_$reflection() {
    return union_type("Main.AuthState", [], AuthState, () => [[], [], [["Item", class_type("Supabase.Types.User")]]]);
}

export class Page extends Union {
    constructor(tag, fields) {
        super();
        this.tag = tag;
        this.fields = fields;
    }
    cases() {
        return ["LoginPage", "SignupPage", "ForgotPasswordPage", "ResetPasswordPage"];
    }
}

export function Page_$reflection() {
    return union_type("Main.Page", [], Page, () => [[], [], [], []]);
}

export class AppState extends Record {
    constructor(authState, currentPage) {
        super();
        this.authState = authState;
        this.currentPage = currentPage;
    }
}

export function AppState_$reflection() {
    return record_type("Main.AppState", [], AppState, () => [["authState", AuthState_$reflection()], ["currentPage", Page_$reflection()]]);
}

export function App() {
    let elems_1, elems;
    let patternInput;
    const initial = new AppState(new AuthState(0, []), new Page(0, []));
    patternInput = reactApi.useState(initial);
    const state = patternInput[0];
    const setState = patternInput[1];
    useEffectDisposableOnce(() => {
        const hash = window.location.hash;
        if (hash.indexOf("type=recovery") >= 0) {
            setState(new AppState(state.authState, new Page(3, [])));
        }
        const unsubscribe = onAuthStateChange((event, session) => {
            switch (event) {
                case "SIGNED_OUT": {
                    setState(new AppState(new AuthState(1, []), new Page(0, [])));
                    break;
                }
                case "PASSWORD_RECOVERY": {
                    setState(new AppState(state.authState, new Page(3, [])));
                    break;
                }
                case "USER_UPDATED": {
                    if (session == null) {
                    }
                    else {
                        const s_1 = session;
                        setState(new AppState(new AuthState(2, [s_1.user]), state.currentPage));
                    }
                    break;
                }
                default:
                    if (session == null) {
                        setState(new AppState(new AuthState(1, []), state.currentPage));
                    }
                    else {
                        const s = session;
                        setState(new AppState(new AuthState(2, [s.user]), state.currentPage));
                    }
            }
        });
        return {
            Dispose() {
                unsubscribe();
            },
        };
    });
    const navigateTo = (page) => {
        setState(new AppState(state.authState, (page === "signup") ? (new Page(1, [])) : ((page === "forgot-password") ? (new Page(2, [])) : ((page === "reset-password") ? (new Page(3, [])) : (new Page(0, []))))));
    };
    const matchValue = state.authState;
    switch (matchValue.tag) {
        case 1: {
            const matchValue_1 = state.currentPage;
            switch (matchValue_1.tag) {
                case 1:
                    return createElement(SignupPage, {
                        onNavigate: navigateTo,
                    });
                case 2:
                    return createElement(ForgotPasswordPage, {
                        onNavigate: navigateTo,
                    });
                case 3:
                    return createElement(ResetPasswordPage, {
                        onNavigate: navigateTo,
                    });
                default:
                    return createElement(LoginPage, {
                        onNavigate: navigateTo,
                        onLoginSuccess: () => {
                        },
                    });
            }
        }
        case 2:
            return createElement(DashboardPage, {
                user: matchValue.fields[0],
                onLogout: () => {
                    setState(new AppState(new AuthState(1, []), new Page(0, [])));
                },
            });
        default:
            return createElement("div", createObj(ofArray([["className", "min-h-screen bg-gray-100 flex items-center justify-center"], (elems_1 = [createElement("div", createObj(ofArray([["className", "text-center"], (elems = [createElement("div", {
                className: "animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4",
            }), createElement("p", {
                className: "text-gray-600",
                children: "로딩 중...",
            })], ["children", reactApi.Children.toArray(Array.from(elems))])])))], ["children", reactApi.Children.toArray(Array.from(elems_1))])])));
    }
}

export const root = createRoot(document.getElementById("app"));

root.render(createElement(App, null));

