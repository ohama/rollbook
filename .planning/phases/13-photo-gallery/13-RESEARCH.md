# Phase 13: Photo Gallery - Research

**Researched:** 2026-02-16
**Domain:** React image modal/lightbox, mobile-first thumbnail galleries, accessibility
**Confidence:** HIGH

## Summary

Phase 13 implements a photo gallery feature where photo thumbnails (already displayed at 64x64px in RecordItem.fs line 68) expand to full-size on click, providing a better viewing experience for uploaded workout photos. The research covers React modal patterns, mobile touch interactions, keyboard accessibility, and CSS techniques for image scaling without external libraries.

The RecordItem component already displays photo thumbnails (`w-16 h-16 object-cover` = 64x64px fixed size). The challenge is to add click-to-expand functionality with a fullscreen modal overlay, ensuring mobile-friendly touch interactions, keyboard navigation (Escape to close), and proper body scroll locking on iOS/Android.

**Primary recommendation:** Build a simple custom modal component using React useState for open/close state, CSS fixed positioning for fullscreen overlay, and onClick handlers for thumbnail expansion. Avoid heavy lightbox libraries (yet-another-react-lightbox, photoswipe) - this is a single-image modal, not a multi-image gallery with navigation. Focus on mobile UX (tap to close, body scroll lock) and accessibility (Escape key, focus management).

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Feliz | 2.9.0 | F# React bindings | Already used for all components, useState hook support |
| React | 19.2.4 | UI framework | Built-in hooks (useState) sufficient for modal state |
| Tailwind CSS | 4.1.18 | Styling | Already used, has modal utilities (fixed, inset-0, z-50) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None needed | - | - | Custom modal is 30 lines of code |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom modal | yet-another-react-lightbox | 45KB library for single-image use case, overkill |
| Custom modal | react-photoswipe-gallery | Complex API, designed for multi-image galleries with navigation |
| Custom modal | react-modal-image | 3KB library, but still adds dependency for trivial feature |
| CSS only | body-scroll-lock library | iOS scroll lock is complex, but simple CSS solution works for iOS 13+ |

**Installation:**
No new dependencies needed. Use existing React hooks + Tailwind CSS.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── Components/
│   ├── RecordItem.fs          # MODIFY: Add onClick to photo thumbnail, pass expandPhoto callback
│   ├── PhotoModal.fs          # NEW: Fullscreen modal for expanded photo view
│   ├── DailyDetailView.fs     # MODIFY: Wire PhotoModal state to RecordItem list
│   └── TeamDayDetailView.fs   # MODIFY: Same pattern for team records
```

### Pattern 1: Simple Modal State with useState
**What:** Single boolean state for modal open/close, single string state for photo URL
**When to use:** Simple modal without navigation (single photo display, not gallery carousel)
**Example:**
```fsharp
// Source: React useState hook + W3Schools modal pattern
[<ReactComponent>]
let DailyDetailView (selectedDate: string) (records: WorkoutRecord array) =
    let (expandedPhotoUrl, setExpandedPhotoUrl) = React.useState<string option>(None)

    // Pass callback to RecordItem to handle thumbnail clicks
    Html.div [
        prop.children [
            for record in records do
                RecordItem
                    record
                    currentUserId
                    onEdit
                    onDelete
                    (fun url -> setExpandedPhotoUrl (Some url))  // onPhotoClick

            // Conditional modal rendering
            match expandedPhotoUrl with
            | Some url -> PhotoModal url (fun () -> setExpandedPhotoUrl None)
            | None -> Html.none
        ]
    ]
```

### Pattern 2: Fullscreen Modal Overlay with Click-to-Close
**What:** Fixed positioning covers viewport, clicking overlay (not image) closes modal
**When to use:** Fullscreen image viewer, lightbox effect
**Example:**
```fsharp
// Source: W3Schools modal pattern + React stopPropagation pattern
[<ReactComponent>]
let PhotoModal (photoUrl: string) (onClose: unit -> unit) =
    Html.div [
        // Overlay: click to close
        prop.className "fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
        prop.onClick (fun _ -> onClose())
        prop.children [
            // Image: click does NOT close (stopPropagation)
            Html.img [
                prop.src photoUrl
                prop.alt "확대된 사진"
                prop.className "max-w-full max-h-full object-contain"
                prop.onClick (fun e -> e.stopPropagation())  // Prevent overlay click
            ]
        ]
    ]
