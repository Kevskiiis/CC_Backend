import { getSupabaseUserClient } from "../supabase/localSupabaseClient";

export async function adminCommunityCount (communityID, bearerToken) {
    try {
        // Create the client:
        const supabaseUser = getSupabaseUserClient(bearerToken); 

        // Extract the user:
        const {data: {user}, error: userError} = await supabaseUser.auth.getUser();

        if (userError) {
            return {
                success: false,
                count: null
            }
        }

        // Try to get the community count by calling the Supabase SQL function: 
        const {data: funcData, error: funcError} = await supabaseUser.rpc('get_admin_count_excluding_member', {community_id: communityID, member_id: user.id});

        // Handle SQL function call error:
        if (funcError) {
            return {
                success: false,
                count: null
            }
        }

        // Return count: 
        return {
            success: true,
            count: data
        }
    }
    catch (error) { 
        return {
            success: false,
            count: null
        }
    }   
}
