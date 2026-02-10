module Components.OfflineIndicator

open Feliz
open Fable.Core
open Fable.Core.JsInterop
open Offline.NetworkStatus
open Offline.Queue

[<ReactComponent>]
let OfflineIndicator () =
    let isOnlineState, setIsOnline = React.useState(isOnline ())
    let pendingCount, setPendingCount = React.useState(0)

    // Subscribe to online/offline changes
    React.useEffect((fun () ->
        let cleanup = onStatusChange setIsOnline
        { new System.IDisposable with
            member _.Dispose() = cleanup() }
    ), [||])

    // Poll pending count every 2 seconds when offline
    React.useEffect((fun () ->
        if not isOnlineState then
            let intervalId =
                Browser.Dom.window.setInterval(
                    (fun () ->
                        promise {
                            let! count = getPendingCount ()
                            setPendingCount count
                        } |> Promise.start
                    ),
                    2000
                )
            // Cleanup
            { new System.IDisposable with
                member _.Dispose() = Browser.Dom.window.clearInterval(intervalId) }
        else
            setPendingCount 0
            { new System.IDisposable with
                member _.Dispose() = () }
    ), [| box isOnlineState |])

    if isOnlineState then
        Html.none
    else
        Html.div [
            prop.className "fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50"
            prop.children [
                // Offline icon (cloud with slash)
                Html.span [
                    prop.className "text-xl"
                    prop.text "📴"
                ]
                Html.div [
                    prop.children [
                        Html.p [
                            prop.className "font-medium"
                            prop.text "오프라인"
                        ]
                        if pendingCount > 0 then
                            Html.p [
                                prop.className "text-sm opacity-90"
                                prop.text (sprintf "%d개 대기 중" pendingCount)
                            ]
                    ]
                ]
            ]
        ]
