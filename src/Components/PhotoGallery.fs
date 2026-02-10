module Components.PhotoGallery

open Feliz
open Fable.Core.JsInterop
open Supabase.Storage

/// Bucket name for workout photos
let private bucketName = "workout-photos"

/// Photo item with signed URL and date
type PhotoItem = {
    Filename: string     // e.g., "2026-02-10.jpg"
    SignedUrl: string
    Date: string         // e.g., "2026-02-10"
}

/// Extract date from filename (remove .jpg extension)
let private extractDate (filename: string) : string =
    if filename.EndsWith(".jpg") then
        filename.Substring(0, filename.Length - 4)
    elif filename.EndsWith(".jpeg") then
        filename.Substring(0, filename.Length - 5)
    elif filename.EndsWith(".png") then
        filename.Substring(0, filename.Length - 4)
    elif filename.EndsWith(".webp") then
        filename.Substring(0, filename.Length - 5)
    else
        filename

/// Format date for display (YYYY-MM-DD -> YYYY년 M월 D일)
let private formatDateKorean (dateStr: string) : string =
    let parts = dateStr.Split('-')
    if parts.Length = 3 then
        sprintf "%s년 %d월 %d일"
            parts.[0]
            (int parts.[1])
            (int parts.[2])
    else
        dateStr

[<ReactComponent>]
let PhotoGallery (userId: string) =
    let (photos, setPhotos) = React.useState<PhotoItem array>([||])
    let (loading, setLoading) = React.useState(true)
    let (error, setError) = React.useState<string option>(None)

    // Load photos on mount
    React.useEffect((fun () ->
        promise {
            try
                setLoading true
                setError None

                // List files in user's folder
                let! filesResult = listFiles bucketName userId

                match filesResult with
                | Ok filenames ->
                    // Get signed URLs for each file
                    let! photoItems =
                        filenames
                        |> Array.filter (fun name ->
                            // Filter to image files only
                            name.EndsWith(".jpg") ||
                            name.EndsWith(".jpeg") ||
                            name.EndsWith(".png") ||
                            name.EndsWith(".webp")
                        )
                        |> Array.map (fun filename ->
                            promise {
                                let path = sprintf "%s/%s" userId filename
                                let! urlResult = createSignedUrl bucketName path 3600
                                match urlResult with
                                | Ok url ->
                                    return Some {
                                        Filename = filename
                                        SignedUrl = url
                                        Date = extractDate filename
                                    }
                                | Error _ ->
                                    return None
                            }
                        )
                        |> Promise.all

                    let validPhotos =
                        photoItems
                        |> Array.choose id
                        |> Array.sortByDescending (fun p -> p.Date)  // Most recent first

                    setPhotos validPhotos
                    setLoading false

                | Error msg ->
                    setError (Some "사진을 불러올 수 없습니다")
                    setLoading false

            with ex ->
                setError (Some "사진 로딩 실패")
                setLoading false
        } |> Promise.start
    ), [| box userId |])

    Html.div [
        prop.className "space-y-4"
        prop.children [
            // Header
            Html.h3 [
                prop.className "text-lg font-semibold text-gray-800"
                prop.text "내 운동 사진"
            ]

            // Loading state
            if loading then
                Html.div [
                    prop.className "text-center py-8 text-gray-500"
                    prop.text "사진 로딩 중..."
                ]
            else
                // Error state
                match error with
                | Some msg ->
                    Html.div [
                        prop.className "text-center py-8 text-red-600"
                        prop.text msg
                    ]
                | None ->
                    // Empty state
                    if photos.Length = 0 then
                        Html.div [
                            prop.className "text-center py-8 text-gray-500"
                            prop.children [
                                Html.p [
                                    prop.className "text-4xl mb-2"
                                    prop.text "📷"
                                ]
                                Html.p [
                                    prop.text "아직 업로드한 사진이 없습니다"
                                ]
                            ]
                        ]
                    else
                        // Photo grid
                        Html.div [
                            prop.className "grid grid-cols-2 md:grid-cols-3 gap-4"
                            prop.children (
                                photos
                                |> Array.map (fun photo ->
                                    Html.div [
                                        prop.key photo.Filename
                                        prop.className "relative aspect-square rounded-lg overflow-hidden shadow-sm"
                                        prop.children [
                                            // Photo
                                            Html.img [
                                                prop.src photo.SignedUrl
                                                prop.alt (sprintf "%s 운동 사진" photo.Date)
                                                prop.className "w-full h-full object-cover"
                                            ]
                                            // Date overlay
                                            Html.div [
                                                prop.className "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2"
                                                prop.children [
                                                    Html.span [
                                                        prop.className "text-white text-sm font-medium"
                                                        prop.text (formatDateKorean photo.Date)
                                                    ]
                                                ]
                                            ]
                                        ]
                                    ]
                                )
                                |> Array.toList
                            )
                        ]
        ]
    ]
