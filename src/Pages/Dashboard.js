import { createElement } from "react";
import React from "react";
import { reactApi } from "../fable_modules/Feliz.2.9.0/Interop.fs.js";
import { createObj } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { PromiseBuilder__Delay_62FBFDE1, PromiseBuilder__Run_212F1D4B } from "../fable_modules/Fable.Promise.3.2.0/Promise.fs.js";
import { promise } from "../fable_modules/Fable.Promise.3.2.0/PromiseImpl.fs.js";
import { signOut } from "../Supabase/Auth.js";
import { ofArray } from "../fable_modules/fable-library-js.4.28.0/List.js";
import { defaultArg } from "../fable_modules/fable-library-js.4.28.0/Option.js";

export function DashboardPage(dashboardPageInputProps) {
    let elems_6, elems_1, elems, elems_5, elems_3, elems_2, elems_4;
    const onLogout = dashboardPageInputProps.onLogout;
    const user = dashboardPageInputProps.user;
    const patternInput = reactApi.useState(false);
    const loading = patternInput[0];
    return createElement("div", createObj(ofArray([["className", "min-h-screen bg-gray-100"], (elems_6 = [createElement("header", createObj(ofArray([["className", "bg-white shadow-sm"], (elems_1 = [createElement("div", createObj(ofArray([["className", "max-w-4xl mx-auto px-4 py-4 flex items-center justify-between"], (elems = [createElement("h1", {
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
    })], ["children", reactApi.Children.toArray(Array.from(elems))])])))], ["children", reactApi.Children.toArray(Array.from(elems_1))])]))), createElement("main", createObj(ofArray([["className", "max-w-4xl mx-auto px-4 py-8"], (elems_5 = [createElement("div", createObj(ofArray([["className", "bg-white rounded-2xl shadow-sm p-6 mb-6"], (elems_3 = [createElement("h2", {
        className: "text-lg font-semibold text-gray-800 mb-2",
        children: "환영합니다!",
    }), createElement("p", createObj(ofArray([["className", "text-gray-600"], (elems_2 = ["로그인 이메일: ", createElement("span", {
        className: "font-medium",
        children: defaultArg(user.email, "N/A"),
    })], ["children", reactApi.Children.toArray(Array.from(elems_2))])])))], ["children", reactApi.Children.toArray(Array.from(elems_3))])]))), createElement("div", createObj(ofArray([["className", "bg-white rounded-2xl shadow-sm p-6 text-center"], (elems_4 = [createElement("div", {
        className: "text-6xl mb-4",
        children: "💪",
    }), createElement("h3", {
        className: "text-lg font-semibold text-gray-800 mb-2",
        children: "운동 기록 준비 중",
    }), createElement("p", {
        className: "text-gray-600",
        children: "Phase 2에서 \'오늘 운동했다\' 원탭 기록 기능이 추가됩니다.",
    })], ["children", reactApi.Children.toArray(Array.from(elems_4))])])))], ["children", reactApi.Children.toArray(Array.from(elems_5))])])))], ["children", reactApi.Children.toArray(Array.from(elems_6))])])));
}

