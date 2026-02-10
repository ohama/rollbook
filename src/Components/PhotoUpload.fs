module Components.PhotoUpload

open Feliz
open Fable.Core
open Fable.Core.JsInterop
open Browser.Types
open Supabase.Types
open Supabase.Storage
open Supabase.Workouts

/// Bucket name for workout photos
let private bucketName = "workout-photos"

/// Build storage path: {user_id}/{date}.jpg
let private buildPath (userId: string) (date: string) : string =
    sprintf "%s/%s.jpg" userId date

[<ReactComponent>]
let PhotoUploadButton (userId: string) (onUploadComplete: unit -> unit) =
    let (uploadState, setUploadState) = React.useState<PhotoUploadState>(Idle)

    let handleFileSelected (file: File) =
        async {
            try
                // Start compression
                setUploadState Compressing

                // Compress image
                let! compressed = compressImage file |> Async.AwaitPromise

                // Start upload
                setUploadState (Uploading 0.0)

                // Build path with today's date
                let today = getTodayDateString()
                let path = buildPath userId today

                // Upload with progress tracking
                let! uploadResult =
                    upload bucketName path compressed (fun progress ->
                        setUploadState (Uploading progress)
                    )
                    |> Async.AwaitPromise

                match uploadResult with
                | Result.Ok uploadedPath ->
                    // Create workout record for today (the key feature: WORK-04)
                    let! _ = upsertWorkout userId today |> Async.AwaitPromise

                    // Get signed URL for display
                    let! urlResult = createSignedUrl bucketName uploadedPath 3600 |> Async.AwaitPromise

                    // Handle URL result and set final state
                    let finalUrl =
                        match urlResult with
                        | Result.Ok url -> url
                        | Result.Error _ -> ""  // Upload succeeded but URL failed - still success

                    setUploadState (PhotoUploadState.Success finalUrl)
                    onUploadComplete()

                | Result.Error msg ->
                    setUploadState (PhotoUploadState.Error msg)

            with ex ->
                setUploadState (PhotoUploadState.Error "사진 업로드 실패. 다시 시도해주세요.")
        } |> Async.StartImmediate

    Html.div [
        prop.className "relative"
        prop.children [
            // Hidden file input
            Html.input [
                prop.id "photo-upload-input"
                prop.type' "file"
                prop.accept "image/*"
                // capture="environment" opens rear camera on mobile
                prop.custom ("capture", "environment")
                prop.className "absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                prop.onChange (fun (e: Event) ->
                    let input = e.target :?> HTMLInputElement
                    if not (isNull input.files) && input.files.length > 0 then
                        handleFileSelected (input.files.[0])
                )
                prop.disabled (
                    match uploadState with
                    | Compressing | Uploading _ -> true
                    | _ -> false
                )
            ]

            // Visual button - render all states
            match uploadState with
            | Idle ->
                Html.div [
                    prop.className "flex items-center gap-2 px-4 py-3 bg-indigo-100 text-indigo-700 rounded-lg cursor-pointer hover:bg-indigo-200 transition-colors"
                    prop.children [
                        Html.span [
                            prop.className "text-xl"
                            prop.text "📷"
                        ]
                        Html.span [
                            prop.className "font-medium"
                            prop.text "사진 올리기"
                        ]
                    ]
                ]

            | Compressing ->
                Html.div [
                    prop.className "flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-500 rounded-lg cursor-wait"
                    prop.children [
                        Html.span [
                            prop.className "animate-spin"
                            prop.text "⏳"
                        ]
                        Html.span [
                            prop.text "압축 중..."
                        ]
                    ]
                ]

            | Uploading progress ->
                Html.div [
                    prop.className "px-4 py-3 bg-gray-100 rounded-lg"
                    prop.children [
                        Html.div [
                            prop.className "flex items-center justify-between mb-2"
                            prop.children [
                                Html.span [
                                    prop.className "text-sm text-gray-600"
                                    prop.text "업로드 중..."
                                ]
                                Html.span [
                                    prop.className "text-sm font-medium text-indigo-600"
                                    prop.text (sprintf "%.0f%%" progress)
                                ]
                            ]
                        ]
                        // Progress bar
                        Html.div [
                            prop.className "w-full h-2 bg-gray-200 rounded-full overflow-hidden"
                            prop.children [
                                Html.div [
                                    prop.className "h-full bg-indigo-600 transition-all duration-200"
                                    prop.style [
                                        style.width (length.percent (int progress))
                                    ]
                                ]
                            ]
                        ]
                    ]
                ]

            | Success url ->
                Html.div [
                    prop.className "flex items-center gap-2 px-4 py-3 bg-green-100 text-green-700 rounded-lg"
                    prop.children [
                        Html.span [
                            prop.className "text-xl"
                            prop.text "✅"
                        ]
                        Html.span [
                            prop.className "font-medium"
                            prop.text "업로드 완료! 운동 기록됨"
                        ]
                    ]
                ]

            | Error msg ->
                Html.div [
                    prop.className "space-y-2"
                    prop.children [
                        Html.div [
                            prop.className "flex items-center gap-2 px-4 py-3 bg-red-100 text-red-700 rounded-lg"
                            prop.children [
                                Html.span [
                                    prop.className "text-xl"
                                    prop.text "❌"
                                ]
                                Html.span [
                                    prop.text msg
                                ]
                            ]
                        ]
                        Html.button [
                            prop.onClick (fun _ -> setUploadState Idle)
                            prop.className "text-sm text-indigo-600 hover:text-indigo-800 underline"
                            prop.text "다시 시도"
                        ]
                    ]
                ]
        ]
    ]
