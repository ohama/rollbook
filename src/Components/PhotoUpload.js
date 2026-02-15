import { printf, toText } from "../fable_modules/fable-library-js.4.28.0/String.js";
import { createElement } from "react";
import React from "react";
import { reactApi } from "../fable_modules/Feliz.2.9.0/Interop.fs.js";
import { PhotoUploadState } from "../Supabase/Types.js";
import { createObj } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { singleton, append, delay, toList } from "../fable_modules/fable-library-js.4.28.0/Seq.js";
import { awaitPromise, startImmediate } from "../fable_modules/fable-library-js.4.28.0/Async.js";
import { singleton as singleton_1 } from "../fable_modules/fable-library-js.4.28.0/AsyncBuilder.js";
import { createSignedUrl, upload, compressImage } from "../Supabase/Storage.js";
import { createPhotoRecord, getTodayDateString } from "../Supabase/Workouts.js";
import { ofArray } from "../fable_modules/fable-library-js.4.28.0/List.js";

const bucketName = "workout-photos";

function buildPath(userId, date) {
    return toText(printf("%s/%s.jpg"))(userId)(date);
}

export function PhotoUploadButton(photoUploadButtonInputProps) {
    let elems_8;
    const onUploadComplete = photoUploadButtonInputProps.onUploadComplete;
    const userId = photoUploadButtonInputProps.userId;
    const patternInput = reactApi.useState(new PhotoUploadState(0, []));
    const uploadState = patternInput[0];
    const setUploadState = patternInput[1];
    return createElement("div", createObj(ofArray([["className", "relative"], (elems_8 = toList(delay(() => append(singleton(createElement("input", {
        id: "photo-upload-input",
        type: "file",
        accept: "image/*",
        capture: "environment",
        className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10",
        onChange: (e) => {
            const input = e.target;
            if (!(input.files == null) && (input.files.length > 0)) {
                const file = input.files[0];
                startImmediate(singleton_1.Delay(() => singleton_1.TryWith(singleton_1.Delay(() => {
                    setUploadState(new PhotoUploadState(1, []));
                    return singleton_1.Bind(awaitPromise(compressImage(file)), (_arg) => {
                        setUploadState(new PhotoUploadState(2, [0]));
                        const path = buildPath(userId, getTodayDateString());
                        return singleton_1.Bind(awaitPromise(upload(bucketName, path, _arg, (progress) => {
                            setUploadState(new PhotoUploadState(2, [progress]));
                        })), (_arg_1) => {
                            const uploadResult = _arg_1;
                            if (uploadResult.tag === 1) {
                                setUploadState(new PhotoUploadState(4, [uploadResult.fields[0]]));
                                return singleton_1.Zero();
                            }
                            else {
                                return singleton_1.Bind(awaitPromise(createSignedUrl(bucketName, uploadResult.fields[0], 3600)), (_arg_2) => {
                                    const urlResult = _arg_2;
                                    const finalUrl = (urlResult.tag === 1) ? "" : urlResult.fields[0];
                                    const today_1 = getTodayDateString();
                                    return singleton_1.Bind(awaitPromise(createPhotoRecord(userId, today_1, finalUrl, undefined)), (_arg_3) => {
                                        setUploadState(new PhotoUploadState(3, [finalUrl]));
                                        onUploadComplete();
                                        return singleton_1.Zero();
                                    });
                                });
                            }
                        });
                    });
                }), (_arg_4) => {
                    setUploadState(new PhotoUploadState(4, ["사진 업로드 실패. 다시 시도해주세요."]));
                    return singleton_1.Zero();
                })));
            }
        },
        disabled: (uploadState.tag === 1) ? true : (uploadState.tag === 2),
    })), delay(() => {
        let elems_1, elems_4, elems_2, elems_3, elems_5, elems_7, elems_6, value_15, elems;
        const matchValue = uploadState;
        switch (matchValue.tag) {
            case 1:
                return singleton(createElement("div", createObj(ofArray([["className", "flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-500 rounded-lg cursor-wait"], (elems_1 = [createElement("span", {
                    className: "animate-spin",
                    children: "⏳",
                }), createElement("span", {
                    children: "압축 중...",
                })], ["children", reactApi.Children.toArray(Array.from(elems_1))])]))));
            case 2: {
                const progress_1 = matchValue.fields[0];
                return singleton(createElement("div", createObj(ofArray([["className", "px-4 py-3 bg-gray-100 rounded-lg"], (elems_4 = [createElement("div", createObj(ofArray([["className", "flex items-center justify-between mb-2"], (elems_2 = [createElement("span", {
                    className: "text-sm text-gray-600",
                    children: "업로드 중...",
                }), createElement("span", {
                    className: "text-sm font-medium text-indigo-600",
                    children: toText(printf("%.0f%%"))(progress_1),
                })], ["children", reactApi.Children.toArray(Array.from(elems_2))])]))), createElement("div", createObj(ofArray([["className", "w-full h-2 bg-gray-200 rounded-full overflow-hidden"], (elems_3 = [createElement("div", {
                    className: "h-full bg-indigo-600 transition-all duration-200",
                    style: {
                        width: ~~progress_1 + "%",
                    },
                })], ["children", reactApi.Children.toArray(Array.from(elems_3))])])))], ["children", reactApi.Children.toArray(Array.from(elems_4))])]))));
            }
            case 3:
                return singleton(createElement("div", createObj(ofArray([["className", "flex items-center gap-2 px-4 py-3 bg-green-100 text-green-700 rounded-lg"], (elems_5 = [createElement("span", {
                    className: "text-xl",
                    children: "✅",
                }), createElement("span", {
                    className: "font-medium",
                    children: "업로드 완료! 운동 기록됨",
                })], ["children", reactApi.Children.toArray(Array.from(elems_5))])]))));
            case 4:
                return singleton(createElement("div", createObj(ofArray([["className", "space-y-2"], (elems_7 = [createElement("div", createObj(ofArray([["className", "flex items-center gap-2 px-4 py-3 bg-red-100 text-red-700 rounded-lg"], (elems_6 = [createElement("span", {
                    className: "text-xl",
                    children: "❌",
                }), createElement("span", {
                    children: matchValue.fields[0],
                })], ["children", reactApi.Children.toArray(Array.from(elems_6))])]))), createElement("button", {
                    onClick: (_arg_5) => {
                        setUploadState(new PhotoUploadState(0, []));
                    },
                    className: "text-sm text-indigo-600 hover:text-indigo-800 underline",
                    children: "다시 시도",
                })], ["children", reactApi.Children.toArray(Array.from(elems_7))])]))));
            default:
                return singleton(createElement("div", createObj(ofArray([(value_15 = "flex items-center gap-2 px-4 py-3 bg-indigo-100 text-indigo-700 rounded-lg cursor-pointer hover:bg-indigo-200 transition-colors", ["className", value_15]), (elems = [createElement("span", {
                    className: "text-xl",
                    children: "📷",
                }), createElement("span", {
                    className: "font-medium",
                    children: "사진 올리기",
                })], ["children", reactApi.Children.toArray(Array.from(elems))])]))));
        }
    })))), ["children", reactApi.Children.toArray(Array.from(elems_8))])])));
}

