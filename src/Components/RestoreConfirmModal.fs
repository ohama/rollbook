module Components.RestoreConfirmModal

open Feliz
open Fable.Core.JsInterop
open Fable.Core
open Supabase.Audit

type RestoreTarget = {
    workoutId: int64
    workoutDate: string
}

[<ReactComponent>]
let RestoreConfirmModal (target: RestoreTarget) (onConfirm: unit -> unit) (onCancel: unit -> unit) =
    let isRestoring, setIsRestoring = React.useState(false)

    let handleConfirm () =
        setIsRestoring true
        promise {
            let! result = restoreWorkout target.workoutId
            match result with
            | Result.Ok () ->
                setIsRestoring false
                onConfirm ()  // Parent handles success (refresh, close modal)
            | Result.Error msg ->
                Browser.Dom.window.alert(sprintf "복구 실패: %s" msg)
                setIsRestoring false
        } |> Promise.start

    Html.div [
        prop.className "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        prop.children [
            Html.div [
                prop.className "bg-white rounded-lg p-6 max-w-sm mx-4"
                prop.children [
                    Html.h3 [
                        prop.className "text-lg font-semibold mb-4"
                        prop.text "기록 복구 확인"
                    ]
                    Html.p [
                        prop.className "text-gray-600 mb-6"
                        prop.text (sprintf "%s 기록을 복구하시겠습니까?" target.workoutDate)
                    ]
                    Html.div [
                        prop.className "flex gap-3 justify-end"
                        prop.children [
                            Html.button [
                                prop.className "px-4 py-2 border rounded hover:bg-gray-100"
                                prop.text "취소"
                                prop.disabled isRestoring
                                prop.onClick (fun _ -> onCancel ())
                            ]
                            Html.button [
                                prop.className "px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
                                prop.text (if isRestoring then "복구 중..." else "복구")
                                prop.disabled isRestoring
                                prop.onClick (fun _ -> handleConfirm ())
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ]
