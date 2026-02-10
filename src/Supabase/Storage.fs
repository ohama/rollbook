module Supabase.Storage

open Fable.Core
open Fable.Core.JsInterop
open Browser.Types
open Supabase.Client

// Import browser-image-compression
[<Import("default", "browser-image-compression")>]
let private imageCompressionLib: File -> obj -> JS.Promise<File> = jsNative

/// Compress image to max 1MB, 1920px
let compressImage (file: File) : JS.Promise<File> =
    let options = createObj [
        "maxSizeMB" ==> 1.0
        "maxWidthOrHeight" ==> 1920
        "useWebWorker" ==> true
        "fileType" ==> "image/jpeg"
    ]
    imageCompressionLib file options

/// Upload file to storage bucket with progress callback
/// Returns path on success, error message on failure
let upload (bucket: string) (path: string) (file: File) (onProgress: float -> unit) : JS.Promise<Result<string, string>> =
    promise {
        let options = createObj [
            "cacheControl" ==> "3600"
            "upsert" ==> true
            "onUploadProgress" ==> (fun progress ->
                let loaded = progress?loaded |> unbox<float>
                let total = progress?total |> unbox<float>
                if total > 0.0 then
                    onProgress ((loaded / total) * 100.0)
            )
        ]
        let! result = supabase?storage?from(bucket)?upload(path, file, options)
        let error = result?error
        if isNull error then
            let data = result?data
            let uploadedPath = data?path |> unbox<string>
            return Ok uploadedPath
        else
            let errorMsg = error?message |> unbox<string>
            return Error errorMsg
    }

/// Create signed URL for private file access
/// expiresIn is in seconds (e.g., 3600 = 1 hour)
let createSignedUrl (bucket: string) (path: string) (expiresIn: int) : JS.Promise<Result<string, string>> =
    promise {
        let! result = supabase?storage?from(bucket)?createSignedUrl(path, expiresIn)
        let error = result?error
        if isNull error then
            let data = result?data
            let url = data?signedUrl |> unbox<string>
            return Ok url
        else
            let errorMsg = error?message |> unbox<string>
            return Error errorMsg
    }

/// Delete file(s) from storage bucket
let remove (bucket: string) (paths: string array) : JS.Promise<Result<unit, string>> =
    promise {
        let! result = supabase?storage?from(bucket)?remove(paths)
        let error = result?error
        if isNull error then
            return Ok ()
        else
            let errorMsg = error?message |> unbox<string>
            return Error errorMsg
    }

/// List files in user's folder
let listFiles (bucket: string) (folder: string) : JS.Promise<Result<string array, string>> =
    promise {
        let! result = supabase?storage?from(bucket)?list(folder)
        let error = result?error
        if isNull error then
            let data = result?data |> unbox<obj array>
            let names = data |> Array.map (fun item -> item?name |> unbox<string>)
            return Ok names
        else
            let errorMsg = error?message |> unbox<string>
            return Error errorMsg
    }
