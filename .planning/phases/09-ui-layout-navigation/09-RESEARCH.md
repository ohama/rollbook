# Phase 9: UI Layout & Navigation - Research

**Researched:** 2026-02-16
**Domain:** Fable/Feliz React UI state management, Tailwind CSS navigation patterns, mobile-first date navigation
**Confidence:** HIGH

## Summary

Phase 9 refactors the existing Dashboard UI to introduce a three-row layout: (1) date navigation with prev/next month buttons, (2) "나/우리" (me/team) tab switcher, and (3) content area that switches between personal records and team records based on tab selection. The core challenge is managing multiple pieces of UI state (current date, active tab, view mode) in Feliz while maintaining the existing month navigation pattern already proven in ProgressView.fs and TeamView.fs.

This is not greenfield UI development. The codebase already has working month navigation (ProgressView.fs lines 30-42), tab switching (Dashboard.fs lines 186-234), and Tailwind CSS styling patterns. The research confirms that the existing patterns are standard React/Feliz approaches and should be reused, not replaced.

The primary recommendation is to extract the existing month navigation state management into a reusable pattern, introduce a new "나/우리" discriminated union type for tab state, and compose these together in a refactored Dashboard layout. No new libraries needed.

**Primary recommendation:** Reuse existing Feliz React.useState patterns from ProgressView.fs for date state, add new ViewScope type ("Me" | "Team"), and compose with Tailwind CSS classes following the established Dashboard.fs tab styling pattern.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Feliz | 2.9.0 | F# React DSL | Current project dependency, provides React.useState, prop.onClick, Html.* DSL for type-safe React components |
| Tailwind CSS | 4.1.18 | Utility-first CSS | Current project dependency, all existing components use Tailwind classes, mobile-first responsive design |
| React | 19.2.4 | UI framework | Current project dependency, Feliz compiles to React components, hooks-based state management |
| Fable | Latest (2026) | F#→JS compiler | Current project dependency, compiles .fs files to JavaScript, enables F# React development |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| System.DateTime | .NET 10.0 | Date manipulation | Already used in ProgressView.fs, TeamView.fs for year/month state initialization |
| Utils.DateHelpers | Project module | Date formatting | Custom module with formatMonthYear, getDaysInMonth, formatDateString functions |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| React.useState (multiple) | React.useReducer | More boilerplate for simple UI state, overkill for 3-4 state variables |
| Discriminated union types | String literals | Less type safety, harder to refactor, prone to typos |
| Tailwind CSS | CSS-in-JS (Feliz.style) | Project already standardized on Tailwind, inconsistent styling approach |
| Custom date navigation | react-day-picker library | Additional dependency, harder to customize Korean labels, existing pattern works well |

**Installation:**

No new dependencies needed. All required tools already in package.json and App.fsproj:

```bash
# Verify current dependencies
npm list react react-dom tailwindcss
# Already installed: react@19.2.4, react-dom@19.2.4, tailwindcss@4.1.18

# Verify Feliz version in .fsproj
grep Feliz src/App.fsproj
# Already referenced: Feliz 2.9.0
```

## Architecture Patterns

### Recommended Project Structure

Current structure (no changes needed):

```
src/
├── Pages/
│   ├── Dashboard.fs        # Main refactor target (tab bar + layout)
│   ├── ProgressView.fs     # Month navigation pattern to reuse
│   └── TeamView.fs         # Month navigation pattern to reuse
├── Components/
│   ├── Calendar.fs         # Calendar grid (reuse as-is)
│   ├── WorkoutList.fs      # List view (reuse as-is)
│   └── MonthlyStats.fs     # Stats card (reuse as-is)
└── Utils/
    └── DateHelpers.fs      # Date formatting utilities
```

No new files needed. Refactor Dashboard.fs in place.

### Pattern 1: Multiple useState for Independent UI State

**What:** Use separate React.useState calls for each independent piece of UI state (date, tab, view mode).

**When to use:** When state variables don't change together. Date navigation is independent from tab selection.

**Example:**

