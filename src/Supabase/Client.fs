module Supabase.Client

open Fable.Core
open Fable.Core.JsInterop

/// Supabase client type (opaque - we only call methods on it)
[<AllowNullLiteral>]
type SupabaseClient =
    abstract auth: obj

/// Import createClient from @supabase/supabase-js
[<ImportMember("@supabase/supabase-js")>]
let private createClient (url: string, key: string, options: obj): SupabaseClient = jsNative

/// Get environment variables (Vite injects these at build time)
[<Emit("import.meta.env.VITE_SUPABASE_URL")>]
let private supabaseUrl: string = jsNative

[<Emit("import.meta.env.VITE_SUPABASE_ANON_KEY")>]
let private supabaseAnonKey: string = jsNative

/// Client options for Supabase initialization
let private clientOptions =
    createObj [
        "auth" ==> createObj [
            "persistSession" ==> true
            "autoRefreshToken" ==> true
            "storageKey" ==> "rollbook-auth"
        ]
    ]

/// Singleton Supabase client instance
let supabase = createClient(supabaseUrl, supabaseAnonKey, clientOptions)
