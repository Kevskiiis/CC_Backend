import { supabase } from "../api/supabase/globalSupabaseClient.js";
import { ErrorHandler } from "../objects/errorHandler.js";

// CREATE ACCOUNT:
export async function createAccount (trimmedFirstName, trimmedLastName, trimmedEmail, trimmedPassword) {
    // Upload user to Auth Table:
    const {data: AuthData, error: AuthError} = await supabase.auth.signUp({
        email: trimmedEmail, 
        password: trimmedPassword, 
        options: {
        data: {display_name: `${trimmedFirstName} ${trimmedLastName}`}
        }
    });

    // If Auth Upload Fails:
    if (AuthError) throw new ErrorHandler(AuthError.message, 500);

    // If successful in sign-up, obtain the user's id:
    const userID = AuthData.user.id;

    // Upload user to the Profiles Table:
    const {data: ProfileData, error: ProfileError} = await supabase
    .from('profiles')
    .insert([{
        profile_id: userID,
        first_name: trimmedFirstName,
        last_name: trimmedLastName
    }])
    .select();

    // If Profile upload fails: 
    if (ProfileError) {
        await supabase.auth.admin.deleteUser(userID);
        throw new ErrorHandler("Failed to save profile data into the database.", 500);
    }

    // Success:
    return {
        success: true,
        message: "Account successfully created!",
        profile: ProfileData[0],
    };  
}