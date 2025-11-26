import { ErrorHandler } from "../../objects/errorHandler.js";

export async function getCommunityAnnouncements(userID, communityID, supabaseClient) {
    // Call the RPC function for announcements:
    const { data: announcements, error: retrievalError } = await supabaseClient.rpc('get_community_announcements', {
        p_user_id: userID,
        p_community_id: communityID
    });

    if (retrievalError) {
        throw new ErrorHandler("Announcement retrieval error. Refresh the page to try again.", 500);
    }

    // Supabase returns `null` instead of [] if function returns 0 rows:
    const safeAnnouncements = announcements ?? [];

    return { announcements: safeAnnouncements, success: true, message: 'Successful!' };
}
