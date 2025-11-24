import { supabase } from "../api/supabase/globalSupabaseClient.js";
import { ErrorHandler } from "../objects/errorHandler.js";

export async function restoreSession (refreshToken) {
    const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken
    });

    if (error || !data?.session) {
        throw new ErrorHandler("There was an error refreshing your session. Try again.", 500);
    }

    return {
        success: true,
        message: 'Session refreshed successfully.',
        data: {
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
            expiresAt: data.session.expires_at
        }
    };
}