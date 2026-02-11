import browser_image_compression from "browser-image-compression";
import { PromiseBuilder__Delay_62FBFDE1, PromiseBuilder__Run_212F1D4B } from "../fable_modules/Fable.Promise.3.2.0/Promise.fs.js";
import { promise } from "../fable_modules/Fable.Promise.3.2.0/PromiseImpl.fs.js";
import { supabase } from "./Client.js";
import { FSharpResult$2 } from "../fable_modules/fable-library-js.4.28.0/Result.js";
import { map } from "../fable_modules/fable-library-js.4.28.0/Array.js";

/**
 * Compress image to max 1MB, 1920px
 */
export function compressImage(file) {
    const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: "image/jpeg",
    };
    return browser_image_compression(file)(options);
}

/**
 * Upload file to storage bucket with progress callback
 * Returns path on success, error message on failure
 */
export function upload(bucket, path, file, onProgress) {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => {
        const options = {
            cacheControl: "3600",
            upsert: true,
            onUploadProgress: (progress) => {
                const loaded = progress.loaded;
                const total = progress.total;
                if (total > 0) {
                    onProgress((loaded / total) * 100);
                }
            },
        };
        return ((supabase.storage.from(bucket)).upload(path, file, options)).then((_arg) => {
            const result = _arg;
            const error = result.error;
            if (error == null) {
                const data = result.data;
                const uploadedPath = data.path;
                return Promise.resolve(new FSharpResult$2(0, [uploadedPath]));
            }
            else {
                const errorMsg = error.message;
                return Promise.resolve(new FSharpResult$2(1, [errorMsg]));
            }
        });
    }));
}

/**
 * Create signed URL for private file access
 * expiresIn is in seconds (e.g., 3600 = 1 hour)
 */
export function createSignedUrl(bucket, path, expiresIn) {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (((supabase.storage.from(bucket)).createSignedUrl(path, expiresIn)).then((_arg) => {
        const result = _arg;
        const error = result.error;
        if (error == null) {
            const data = result.data;
            const url = data.signedUrl;
            return Promise.resolve(new FSharpResult$2(0, [url]));
        }
        else {
            const errorMsg = error.message;
            return Promise.resolve(new FSharpResult$2(1, [errorMsg]));
        }
    }))));
}

/**
 * Delete file(s) from storage bucket
 */
export function remove(bucket, paths) {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (((supabase.storage.from(bucket)).remove(paths)).then((_arg) => {
        const error = _arg.error;
        if (error == null) {
            return Promise.resolve(new FSharpResult$2(0, [undefined]));
        }
        else {
            const errorMsg = error.message;
            return Promise.resolve(new FSharpResult$2(1, [errorMsg]));
        }
    }))));
}

/**
 * List files in user's folder
 */
export function listFiles(bucket, folder) {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (((supabase.storage.from(bucket)).list(folder)).then((_arg) => {
        const result = _arg;
        const error = result.error;
        if (error == null) {
            const names = map((item) => item.name, result.data);
            return Promise.resolve(new FSharpResult$2(0, [names]));
        }
        else {
            const errorMsg = error.message;
            return Promise.resolve(new FSharpResult$2(1, [errorMsg]));
        }
    }))));
}

