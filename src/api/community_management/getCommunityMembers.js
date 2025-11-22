import { getSupabaseUserClient } from '../supabase/localSupabaseClient.js'; 

export async function getCommunityMembers (bearerToken, communityID) {
    // Get the user client:
    const supabaseUser = await getSupabaseUserClient(bearerToken); 

    // Get the user:
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();

    if (userError || !user) {
        console.error("Auth error or no user:", userError);
        return { members: [], success: false, message: 'User not found or invalid token.' };
    }

    // Retrieve the join queue
    const { data: members, error: retrievalError } = await supabaseUser.rpc('get_community_members', {
        p_member_id: user.id,
        p_community_id: communityID
    });

    if (retrievalError) {
        console.error("Retrieval error:", retrievalError);
        return { members: [], success: false, message: 'Failed to retrieve members in the community.' };
    }

    // Supabase returns null if the function returns 0 rows, so ensure we always return an array
    const safeMembers = members ?? [];
    console.log(safeMembers);

    // Return consistent structure
    return { members: safeMembers, success: true, message: 'Members retrieved successfully.' };
}