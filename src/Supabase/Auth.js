import { PromiseBuilder__Delay_62FBFDE1, PromiseBuilder__Run_212F1D4B } from "../fable_modules/Fable.Promise.3.2.0/Promise.fs.js";
import { promise } from "../fable_modules/Fable.Promise.3.2.0/PromiseImpl.fs.js";
import { supabase } from "./Client.js";

/**
 * Sign up with email and password
 */
export function signUp(email, password, redirectTo) {
    let options;
    if (redirectTo == null) {
        options = {};
    }
    else {
        const url = redirectTo;
        options = {
            emailRedirectTo: url,
        };
    }
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => ((supabase.auth.signUp({
        email: email,
        password: password,
        options: options,
    })).then((_arg) => {
        const result = _arg;
        return Promise.resolve(result);
    }))));
}

/**
 * Sign in with email and password
 */
export function signInWithPassword(email, password) {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => ((supabase.auth.signInWithPassword({
        email: email,
        password: password,
    })).then((_arg) => {
        const result = _arg;
        return Promise.resolve(result);
    }))));
}

/**
 * Sign out the current user
 */
export function signOut() {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => ((supabase.auth.signOut()).then((_arg) => {
        const result = _arg;
        return Promise.resolve(result);
    }))));
}

/**
 * Request password reset email
 */
export function resetPasswordForEmail(email, redirectTo) {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => ((supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo,
    })).then((_arg) => {
        const result = _arg;
        return Promise.resolve(result);
    }))));
}

/**
 * Update user password (after clicking reset link)
 */
export function updatePassword(newPassword) {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => ((supabase.auth.updateUser({
        password: newPassword,
    })).then((_arg) => {
        const result = _arg;
        return Promise.resolve(result);
    }))));
}

/**
 * Get current session (may be null if not logged in)
 */
export function getSession() {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => ((supabase.auth.getSession()).then((_arg) => {
        const result = _arg;
        return Promise.resolve(result);
    }))));
}

/**
 * Subscribe to auth state changes
 * Returns an unsubscribe function
 */
export function onAuthStateChange(callback) {
    const subscription = supabase.auth.onAuthStateChange((event, session) => {
        const typedEvent = event;
        const typedSession = (session == null) ? undefined : session;
        callback(typedEvent, typedSession);
    });
    return () => {
        subscription.data.subscription.unsubscribe();
    };
}