```

### Pattern 3: Keyboard Accessibility (Escape to Close)
**What:** useEffect hook adds keydown listener for Escape key, removes on unmount
**When to use:** All modal components (accessibility requirement)
**Example:**
```fsharp
// Source: React accessibility best practices
[<ReactComponent>]
let PhotoModal (photoUrl: string) (onClose: unit -> unit) =
    // Add Escape key listener
    React.useEffect((fun () ->
        let handleEscape (e: Browser.Types.KeyboardEvent) =
            if e.key = "Escape" then
                onClose()

        Browser.Dom.document.addEventListener("keydown", handleEscape)

        // Cleanup on unmount
        React.createDisposable(fun () ->
            Browser.Dom.document.removeEventListener("keydown", handleEscape)
        )
    ), [||])  // Run once on mount

    // ... modal HTML
```

### Pattern 4: Body Scroll Lock for Mobile
**What:** Add `overflow: hidden` to body when modal opens, restore on close
**When to use:** Prevent background scrolling on iOS/Android during modal interaction
**Example:**
```fsharp
// Source: CSS-Tricks body scroll lock pattern
[<ReactComponent>]
let PhotoModal (photoUrl: string) (onClose: unit -> unit) =
    // Lock body scroll on mount, unlock on unmount
    React.useEffect((fun () ->
        let body = Browser.Dom.document.body
        let originalOverflow = body.style.overflow
        body.style.overflow <- "hidden"

        React.createDisposable(fun () ->
            body.style.overflow <- originalOverflow
        )
    ), [||])

    // ... modal HTML
```

### Pattern 5: Clickable Thumbnail with Cursor Pointer
**What:** Add cursor-pointer class to thumbnail image, onClick handler
**When to use:** Make thumbnail affordance clear (visual cue that image is clickable)
**Example:**
```fsharp
// Source: Existing RecordItem.fs line 68, add cursor + onClick
// Photo thumbnail (if present)
match record.photo_url with
| Some url ->
    Html.img [
        prop.src url
        prop.alt "운동 사진"
        prop.className "w-16 h-16 object-cover rounded mt-1 cursor-pointer hover:opacity-80 transition-opacity"
        prop.onClick (fun _ -> onPhotoClick url)  // NEW: click to expand
    ]
