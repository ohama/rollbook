import { PromiseBuilder__Delay_62FBFDE1, PromiseBuilder__Run_212F1D4B } from "../fable_modules/Fable.Promise.3.2.0/Promise.fs.js";
import { promise } from "../fable_modules/Fable.Promise.3.2.0/PromiseImpl.fs.js";
import { supabase } from "./Client.js";

/**
 * Sign up with email and password
 */
export function signUp(email, password, redirectTo) {
    const options = (redirectTo == null) ? {} : {
        emailRedirectTo: redirectTo,
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

