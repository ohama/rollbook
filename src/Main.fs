module Main

open Browser.Dom
open Feliz

let app = React.functionComponent(fun () ->
    Html.div [
        prop.className "min-h-screen bg-gray-100 flex items-center justify-center"
        prop.children [
            Html.div [
                prop.className "bg-white p-8 rounded-lg shadow-lg"
                prop.children [
                    Html.h1 [
                        prop.className "text-3xl font-bold text-blue-600 mb-4"
                        prop.text "Rollbook"
                    ]
                    Html.p [
                        prop.className "text-gray-700"
                        prop.text "원탭 운동 기록 — Welcome to your fitness tracker!"
                    ]
                ]
            ]
        ]
    ]
)

let root = document.getElementById("app")
match root with
| null -> console.error("Could not find app root element")
| element ->
    let reactRoot = ReactDOM.createRoot(element)
    reactRoot.render(app())
