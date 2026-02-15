import { TeamMemberSummary, WorkoutWithProfile, ProfileRecord } from "./Types.js";
import { PromiseBuilder__Delay_62FBFDE1, PromiseBuilder__Run_212F1D4B } from "../fable_modules/Fable.Promise.3.2.0/Promise.fs.js";
import { supabase } from "./Client.js";
import { promise } from "../fable_modules/Fable.Promise.3.2.0/PromiseImpl.fs.js";
import { append, sortByDescending, tryHead, map } from "../fable_modules/fable-library-js.4.28.0/Array.js";
import { tryFind, ofArray } from "../fable_modules/fable-library-js.4.28.0/Map.js";
import { stringHash, comparePrimitives } from "../fable_modules/fable-library-js.4.28.0/Util.js";
import { map as map_1, defaultArg, defaultArgWith, bind, orElse } from "../fable_modules/fable-library-js.4.28.0/Option.js";
import { Array_groupBy } from "../fable_modules/fable-library-js.4.28.0/Seq2.js";
import { contains, ofArray as ofArray_1 } from "../fable_modules/fable-library-js.4.28.0/Set.js";

/**
 * Parse raw workout with profile into F# record
 */
export function parseWorkoutWithProfile(raw) {
    const profile = (raw.profiles == null) ? undefined : (new ProfileRecord(raw.profiles.id, raw.profiles.email, raw.profiles.display_name));
    return new WorkoutWithProfile(raw.user_id, raw.workout_date, profile);
}

/**
 * Get all team workouts for a date range with profile info
 * Uses Supabase nested select with foreign key join
 */
export function getTeamWorkouts(startDate, endDate) {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => {
        const query = ((((supabase.from("workouts")).select("user_id, workout_date, profiles!workouts_user_id_fkey(id, email, display_name)")).gte("workout_date", startDate)).lte("workout_date", endDate)).order("workout_date", {
            ascending: false,
        });
        return query.then((_arg) => {
            const result = _arg;
            const data = result.data;
            if (data == null) {
                return Promise.resolve([]);
            }
            else {
                const rawWorkouts = data;
                return Promise.resolve(map(parseWorkoutWithProfile, rawWorkouts));
            }
        });
    }));
}

/**
 * Get all team member profiles
 */
export function getTeamProfiles() {
    return PromiseBuilder__Run_212F1D4B(promise, PromiseBuilder__Delay_62FBFDE1(promise, () => {
        const query = ((supabase.from("profiles")).select("id, email, display_name")).order("email", {
            ascending: true,
        });
        return query.then((_arg) => {
            const result = _arg;
            const data = result.data;
            return (data == null) ? (Promise.resolve([])) : (Promise.resolve(data));
        });
    }));
}

/**
 * Group workouts by user and create team member summaries
 * Sorted by workout count descending (most active first)
 */
export function groupWorkoutsByUser(workouts, allProfiles) {
    const profileMap = ofArray(map((p) => [p.id, p], allProfiles), {
        Compare: comparePrimitives,
    });
    const grouped = map((tupledArg) => {
        const userId = tupledArg[0];
        const userWorkouts = tupledArg[1];
        const profile = orElse(bind((w_1) => w_1.profile, tryHead(userWorkouts)), tryFind(userId, profileMap));
        const displayName = defaultArgWith(bind((p_1) => p_1.display_name, profile), () => defaultArg(map_1((p_2) => p_2.email, profile), "Unknown"));
        const email = defaultArg(map_1((p_3) => p_3.email, profile), "");
        return new TeamMemberSummary(userId, displayName, email, userWorkouts.length, map((w_2) => w_2.workout_date, userWorkouts));
    }, Array_groupBy((w) => w.user_id, workouts, {
        Equals: (x_1, y_1) => (x_1 === y_1),
        GetHashCode: stringHash,
    }));
    const usersWithWorkouts = ofArray_1(map((m) => m.UserId, grouped), {
        Compare: comparePrimitives,
    });
    const usersWithoutWorkouts = map((p_5) => (new TeamMemberSummary(p_5.id, defaultArg(p_5.display_name, p_5.email), p_5.email, 0, [])), allProfiles.filter((p_4) => !contains(p_4.id, usersWithWorkouts)));
    return sortByDescending((m_1) => m_1.WorkoutCount, append(grouped, usersWithoutWorkouts), {
        Compare: comparePrimitives,
    });
}

