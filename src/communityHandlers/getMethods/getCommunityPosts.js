import { getSupabaseUserClient } from "../../api/supabase/localSupabaseClient.js";

export async function getCommunityPosts (userID, communityID, supabaseClient) {
    // Retrieve the posts:
    const {data: posts, error: retrievalError} = await supabaseClient.rpc('get_community_posts', {
        p_user_id: userID,
        p_community_id: communityID
    });

    if (retrievalError) {
        // This includes RLS failures, bad params, SQL exceptions, etc.
        console.error("Retrieval error:", retrievalError);
        return { posts: [], success: false, message: 'Retrival error.'};
    }

    // Supabase returns `null` instead of [] if function returns 0 rows.
    const safePosts = posts ?? [];

    // Return consistent structure
    return { posts: safePosts, success: true, messsage: 'Successful!'};
}