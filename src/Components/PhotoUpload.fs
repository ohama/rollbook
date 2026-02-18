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
    let (uploadState, setUploadState) = React.useState<PhotoUploadState>(PhotoUploadState.Idle)

    let handleFileSelected (file: File) =
        async {
            try
                // Start compression
                setUploadState PhotoUploadState.Compressing

                // Compress image
                let! compressed = compressImage file |> Async.AwaitPromise

                // Start upload
                setUploadState (PhotoUploadState.Uploading 0.0)

                // Build path with today's date
                let today = getTodayDateString()
                let path = buildPath userId today

                // Upload with progress tracking
                let! uploadResult =
                    upload bucketName path compressed (fun progress ->
                        setUploadState (PhotoUploadState.Uploading progress)
                    )
                    |> Async.AwaitPromise

                match uploadResult with
                | Result.Ok uploadedPath ->
                    // Get signed URL for display and record
                    let! urlResult = createSignedUrl bucketName uploadedPath 3600 |> Async.AwaitPromise

                    let finalUrl =
                        match urlResult with
                        | Result.Ok url -> url
                        | Result.Error _ -> ""

                    // Create photo record with the uploaded URL (v2.0: photo type instead of workout)
                    let today = getTodayDateString()
                    let! _ = createPhotoRecord userId today finalUrl None |> Async.AwaitPromise

                    setUploadState (PhotoUploadState.Success finalUrl)
                    onUploadComplete()

                | Result.Error msg ->
                    setUploadState (PhotoUploadState.Error msg)

            with ex ->
                setUploadState (PhotoUploadState.Error "사진 업로드 실패. 다시 시도해주세요.")
        } |> Async.StartImmediate

    let isUploading =
        match uploadState with
        | PhotoUploadState.Compressing | PhotoUploadState.Uploading _ -> true
        | _ -> false

    let onFileChange (e: Event) =
        let input = e.target :?> HTMLInputElement
        if not (isNull input.files) && input.files.length > 0 then
            handleFileSelected (input.files.[0])
            // Reset input value so same file can be re-selected
            input.value <- ""

    Html.div [
        prop.children [
            // Hidden file input for camera (with capture)
            Html.input [
                prop.id "photo-camera-input"
                prop.type' "file"
                prop.accept "image/*"
                prop.custom ("capture", "environment")
                prop.className "hidden"
                prop.onChange onFileChange
                prop.disabled isUploading
            ]
            // Hidden file input for gallery (no capture)
            Html.input [
                prop.id "photo-gallery-input"
                prop.type' "file"
                prop.accept "image/*"
                prop.className "hidden"
                prop.onChange onFileChange
                prop.disabled isUploading
            ]

            // Visual buttons - render all states
            match uploadState with
            | PhotoUploadState.Idle ->
                Html.div [
                    prop.className "flex gap-2"
                    prop.children [
                        Html.button [
                            prop.className "flex items-center gap-2 px-4 py-3 bg-indigo-100 text-indigo-700 rounded-lg cursor-pointer hover:bg-indigo-200 transition-colors"
                            prop.onClick (fun _ ->
                                let el = Browser.Dom.document.getElementById("photo-camera-input")
                                if not (isNull el) then el.click()
                            )
                            prop.children [
                                Html.span [
                                    prop.className "text-xl"
                                    prop.text "📷"
                                ]
                                Html.span [
                                    prop.className "font-medium"
                                    prop.text "사진 촬영"
                                ]
                            ]
                        ]
                        Html.button [
                            prop.className "flex items-center gap-2 px-4 py-3 bg-purple-100 text-purple-700 rounded-lg cursor-pointer hover:bg-purple-200 transition-colors"
                            prop.onClick (fun _ ->
                                let el = Browser.Dom.document.getElementById("photo-gallery-input")
                                if not (isNull el) then el.click()
                            )
                            prop.children [
                                Html.span [
                                    prop.className "text-xl"
                                    prop.text "🖼️"
                                ]
                                Html.span [
                                    prop.className "font-medium"
                                    prop.text "앨범에서 선택"
                                ]
                            ]
                        ]
                    ]
                ]

            | PhotoUploadState.Compressing ->
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

            | PhotoUploadState.Uploading progress ->
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

            | PhotoUploadState.Success url ->
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

            | PhotoUploadState.Error msg ->
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
                            prop.onClick (fun _ -> setUploadState PhotoUploadState.Idle)
                            prop.className "text-sm text-indigo-600 hover:text-indigo-800 underline"
                            prop.text "다시 시도"
                        ]
                    ]
                ]
        ]
    ]
