import { createClient } from "@supabase/supabase-js";

const clientOptions = {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: "rollbook-auth",
    },
};

export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY, clientOptions);

