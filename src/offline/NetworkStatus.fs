module Offline.NetworkStatus

open Fable.Core
open Fable.Core.JsInterop
open Browser

/// Access to global navigator object
[<Emit("navigator")>]
let private navigator : obj = jsNative

/// Check if currently online
let isOnline () : bool =
    navigator?onLine |> unbox<bool>

/// Subscribe to online/offline status changes
/// Returns a function to unsubscribe
let onStatusChange (callback: bool -> unit) : unit -> unit =
    let handleOnline = fun _ -> callback true
    let handleOffline = fun _ -> callback false

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Return cleanup function
    fun () ->
        window.removeEventListener("online", handleOnline)
        window.removeEventListener("offline", handleOffline)

/// Subscribe to visibility changes (for fallback sync trigger)
let onVisibilityChange (callback: bool -> unit) : unit -> unit =
    let handleVisibility = fun _ ->
        let isVisible = document?visibilityState = "visible"
        callback isVisible

    document.addEventListener("visibilitychange", handleVisibility)

    fun () ->
        document.removeEventListener("visibilitychange", handleVisibility)
