module ServiceWorker.Registration

open Fable.Core
open Fable.Core.JsInterop

[<Emit("navigator")>]
let private navigator : obj = jsNative

/// Check if service workers are supported
let isSupported () : bool =
    jsIn "serviceWorker" navigator

/// Register the service worker
let register () : JS.Promise<obj option> =
    promise {
        if isSupported () then
            try
                let! registration = navigator?serviceWorker?register("/sw.js")
                printfn "Service Worker registered successfully"
                return Some registration
            with exn ->
                printfn "Service Worker registration failed: %s" exn.Message
                return None
        else
            printfn "Service Workers not supported in this browser"
            return None
    }

/// Unregister all service workers (useful for debugging)
let unregisterAll () : JS.Promise<unit> =
    promise {
        if isSupported () then
            let! registrations = navigator?serviceWorker?getRegistrations()
            let regsArray : obj array = unbox registrations
            for reg in regsArray do
                let! _ = reg?unregister()
                ()
            printfn "All Service Workers unregistered"
    }