```fsharp
// src/Pages/Dashboard.fs - Recommended pattern
[<ReactComponent>]
let DashboardPage (user: User) (onLogout: unit -> unit) =
    // Date navigation state (independent)
    let (currentYear, setCurrentYear) = React.useState(System.DateTime.Now.Year)
    let (currentMonth, setCurrentMonth) = React.useState(System.DateTime.Now.Month)

    // Tab state (independent)
    let (viewScope, setViewScope) = React.useState(Me)  // Me | Team

    // Other state
    let (loading, setLoading) = React.useState(false)
    let (refreshKey, setRefreshKey) = React.useState(0)

    // Month navigation functions (reuse from ProgressView.fs)
    let goToNextMonth () =
        if currentMonth = 12 then
            setCurrentYear (currentYear + 1)
            setCurrentMonth 1
        else
            setCurrentMonth (currentMonth + 1)

    let goToPrevMonth () =
        if currentMonth = 1 then
            setCurrentYear (currentYear - 1)
            setCurrentMonth 12
        else
            setCurrentMonth (currentMonth - 1)

    // Render UI...
```

**Why this pattern:**

- Follows existing ProgressView.fs pattern (lines 21-22)
- Each useState manages independent concern
- Easy to reason about state updates
- No need for useReducer complexity
- Feliz standard practice (verified in docs)

