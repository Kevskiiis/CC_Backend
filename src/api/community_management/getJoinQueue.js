import { getSupabaseUserClient } from '../supabase/localSupabaseClient.js'; 

export async function getJoinQueue (bearerToken, communityID) {
    // Get the user client:
    const supabaseUser = await getSupabaseUserClient(bearerToken); 

    // Get the user:
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();

    if (userError || !user) {
        console.error("Auth error or no user:", userError);
        return { posts: [], success: false, message: 'User not found or invalid token.' };
    }

    // Retrieve the join queue
    const { data: joinQueue, error: retrievalError } = await supabaseUser.rpc('get_community_join_queue', {
        p_requesting_user_id: user.id,
        p_target_community_id: communityID
    });

    if (retrievalError) {
        console.error("Retrieval error:", retrievalError);
        return { joinQueue: [], success: false, message: 'Failed to retrieve join queue.' };
    }

    // Supabase returns null if the function returns 0 rows, so ensure we always return an array
    const safeQueue = joinQueue ?? [];

    // Return consistent structure
    return { joinQueue: safeQueue, success: true, message: 'Join queue retrieved successfully.' };
}