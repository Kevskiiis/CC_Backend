// NPM Packages: 
import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import { createClient } from '@supabase/supabase-js';
import { argon2 } from 'argon2';
import { nanoid } from 'nanoid';

// Enviroment Variables:
dotenv.config({path: '../.env'});

// Secure: Apply RSA and HTTPS

// Start server & intialize port number:
const server = express();
const PORT = process.env.PORT || 3000;

// Supbase configuration:
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Start Supabase Client:
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Middleware:
server.use(express.json());
server.use(express.urlencoded({ extended: false }));

// GET Methods:


// POST Methods: 

server.post('/sign-in', async (req, res) => {
    const { email, password } = req.body;

    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error || !data.session) {
            return res.status(401).send({
                isAuthenticated: false,
                accessToken: null,
                error: true,
                errorMessage: error?.message || 'Invalid credentials'
            });
        }

        // Implement this function!
        //
        // 
        // Fix the seurity here!
        const {data: result, error: err} = await supabase
            .from('refresh_token')
            .insert([
                {
                    profile_id: data.user.id,
                    refresh_token_id: data.session.refresh_token,
                    last_accessed_at: new Date()
                }
            ]);

        await storeRefreshTokenForUser(data.user.id, data.session.refresh_token);

        return res.status(200).send({
            isAuthenticated: true,
            accessToken: data.session.access_token,
            error: false,
            errorMessage: null
        });
        
    } catch (err) {
        console.error(err);
        return res.status(500).send({
            isAuthenticated: false,
            accessToken: null,
            error: true,
            errorMessage: 'Sign-in failed, please try again later.'
        });
    }
});


server.post('/sign-out', async (req, res) => {
    const { userID } = req.body;

    try {
        // IMPLEMENT THIS FUNCTION
        const refreshToken = await getUserRefreshToken(userID);

        if (!refreshToken) {
            return res.status(401).send({
                error: true,
                errorMessage: 'You must sign in first.'
            });
        }

        const { error } = await supabase.auth.signOut({ refreshToken });

        if (error) {
            return res.status(400).send({
                error: true,
                errorMessage: error.message
            });
        }

        // Remove token from backend store (IMPLEMENT)
        await deleteUserRefreshToken(userID);

        return res.status(200).send({
            error: false,
            errorMessage: null
        });
    } catch (err) {
        console.error(err);
        return res.status(500).send({
            error: true,
            errorMessage: 'Our servers are unable to complete this action at this time.'
        });
    }
});

server.post('/create-account', async (req, res) => {
    const { firstName, lastName, username, phoneNumber, email, password } = req.body;

    try {
        // Sign up user with Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            return res.status(400).send({
                error: true,
                errorMessage: error.message,
                success: false,
                successMessage: null
            });
        }

        const user = data.user;

        if (!user) {
            console.error("No user returned from signUp");
            return res.status(500).send({
                error: true,
                errorMessage: "User creation failed, no user returned",
                success: false,
                successMessage: null
            });
        }

        // Insert the rest of the profile info in your 'profiles' table
        const { error: profileError } = await supabase.from("profiles").insert({
            profile_id: user.id,
            first_name: firstName,
            last_name: lastName,
            username: username,
            phone_number: phoneNumber,
            created_at: new Date(),
        });

        if (profileError) {
            // Optional: delete the user from auth if profile insert fails
            await supabase.auth.admin.deleteUser(user.id);

            return res.status(400).send({
                error: true,
                errorMessage: profileError.message,
                success: false,
                successMessage: null
            });
        }

        // Successfully created user and profile
        return res.status(201).send({
            error: false,
            errorMessage: null,
            success: true,
            successMessage: "Account created successfully!",
            userId: user.id // optional, useful for client
        });

    } catch (err) {
        console.error(err);
        return res.status(500).send({
            error: true,
            errorMessage: "Server error: Unable to create account at this time.",
            success: false,
            successMessage: null
        });
    }
});

server.post('/restore-session', async (req, res) => {
    const { userID, accessToken } = req.body;

    try {
        // IMPLEMENT
        const refreshToken = await getUserRefreshToken(userID);

        if (!refreshToken) {
            return res.status(401).send({
                error: true,
                errorMessage: 'No session found. Please sign in again.',
                accessToken: null
            });
        }

        // Attempt to restore the session using Supabase
        const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
        });

        if (error || !data.session) {
            return res.status(401).send({
                error: true,
                errorMessage: error?.message || 'Unable to restore session.',
                accessToken: null
            });
        }

        // IMPLEMENT:
        await replaceRefreshToken(userID, data.session.refresh_token);

        // Return the refreshed session info
        return res.status(200).send({
            error: false,
            errorMessage: null,
            accessToken: data.session.access_token
        });

    } catch (err) {
        console.error(err);
        return res.status(500).send({
            error: true,
            errorMessage: 'Server error: Unable to restore session at this time.',
            accessToken: null
        });
    }
});

server.post('/join-community', (req, res) => {

});

server.post('/create-community', async (req, res) => {
    const { communityName, communityBio, attachment} = req.body;

    try {
        // Generate unqiue code for the communtity:
        let communityJoinCode = nanoid(15);



    } catch (err) {

    }
});

// PATCH Methods:
server.patch('/reset-password', (req, res) => {
    // POSTPONE for now!
});

server.post('/update-username', (req, res) => {

});

// DELETE Methods:
server.delete('/leave-community', (req, res) => {

});

// Listening Port:
server.listen(PORT, (error) => {
    if (error) {
        console.log(`There was an error starting the server on port: ${PORT}`);
        return;
    }
    console.log(`Server listening on port: ${PORT}`);
});