import { getSupabaseUserClient } from "../../api/supabase/localSupabaseClient.js";
import { ErrorHandler } from "../../objects/errorHandler.js";

export async function getCommunityPosts (userID, communityID, supabaseClient) {
    // Retrieve the posts:
    const {data: posts, error: retrievalError} = await supabaseClient.rpc('get_community_posts', {
        p_user_id: userID,
        p_community_id: communityID
    });

    if (retrievalError) {
        throw new ErrorHandler("Post retrieval error. Refresh the page to try again.", 500);
    }

    // Supabase returns `null` instead of [] if function returns 0 rows.
    const safePosts = posts ?? [];

    // Return consistent structure
    return { posts: safePosts, success: true, messsage: 'Posts retrieved successfully!'};
}