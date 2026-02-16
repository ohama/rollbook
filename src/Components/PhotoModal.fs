module Components.PhotoModal

open Feliz
open Fable.Core
open Fable.Core.JsInterop
open Browser.Types
open Browser.Dom

[<ReactComponent>]
let PhotoModal (photoUrl: string) (onClose: unit -> unit) =
    // Lock body scroll on mount, restore on unmount
    React.useEffect((fun () ->
        let body = document.body
        let originalOverflow: string = body?style?overflow
        body?style?overflow <- "hidden"

        React.createDisposable(fun () ->
            body?style?overflow <- originalOverflow
        )
    ), [||])

    // Escape key to close
    React.useEffect((fun () ->
        let handleEscape (e: Event) =
            let ke = e :?> KeyboardEvent
            if ke.key = "Escape" then
                onClose()

        document.addEventListener("keydown", handleEscape)

        React.createDisposable(fun () ->
            document.removeEventListener("keydown", handleEscape)
        )
    ), [||])

    Html.div [
        // Fullscreen overlay (click to close)
        prop.className "fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4"
        prop.onClick (fun _ -> onClose())
        prop.children [
            // Close button (top-right)
            Html.button [
                prop.className "absolute top-4 right-4 text-white text-3xl font-bold hover:text-gray-300 transition-colors"
                prop.onClick (fun e ->
                    e.stopPropagation()
                    onClose()
                )
                prop.title "닫기 (ESC)"
                prop.text "×"
            ]

            // Expanded photo (click does NOT close)
            Html.img [
                prop.src photoUrl
                prop.alt "확대된 운동 사진"
                prop.className "max-w-full max-h-full object-contain"
                prop.onClick (fun e -> e.stopPropagation())
            ]
        ]
    ]
