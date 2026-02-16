module Components.TeamDayDetailView

open Feliz
open Fable.Core.JsInterop
open Supabase.Types
open Supabase.Team

/// User record group with type counts and badges
type UserRecordGroup = {
    UserId: string
    DisplayName: string
    RecordCount: int
    RecordsByType: (string * int) array
    Records: WorkoutRecord array
}

/// Group records by user with type counts
let groupRecordsByUser (records: WorkoutRecord array) (profiles: ProfileRecord array) : UserRecordGroup array =
    // Create profile lookup map
    let profileMap =
        profiles
        |> Array.map (fun p -> p.id, p)
        |> Map.ofArray

    // Group records by user_id
    records
    |> Array.groupBy (fun r -> r.user_id)
    |> Array.map (fun (userId, userRecords) ->
        // Lookup profile with fallback chain: display_name → email → "Unknown User"
        let profile = Map.tryFind userId profileMap
        let displayName =
            profile
            |> Option.bind (fun p -> p.display_name)
            |> Option.orElse (profile |> Option.map (fun p -> p.email))
            |> Option.defaultValue "Unknown User"

        // Count records by type
        let recordsByType =
            userRecords
            |> Array.countBy (fun r -> r.record_type)
            |> Array.sortBy fst  // Sort by type name for consistent order

        {
            UserId = userId
            DisplayName = displayName
            RecordCount = userRecords.Length
            RecordsByType = recordsByType
            Records = userRecords
        }
    )
    |> Array.sortBy (fun g -> g.DisplayName)  // Sort alphabetically by display name

/// Get badge color classes based on record type
let getBadgeColor (recordType: string) : string * string =
    match recordType with
    | "workout" -> "bg-green-100 text-green-700", "운동"
    | "text" -> "bg-blue-100 text-blue-700", "메모"
    | "photo" -> "bg-purple-100 text-purple-700", "사진"
    | _ -> "bg-gray-100 text-gray-700", recordType

/// Format count multiplier for display
let formatCountMultiplier (count: int) : string =
    if count <= 1 then ""
    elif count >= 100 then " ×99+"
    else sprintf " ×%d" count

/// Team day detail view showing grouped user list with record type badges
[<ReactComponent>]
let TeamDayDetailView (selectedDate: string) (records: WorkoutRecord array) (onBack: unit -> unit) (onUserClick: string -> unit) =
    let userGroups, setUserGroups = React.useState<UserRecordGroup array>([||])
    let loading, setLoading = React.useState(true)

    // Fetch profiles and group records
    React.useEffect(
        (fun () ->
            promise {
                try
                    let! profiles = getTeamProfiles()
                    let groups = groupRecordsByUser records profiles
                    setUserGroups groups
                    setLoading false
                with ex ->
                    // Graceful degradation - proceed with empty profiles
                    Browser.Dom.console.error("Failed to fetch team profiles:", ex.Message)
                    let groups = groupRecordsByUser records [||]
                    setUserGroups groups
                    setLoading false
            }
            |> Promise.start
        ),
        [| box records |]
    )

    // Format date for display (e.g., "2026년 2월 16일 - 팀 기록")
    let displayDate =
        let parts = selectedDate.Split('-')
        if parts.Length = 3 then
            sprintf "%s년 %s월 %s일 - 팀 기록" parts.[0] (parts.[1].TrimStart('0')) (parts.[2].TrimStart('0'))
        else
            selectedDate + " - 팀 기록"

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

            // Loading state
            if loading then
                Html.div [
                    prop.className "text-center text-gray-400 py-8"
                    prop.text "로딩 중..."
                ]
            // Empty state
            elif userGroups.Length = 0 then
                Html.div [
                    prop.className "text-center text-gray-400 py-8"
                    prop.text "이 날의 기록이 없습니다"
                ]
            // User list
            else
                Html.div [
                    prop.className "space-y-2"
                    prop.children [
                        for group in userGroups do
                            Html.button [
                                prop.onClick (fun _ -> onUserClick group.UserId)
                                prop.className "w-full flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all"
                                prop.children [
                                    // Left: avatar + name
                                    Html.div [
                                        prop.className "flex items-center gap-3"
                                        prop.children [
                                            // Avatar circle with first letter
                                            Html.div [
                                                prop.className "w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-semibold text-indigo-700"
                                                prop.text (if group.DisplayName.Length > 0 then group.DisplayName.Substring(0, 1) else "?")
                                            ]
                                            // Display name
                                            Html.span [
                                                prop.className "font-medium text-gray-800"
                                                prop.text group.DisplayName
                                            ]
                                        ]
                                    ]

                                    // Right: record type badges
                                    Html.div [
                                        prop.className "flex gap-2 flex-wrap justify-end"
                                        prop.children [
                                            for (recordType, count) in group.RecordsByType do
                                                let colorClass, typeText = getBadgeColor recordType
                                                let multiplier = formatCountMultiplier count
                                                Html.span [
                                                    prop.className (sprintf "px-2 py-1 rounded-full text-xs font-medium %s" colorClass)
                                                    prop.text (typeText + multiplier)
                                                ]
                                        ]
                                    ]
                                ]
                            ]
                    ]
                ]
        ]
    ]
