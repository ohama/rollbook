module Components.RecordItem

open Feliz
open Fable.Core
open Fable.Core.JsInterop
open Supabase.Types

[<ReactComponent>]
let RecordItem (record: WorkoutRecord) (currentUserId: string) (onEdit: int -> unit) (onDelete: int -> unit) (onPhotoClick: string -> unit) =
    // Format time from created_at
    let timeDisplay =
        match record.created_at with
        | Some timestamp ->
            emitJsExpr timestamp "new Date($0).toLocaleTimeString('ko-KR', {hour: '2-digit', minute: '2-digit'})"
        | None -> ""

    // Get record type label
    let recordTypeLabel =
        match record.record_type with
        | "workout" -> "운동"
        | "text" -> "메모"
        | "photo" -> "사진"
        | _ -> "기록"

    // Check if current user owns this record
    let isOwner = record.user_id = currentUserId

    Html.div [
        prop.key (string record.id)
        prop.className "bg-white rounded-lg p-3 shadow-sm flex items-start gap-3"
        prop.children [
            // Left side: Type icon/label
            Html.div [
                prop.className "flex-shrink-0 w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center"
                prop.children [
                    Html.span [
                        prop.className "text-xs font-semibold text-indigo-700"
                        prop.text recordTypeLabel
                    ]
                ]
            ]

            // Center: Content area
            Html.div [
                prop.className "flex-1 min-w-0"
                prop.children [
                    // Time display
                    Html.div [
                        prop.className "text-xs text-gray-500 mb-1"
                        prop.text timeDisplay
                    ]

                    // Text content (if present)
                    match record.text_content with
                    | Some text when not (System.String.IsNullOrWhiteSpace(text)) ->
                        Html.div [
                            prop.className "text-sm text-gray-800 whitespace-pre-wrap break-words"
                            prop.text text
                        ]
                    | _ -> Html.none

                    // Photo thumbnail (if present)
                    match record.photo_url with
                    | Some url ->
                        Html.img [
                            prop.src url
                            prop.alt "운동 사진"
                            prop.className "w-16 h-16 object-cover rounded mt-1 cursor-pointer hover:opacity-80 transition-opacity"
                            prop.onClick (fun _ -> onPhotoClick url)
                        ]
                    | None -> Html.none
                ]
            ]

            // Right side: Edit/Delete buttons (owner only)
            if isOwner then
                Html.div [
                    prop.className "flex-shrink-0 flex items-start gap-2"
                    prop.children [
                        // Edit button
                        Html.button [
                            prop.onClick (fun _ -> onEdit record.id)
                            prop.className "text-sm text-blue-600 hover:text-blue-800 transition-colors"
                            prop.text "수정"
                        ]

                        // Delete button
                        Html.button [
                            prop.onClick (fun _ -> onDelete record.id)
                            prop.className "text-sm text-red-600 hover:text-red-800 transition-colors"
                            prop.text "삭제"
                        ]
                    ]
                ]
            else
                Html.none
        ]
    ]
