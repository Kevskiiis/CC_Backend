import { getSupabaseUserClient } from "../supabase/localSupabaseClient.js";

export async function getCommunityPosts (bearerToken, communityID) {
    // Get the user client:
    const supabaseUser = await getSupabaseUserClient(bearerToken); 

    // Get the user:
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();

    if (userError || !user) {
        console.error("Auth error or no user:", userError);
        return { posts: [], success: false, message: 'User not found or invalid token.' };
    }

    // Retrieve the posts:
    const {data: posts, error: retrievalError} = await supabaseUser.rpc('get_community_posts', {
        p_user_id: user.id,
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