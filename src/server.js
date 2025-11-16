// NPM Packages: 
import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';

// Imported functions:
import { validateNewAccount } from '../utils/authValidator.js';
import { 
    createNewAccount, 
    signIn, 
    signOut, 
    refreshSession, 
    createCommunity,
    getCommunities,
    isUserInCommunity,
    createPost
} from '../utils/supabaseFuntions.js';

import { createAnnouncement } from './api/announcement/createAnnouncement.js';
import { joinCommunity } from './api/community_management/joinCommunity.js';
import { approveJoinRequest } from './api/community_management/approveJoinRequest.js';
import { declineJoinRequest } from './api/community_management/declineJoinRequest.js';
import { getUserCommunities } from './api/community_management/getUserCommunities.js';
import { getCommunityPosts } from './api/post/getCommunityPosts.js';
import { getCommunityAnnouncements } from './api/announcement/getCommunityAnnouncements.js';
import { getJoinQueue } from './api/community_management/getJoinQueue.js';
import { isUserInThisCommunity } from './api/community/isUserInThisCommunity.js';
import { isUserAdmin } from './api/community/isUserAdmin.js';

// Enviroment Variables:
dotenv.config({path: '../.env'});

// Start server & intialize port number:
const server = express();
const PORT = process.env.PORT || 3000;

// Middleware:
server.use(express.json());
server.use(express.urlencoded({ extended: false }));

// GET Methods:
server.get('/get-user-communities', async(req, res) => { // Requires access token. 
    try {
        // Use access token to make the call: 
        const bearerToken = req.headers['authorization'];

        // Attempt to fetch communities: 
        const result = await getUserCommunities(bearerToken);

        if (result.success) {
            return res.status(200).json({
                message: result.message,
                communities: result.communities
            })
        }

        return res.status(401).json({
            message: result.message,
            communities: null
        })
    }
    catch (error) {
        return res.status(500).json({
            message: 'Upexpected error occured.',
            communities: null
        })
    }
});

server.get('/get-community-posts', async (req, res) => {
    try {
        // Use access token to make the call: 
        const bearerToken = req.headers['authorization'];

        if (!bearerToken) {
            return res.status(401).json({
                message: 'Authorization token missing.',
                communityPosts: null
            });
        }
        
        // Get query params
        const { communityID } = req.query;
        if (!communityID) {
            return res.status(400).json({
                message: 'communityID query parameter is required.',
                communityPosts: null
            });
        }

        const isUserInCommunity = await isUserInThisCommunity(communityID, bearerToken);

        // Use the function to get posts:
        if (isUserInCommunity.success) {
            const result = await getCommunityPosts(bearerToken, communityID);
                
            // Check for errors in the result
            if (!result.success) {
                return res.status(404).json({
                    message: 'Could not retrieve any posts.',
                    communityPosts: null
                });
            }
    
            // Return posts
            return res.status(200).json({
                message: 'Posts retrieved successfully.',
                communityPosts: result.posts
            });
        }
        else {
            return res.status(401).json({
                message: 'Not authorized to load the posts from this community.',
                communityPosts: null
            })
        }
    }
    catch (error) {
        return res.status(500).json({
            message: 'Upexpected error occured.',
            communitiesPosts: null
        })
    }
});

server.get('/get-community-announcements', async (req, res) => {
    try {
        // Extract the access token from headers
        const bearerToken = req.headers['authorization'];

        if (!bearerToken) {
            return res.status(401).json({
                message: 'Authorization token missing.',
                communityAnnouncements: null
            });
        }
        
        // Get query params
        const { communityID } = req.query;
        if (!communityID) {
            return res.status(400).json({
                message: 'communityID query parameter is required.',
                communityAnnouncements: null
            });
        }

        // Check if user is a member of this community
        const isUserInCommunity = await isUserInThisCommunity(communityID, bearerToken);

        if (!isUserInCommunity.success) {
            return res.status(401).json({
                message: 'Not authorized to load the announcements from this community.',
                communityAnnouncements: null
            });
        }

        // Use the function to get announcements
        const result = await getCommunityAnnouncements(bearerToken, communityID);

        if (!result.success) {
            return res.status(404).json({
                message: 'Could not retrieve any announcements.',
                communityAnnouncements: null
            });
        }

        // Return announcements
        return res.status(200).json({
            message: 'Announcements retrieved successfully.',
            communityAnnouncements: result.announcements
        });

    } catch (error) {
        console.error("Unexpected error:", error);
        return res.status(500).json({
            message: 'Unexpected error occurred.',
            communityAnnouncements: null
        });
    }
});

