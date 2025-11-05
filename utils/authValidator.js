// NPM Packages:
import axios from "axios";
import dotenv from 'dotenv';
import { createClient } from "@supabase/supabase-js";

// Supabase Functions:
// import { findValueInTable } from "./supabaseFuntions.js";

// Enviroment Variables:
dotenv.config({path: '../.env'});

// Supbase configuration:
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Start Supabase Client:
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Email Validator:
export async function emailValidator (email) {
    try {
        // (1) Verify that the email exists and is valid to recieve emails:
        const response = await axios.get(`https://emailreputation.abstractapi.com/v1/?api_key=${process.env.ABSTRACT_API_KEY}&email=${email}`)
        
        const deliverability = data.email_deliverability?.status || null;
        const isDisposable = data.email_quality?.is_disposable || false;
        const isRole = data.email_quality?.is_role || false;
        const smtpValid = data.email_deliverability?.is_smtp_valid ?? false;

        // Reject disposable or role-based emails
        if (isDisposable || isRole) return false;

        // Reject if SMTP check fails
        if (!smtpValid) return false;

        // Only accept truly deliverable emails
        if (deliverability === 'deliverable') return true;

        // Risky, undeliverable, unknown → reject
        return false;
  } 
  catch (err) {
    console.error('Email validation error:', err.message);
    return false;
  }
}

// Password Validator:
async function passwordLengthValidator (password) {
    return password.length >= 10; 
}   

async function passwordCharValidator (password) {
    if (typeof password !== 'string') return false;

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
}

export async function passwordValidator (password) {
  try {
      const isLongEnough = await passwordLengthValidator(password);
      const hasRequiredChars = await passwordCharValidator(password);

      // Return combined result:
      return isLongEnough && hasRequiredChars;
    
  } catch (error) {
      console.error("Password validation error:", error);
      return false;
  }
}

// Name validator:
export async function nameValidator (name) {
    return typeof name === 'string' && name.trim() !== '';
}

// Validate profile:
export async function validateNewAccount(firstName, lastName, email, password) {
	try {
      // Run all validators
      const firstNameValidation = await nameValidator(firstName);
      const lastNameValidation = await nameValidator(lastName);
      const emailValidation = await nameValidator(email)
      const passwordValidation = await passwordValidator(password);

      // Return value;
      return firstNameValidation && lastNameValidation && emailValidation && passwordValidation;
	} 
  catch (error) {
      console.error('Error validating new account:', error);
      return false; 
	}
}