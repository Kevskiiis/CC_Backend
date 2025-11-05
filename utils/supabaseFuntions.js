import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
// import { hashToken } from './authFunctions.js';

// Enviroment Variables:
dotenv.config({path: '../.env'});

// Supbase configuration:
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Start Supabase Client:
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// CREATE ACCOUNT:
export async function createNewAccount (trimmedFirstName, trimmedLastName, trimmedEmail, trimmedPassword) {
    try {
        // Upload user to Auth Table:
        const {data: AuthData, error: AuthError} = await supabase.auth.signUp({
          email: trimmedEmail, 
          password: trimmedPassword, 
          options: {
            data: {display_name: `${trimmedFirstName} ${trimmedLastName}`}
          }
        })

        // If Auth Upload Fails:
        if (AuthError) {
          return {
            userId: null,
            profile: null,
            errorStatus: true,
            errorMessage: AuthError.message
          };
        }

        const userID = AuthData.user.id;

        // Upload user to the Profiles Table:
        const {data: ProfileData, error: ProfileError} = await supabase
        .from('profiles')
        .insert([{
          profile_id: userID,
          first_name: trimmedFirstName,
          last_name: trimmedLastName
        }])
        .select()

        // If Profile Upload fails: 
        if (ProfileError) {
          const { data, error } = await supabase.auth.admin.deleteUser(userID);

          return {
            userId: null,
            profile: null,
            errorStatus: true,
            errorMessage: ProfileError.message
          };
        }

        // Success:
        return {
          userId: userID,
          profile: ProfileData[0],
          errorStatus: false,
          errorMessage: null
        };
    } // Catch Error:
    catch (error) {
      return {
        userId: null,
        profile: null,
        errorStatus: true,
        errorMessage: error
      };
    }    
}

// SIGN IN
export async function signIn (trimmedEmail, trimmedPassword) {
    try {
      // Attempt to login with Supabase:
      const { data, error} = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: trimmedPassword
      })

      // Handle Session Management:
      if (error || !data.session) {
        return {
          success: false,
          message: error?.message || 'Invalid login credentials',
          userID: null,
          refresh_token: null,
          accessToken: null
        }
      }
      else {
        // Success:
        return {
          success: true,
          message: 'Login successful!',
          userID: data.user.id,
          refresh_token: data.session.refresh_token,
          accessToken: data.session.access_token
        }
      }
    }  
    catch (error) {
      return {
          success: false,
          message: 'Unable to login at this time.',
          userID: null,
          refresh_token: null,
          accessToken: null
      }
    }
}

// SIGN OUT USER:
export async function signOut (userID) {
    const { error } = await supabase.auth.admin.signOut(userID);
    return error;
} 

// Refresh Token:
export async function refreshSession (refreshToken) {
    const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken
    });

    if (error) {
        return {
            success: false,
            message: error.message,
            data: null
        };
    }

    return {
        success: true,
        message: 'Session refreshed successfully',
        data: {
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
            expiresAt: data.session.expires_at
        }
    };
}

// CREATE COMMUNITY:
export async function createCommunity (communityName, communityBio, attachment64, userID) {

}