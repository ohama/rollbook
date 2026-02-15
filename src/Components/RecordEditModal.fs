module Components.RecordEditModal

open Feliz
open Fable.Core.JsInterop
open Supabase.Types

[<ReactComponent>]
let RecordEditModal (editingRecordId: int option) (initialText: string) (saving: bool) (onSave: string -> unit) (onCancel: unit -> unit) =
    let (textContent, setTextContent) = React.useState(initialText)

    // Modal title based on create vs edit
    let title =
        if editingRecordId.IsSome then "메모 수정"
        else "메모 추가"

    // Save button text based on saving state
    let saveButtonText =
        if saving then "저장 중..."
        else "저장"

    // Disable save if content is empty or saving
    let isSaveDisabled = saving || System.String.IsNullOrWhiteSpace(textContent)

    Html.div [
        prop.className "fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        // Click overlay to cancel (only if not saving)
        prop.onClick (fun _ ->
            if not saving then onCancel()
        )
        prop.children [
            Html.div [
                prop.className "bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl"
                // Stop propagation so clicking modal doesn't trigger overlay click
                prop.onClick (fun e -> e.stopPropagation())
                prop.children [
                    // Title
                    Html.h2 [
                        prop.className "text-lg font-semibold mb-4"
                        prop.text title
                    ]

                    // Textarea
                    Html.textarea [
                        prop.value textContent
                        prop.onChange setTextContent
                        prop.placeholder "운동 메모를 입력하세요"
                        prop.autoFocus true
                        prop.className "w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 min-h-[120px] focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                        prop.disabled saving
                    ]

                    // Button row
                    Html.div [
                        prop.className "flex gap-2 justify-end"
                        prop.children [
                            // Cancel button
                            Html.button [
                                prop.onClick (fun _ -> onCancel())
                                prop.className "px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                prop.disabled saving
                                prop.text "취소"
                            ]

                            // Save button
                            Html.button [
                                prop.onClick (fun _ -> onSave textContent)
                                prop.className "px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                prop.disabled isSaveDisabled
                                prop.text saveButtonText
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ]
