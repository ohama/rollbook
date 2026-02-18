import { PromiseBuilder__Delay_62FBFDE1, PromiseBuilder__Run_212F1D4B } from "../fable_modules/Fable.Promise.3.2.0/Promise.fs.js";
import { promise } from "../fable_modules/Fable.Promise.3.2.0/PromiseImpl.fs.js";
import { supabase } from "./Client.js";
import { defaultOf, equals } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { FSharpResult$2 } from "../fable_modules/fable-library-js.4.28.0/Result.js";
import { toString } from "../fable_modules/fable-library-js.4.28.0/Types.js";

/**
 * Sign up with member_id, email and password
 */
export function signUp(memberId, email, password, redirectTo) {
    const data = {
        member_id: memberId,
    };
    const options = (redirectTo == null) ? {
        data: data,
    } : {
        emailRedirectTo: redirectTo,
        data: data,
    };
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => ((supabase.auth.signUp({
        email: email,
        password: password,
        options: options,
    })).then((_arg) => (Promise.resolve(_arg))))));
}

/**
 * Sign in with email and password
 */
export function signInWithPassword(email, password) {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => ((supabase.auth.signInWithPassword({
        email: email,
        password: password,
    })).then((_arg) => (Promise.resolve(_arg))))));
}

/**
 * Sign out the current user
 */
export function signOut() {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => ((supabase.auth.signOut()).then((_arg) => (Promise.resolve(_arg))))));
}

/**
 * Request password reset email
 */
export function resetPasswordForEmail(email, redirectTo) {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => ((supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo,
    })).then((_arg) => (Promise.resolve(_arg))))));
}

/**
 * Update user password (after clicking reset link)
 */
export function updatePassword(newPassword) {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => ((supabase.auth.updateUser({
        password: newPassword,
    })).then((_arg) => (Promise.resolve(_arg))))));
}

/**
 * Get current session (may be null if not logged in)
 */
export function getSession() {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => ((supabase.auth.getSession()).then((_arg) => (Promise.resolve(_arg))))));
}

/**
 * Get email by member_id using RPC
 */
export function getEmailByMemberId(memberId) {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => ((supabase.rpc("get_email_by_member_id", {
        p_member_id: memberId,
    })).then((_arg) => {
        const result = _arg;
        const error = result.error;
        const data = result.data;
        return equals(error, defaultOf()) ? (equals(data, defaultOf()) ? (Promise.resolve(undefined)) : (Promise.resolve(data))) : (Promise.resolve(undefined));
    }))));
}

/**
 * Sign in with member_id and password
 */
export function signInWithMemberId(memberId, password) {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (getEmailByMemberId(memberId).then((_arg) => {
        const emailOpt = _arg;
        if (emailOpt == null) {
            const errorResponse = ({ data: { user: null, session: null }, error: { message: "존재하지 않는 아이디입니다", status: 400 } });
            return Promise.resolve(errorResponse);
        }
        else {
            const email = emailOpt;
            return signInWithPassword(email, password);
        }
    }))));
}

/**
 * Delete user account (profiles, workouts, user_roles, then auth user via RPC)
 */
export function deleteAccount(userId) {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => (PromiseBuilder__Delay_62FBFDE1(promise, () => ((((supabase.from("workouts")).delete()).eq("user_id", userId)).then((_arg) => ((((supabase.from("user_roles")).delete()).eq("user_id", userId)).then((_arg_1) => ((((supabase.from("profiles")).delete()).eq("id", userId)).then((_arg_2) => ((supabase.rpc("delete_own_account")).then((_arg_3) => {
        const error = _arg_3.error;
        return equals(error, defaultOf()) ? (Promise.resolve(new FSharpResult$2(0, [undefined]))) : (Promise.resolve(new FSharpResult$2(1, [toString(error.message)])));
    }))))))))).catch((_arg_4) => (Promise.resolve(new FSharpResult$2(1, [_arg_4.message])))))));
}

/**
 * Subscribe to auth state changes
 * Returns an unsubscribe function
 */
export function onAuthStateChange(callback) {
    const subscription = supabase.auth.onAuthStateChange((event, session) => {
        callback(event, (session == null) ? undefined : session);
    });
    return () => {
        subscription.data.subscription.unsubscribe();
    };
}

