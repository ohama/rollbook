module Components.TeamMemberCard

open Feliz
open Supabase.Types

/// Renders a team member card showing display name, email (if different), and workout count
[<ReactComponent>]
let TeamMemberCard (member': TeamMemberSummary) =
    Html.div [
        prop.className "bg-white rounded-lg shadow-sm p-4 flex items-center justify-between"
        prop.children [
            // Left: Member info with avatar
            Html.div [
                prop.className "flex items-center gap-3"
                prop.children [
                    // Avatar placeholder (first letter of display name)
                    Html.div [
                        prop.className "w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold"
                        prop.text (
                            member'.DisplayName
                            |> Seq.tryHead
                            |> Option.map string
                            |> Option.defaultValue "?"
                        )
                    ]
                    // Name and optional email
                    Html.div [
                        prop.children [
                            Html.p [
                                prop.className "font-medium text-gray-800"
                                prop.text member'.DisplayName
                            ]
                            // Show email only if different from display name and not empty
                            if member'.DisplayName <> member'.Email && member'.Email <> "" then
                                Html.p [
                                    prop.className "text-sm text-gray-500"
                                    prop.text member'.Email
                                ]
                        ]
                    ]
                ]
            ]

            // Right: Workout count with Korean suffix
            Html.div [
                prop.className "text-right"
                prop.children [
                    Html.span [
                        prop.className (
                            "text-2xl font-bold " +
                            if member'.WorkoutCount > 0 then "text-indigo-600"
                            else "text-gray-400"
                        )
                        prop.text (sprintf "%d" member'.WorkoutCount)
                    ]
                    Html.span [
                        prop.className "text-sm text-gray-500 ml-1"
                        prop.text "회"
                    ]
                ]
            ]
        ]
    ]
