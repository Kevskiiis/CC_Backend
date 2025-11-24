// NPM Packages: 
import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import multer from 'multer';

// Imported functions:
import { validateNewAccount } from '../utils/authValidator.js';
import { 
    createNewAccount, 
    // signIn, 
    // signOut, 
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
import { changeJoinCode } from './api/community/changeJoinCode.js';
import { getCommunityMembers } from './api/community_management/getCommunityMembers.js';
import { adminCommunityCount } from './api/community/adminCommunityCount.js';
import { leaveCommunity } from './api/community_management/leaveCommunity.js';

// Authentication Handler Functions:
import { createAccount } from './authenticationHandlers/createAccount.js';
import { signIn } from './authenticationHandlers/signIn.js';
import { signOut } from './authenticationHandlers/signOut.js';

// Image Handler Functions:
import { imageUploader } from './imageHandlers/imageUploader.js';

// Helper Functions:
import { trimStrings } from './helpers/strings/trimStrings.js';

// Objects:
import { ErrorHandler } from './objects/errorHandler.js';

// Enviroment Variables:
dotenv.config({path: '../.env'});

// Start server & intialize port number:
const server = express();
const PORT = process.env.PORT || 3000;

// Middleware:
server.use(express.json());
server.use(express.urlencoded({ extended: false }));

// Store uploaded files in memory instead of disk
// const storage = multer.memoryStorage();
// const upload = multer({ storage });

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

server.get('/get-community-members', async(req, res) => {
    try {
        // Use access token to make the call: 
        const bearerToken = req.headers['authorization'];

        // Get Query Param:
        const { communityID } = req.query;

        // Attempt to retrieve members: 
        const result = await getCommunityMembers(bearerToken, communityID);

        // Handle the return status codes based on the success:
        if (!result.success) {
            return res.status(401).json(result);
        }

        return res.status(200).json(result);
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Unexpected error ocurred with the server.",
            members: null
        });
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
server.post('/sign-in', async (req, res) => { // Finalized
    try {
        // Obtain the form body:
        const { email, password } = req.body;
        if (!email || !password) {
            throw new ErrorHandler("Missing required fields.", 400);
        }

        // Trim any trailing spaces in the inputs: 
        const [trimmedEmail, trimmedPassword] = trimStrings([email, password]);

        // Attempt to sign-in via Supabase:
        const result = await signIn(trimmedEmail, trimmedPassword);

        // Return data if successful:
        return res.status(200).json(result); 
    } 
    catch (err) {
        return res.status(err.statusCode || 500).json({
            success: false,
            message: err.message
        })
    }
});

server.post('/sign-out', async (req, res) => { // Finalized but requires testing! 
    try {
        // Accept tokens to kill the session attached to them:
        const accessToken = req.headers.authorization.replace(/^Bearer\s+/i, ''); 
        const refreshToken = req.headers["refreshtoken"]; 
        // Handle edge case where the required tokens are not entered:
        if (!accessToken || !refreshToken) throw new ErrorHandler("There is missing required data to sign-out. Please try again.");
        
        // Call the sign out function to complete the task: 
        const result = await signOut(accessToken, refreshToken);
        // Return the result:
        return res.status(200).json(result); 
    }
    catch (err) { // Handling & Catching Errors here:
        return res.status(err.statusCode || 500).json({
                success: false,
                message: err.message || 'An unexpected error occurred with the server.'
        })
    }
});

server.post('/create-account', async (req, res) => { // Finalized
    try {
        // Obtain all the features that we need from middleware: 
        const { firstName, lastName, email, password } = req.body;

        // Handle if one the fields is missing:
        if (!firstName || !lastName || !email || !password) {
            throw new ErrorHandler("Missing required fields.", 400);
        }

        // Trim the inputs from trailing white spaces:
        const [trimmedFirstName, trimmedLastName, trimmedEmail, trimmedPassword] = trimStrings([firstName, lastName, email, password]);
        
        // Validate new account first: function throws Errors if not valid for the catch block to handle.
        await validateNewAccount(trimmedFirstName, trimmedLastName, trimmedEmail, trimmedPassword);

        // Create new account: 
        const result = await createAccount(trimmedFirstName, trimmedLastName, trimmedEmail, trimmedPassword);

        // Account was successfully create:
        return res.status(200).json(result);
    } 
    catch (err) {
        return res.status(err.statusCode || 500).json({
            success: false,
            message: err.message || 'An unexpected error occurred with the server.'
        })
    }
});

server.post('/restore-session', async (req, res) => {
    try {
        // Accept refresh token in order to refresh the session:
        const refreshToken = req.headers["refreshtoken"];
        
    }
    catch (err) {

    }
    // const { refreshToken } = req.body;
    
    // if (!refreshToken) {
    //     return res.status(400).json({
    //         success: false,
    //         message: "Refresh token is required.",
    //         data: null
    //     });
    // }

    // try {
    //     const result = await refreshSession(refreshToken);

    //     if (!result.success) {
    //         return res.status(401).json({
    //             success: false,
    //             message: result.message,
    //             data: null
    //         });
    //     }

    //     return res.status(200).json(result);
    // }
    // catch (error) {
    //     return res.status(500).json({
    //         success: false,
    //         message: error.message || 'An unexpected error occurred',
    //         data: null
    //     });
    // }
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
    const {communityID, userID, postTitle, postDescription, attachmentURL} = req.body;
    const bearerToken = req.headers['authorization']; // We expect the Access Token here to be able to take any action.

        const isInCommunity = await isUserInThisCommunity(communityID, bearerToken);

        console.log(isInCommunity);

        if (isInCommunity.success) {
            const result = await createPost(communityID, userID, postTitle, postDescription, attachmentURL);
            console.log(result);
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

// PATCH Methods:
server.patch('/change-join-code', async (req, res) => {
    try {
        // Bearer Token:
        const bearerToken = req.headers['authorization'];
    
        // Community ID:
        const { communityID }= req.body;

        // Check if the user is an admin:
        const isAdmin = await isUserAdmin(communityID, bearerToken);

        // If admin, change the code of community:
        if (isAdmin) {
            // Insert the new code into the community via function:
            const changeRequestResult = await changeJoinCode(communityID, bearerToken);
            return res.status(200).json(changeRequestResult);
        }
    }
    catch (error) {

    }
});

// DELETE Methods:
server.delete('/leave-community', async (req, res) => { // Takes in Params:
    try {
        // Bearer Token:
        const bearerToken = req.headers['authorization'];
    
        // Community ID:
        const { communityID } = req.query;

        console.log(communityID); 

        // See if the user is an admin:
        const isAdmin = await isUserAdmin(communityID, bearerToken);

        // console.log(isAdmin); 

        // If they are admin, handle edge cases:
        if (isAdmin) {
            const adminCount = await adminCommunityCount(communityID, bearerToken);

            console.log(adminCount); 

            if (!adminCount.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Failed to obtain the other admin members.'
                })
            }

            if (adminCount.count >= 1) {
                const leaveStatus = await leaveCommunity(communityID, bearerToken);
                return res.status(leaveCommunity.success ? 200 : 400).json(leaveStatus); 
            }
            else {
                return {
                    success: false,
                    message: "You must promote an member to admin status within your community before leaving."
                }
            }
        }
        // If they are not, then simply remove them from the community: 
        const leaveStatus = await leaveCommunity(communityID, bearerToken); 
        return res.status(leaveCommunity.success ? 200 : 400).json(leaveStatus);
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'An unexpected error occured.'
        })
    }
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