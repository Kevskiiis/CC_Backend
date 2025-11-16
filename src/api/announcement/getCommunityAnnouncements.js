import { getSupabaseUserClient } from "../supabase/localSupabaseClient.js";

export async function getCommunityAnnouncements(bearerToken, communityID) {
    // Get the user client
    const supabaseUser = await getSupabaseUserClient(bearerToken); 
    
    // Get the logged-in user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();

    if (userError || !user) {
        console.error("Auth error or no user:", userError);
        return { announcements: [], success: false, message: 'User not found or invalid token.' };
    }

    // Call the RPC function for announcements
    const { data: announcements, error: retrievalError } = await supabaseUser.rpc('get_community_announcements', {
        p_user_id: user.id,
        p_community_id: communityID
    });

    if (retrievalError) {
        console.error("Retrieval error:", retrievalError);
        return { announcements: [], success: false, message: 'Retrieval error.' };
    }

    // Supabase returns `null` instead of [] if function returns 0 rows
    const safeAnnouncements = announcements ?? [];

    return { announcements: safeAnnouncements, success: true, message: 'Successful!' };
}
