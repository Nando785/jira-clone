"use server";

import { createSessionClient } from "@/lib/appwrite";

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
        const { Account } = await createSessionClient();
        return await Account.get();

    } catch (error) {
        console.error("Error getting current user:", error);
        return null;
    }
}

