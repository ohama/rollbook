module Components.DailyDetailView

open Feliz
open Supabase.Types
open Components.RecordItem
open Components.PhotoModal
open Utils.DateHelpers

/// Daily detail view showing all records for a specific date
[<ReactComponent>]
let DailyDetailView (selectedDate: string) (records: WorkoutRecord array) (currentUserId: string) (onBack: unit -> unit) (onEdit: int -> unit) (onDelete: int -> unit) =
    // Photo modal state
    let (expandedPhotoUrl, setExpandedPhotoUrl) = React.useState<string option>(None)

    // Format date for display (e.g., "2026년 2월 16일")
    let displayDate =
        // Parse YYYY-MM-DD
        let parts = selectedDate.Split('-')
        if parts.Length = 3 then
            sprintf "%s년 %s월 %s일" parts.[0] (parts.[1].TrimStart('0')) (parts.[2].TrimStart('0'))
        else
            selectedDate

    Html.div [
        prop.className "space-y-4"
        prop.children [
            // Header with back button
            Html.div [
                prop.className "flex items-center gap-3 mb-4"
                prop.children [
                    // Back button (44x44px touch target)
                    Html.button [
                        prop.onClick (fun _ -> onBack())
                        prop.className "w-11 h-11 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition-colors"
                        prop.text "←"
                    ]
                    // Date heading
                    Html.h2 [
                        prop.className "text-lg font-semibold text-gray-800"
                        prop.text displayDate
                    ]
                ]
            ]

            // Records list
            if records.Length = 0 then
                Html.div [
                    prop.className "text-center text-gray-400 py-8"
                    prop.text "이 날의 기록이 없습니다"
                ]
            else
                Html.div [
                    prop.className "space-y-2"
                    prop.children [
                        for record in records do
                            RecordItem record currentUserId onEdit onDelete (fun url -> setExpandedPhotoUrl (Some url))
                    ]
                ]

            // Photo modal (renders when photo clicked)
            match expandedPhotoUrl with
            | Some url -> PhotoModal url (fun () -> setExpandedPhotoUrl None)
            | None -> Html.none
        ]
    ]
