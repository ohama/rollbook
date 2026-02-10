import { PromiseBuilder__Delay_62FBFDE1, PromiseBuilder__Run_212F1D4B } from "../fable_modules/Fable.Promise.3.2.0/Promise.fs.js";
import { promise } from "../fable_modules/Fable.Promise.3.2.0/PromiseImpl.fs.js";
import { supabase } from "./Client.js";
import { defaultOf, equals } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { FSharpResult$2 } from "../fable_modules/fable-library-js.4.28.0/Result.js";

/**
 * Check if current user has admin role
 */
export function isAdmin() {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (PromiseBuilder__Delay_62FBFDE1(promise, () => (((((supabase.from("user_roles")).select("role")).eq("role", "admin")).single()).then((_arg) => (equals(_arg.error, defaultOf()) ? (Promise.resolve(true)) : (Promise.resolve(false)))))).catch((_arg_1) => (Promise.resolve(false))))));
}

/**
 * Get all profiles (admin only - RLS will enforce)
 */
export function getAllProfiles() {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (PromiseBuilder__Delay_62FBFDE1(promise, () => ((((supabase.from("profiles")).select("id, email, display_name, created_at")).order("created_at", {
        ascending: false,
    })).then((_arg) => {
        const response = _arg;
        const error = response.error;
        const data = response.data;
        if (equals(error, defaultOf())) {
            return Promise.resolve(new FSharpResult$2(0, [data]));
        }
        else {
            const errorMsg = error.message;
            return Promise.resolve(new FSharpResult$2(1, [errorMsg]));
        }
    }))).catch((_arg_1) => (Promise.resolve(new FSharpResult$2(1, [_arg_1.message])))))));
}

/**
 * Delete a profile (admin only - RLS will enforce)
 * This also deletes the auth.users entry via CASCADE
 */
export function deleteProfile(userId) {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (PromiseBuilder__Delay_62FBFDE1(promise, () => ((((supabase.from("profiles")).delete()).eq("id", userId)).then((_arg) => {
        const error = _arg.error;
        if (equals(error, defaultOf())) {
            return Promise.resolve(new FSharpResult$2(0, [undefined]));
        }
        else {
            const errorMsg = error.message;
            return Promise.resolve(new FSharpResult$2(1, [errorMsg]));
        }
    }))).catch((_arg_1) => (Promise.resolve(new FSharpResult$2(1, [_arg_1.message])))))));
}

/**
 * Get admin user count (for dashboard stats)
 */
export function getAdminCount() {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (PromiseBuilder__Delay_62FBFDE1(promise, () => ((((supabase.from("user_roles")).select("user_id", {
        count: "exact",
        head: true,
    })).eq("role", "admin")).then((_arg) => {
        const count = _arg.count;
        return Promise.resolve(count);
    }))).catch((_arg_1) => (Promise.resolve(0))))));
}

