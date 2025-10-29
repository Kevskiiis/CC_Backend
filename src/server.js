// NPM Packages: 
import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';

// Enviroment Variables:
dotenv.config({path: '../.env'});

// Secure: Apply RSA and HTTPS

const server = express();
const PORT = process.env.PORT || 3000;

// Supbase configuration:
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Middleware:
server.use(express.json());
server.use(express.urlencoded({ extended: false }));

// POST Methods:
server.post('/sign-in', (req, res) => {

});

server.post('/sign-out', (req, res) => {

});

server.post('/create-account', (req, res) => {

});

server.post('/restore-session', (req, res) => {

});

server.post('/join-community', (req, res) => {

});

server.post('/create-community', (req, res) => {

});

// PATCH Methods:
server.patch('/reset-password', (req, res) => {
    
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