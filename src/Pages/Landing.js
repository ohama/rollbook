import { createElement } from "react";
import React from "react";
import { createObj } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { reactApi } from "../fable_modules/Feliz.2.9.0/Interop.fs.js";
import { ofArray } from "../fable_modules/fable-library-js.4.28.0/List.js";

export function LandingPage(landingPageInputProps) {
    let elems_4, elems, elems_3, elems_2, value_43, elems_1, value_53, value_58;
    const onNavigate = landingPageInputProps.onNavigate;
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
        marginTop: 80,
    }], (elems_2 = [createElement("button", createObj(ofArray([(value_43 = "w-full py-6 px-6 rounded-2xl font-bold text-white text-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all", ["className", value_43]), ["onClick", (_arg) => {
        onNavigate("login");
    }], ["children", "로그인"]]))), createElement("div", createObj(ofArray([["className", "flex gap-4"], ["style", {
        marginTop: 20,
    }], (elems_1 = [createElement("button", createObj(ofArray([(value_53 = "flex-1 py-5 px-4 rounded-2xl font-semibold text-indigo-600 text-lg border-2 border-indigo-300 hover:bg-indigo-50 active:scale-[0.98] transition-all", ["className", value_53]), ["onClick", (_arg_1) => {
        onNavigate("signup");
    }], ["children", "회원가입"]]))), createElement("button", createObj(ofArray([(value_58 = "flex-1 py-5 px-4 rounded-2xl font-semibold text-gray-500 text-lg hover:text-gray-700 hover:bg-gray-100 active:scale-[0.98] transition-all", ["className", value_58]), ["onClick", (_arg_2) => {
        onNavigate("forgot-password");
    }], ["children", "비밀번호 분실"]])))], ["children", reactApi.Children.toArray(Array.from(elems_1))])])))], ["children", reactApi.Children.toArray(Array.from(elems_2))])])))], ["children", reactApi.Children.toArray(Array.from(elems_3))])])))], ["children", reactApi.Children.toArray(Array.from(elems_4))])])));
}

