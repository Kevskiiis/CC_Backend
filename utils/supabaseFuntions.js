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

// Community Functions:
import { generateCommunityCode } from './CommunityFunctions.js';

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
export async function createCommunity(communityName, communityBio, attachment64, userID) {
  try {
    // Validate inputs
    if (!communityName?.trim()) {
      return { success: false, message: 'Community name is required.' };
    }
    if (!userID) {
      return { success: false, message: 'User ID is required.' };
    }

    // Check if the community name already exists:
    const { data: CommunityCheckData, error: CommunityCheckError } = await supabase
      .from('communities')
      .select('community_name')
      .eq('community_name', communityName)
      .limit(1);

    if (CommunityCheckError) {
      console.error('Error checking community name:', CommunityCheckError);
      return { 
        success: false, 
        message: 'Failed to verify community name availability.',
        error: CommunityCheckError.message 
      };
    }

    if (CommunityCheckData?.length > 0) {
      return { 
        success: false, 
        message: 'A community with this name already exists.'
      };
    }

    // Generate community code with retry logic:
    let joinCode;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      joinCode = await generateCommunityCode();

      const { data: JoinCodeData, error: JoinCodeError } = await supabase
        .from('communities')
        .select('join_code')
        .eq('join_code', joinCode)
        .limit(1);

      if (JoinCodeError) {
        console.error('Error checking join code:', JoinCodeError);
        return { 
          success: false, 
          message: 'Failed to generate a unique join code.'
        };
      }

      if (JoinCodeData?.length === 0) {
        break;
      }

      attempts++;
      
      if (attempts >= maxAttempts) {
        return { 
          success: false, 
          message: 'Could not generate a unique join code. Please try again.' 
        };
      }
    }

    // Call the database function (atomic transaction)
    const { data: CommunityData, error: CommunityError } = await supabase
      .rpc('create_community_with_creator', {
        p_community_name: communityName,
        p_community_bio: communityBio || null,
        p_attachment_url: attachment64 || null,
        p_join_code: joinCode,
        p_user_id: userID
      });

    if (CommunityError) {
      console.error('Error creating community:', CommunityError);
      return { 
        success: false, 
        message: 'Failed to create community.' 
      };
    }

    if (!CommunityData || CommunityData.length === 0) {
      console.error('Community function returned no data');
      return { 
        success: false, 
        message: 'Failed to retrieve community data after creation.' 
      };
    }

    // The function returns an array with one row
    const community = CommunityData[0];

    // Success:
    return {
      success: true,
      message: 'Community created successfully!',
      community: {
        id: community.community_id,
        name: community.community_name,
        bio: community.community_bio,
        joinCode: community.join_code,
        attachmentUrl: community.attachment_url,
        dateCreated: community.date_created
      }
    };

  } catch (error) {
    console.error('Unexpected error in createCommunity:', error);
    return { 
      success: false, 
      message: 'An unexpected error occurred while creating the community.'
    };
  }
}