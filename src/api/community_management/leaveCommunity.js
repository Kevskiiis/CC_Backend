import { getSupabaseUserClient } from "../supabase/localSupabaseClient.js";
import { adminApproval } from "./adminApproval.js";

export async function leaveCommunity (communityID, bearerToken, newAdminID = null) {
    try {
        // Create a superbase object: 
        const supabaseUser = await getSupabaseUserClient(bearerToken);

        // Catch the user and the data:
        const { data: { user } } = await supabaseUser.auth.getUser();

        if (newAdminID === null) {
            // Perform delete:
            const { data, error } = await supabaseUser
            .from('community_members')
            .delete()
            .match({ community_id: communityID, member_id: user.id });
        }
        else {
            // Update a new admin:
            const result = await adminApproval(communityID, bearerToken, newAdminID);

            if (result.success) {
                // Perform delete:
                const { data, error } = await supabaseUser
                .from('community_members')
                .delete()
                .match({ community_id: communityID, member_id: user.id });
            }
        }

    }
    catch (error) {

    }
} 