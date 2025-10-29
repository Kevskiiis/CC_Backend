import express from 'express';
import bodyParser from 'body-parser';

const app = express();
const PORT = process.env.PORT || 3000;

// Secure: Apply RSA and HTTPS