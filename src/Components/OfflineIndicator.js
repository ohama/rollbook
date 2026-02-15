import { createElement } from "react";
import React from "react";
import { onStatusChange, isOnline } from "../offline/NetworkStatus.js";
import { reactApi } from "../fable_modules/Feliz.2.9.0/Interop.fs.js";
import { useEffectWithDeps } from "../fable_modules/Feliz.2.9.0/ReactInterop.js";
import { PromiseBuilder__Delay_62FBFDE1, PromiseBuilder__Run_212F1D4B } from "../fable_modules/Fable.Promise.3.2.0/Promise.fs.js";
import { promise } from "../fable_modules/Fable.Promise.3.2.0/PromiseImpl.fs.js";
import { getPendingCount } from "../offline/Queue.js";
import { defaultOf } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { createObj } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { empty, singleton, append, delay, toList } from "../fable_modules/fable-library-js.4.28.0/Seq.js";
import { printf, toText } from "../fable_modules/fable-library-js.4.28.0/String.js";
import { ofArray, singleton as singleton_1 } from "../fable_modules/fable-library-js.4.28.0/List.js";

export function OfflineIndicator() {
    let value, elems_1, elems;
    let patternInput;
    const initial = isOnline();
    patternInput = reactApi.useState(initial);
    const isOnlineState = patternInput[0];
    const patternInput_1 = reactApi.useState(0);
    const setPendingCount = patternInput_1[1];
    const pendingCount = patternInput_1[0] | 0;
    useEffectWithDeps(() => {
        const cleanup = onStatusChange(patternInput[1]);
        return {
            Dispose() {
                cleanup();
            },
        };
    }, []);
    useEffectWithDeps(() => {
        if (!isOnlineState) {
            const intervalId = window.setInterval(() => {
                const pr = PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (getPendingCount().then((_arg) => {
                    setPendingCount(_arg);
                    return Promise.resolve();
                }))));
                void pr;
            }, 2000);
            return {
                Dispose() {
                    window.clearInterval(intervalId);
                },
            };
        }
        else {
            setPendingCount(0);
            return {
                Dispose() {
                },
            };
        }
    }, [isOnlineState]);
    if (isOnlineState) {
        return defaultOf();
    }
    else {
        return createElement("div", createObj(ofArray([(value = "fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50", ["className", value]), (elems_1 = [createElement("span", {
            className: "text-xl",
            children: "📴",
        }), createElement("div", createObj(singleton_1((elems = toList(delay(() => append(singleton(createElement("p", {
            className: "font-medium",
            children: "오프라인",
        })), delay(() => ((pendingCount > 0) ? singleton(createElement("p", {
            className: "text-sm opacity-90",
            children: toText(printf("%d개 대기 중"))(pendingCount),
        })) : empty()))))), ["children", reactApi.Children.toArray(Array.from(elems))]))))], ["children", reactApi.Children.toArray(Array.from(elems_1))])])));
    }
}

