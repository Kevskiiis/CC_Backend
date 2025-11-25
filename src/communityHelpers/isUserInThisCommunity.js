import { getSupabaseUserClient } from "../api/supabase/localSupabaseClient.js";

export async function isUserInThisCommunity (userID, communityID, supabaseClient) {
    
        // Create Instance of the supbase client:
        // const supabaseUser = await getSupabaseUserClient(bearerToken);

        // Catch the user and the data:
        // const { data: { user }, error: UserError } = await supabaseUser.auth.getUser();

        // Catch getUser() error:
        // if (UserError) {
        //     return {
        //         success: false,
        //         message: 'Error occured while trying to create a client.'
        //     }
        // }

        // Call the SQL function to check:
        const {data: Table, error: TableError } = await supabaseClient.rpc('is_user_in_community_v3', {p_community_id: communityID, p_user_id: userID});

        // Catch TableError:
        if (TableError) {
            return {
                success: false,
                message: 'Error occured while calling the database function'
            }
        }

        // Obtain boolean value from the SQL call:
        const isInCommunity = Table?.[0]?.in_community ?? false;

        // Return if they are part of the community:
        if (isInCommunity) {
            return {
                success: true,
                message: 'User is present in the community!'
            }
        }
        else {
            return {
                success: false,
                message: 'User is not present in the community.'
            }
        }
}