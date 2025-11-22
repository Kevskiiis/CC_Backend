import { getSupabaseUserClient } from "../supabase/localSupabaseClient.js";

export async function adminCommunityCount (communityID, bearerToken) {
    try {
        // Create the client:
        const supabaseUser = await getSupabaseUserClient(bearerToken); 

        // Extract the user:
        const {data: {user}, error: userError} = await supabaseUser.auth.getUser();

        // console.log(user); 

        if (userError) {
            return {
                success: false,
                count: null
            }
        }

        // Try to get the community count by calling the Supabase SQL function: 
        const {data: funcData, error: funcError} = await supabaseUser.rpc('get_admin_count_excluding_member', {community_id: communityID, member_id: user.id});

        console.log(funcData); 
        console.log(funcError); 
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
            count: funcData
        }
    }
    catch (error) { 
        return {
            success: false,
            count: null
        }
    }   
}