| None -> Html.none
```

### Anti-Patterns to Avoid
- **Using library for simple modal:** Don't add yet-another-react-lightbox for single-image modal (45KB overhead)
- **Forgetting e.stopPropagation on image:** Clicking expanded image should NOT close modal (only overlay/Escape)
- **Not locking body scroll:** Mobile browsers scroll background content without overflow:hidden on body
- **Missing Escape key handler:** Keyboard users need way to close modal (accessibility requirement)
- **Using position:absolute instead of fixed:** Modal won't cover viewport if parent has position:relative

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Multi-image gallery with navigation | Custom prev/next buttons + swipe detection | yet-another-react-lightbox | This phase is single-image modal, not gallery carousel |
| Image lazy loading | Custom intersection observer | Native `loading="lazy"` attribute | Already supported in all modern browsers (2021+) |
| Touch gesture detection | Custom touchstart/touchmove handlers | Simple onClick for this use case | Gallery swipe navigation not in scope (PHO requirements) |
| Focus trap library | focus-trap-react | Not needed for simple modal | No focusable elements inside photo modal |

**Key insight:** Phase 13 requirements (PHO-01, PHO-02, PHO-03) are about single-image expand/collapse, NOT multi-image gallery navigation. Keep it simple. Future phase can add swipe-through-photos if needed.

## Common Pitfalls

### Pitfall 1: Clicking Expanded Image Closes Modal
**What goes wrong:** User clicks photo to examine detail, modal unexpectedly closes
**Why it happens:** onClick handler on overlay div propagates to child image element
**How to avoid:** Add `e.stopPropagation()` to image onClick handler (prevent bubble to overlay)
**Warning signs:** User reports "modal closes when I tap the photo"

### Pitfall 2: Background Content Scrolls on Mobile (iOS)
**What goes wrong:** User scrolls photo modal, body content scrolls behind it (disorienting)
**Why it happens:** iOS Safari touch events propagate to body unless overflow:hidden set
**How to avoid:** useEffect on modal mount: set `document.body.style.overflow = "hidden"`, restore on unmount
**Warning signs:** Mobile testers report "can scroll page while viewing photo"

### Pitfall 3: Missing Escape Key Handler (Accessibility)
**What goes wrong:** Keyboard users have no way to close modal except clicking X button
**Why it happens:** Forgetting to add keydown event listener for Escape key
**How to avoid:** Add useEffect with keydown listener, check `if e.key === "Escape" then onClose()`
**Warning signs:** Accessibility audit flags "modal not keyboard accessible"

### Pitfall 4: Photo URL is Signed URL with Expiration
**What goes wrong:** Expanded photo shows 404 error after 1 hour (signed URL expired)
**Why it happens:** Supabase createSignedUrl in PhotoUpload.fs uses 3600 seconds (1 hour) expiration
**How to avoid:** For this phase, 1-hour expiration is acceptable (photos viewed within session). Future: refresh signed URLs on page load.
**Warning signs:** User reports "photo thumbnail works but expanded view shows broken image" after long session

### Pitfall 5: Modal Not Fullscreen on Mobile (Safe Area Insets)
**What goes wrong:** Modal doesn't cover status bar / home indicator area on iOS notch devices
**Why it happens:** Missing safe area inset padding
**How to avoid:** Use Tailwind `inset-0` (already covers viewport), add `bg-black` (not transparent) to hide safe area
**Warning signs:** White bars visible at top/bottom of modal on iPhone X/11/12

### Pitfall 6: Image Doesn't Scale to Fit Viewport
**What goes wrong:** Large photo overflows modal, user can't see full image without scrolling
**Why it happens:** Using `width: 100%` instead of `max-width: 100%` and `max-height: 100%`
**How to avoid:** Use `object-contain` + `max-w-full max-h-full` classes (fit within viewport, preserve aspect ratio)
**Warning signs:** Tall photos require vertical scrolling to see full image in modal

### Pitfall 7: Thumbnail Loading Performance on Date with Many Photos
**What goes wrong:** Generating thumbnails client-side (browser-image-compression for every photo in gallery view) causes mobile browsers to freeze or crash when viewing date with 5+ photos
**Why it happens:** Compressing multiple images in browser main thread blocks UI
**How to avoid:** Phase 10 already solved this - compression happens ONCE during upload (PhotoUpload.fs line 29), photo_url field stores final compressed URL. Thumbnails just render existing URLs (no client processing).
**Warning signs:** DailyDetailView sluggish on dates with multiple photo records

## Code Examples

Verified patterns from official sources and existing codebase:

### PhotoModal Component (Full Implementation)
```fsharp
// Source: W3Schools modal pattern + React hooks best practices
module Components.PhotoModal

open Feliz
open Browser.Types

[<ReactComponent>]
let PhotoModal (photoUrl: string) (onClose: unit -> unit) =
    // Lock body scroll on mount
    React.useEffect((fun () ->
        let body = Browser.Dom.document.body
        let originalOverflow = body.style.overflow
        body.style.overflow <- "hidden"

        React.createDisposable(fun () ->
            body.style.overflow <- originalOverflow
        )
    ), [||])

    // Escape key to close
    React.useEffect((fun () ->
        let handleEscape (e: KeyboardEvent) =
            if e.key = "Escape" then
                onClose()

        Browser.Dom.document.addEventListener("keydown", handleEscape)

        React.createDisposable(fun () ->
            Browser.Dom.document.removeEventListener("keydown", handleEscape)
        )
    ), [||])

    Html.div [
        // Fullscreen overlay (click to close)
        prop.className "fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4"
        prop.onClick (fun _ -> onClose())
        prop.children [
            // Close button (top-right)
            Html.button [
                prop.className "absolute top-4 right-4 text-white text-3xl font-bold hover:text-gray-300 transition-colors w-11 h-11 flex items-center justify-center"
                prop.onClick (fun e ->
                    e.stopPropagation()
                    onClose()
                )
                prop.title "닫기 (ESC)"
                prop.text "×"
            ]

            // Expanded photo (click does NOT close)
            Html.img [
                prop.src photoUrl
                prop.alt "확대된 운동 사진"
                prop.className "max-w-full max-h-full object-contain"
                prop.onClick (fun e -> e.stopPropagation())  // Prevent overlay click
            ]
        ]
    ]
