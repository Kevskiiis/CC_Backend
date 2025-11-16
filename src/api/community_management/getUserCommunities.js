import { getSupabaseUserClient } from "../supabase/localSupabaseClient.js";

export async function getUserCommunities (bearerToken) {
    try {
        const supabaseUser = await getSupabaseUserClient(bearerToken); 

        // Get the user:
        const { data: { user }, error: userError } = await supabaseUser.auth.getUser();

        // Call the supabase function:
        const {data, error} = await supabaseUser.rpc('get_user_communities', { p_user_id: user.id });
        if (userError || !user) {
            return {
                success: false,
                message: 'Unable to retrieve user.',
                communities: null
            }
        }

        // Analyze if the data exists:
        if (error) {
            return {
                success: false, 
                message: 'An error occured while fetching your communities.',
                communities: null
            }
        }

        // User belongs to no communities
        if (!data || data.length === 0) {
            return {
                success: false, 
                message: 'Join a community now!',
                communities: data
            }
        }

        // Handle the case where data is present: 
        if (data.length > 0) {
            return {
                success: true, 
                message: 'Here are your communities!',
                communities: data
            }
        }
    }
    catch (error) {
        return {
            success: false,
            message: error.message,
            communities: null
        }
    }
}