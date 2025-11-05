// NPM Packages: 
import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import { createClient } from '@supabase/supabase-js';
// import argon2 from 'argon2';
// import { nanoid } from 'nanoid';

// Imported functions:
import { hashToken } from '../utils/authFunctions.js';
import { validateNewAccount } from '../utils/authValidator.js';
import { createNewAccount, signIn, signOut, refreshSession} from '../utils/supabaseFuntions.js';

// Enviroment Variables:
dotenv.config({path: '../.env'});

// Secure: Apply RSA and HTTPS

// Start server & intialize port number:
const server = express();
const PORT = process.env.PORT || 3000;

// Supbase configuration:
// const SUPABASE_URL = process.env.SUPABASE_URL;
// const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Start Supabase Client:
// const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Middleware:
server.use(express.json());
server.use(express.urlencoded({ extended: false }));

// GET Methods:


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

// server.post('/join-community', (req, res) => {

// });

server.post('/create-community', async (req, res) => {
    const { communityName, communityBio, attachment, userID} = req.body; // Attachment = Image, must be a base64 string.

    try {
        // Generate unqiue code for the communtity:
        


    } catch (err) {

    }
});

// // PATCH Methods:
// server.patch('/reset-password', (req, res) => {
//     // POSTPONE for now!
// });

// server.post('/update-username', (req, res) => {

// });

// DELETE Methods:
server.delete('/leave-community', (req, res) => {

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