server.get('/get-community-join-queue', async (req, res) => {
    try {
        // Extract the access token from headers
       const bearerToken = req.headers['authorization'];
    
       // Query Params
       const { communityID } = req.query;

       // Check if the user is an admin: 
       const isAdmin = await isUserAdmin(communityID, bearerToken); 

       // If the user is not an admin: 
       if (isAdmin) {
            const queue = await getJoinQueue(bearerToken, communityID);

            if (queue.success) {
                return res.status(200).json({
                    success: true,
                    message: 'Success in returning the queue for the community.',
                    queue: queue.joinQueue
                });
            }

            return res.status(401).json({
                success: false,
                message: 'Unable to get the queue for the community.', 
                queue: null
            })
       }
       else {
            return res.status(401).json({
                success: false,
                message: 'Unathorized to get join queue.', 
                queue: null
            })
       }
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Unexpected error occurred.',
            queue: null
        });
    }
});

// POST Methods: 

server.post('/sign-in', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Trim any trailing spaces: 
        let [trimmedEmail, trimmedPassword] = [email, password].map(str => str.trim());

        // Attempt to sign-in via Supabase:
        const result = await signIn(trimmedEmail, trimmedPassword);

        // Send data back:
        if (result.success) {
            return res.status(200).json({
                success: true, 
                message: result.message,
                userID: result.userID,
                refreshToken: result.refresh_token,
                accessToken: result.accessToken
            })
        }
        
        // Success:
        return res.status(401).json({
            success: false,
            message: result.message,
            userID: null,
            refreshToken: null,
            accessToken: null
        })
    } 
    catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Cannot sign in at this time.',
            userID: null,
            refreshToken: null,
            accessToken: null
        })
    }
});


server.post('/sign-out', async (req, res) => {
    const { userID } = req.body;

    if (!userID) {
        return res.status(400).json({
            success: false,
            message: 'userID is required'
        });
    }

    try {
        const error = await signOut(userID.trim())

        if (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            })
        }
        else {
            return res.status(200).json({
                success: true,
                message: 'Logged out successfully!'
            }) 
        }
    }
    catch (error) {
        return res.status(500).json({
                success: false,
                message: error.message || 'An unexpected error occurred'
        })
    }
});

server.post('/create-account', async (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    
    try {
        // Trim the inputs from trailing white spaces:
        let [trimmedFirstName, trimmedLastName, trimmedEmail, trimmedPassword] = [firstName, lastName, email, password].map(str => str.trim());

        // Validate new account first:
        const newAccountStatus = await validateNewAccount(trimmedFirstName, trimmedLastName, trimmedEmail, trimmedPassword);

        // Create new account: 
        if (newAccountStatus) {
            const result = await createNewAccount(trimmedFirstName, trimmedLastName, trimmedEmail, trimmedPassword);

            if (result.errorStatus) {
                return res.status(500).json({
                    sucess: false,
                    sucessMessage: null,
                    errorStatus: true,
                    errorMessage: result.errorMessage
                })
            }
            else {
                return res.status(200).json({
                    sucess: true,
                    sucessMessage: 'Account was successfully created.',
                    errorStatus: false,
                    errorMessage: null
                })
            } 
        }
        else {
            return res.status(500).json({
                sucess: false,
                sucessMessage: null,
                errorStatus: true,
                errorMessage: "We couldn't create your account. Please double-check that all fields are filled out, and your password is at least 10 characters long with a mix of uppercase and lowercase letters, a number, and a special character."
            })
        }
    } 
    catch (err) {
        return res.status(500).json({
                sucess: false,
                sucessMessage: null,
                errorStatus: true,
                errorMessage: 'The server is unable to create accounts at this time. Please try again later.'
        })
    }
});

server.post('/restore-session', async (req, res) => {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
        return res.status(400).json({
            success: false,
            message: "Refresh token is required.",
            data: null
        });
    }

    try {
        const result = await refreshSession(refreshToken);

        if (!result.success) {
            return res.status(401).json({
                success: false,
                message: result.message,
                data: null
            });
        }

        return res.status(200).json(result);
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'An unexpected error occurred',
            data: null
        });
    }
});