**Source:** Current codebase ProgressView.fs, TeamView.fs; [Choosing the State Structure – React](https://react.dev/learn/choosing-the-state-structure)

### Pattern 2: Discriminated Union for Tab State

**What:** Define F# discriminated union type for tab selection instead of string literals.

**When to use:** Always, for type-safe tab state management.

**Example:**

```fsharp
// src/Pages/Dashboard.fs - Add new type
/// View scope for dashboard content (나/우리)
type ViewScope = Me | Team

/// Main tab mode for dashboard navigation
type TabMode = Home | Progress | Admin

[<ReactComponent>]
let DashboardPage (user: User) (onLogout: unit -> unit) =
    let (activeTab, setActiveTab) = React.useState(Home)
    let (viewScope, setViewScope) = React.useState(Me)  // NEW

    // Tab navigation (existing pattern, keep as-is)
    Html.button [
        prop.onClick (fun _ -> setActiveTab Home)
        prop.className (
            "px-6 py-3 rounded-lg font-medium transition-colors " +
            if activeTab = Home then
                "bg-indigo-600 text-white"
            else
                "bg-gray-200 text-gray-700 hover:bg-gray-300"
        )
        prop.text "홈"
    ]

    // View scope tabs (NEW pattern)
    Html.button [
        prop.onClick (fun _ -> setViewScope Me)
        prop.className (
            "px-6 py-3 rounded-lg font-medium transition-colors " +
            if viewScope = Me then
                "bg-indigo-600 text-white"
            else
                "bg-gray-200 text-gray-700 hover:bg-gray-300"
        )
        prop.text "나"
    ]
```

**Why this pattern:**

- Type safety prevents invalid states
- Compiler-enforced exhaustive matching
- F# idiomatic (already used for TabMode)
- Easy to extend (add third tab type later)
- No string literal typos

**Source:** Current codebase Dashboard.fs line 19; [F# Discriminated Unions - Microsoft Docs](https://learn.microsoft.com/en-us/dotnet/fsharp/language-reference/discriminated-unions)

### Pattern 3: Three-Row Layout with Tailwind CSS

**What:** Stack date navigation, tab switcher, and content area vertically using Tailwind flex/grid utilities.

**When to use:** For mobile-first hierarchical UI layout.

**Example:**

```fsharp
// src/Pages/Dashboard.fs - Layout structure
Html.main [
    prop.className "max-w-4xl mx-auto px-4 py-8"
    prop.children [
        // Row 1: Date navigation (single line, centered)
        Html.div [
            prop.className "flex items-center justify-between bg-white rounded-lg shadow-sm p-4 mb-4"
            prop.children [
                Html.button [
                    prop.onClick (fun _ -> goToPrevMonth())
                    prop.className "px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium"
                    prop.text "< 이전 달"
                ]
                Html.h2 [
                    prop.className "text-lg font-semibold text-gray-800"
                    prop.text (formatMonthYear currentYear currentMonth)
                ]
                Html.button [
                    prop.onClick (fun _ -> goToNextMonth())
                    prop.className "px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium"
                    prop.text "다음 달 >"
                ]
            ]
        ]

        // Row 2: 나/우리 tab switcher
        Html.div [
            prop.className "flex gap-2 mb-6"
            prop.children [
                Html.button [
                    prop.onClick (fun _ -> setViewScope Me)
                    prop.className (
                        "flex-1 px-6 py-3 rounded-lg font-medium transition-colors " +
                        if viewScope = Me then
                            "bg-indigo-600 text-white"
                        else
                            "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    )
                    prop.text "나"
                ]
                Html.button [
                    prop.onClick (fun _ -> setViewScope Team)
                    prop.className (
                        "flex-1 px-6 py-3 rounded-lg font-medium transition-colors " +
                        if viewScope = Team then
                            "bg-indigo-600 text-white"
                        else
                            "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    )
                    prop.text "우리"
                ]
            ]
        ]

        // Row 3: Content area (switches based on viewScope)
        Html.div [
            prop.className "bg-white rounded-2xl shadow-sm p-6"
            prop.children [
                match viewScope with
                | Me ->
                    // Show user's personal records
                    ProgressViewPage user.id
                | Team ->
                    // Show team records
                    TeamViewPage()
            ]
        ]
    ]
]
```

**Why this pattern:**

- Matches requirements UI-01, UI-02, UI-03, UI-04
- Mobile-first responsive (Tailwind defaults)
- Reuses existing Tailwind classes from codebase
- Vertical stacking natural for mobile screens
- Clear visual hierarchy

**Source:** Current codebase Dashboard.fs, TeamView.fs; [Tailwind CSS Tabs - Flowbite](https://flowbite.com/docs/components/tabs/)

### Pattern 4: Conditional Content Rendering with Pattern Matching

**What:** Use F# pattern matching to switch content based on tab state.

**When to use:** Always, for type-safe conditional rendering in Feliz.

**Example:**

```fsharp
// Content area switches based on both activeTab AND viewScope
match activeTab with
| Home ->
    Html.div [
        prop.children [
            // Home tab content (workout toggle, photo upload)
            WorkoutToggle user.id refreshKey
            PhotoUploadButton user.id (fun () -> setRefreshKey (refreshKey + 1))
            PhotoGallery user.id
        ]
    ]
| Progress ->
    // Switch based on viewScope
    match viewScope with
    | Me ->
        ProgressViewPage user.id  // User's personal progress
    | Team ->
        TeamViewPage()             // Team progress
| Admin ->
    AdminPage()
```

**Why this pattern:**

- Type-safe (compiler ensures all cases handled)
- Explicit control flow (no hidden logic)
- F# idiomatic
- Easy to debug (clear what renders when)
- Existing pattern in Dashboard.fs (line 238)

**Source:** Current codebase Dashboard.fs lines 238-304

### Anti-Patterns to Avoid

**Anti-Pattern 1: Nested useState calls**

Don't do:
```fsharp
let (state, setState) = React.useState({| year = 2026; month = 2; tab = "Me" |})
```

Why bad: Breaks React hooks rules, F# anonymous records harder to update immutably, couples independent state.

Better: Separate useState for each concern (Pattern 1).

**Anti-Pattern 2: String literals for tab state**

Don't do:
```fsharp
let (viewScope, setViewScope) = React.useState("Me")  // String literal
if viewScope = "me" then  // Typo causes bug!
```

Why bad: No type safety, typos at runtime, harder to refactor.

Better: Discriminated union (Pattern 2).

**Anti-Pattern 3: Inline date navigation logic**

Don't do:
```fsharp
prop.onClick (fun _ ->
    if currentMonth = 12 then
        setCurrentYear (currentYear + 1)
        setCurrentMonth 1
    else
        setCurrentMonth (currentMonth + 1)
)
```

Why bad: Duplicated in prev/next buttons, harder to test, verbose.

Better: Extract goToNextMonth/goToPrevMonth functions (Pattern 1).

**Anti-Pattern 4: Using CSS Grid for date navigation row**

Don't do:
```fsharp
prop.className "grid grid-cols-3 gap-4"  // For prev/title/next layout
```

Why bad: Flexbox better for centering, existing codebase uses flex, grid overkill for 3 items.

Better: Use flex with justify-between (Pattern 3).

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Month navigation state | Custom date class | React.useState + goToNextMonth/goToPrevMonth functions | Already proven in ProgressView.fs, TeamView.fs (lines 30-42), handles year rollover correctly |
| Date formatting | String concatenation | Utils.DateHelpers.formatMonthYear | Handles Korean formatting ("2026년 2월"), already in codebase, tested |
| Tab active styling | Conditional ternary chains | Pattern matching with discriminated unions | Type-safe, compiler-verified, F# idiomatic (existing TabMode pattern) |
| Mobile-responsive layout | Custom media queries | Tailwind responsive classes | Project standard, mobile-first defaults, existing patterns |
| Date validation | Custom bounds checking | System.DateTime methods | Handles leap years, month boundaries, built-in .NET |

**Key insight:** The existing codebase already has proven patterns for every aspect of this phase. Reuse ProgressView.fs month navigation, Dashboard.fs tab styling, and Utils.DateHelpers formatting. Don't reinvent working patterns.

## Common Pitfalls

### Pitfall 1: Month Navigation Year Rollover Bug

**What goes wrong:** Clicking "next month" in December sets month to 13 instead of rolling over to January of next year. Calendar breaks.

**Why it happens:**
- Forgot to check if currentMonth = 12
- Only increment month, don't reset to 1
- Don't increment year

**How to avoid:**
1. **Copy proven pattern from ProgressView.fs** (lines 30-42)
2. **Test boundary conditions**: Dec → Jan, Jan → Dec
3. **Use pattern matching for clarity**:
   ```fsharp
   let goToNextMonth () =
       match currentMonth with
       | 12 ->
           setCurrentYear (currentYear + 1)
           setCurrentMonth 1
       | m -> setCurrentMonth (m + 1)
   ```

**Warning signs:**
- Calendar shows "2026년 13월"
- Console error: "Invalid month value"
- Next month button stops working in December

**Source:** Current codebase ProgressView.fs lines 30-35, TeamView.fs lines 23-28

### Pitfall 2: Tab State Not Syncing with Content

**What goes wrong:** User clicks "우리" tab, tab highlights, but content still shows "나" (personal) records. Confusing UX.

**Why it happens:**
- Tab button updates viewScope state
- Content area doesn't read viewScope state
- Forgot to pass viewScope to conditional rendering

**How to avoid:**
1. **Single source of truth**: viewScope state controls BOTH tab highlighting AND content
2. **Pattern matching for content**:
   ```fsharp
   match viewScope with
   | Me -> ProgressViewPage user.id
   | Team -> TeamViewPage()
   ```
3. **Test**: Click tab, verify content changes

**Warning signs:**
- Tab highlights but content doesn't change
- Content changes but tab doesn't highlight
- Multiple useState for same concept (activeTab vs selectedView)

**Source:** [React useState Hook Guide](https://dmitripavlutin.com/react-usestate-hook-guide/), [Choosing the State Structure – React](https://react.dev/learn/choosing-the-state-structure)

### Pitfall 3: Passing Date State Down Incorrectly

**What goes wrong:** ProgressViewPage manages its own year/month state. Date navigation buttons at top change Dashboard state, but ProgressViewPage shows different month.

**Why it happens:**
- ProgressViewPage has internal useState for date (lines 21-22)
- Dashboard also has useState for date
- Two sources of truth conflict

**How to avoid:**
1. **Lift state up**: Dashboard owns currentYear, currentMonth
2. **Pass as props**: ProgressViewPage accepts year/month props
3. **Remove internal state** from ProgressViewPage:
   ```fsharp
   // OLD (don't do):
   [<ReactComponent>]
   let ProgressViewPage (userId: string) =
       let (currentYear, setCurrentYear) = React.useState(...)  // Conflict!

   // NEW (correct):
   [<ReactComponent>]
   let ProgressViewPage (userId: string) (year: int) (month: int) =
       // Use passed-in year/month, no internal state
   ```

**Warning signs:**
- Date navigation changes header but not content
- Content and header show different months
- Clicking next month twice moves header 2 months but content 0 months

**Source:** [React Docs: Sharing State Between Components](https://react.dev/learn/sharing-state-between-components)

### Pitfall 4: Mobile Layout Breaks on Small Screens

**What goes wrong:** Date navigation row overflows, text wraps, buttons overlap on iPhone SE (320px width).

**Why it happens:**
- Fixed px widths instead of flex
- Long Korean text "이전 달" / "다음 달" takes space
- Didn't test on small viewport

**How to avoid:**
1. **Use Tailwind responsive classes**:
   ```fsharp
   prop.className "text-sm sm:text-base"  // Smaller on mobile
   ```
2. **Shorten button text on mobile**:
   ```fsharp
   prop.text "< 이전"  // Not "< 이전 달"
   ```
3. **Test viewport**: Chrome DevTools → iPhone SE (375x667)
4. **Use Tailwind breakpoints**: sm:, md:, lg:

**Warning signs:**
- Horizontal scrollbar on mobile
- Buttons wrap to second line
- Text truncated with "..."
- Layout looks fine on desktop, broken on mobile

**Source:** [Designing Better Mobile Navigation UX](https://smart-interface-design-patterns.com/articles/better-mobile-navigation/), [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)

### Pitfall 5: Re-rendering Performance on Tab Switch

**What goes wrong:** Switching between "나" and "우리" tabs causes 500ms+ delay, feels sluggish.

**Why it happens:**
- Re-fetching data on every tab switch
- No React.useEffect dependency optimization
- Re-mounting entire component tree

**How to avoid:**
1. **Prefetch data**: Load both Me and Team data on mount
2. **Optimize useEffect deps**:
   ```fsharp
   React.useEffect((fun () ->
       // Fetch data
   ), [| box currentYear; box currentMonth |])  // Only re-fetch on date change
   ```
3. **Keep components mounted**: Don't unmount/remount on tab switch
4. **Use React.memo** for expensive components (if needed)

**Warning signs:**
- Network request on every tab click
- Visible lag when switching tabs
- Loading spinner flashes on tab switch
- React DevTools shows full re-render

**Source:** [React useEffect Dependency Array Best Practices](https://dmitripavlutin.com/react-useeffect-infinite-loop/)

## Code Examples

Verified patterns from official sources and current codebase:

### Month Navigation (Reuse from ProgressView.fs)

```fsharp
// src/Pages/Dashboard.fs - Date navigation state and functions
[<ReactComponent>]
let DashboardPage (user: User) (onLogout: unit -> unit) =
    // Date navigation state (reuse ProgressView.fs pattern)
    let (currentYear, setCurrentYear) = React.useState(System.DateTime.Now.Year)
    let (currentMonth, setCurrentMonth) = React.useState(System.DateTime.Now.Month)

    // Month navigation functions with year rollover
    let goToNextMonth () =
        if currentMonth = 12 then
            setCurrentYear (currentYear + 1)
            setCurrentMonth 1
        else
            setCurrentMonth (currentMonth + 1)

    let goToPrevMonth () =
        if currentMonth = 1 then
            setCurrentYear (currentYear - 1)
            setCurrentMonth 12
        else
            setCurrentMonth (currentMonth - 1)

    // Rest of component...
```

**Source:** Current codebase ProgressView.fs lines 21-42, TeamView.fs lines 14-35

### ViewScope Discriminated Union

```fsharp
// src/Pages/Dashboard.fs - New type for 나/우리 tabs
module Pages.Dashboard

open Feliz
open Fable.Core.JsInterop
// ... existing opens ...

/// View scope for dashboard content (나 vs 우리)
type ViewScope = Me | Team

/// Tab mode for dashboard navigation (existing)
type TabMode = Home | Progress | Team | Admin

[<ReactComponent>]
let DashboardPage (user: User) (onLogout: unit -> unit) =
    let (activeTab, setActiveTab) = React.useState(Home)
    let (viewScope, setViewScope) = React.useState(Me)  // NEW

    // Rest of component...
```

**Source:** Pattern from existing Dashboard.fs TabMode (line 19), F# discriminated unions standard practice

### Date Navigation Row UI

```fsharp
// Row 1: Date navigation (horizontal, single line)
Html.div [
    prop.className "flex items-center justify-between bg-white rounded-lg shadow-sm p-4 mb-4"
    prop.children [
        Html.button [
            prop.onClick (fun _ -> goToPrevMonth())
            prop.className "px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition-colors"
            prop.text "< 이전"
        ]
        Html.h2 [
            prop.className "text-lg font-semibold text-gray-800"
            prop.text (formatMonthYear currentYear currentMonth)  // Utils.DateHelpers
        ]
        Html.button [
            prop.onClick (fun _ -> goToNextMonth())
            prop.className "px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition-colors"
            prop.text "다음 >"
        ]
    ]
]
```

**Source:** Adapted from TeamView.fs lines 67-84, Tailwind flex pattern

### 나/우리 Tab Switcher

```fsharp
// Row 2: View scope tabs (나/우리)
Html.div [
    prop.className "flex gap-2 mb-6"
    prop.children [
        Html.button [
            prop.onClick (fun _ -> setViewScope Me)
            prop.className (
                "flex-1 px-6 py-3 rounded-lg font-medium transition-colors " +
                if viewScope = Me then
                    "bg-indigo-600 text-white"
                else
                    "bg-gray-200 text-gray-700 hover:bg-gray-300"
            )
            prop.text "나"
        ]
        Html.button [
            prop.onClick (fun _ -> setViewScope Team)
            prop.className (
                "flex-1 px-6 py-3 rounded-lg font-medium transition-colors " +
                if viewScope = Team then
                    "bg-indigo-600 text-white"
                else
                    "bg-gray-200 text-gray-700 hover:bg-gray-300"
            )
            prop.text "우리"
        ]
    ]
]
```

**Source:** Pattern from Dashboard.fs lines 190-234 (existing tab pattern), adapted for ViewScope

### Content Area Switching

```fsharp
// Row 3: Content area (switches based on activeTab and viewScope)
Html.div [
    prop.className "bg-white rounded-2xl shadow-sm p-6"
    prop.children [
        match activeTab with
        | Home ->
            // Home tab: workout toggle, photos (no viewScope dependency)
            Html.div [
                prop.children [
                    WorkoutToggle user.id refreshKey
                    PhotoUploadButton user.id (fun () -> setRefreshKey (refreshKey + 1))
                    PhotoGallery user.id
                ]
            ]
        | Progress ->
            // Progress tab: switches based on viewScope
            match viewScope with
            | Me ->
                ProgressViewPage user.id currentYear currentMonth
            | Team ->
                TeamViewPage currentYear currentMonth
        | Admin ->
            AdminPage()
    ]
]
```

**Source:** Pattern from Dashboard.fs lines 238-304, extended with viewScope switching

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tab-based layout only | Date navigation + tab switching | v2.0 (Feb 2026) | Enables monthly browsing of records |
| Separate pages for progress/team | Unified view with 나/우리 tabs | v2.0 | Faster context switching, less navigation |
| ProgressView manages own date state | Dashboard lifts date state up | v2.0 | Consistent date across tabs |
| "홈/내 기록/팀/관리자" tabs | "날짜 네비 → 나/우리 탭 → 콘텐츠" | v2.0 | Hierarchical navigation, mobile-friendly |
| String literals for tabs | Discriminated unions | v2.0 | Type safety, compiler verification |

**Deprecated/outdated:**
- Tab bar as sole navigation (v1.0): Replaced with three-row layout
- ProgressView as standalone page: Now embedded in Dashboard with lifted state
- TeamView as standalone page: Now embedded in Dashboard with lifted state

**Modern patterns (2026):**
- Mobile-first navigation with horizontal date slider
- Tab persistence with React.useState (no URL routing needed for this use case)
- Tailwind responsive utilities over custom media queries
- Feliz React hooks over class components

## Open Questions

Things that couldn't be fully resolved:

1. **Should date navigation be global across all tabs or reset per tab?**
   - What we know: Current date is user's mental model ("what happened this month?")
   - What's unclear: If switching from Progress to Team should keep same month or reset to current month
   - Recommendation: Keep date global (user expectation), reset only on Home tab (no date dependency)

2. **Should "나/우리" tabs appear on Home tab?**
   - What we know: Requirements say tabs appear in Row 2, content area in Row 3
   - What's unclear: If Home tab (workout toggle, photos) needs 나/우리 switching
   - Recommendation: Hide 나/우리 tabs on Home tab (no team context), show only on Progress tab

3. **Should URL reflect current month/tab state?**
   - What we know: Current app has no URL routing (all client-side state)
   - What's unclear: If adding URL params (?year=2026&month=2&view=team) improves UX
   - Recommendation: Defer URL routing to future phase (v2.1+), use React.useState for now (simpler, fewer dependencies)

4. **Should month navigation buttons disable at min/max bounds?**
   - What we know: No obvious min year (could browse 2020 records), no max year (could browse future months)
   - What's unclear: If allowing year 9999 causes bugs, if year 1900 breaks DateTime
   - Recommendation: No bounds checking (PostgreSQL DATE supports wide range), trust users not to navigate to year 9999

## Sources

### Primary (HIGH confidence)

- Current codebase src/Pages/Dashboard.fs - Existing tab pattern (lines 19, 186-234, 238-304)
- Current codebase src/Pages/ProgressView.fs - Month navigation pattern (lines 21-42)
- Current codebase src/Pages/TeamView.fs - Month navigation pattern (lines 14-35)
- Current codebase src/Utils/DateHelpers.fs - Date formatting utilities
- [Choosing the State Structure – React](https://react.dev/learn/choosing-the-state-structure) - Multiple useState best practices
- [useState – React](https://react.dev/reference/react/useState) - Official React hooks API
- [Fable Hub: Feliz](https://github.com/fable-hub/Feliz) - Feliz React bindings, component patterns

### Secondary (MEDIUM confidence)

- [React useState Hook Guide](https://strapi.io/blog/react-usestate-hook-guide-best-practices) - Best practices for multiple state values
- [Tailwind CSS Tabs - Flowbite](https://flowbite.com/docs/components/tabs/) - Tab navigation patterns
- [Designing Better Mobile Navigation UX](https://smart-interface-design-patterns.com/articles/better-mobile-navigation/) - Mobile-first navigation principles
- [Horizontal Timeline in CSS and JavaScript | CodyHouse](https://codyhouse.co/gem/horizontal-timeline) - Horizontal date navigation pattern

### Tertiary (LOW confidence)

- [Date Picker with Month and Year Selector - shadcn](https://www.shadcn.io/patterns/date-picker-standard-2) - Date navigation inspiration (not using library)
- [React DayPicker: Months Navigation](https://daypicker.dev/docs/navigation) - Navigation patterns (not using library)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All dependencies already in project, verified versions
- Architecture patterns: HIGH - Reusing proven patterns from existing codebase
- Pitfalls: HIGH - Based on common React/Feliz mistakes, verified with current code
- Code examples: HIGH - Extracted from working codebase components
- Layout patterns: MEDIUM - Tailwind patterns verified, but mobile-first hierarchy untested in this app

**Research date:** 2026-02-16
**Valid until:** 2026-03-16 (30 days - stable domain, React/Feliz patterns don't change rapidly)

**Critical dependencies:**
- Feliz 2.9.0 React hooks (React.useState)
- Tailwind CSS 4.1.18 utility classes
- Existing Dashboard.fs tab pattern (TabMode type)
- Existing ProgressView.fs month navigation (goToNextMonth/goToPrevMonth)
- Utils.DateHelpers (formatMonthYear, getDaysInMonth)

**Ready for planning:** Yes. All necessary patterns identified, existing code reviewed, no new libraries needed. Planner can create tasks to refactor Dashboard.fs with three-row layout.
