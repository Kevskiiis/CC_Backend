import { getSupabaseUserClient } from "../supabase/localSupabaseClient.js";
// import { adminApproval } from "./adminApproval.js";

export async function leaveCommunity (communityID, bearerToken) {
    // Create the client:
    const supabaseUser = await getSupabaseUserClient(bearerToken); 

    // Extract the user:
    const {data: {user}, error: userError} = await supabaseUser.auth.getUser();

    if (userError) {
        return {
            success: false,
            count: null
        }
    }

    // Remove the user from the community:
    const { data, error } = await supabaseUser.rpc('remove_member_from_community', {
        p_community_id: communityID,
        p_member_id: user.id
    })

    // If error: 
    if (error) {
        return {
            success: false,
            message: error
        }
    }

    return {
        success: true,
        message: data
    }
} 