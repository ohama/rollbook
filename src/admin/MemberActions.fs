module Admin.MemberActions

open Feliz
open Fable.Core.JsInterop

/// Confirmation modal for delete action
[<ReactComponent>]
let DeleteConfirmModal (memberName: string) (onConfirm: unit -> unit) (onCancel: unit -> unit) =
    Html.div [
        prop.className "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        prop.children [
            Html.div [
                prop.className "bg-white rounded-lg p-6 max-w-sm mx-4"
                prop.children [
                    Html.h3 [
                        prop.className "text-lg font-semibold mb-4"
                        prop.text "회원 삭제"
                    ]
                    Html.p [
                        prop.className "text-gray-600 mb-6"
                        prop.text (sprintf "'%s' 회원을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다." memberName)
                    ]
                    Html.div [
                        prop.className "flex justify-end gap-3"
                        prop.children [
                            Html.button [
                                prop.className "px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                prop.text "취소"
                                prop.onClick (fun _ -> onCancel ())
                            ]
                            Html.button [
                                prop.className "px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded"
                                prop.text "삭제"
                                prop.onClick (fun _ -> onConfirm ())
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ]