server.post('/create-community', async (req, res) => {
    const { communityName, communityBio, attachment, userID } = req.body; // Attachment = Image, must be a base64 string.

    try {
        const result = await createCommunity (communityName, communityBio, attachment, userID);

        if (result.success) {
            return res.status(200).json({
                success: result.success,
                message: result.message,
                community: result.community
            })
        }
        else {
            return res.status(500).json({
                success: result.success,
                message: result.message
            })
        }
    } 
    catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Failed to request call for create community at this time.'
        })
    }
});

server.post('/join-community', async (req, res) => {
    const { userID, communityCode } = req.body;
    const bearerToken = req.headers['authorization'];

    try {   
        const result = await joinCommunity(userID, communityCode, bearerToken); 

        if (result.success) {
            return res.status(200).json({
                success: true,
                message: result.message
            })
        }
        else {
            return res.status(401).json({
                success: false,
                message: result.message
            })
        }
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Failed to request call for join community at this time.'
        })
    }
});

server.post('/approve-join-request', async (req, res) => {
    const { newUserID, communityID } = req.body;
    const adminBearerToken = req.headers['authorization'];
    try{
        const joinResult = await approveJoinRequest(newUserID,communityID, adminBearerToken);

        if (joinResult.approved) {
            return res.status(200).json({
                success: joinResult.approved,
                message: joinResult.result
            })
        }
        else {
            return res.status(401).json({
                success: false,
                message: joinResult.result
            })
        }
    }
    catch (error) {

    }
}); 

server.post('/create-post', async (req, res) => {
    const {communityID, postTitle, postDescription, attachmentURL} = req.body;
    const bearerToken = req.headers['authorization'].slice(7); // We expect the Access Token here to be able to take any action.

        const isInCommunity = await isUserInCommunity(communityID, bearerToken);

        if (isInCommunity.success) {
            const result = await createPost(communityID, postTitle, postDescription, attachmentURL, bearerToken);
    
            if (result.success) {
                return res.status(200).json({
                    success: true,
                    data: result.data,
                    message: 'userInCommunity.message'
                })
            }
    
            return res.status(401).json({
                    success: false,
                    data: null,
                    message: result.message
            })
        }
        else {
            return res.status(401).json({
                    success: false,
                    data: null,
                    message: isInCommunity.message
            })
        }
});

server.post('/create-announcement', async (req, res) => {
    const {communityID, announcementTitle, announcementDescription, attachment64, announcementRole} = req.body; 
    const bearerToken = req.headers['authorization'].slice(7); // We expect the Access Token here to be able to take any action.

    try {
        const result = await createAnnouncement(communityID, announcementTitle, announcementDescription, attachment64, announcementRole, bearerToken);

        if (result.success) {
            return res.status(200).json({
                success: true,
                message: 'Creating announcement successful!'
            })
        }

        return res.status(401).json({
            success: false,
            message: 'Creating announcement failed.'
        })
    }   
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
});

// DELETE Methods:
server.delete('/leave-community', (req, res) => {
    
});

server.delete('/decline-join-request', async (req, res) => {
    const { userID, communityID } = req.body;
    const bearerToken = req.headers['authorization'];
    
    try {
        console.log(`[/decline-join-request] Request received - userID: ${userID}, communityID: ${communityID}`);
        
        // Decline the result: 
        const declineResult = await declineJoinRequest(userID, communityID, bearerToken);
        
        console.log(`[/decline-join-request] declineResult:`, declineResult);

        if (declineResult.declined) {
            return res.status(200).json({
                success: true, 
                message: 'The user was successfully declined.'
            })
        }
        else {
            return res.status(400).json({
                success: false,
                message: declineResult.result || 'The user was not declined. Try again.'
            })
        }
    }
    catch (error) {
        console.error(`[/decline-join-request] Error:`, error);
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
});

server.delete('/delete-user', async (req, res) => {

});

// Listening Port:
server.listen(PORT, (error) => {
    if (error) {
        console.log(`There was an error starting the server on port: ${PORT}`);
        return;
    }
    console.log(`Server listening on port: ${PORT}`);
});