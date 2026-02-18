module Components.Layout

open Feliz

/// Centered card layout for auth pages
[<ReactComponent>]
let AuthLayout (children: ReactElement list) =
    Html.div [
        prop.className "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4"
        prop.children [
            Html.div [
                prop.className "w-full max-w-md"
                prop.children [
                    // Logo/Brand
                    Html.div [
                        prop.className "text-center mb-8"
                        prop.children [
                            Html.h1 [
                                prop.className "text-3xl font-bold text-indigo-600"
                                prop.text "픽제주 헬스 클럽"
                            ]
                        ]
                    ]
                    // Card content
                    Html.div [
                        prop.className "bg-white rounded-2xl shadow-xl p-6 sm:p-8"
                        prop.children children
                    ]
                ]
            ]
        ]
    ]

/// Input field component with label and error state
[<ReactComponent>]
let FormInput
    (label: string)
    (inputType: string)
    (placeholder: string)
    (value: string)
    (onChange: string -> unit)
    (error: string option) =
    Html.div [
        prop.className "mb-4"
        prop.children [
            Html.div [
                prop.className "flex items-center gap-3"
                prop.children [
                    Html.label [
                        prop.className "text-base font-medium text-gray-700 whitespace-nowrap w-28 text-right"
                        prop.text label
                    ]
                    Html.input [
                        prop.type' inputType
                        prop.placeholder placeholder
                        prop.value value
                        prop.onChange onChange
                        prop.className (
                            "flex-1 px-4 py-3 rounded-lg border text-base focus:ring-2 focus:outline-none transition-colors " +
                            match error with
                            | Some _ -> "border-red-500 focus:ring-red-200"
                            | None -> "border-gray-300 focus:ring-indigo-200 focus:border-indigo-500"
                        )
                    ]
                ]
            ]
            match error with
            | Some msg ->
                Html.p [
                    prop.className "mt-1 text-sm text-red-600 pl-27"
                    prop.text msg
                ]
            | None -> Html.none
        ]
    ]

/// Primary button component
[<ReactComponent>]
let PrimaryButton (text: string) (loading: bool) (onClick: unit -> unit) =
    Html.button [
        prop.type' "submit"
        prop.disabled loading
        prop.onClick (fun e ->
            e.preventDefault()
            onClick()
        )
        prop.className (
            "w-full py-3 px-4 rounded-lg font-medium text-white transition-all " +
            if loading then
                "bg-indigo-400 cursor-not-allowed"
            else
                "bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]"
        )
        prop.children [
            if loading then
                Html.span [
                    prop.className "inline-flex items-center"
                    prop.children [
                        Html.span [
                            prop.className "animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"
                        ]
                        Html.text "처리 중..."
                    ]
                ]
            else
                Html.text text
        ]
    ]

/// Link styled as button
[<ReactComponent>]
let LinkButton (text: string) (onClick: unit -> unit) =
    Html.button [
        prop.type' "button"
        prop.onClick (fun _ -> onClick())
        prop.className "text-indigo-600 hover:text-indigo-800 text-sm font-medium"
        prop.text text
    ]

/// Alert/message component
[<ReactComponent>]
let Alert (message: string) (alertType: string) =
    let (bgColor, textColor, borderColor) =
        match alertType with
        | "success" -> ("bg-green-50", "text-green-800", "border-green-200")
        | "error" -> ("bg-red-50", "text-red-800", "border-red-200")
        | "info" -> ("bg-blue-50", "text-blue-800", "border-blue-200")
        | _ -> ("bg-gray-50", "text-gray-800", "border-gray-200")

    Html.div [
        prop.className $"p-4 rounded-lg border {bgColor} {textColor} {borderColor} mb-4"
        prop.text message
    ]
