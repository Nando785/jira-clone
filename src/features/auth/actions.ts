"use server";

import { cookies } from "next/headers";
import { Account, Client } from "node-appwrite";

import { AUTH_COOKIE } from "./constants";

/**
 * This module provides a function to retrieve the current user's information from an Appwrite client.
 * 
 * It will create a new Appwrite client with the specified endpoint and project,
 * then retrieve session cookie and set them on the client if it exists
 * 
 * The function returns the current user's information or null if there's an error or no session cookie.
 * 
 * @returns {Promise<Account>} The current user's information or null.
 */

// Get the current user
export const getCurrent = async () => {
    try {
        const client = new Client()
            .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
            .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!);
        
        const cookie = await cookies();
        const session = cookie.get(AUTH_COOKIE);

        if (!session) return null;
        client.setSession(session.value);

        const account = new Account(client)
        return await account.get();

    } catch (error) {
        console.error("Error getting current user:", error);
        return null;
    }
}