```

### RecordItem with Clickable Thumbnail
```fsharp
// Source: Existing RecordItem.fs line 62-70, add onClick handler
[<ReactComponent>]
let RecordItem
    (record: WorkoutRecord)
    (currentUserId: string)
    (onEdit: int -> unit)
    (onDelete: int -> unit)
    (onPhotoClick: string -> unit) =  // NEW: callback for photo expand

    Html.div [
        // ... existing code ...

        // Photo thumbnail (if present)
        match record.photo_url with
        | Some url ->
            Html.img [
                prop.src url
                prop.alt "운동 사진"
                prop.className "w-16 h-16 object-cover rounded mt-1 cursor-pointer hover:opacity-80 transition-opacity"
                prop.onClick (fun _ -> onPhotoClick url)  // Click to expand
            ]
        | None -> Html.none
    ]
```

### DailyDetailView with Modal State
```fsharp
// Source: Existing DailyDetailView.fs, add modal state
module Components.DailyDetailView

open Feliz
open Supabase.Types
open Components.RecordItem
open Components.PhotoModal

[<ReactComponent>]
let DailyDetailView (selectedDate: string) (records: WorkoutRecord array) (currentUserId: string) (onBack: unit -> unit) (onEdit: int -> unit) (onDelete: int -> unit) =
    let (expandedPhotoUrl, setExpandedPhotoUrl) = React.useState<string option>(None)

    Html.div [
        prop.className "space-y-4"
        prop.children [
            // ... existing header code ...

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
                            RecordItem
                                record
                                currentUserId
                                onEdit
                                onDelete
                                (fun url -> setExpandedPhotoUrl (Some url))  // NEW
                    ]
                ]

            // Photo modal (conditional render)
            match expandedPhotoUrl with
            | Some url ->
                PhotoModal url (fun () -> setExpandedPhotoUrl None)
            | None ->
                Html.none
        ]
    ]
```

### CSS Approach (Alternative to useEffect for Body Scroll Lock)
```css
/* Source: Tailwind CSS utilities - no custom CSS needed */
/* Modal overlay class already handles fullscreen: */
.fixed.inset-0  /* position:fixed; top:0; right:0; bottom:0; left:0; */
.z-50           /* z-index: 50; (above all content) */
.bg-black.bg-opacity-95  /* rgba(0,0,0,0.95) dark overlay */

/* Image scaling: */
.max-w-full     /* max-width: 100%; */
.max-h-full     /* max-height: 100%; */
.object-contain /* object-fit: contain; (preserve aspect ratio, fit within bounds) */
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Heavy lightbox libraries (PhotoSwipe, Lightbox.js) | Custom React modal with hooks | 2020+ | 45KB → 0KB, simpler code, less dependency risk |
| CSS :target pseudo-class hack | useState for modal state | React era | Better UX, no URL hash pollution, works with SPA routing |
| jQuery lightbox plugins | Vanilla JS/React hooks | 2019+ | No jQuery dependency, better performance |
| Manual focus trap with tabindex | Not needed for image-only modal | 2021+ | No focusable elements = no focus trap needed |
| body-scroll-lock library | CSS overflow:hidden via useEffect | iOS 13+ (2019) | One less dependency, simpler solution works |
| Fixed aspect-ratio with padding-bottom hack | Native aspect-ratio CSS property | 2021 (all browsers) | Cleaner code, no JS needed for aspect ratio |

**Deprecated/outdated:**
- **PhotoSwipe 4.x:** Version 5 requires different API, but neither needed for simple modal
- **Lightbox2 (jQuery-based):** Unmaintained since 2018, requires jQuery
- **CSS padding-bottom hack for aspect ratio:** Use native `aspect-ratio` property (supported all browsers 2021+)
- **body-scroll-lock library:** iOS 13+ supports simple CSS solution, library has open issues with React 18+

## Open Questions

