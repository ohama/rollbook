import { Record } from "../fable_modules/fable-library-js.4.28.0/Types.js";
import { record_type, string_type } from "../fable_modules/fable-library-js.4.28.0/Reflection.js";
import { printf, toText, split, substring } from "../fable_modules/fable-library-js.4.28.0/String.js";
import { choose, sortByDescending, map, item } from "../fable_modules/fable-library-js.4.28.0/Array.js";
import { parse } from "../fable_modules/fable-library-js.4.28.0/Int32.js";
import { createElement } from "react";
import React from "react";
import { reactApi } from "../fable_modules/Feliz.2.9.0/Interop.fs.js";
import { PromiseBuilder__Delay_62FBFDE1, PromiseBuilder__Run_212F1D4B } from "../fable_modules/Fable.Promise.3.2.0/Promise.fs.js";
import { promise } from "../fable_modules/Fable.Promise.3.2.0/PromiseImpl.fs.js";
import { createSignedUrl, listFiles } from "../Supabase/Storage.js";
import { createObj, comparePrimitives } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { singleton, append, delay, toList } from "../fable_modules/fable-library-js.4.28.0/Seq.js";
import { ofArray } from "../fable_modules/fable-library-js.4.28.0/List.js";

const bucketName = "workout-photos";

export class PhotoItem extends Record {
    constructor(Filename, SignedUrl, Date$) {
        super();
        this.Filename = Filename;
        this.SignedUrl = SignedUrl;
        this.Date = Date$;
    }
}

export function PhotoItem_$reflection() {
    return record_type("Components.PhotoGallery.PhotoItem", [], PhotoItem, () => [["Filename", string_type], ["SignedUrl", string_type], ["Date", string_type]]);
}

function extractDate(filename) {
    if (filename.endsWith(".jpg")) {
        return substring(filename, 0, filename.length - 4);
    }
    else if (filename.endsWith(".jpeg")) {
        return substring(filename, 0, filename.length - 5);
    }
    else if (filename.endsWith(".png")) {
        return substring(filename, 0, filename.length - 4);
    }
    else if (filename.endsWith(".webp")) {
        return substring(filename, 0, filename.length - 5);
    }
    else {
        return filename;
    }
}

function formatDateKorean(dateStr) {
    const parts = split(dateStr, ["-"], undefined, 0);
    if (parts.length === 3) {
        const arg = item(0, parts);
        const arg_1 = parse(item(1, parts), 511, false, 32) | 0;
        const arg_2 = parse(item(2, parts), 511, false, 32) | 0;
        return toText(printf("%s년 %d월 %d일"))(arg)(arg_1)(arg_2);
    }
    else {
        return dateStr;
    }
}

export function PhotoGallery(photoGalleryInputProps) {
    let elems_4;
    const userId = photoGalleryInputProps.userId;
    const patternInput = reactApi.useState([]);
    const setPhotos = patternInput[1];
    const photos = patternInput[0];
    const patternInput_1 = reactApi.useState(true);
    const setLoading = patternInput_1[1];
    const loading = patternInput_1[0];
    const patternInput_2 = reactApi.useState(undefined);
    const setError = patternInput_2[1];
    const error = patternInput_2[0];
    const dependencies = [userId];
    reactApi.useEffect(() => {
        const pr_1 = PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (PromiseBuilder__Delay_62FBFDE1(promise, () => {
            setLoading(true);
            setError(undefined);
            return listFiles(bucketName, userId).then((_arg) => {
                let pr;
                const filesResult = _arg;
                if (filesResult.tag === 1) {
                    const msg = filesResult.fields[0];
                    setError("사진을 불러올 수 없습니다");
                    setLoading(false);
                    return Promise.resolve();
                }
                else {
                    const filenames = filesResult.fields[0];
                    return ((pr = map((filename) => PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => {
                        const path = toText(printf("%s/%s"))(userId)(filename);
                        return createSignedUrl(bucketName, path, 3600).then((_arg_1) => {
                            const urlResult = _arg_1;
                            if (urlResult.tag === 1) {
                                return Promise.resolve(undefined);
                            }
                            else {
                                const url = urlResult.fields[0];
                                return Promise.resolve(new PhotoItem(filename, url, extractDate(filename)));
                            }
                        });
                    })), filenames.filter((name) => {
                        if ((name.endsWith(".jpg") ? true : name.endsWith(".jpeg")) ? true : name.endsWith(".png")) {
                            return true;
                        }
                        else {
                            return name.endsWith(".webp");
                        }
                    })), Promise.all(pr))).then((_arg_2) => {
                        const photoItems = _arg_2;
                        const validPhotos = sortByDescending((p) => p.Date, choose((x) => x, photoItems), {
                            Compare: comparePrimitives,
                        });
                        setPhotos(validPhotos);
                        setLoading(false);
                        return Promise.resolve();
                    });
                }
            });
        }).catch((_arg_3) => {
            const ex = _arg_3;
            setError("사진 로딩 실패");
            setLoading(false);
            return Promise.resolve();
        }))));
        void pr_1;
    }, dependencies);
    return createElement("div", createObj(ofArray([["className", "space-y-4"], (elems_4 = toList(delay(() => append(singleton(createElement("h3", {
        className: "text-lg font-semibold text-gray-800",
        children: "내 운동 사진",
    })), delay(() => {
        let elems, elems_3;
        if (loading) {
            return singleton(createElement("div", {
                className: "text-center py-8 text-gray-500",
                children: "사진 로딩 중...",
            }));
        }
        else {
            const matchValue = error;
            if (matchValue == null) {
                return (photos.length === 0) ? singleton(createElement("div", createObj(ofArray([["className", "text-center py-8 text-gray-500"], (elems = [createElement("p", {
                    className: "text-4xl mb-2",
                    children: "📷",
                }), createElement("p", {
                    children: "아직 업로드한 사진이 없습니다",
                })], ["children", reactApi.Children.toArray(Array.from(elems))])])))) : singleton(createElement("div", createObj(ofArray([["className", "grid grid-cols-2 md:grid-cols-3 gap-4"], (elems_3 = ofArray(map((photo) => {
                    let elems_2, elems_1;
                    return createElement("div", createObj(ofArray([["key", photo.Filename], ["className", "relative aspect-square rounded-lg overflow-hidden shadow-sm"], (elems_2 = [createElement("img", {
                        src: photo.SignedUrl,
                        alt: toText(printf("%s 운동 사진"))(photo.Date),
                        className: "w-full h-full object-cover",
                    }), createElement("div", createObj(ofArray([["className", "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2"], (elems_1 = [createElement("span", {
                        className: "text-white text-sm font-medium",
                        children: formatDateKorean(photo.Date),
                    })], ["children", reactApi.Children.toArray(Array.from(elems_1))])])))], ["children", reactApi.Children.toArray(Array.from(elems_2))])])));
                }, photos)), ["children", reactApi.Children.toArray(Array.from(elems_3))])]))));
            }
            else {
                const msg_1 = matchValue;
                return singleton(createElement("div", {
                    className: "text-center py-8 text-red-600",
                    children: msg_1,
                }));
            }
        }
    })))), ["children", reactApi.Children.toArray(Array.from(elems_4))])])));
}