Things that couldn't be fully resolved:

1. **Should modal support pinch-to-zoom on mobile?**
   - What we know: Native browser image zoom works if we don't preventDefault on touch events
   - What's unclear: Do users expect pinch-to-zoom in modal, or is tap-to-close sufficient?
   - Recommendation: Start with simple tap-to-close (PHO-03 requirement). Add pinch-zoom in future phase if users request it.

2. **How to handle signed URL expiration in long sessions?**
   - What we know: createSignedUrl uses 3600 seconds (1 hour) expiration (Storage.fs line 49)
   - What's unclear: Should we refresh URLs on page load, or is 1-hour sufficient for session length?
   - Recommendation: Accept 1-hour limitation for Phase 13. Users rarely keep app open > 1 hour. Future: refresh URLs on DailyDetailView mount.

3. **Should we add loading state for expanded photo?**
   - What we know: Photo URL is already loaded (displayed as thumbnail), full-size should load fast
   - What's unclear: On slow 3G, full-size image might take 2-3 seconds to load
   - Recommendation: Add simple loading spinner overlay while image loads. Use `<img onLoad={...}>` to hide spinner.

4. **Should clicking expanded photo toggle zoom (100% → fit-to-screen)?**
   - What we know: Many lightbox libraries support click-to-zoom-in on large images
   - What's unclear: PHO-03 says "확대된 사진 다시 클릭 시 작은 사진으로 돌아간다" (return to thumbnail), not toggle zoom
   - Recommendation: Follow PHO-03 spec - click overlay OR image closes modal (simpler UX). Don't add zoom toggle in Phase 13.

## Sources

### Primary (HIGH confidence)
- [W3Schools: How To Create Modal Images](https://www.w3schools.com/howto/howto_css_modal_images.asp) - Basic modal HTML/CSS/JS pattern
- [React Accessibility: Modal Focus Management](https://tinloof.com/blog/how-to-create-an-accessible-react-modal) - Escape key handler, ARIA attributes
- [CSS-Tricks: Prevent Page Scrolling When Modal Open](https://css-tricks.com/prevent-page-scrolling-when-a-modal-is-open/) - Body scroll lock techniques
- Existing codebase: `/Users/ohama/vibe-coding/rollbook/src/Components/RecordItem.fs` - Current thumbnail rendering (line 63-70)
- Existing codebase: `/Users/ohama/vibe-coding/rollbook/src/Components/PhotoUpload.fs` - Photo upload and compression (already solved thumbnail generation)

### Secondary (MEDIUM confidence)
- [Yet Another React Lightbox](https://yet-another-react-lightbox.com/) - Modern lightbox library (not used, but good reference for patterns)
- [LogRocket: React Lightbox Libraries Comparison](https://blog.logrocket.com/comparing-the-top-3-react-lightbox-libraries/) - Library evaluation (decided against libraries)
- [CSS Aspect Ratio Production Guide 2026](https://thelinuxcode.com/css-aspect-ratio-property-a-practical-production-ready-guide-2026/) - Aspect ratio + object-fit patterns
- [web.dev: Browser-Level Lazy Loading](https://web.dev/articles/browser-level-image-lazy-loading) - Native loading="lazy" attribute
- [DigitalOcean: CSS object-fit](https://www.digitalocean.com/community/tutorials/css-cropping-images-object-fit) - Image scaling techniques

### Tertiary (LOW confidence)
- [Medium: React Modal Image Gallery with Tailwind](https://medium.com/@dimterion/reusable-image-gallery-and-modal-component-in-react-tailwind-css-855fdd9b9518) - General pattern (not F#/Fable specific)
- [LearnersBucket: Lightbox in React](https://learnersbucket.com/examples/interview/create-a-lightbox-modal-image-gallery-in-reactjs/) - Tutorial (not production code)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies, React hooks + Tailwind CSS sufficient
- Architecture: HIGH - Simple modal pattern, well-established in React ecosystem
- Pitfalls: HIGH - Based on known iOS scroll lock issues, accessibility best practices
- Code examples: HIGH - Adapted from W3Schools + existing RecordItem.fs patterns

**Research date:** 2026-02-16
**Valid until:** 2026-03-16 (30 days - stable patterns, no breaking changes expected)
